import asyncio
import json
import logging
import os
from decimal import Decimal
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from apify_client import ApifyClient
from db_handler import DynamoDBHandler
from data_processor import process_data
from bson import ObjectId
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC_REQUESTS = os.getenv("KAFKA_TOPIC_REQUESTS", "instagram-requests")
KAFKA_TOPIC_RESULTS = os.getenv("KAFKA_TOPIC_RESULTS", "instagram-results")

# API Keys
APIFY_KEY = os.getenv("APIFY_KEY")

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "instagram_analytics")
MONGO_COLLECTION_NAME = os.getenv("MONGO_COLLECTION_NAME", "profiles")

# Initialize services
instagram_scraper = ApifyClient(APIFY_KEY)
db_handler = DynamoDBHandler("instagram_analytics")


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, Decimal):
            return float(obj)  # Convert Decimal to float for JSON serialization
        return super().default(obj)


# Helper function to convert Decimal to float in dictionaries
def convert_decimal_to_float(data):
    if isinstance(data, dict):
        return {k: convert_decimal_to_float(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [convert_decimal_to_float(item) for item in data]
    elif isinstance(data, Decimal):
        return float(data)
    else:
        return data


async def process_message(message, producer):
    try:
        # Parse the message
        data = message.value
        request_id = data.get("request_id")
        usernames = data.get("usernames", [])

        logging.info(f"Processing request {request_id} for usernames: {usernames}")

        # Scrape Instagram profiles
        results = await process_data(instagram_scraper, usernames)

        # Save results to MongoDB
        await db_handler.save_analytics(results)

        # Send results back to Kafka
        for result in results:
            # Convert Decimal objects to float before sending
            float_result = convert_decimal_to_float(result)
            await send_result(request_id, float_result, producer)

        # Send completion status
        await send_status_update(request_id, "completed", "Request completed", producer)

    except Exception as e:
        logging.error(f"Error processing message: {str(e)}")
        if "request_id" in locals():
            await send_status_update(request_id, "error", str(e), producer)


async def send_status_update(request_id, status, message, producer):
    try:
        await producer.send_and_wait(
            KAFKA_TOPIC_RESULTS,
            {
                "request_id": request_id,
                "status": status,
                "message": message,
                "type": "status",
            },
        )
    except Exception as e:
        logging.error(f"Error sending status update: {str(e)}")


async def send_result(request_id, result, producer):
    try:
        # Convert Decimal to float before sending
        float_result = convert_decimal_to_float(result)

        # Send message
        await producer.send_and_wait(
            KAFKA_TOPIC_RESULTS,
            {"request_id": request_id, "type": "result", "data": float_result},
        )
    except Exception as e:
        logging.error(f"Error sending result to Kafka: {str(e)}")


async def main():
    # Initialize the Kafka consumer
    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC_REQUESTS,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="instagram-analytics-consumer",  # Consumer group ID
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        session_timeout_ms=30000,  # 30 seconds session timeout
        heartbeat_interval_ms=10000,  # 10 seconds heartbeat interval
    )

    # Initialize the Kafka producer (reuse this across the consumer lifecycle)
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v, cls=CustomJSONEncoder).encode("utf-8"),
    )

    # Start the producer
    await producer.start()

    # Start the consumer
    await consumer.start()
    logging.info("Consumer started and ready to consume messages.")

    try:
        # Consume messages
        async for message in consumer:
            logging.info(f"Received message: {message.value}")
            # Process each message
            await process_message(message, producer)
    finally:
        logging.info("Stopping consumer...")
        await consumer.stop()  # Stop consumer
        await producer.stop()  # Stop producer
        logging.info("Consumer and producer stopped.")


if __name__ == "__main__":
    asyncio.run(main())
