import asyncio
import json
import logging
import os
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from apify_client import ApifyClient
from db_handler import MongoDBHandler
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
db_handler = MongoDBHandler(MONGO_DB_NAME, MONGO_COLLECTION_NAME, MONGO_URI)


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


async def process_message(message):
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
            await send_result(request_id, result)

        # Send completion status
        await send_status_update(request_id, "completed", "Request completed")

    except Exception as e:
        logging.error(f"Error processing message: {str(e)}")
        if "request_id" in locals():
            await send_status_update(request_id, "error", str(e))


async def send_status_update(request_id, status, message):
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v, cls=CustomJSONEncoder).encode("utf-8"),
    )
    await producer.start()

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
    finally:
        await producer.stop()


async def send_result(request_id, result):
    producer = AIOKafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v, cls=CustomJSONEncoder).encode("utf-8"),
    )
    await producer.start()

    try:
        await producer.send_and_wait(
            KAFKA_TOPIC_RESULTS,
            {"request_id": request_id, "type": "result", "data": result},
        )
    finally:
        await producer.stop()


async def main():
    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC_REQUESTS,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id="instagram-analytics-consumer",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )

    await consumer.start()

    try:
        async for message in consumer:
            asyncio.create_task(process_message(message))
    finally:
        await consumer.stop()


if __name__ == "__main__":
    asyncio.run(main())
