import asyncio
import json
import logging
import os
import time
from decimal import Decimal
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from apify_client import ApifyClient
from db_handler import DynamoDBHandler, MongoDBHandler
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

# DynamoDB Configuration
DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "instagram_analytics")

# DB Selection (mongodb, dynamodb, or both)
DB_PROVIDER = os.getenv("DB_PROVIDER", "both")  # Options: mongodb, dynamodb, both

# Initialize services
instagram_scraper = ApifyClient(APIFY_KEY)

# Initialize database handlers based on configuration
db_handlers = {}
if DB_PROVIDER in ["dynamodb", "both"]:
    db_handlers["dynamodb"] = DynamoDBHandler(DYNAMODB_TABLE_NAME)
if DB_PROVIDER in ["mongodb", "both"]:
    db_handlers["mongodb"] = MongoDBHandler(
        MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTION_NAME
    )

# Performance metrics storage
performance_metrics = {
    "mongodb": {"read": [], "write": []},
    "dynamodb": {"read": [], "write": []},
}


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
        benchmark = data.get("benchmark", False)

        logging.info(f"Processing request {request_id} for usernames: {usernames}")

        # Scrape Instagram profiles
        results = await process_data(instagram_scraper, usernames)

        # Save results to databases and collect performance metrics
        performance_data = []
        for db_type, handler in db_handlers.items():
            try:
                success, execution_time = await handler.save_analytics(results)
                performance_data.append(
                    {
                        "db_type": db_type,
                        "operation": "write",
                        "execution_time": execution_time,
                        "timestamp": time.time(),
                    }
                )
                performance_metrics[db_type]["write"].append(execution_time)

                # Get the first profile for read benchmark
                if results and benchmark:
                    username = results[0]["username"]
                    _, read_time = await handler.get_analytics_by_username(username)
                    performance_data.append(
                        {
                            "db_type": db_type,
                            "operation": "read",
                            "execution_time": read_time,
                            "timestamp": time.time(),
                        }
                    )
                    performance_metrics[db_type]["read"].append(read_time)
            except Exception as e:
                logging.error(f"Error with {db_type}: {str(e)}")

        # If benchmarking was requested, run detailed benchmarks
        if benchmark and results:
            benchmark_data = await run_benchmarks(results[0])
            performance_data.extend(benchmark_data)

        # Send results back to Kafka
        for result in results:
            # Convert Decimal objects to float before sending
            float_result = convert_decimal_to_float(result)
            await send_result(request_id, float_result, producer)

        # Send performance data if collected
        if performance_data:
            await send_performance_data(request_id, performance_data, producer)

        # Send completion status
        await send_status_update(request_id, "completed", "Request completed", producer)

    except Exception as e:
        logging.error(f"Error processing message: {str(e)}")
        if "request_id" in locals():
            await send_status_update(request_id, "error", str(e), producer)


async def run_benchmarks(sample_data):
    benchmark_results = []

    # Run comparative benchmarks
    for db_type, handler in db_handlers.items():
        # Benchmark writes - reduced iterations for practical testing
        write_benchmark = await handler.benchmark_write(sample_data, iterations=10)
        benchmark_results.append(write_benchmark)

        # Benchmark reads - reduced iterations for practical testing
        read_benchmark = await handler.benchmark_read(
            sample_data["username"], iterations=10
        )
        benchmark_results.append(read_benchmark)

    return benchmark_results


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


async def send_performance_data(request_id, performance_data, producer):
    try:
        await producer.send_and_wait(
            KAFKA_TOPIC_RESULTS,
            {"request_id": request_id, "type": "performance", "data": performance_data},
        )
    except Exception as e:
        logging.error(f"Error sending performance data: {str(e)}")


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
    logging.info(f"Using database providers: {', '.join(db_handlers.keys())}")

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
