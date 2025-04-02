import os
import json
import uuid
import asyncio
from dotenv import load_dotenv
from aiokafka import AIOKafkaProducer
from models import InfluencerRequest

load_dotenv()

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC_REQUESTS = os.getenv("KAFKA_TOPIC_REQUESTS", "instagram-requests")


class KafkaMessageProducer:
    def __init__(self, producer: AIOKafkaProducer):
        self.producer = producer

    @classmethod
    async def create(cls):
        """Async factory method to create Kafka producer instance"""
        producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            client_id=f"backend-{uuid.uuid4()}",
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )
        await producer.start()
        return cls(producer)

    async def send_request(self, request: InfluencerRequest) -> str:
        request_id = str(uuid.uuid4())
        message = {
            "request_id": request_id,
            "usernames": request.usernames,
            "databases": request.databases or {"mongodb": True, "dynamodb": True},
            "benchmark": request.benchmark,
        }

        try:
            # Remove json.dumps() and encode() here
            await self.producer.send_and_wait(KAFKA_TOPIC_REQUESTS, message)
            return request_id
        except Exception as e:
            print(f"Error sending message to Kafka: {str(e)}")
            raise e

    async def close(self):
        """Close Kafka Producer"""
        await self.producer.stop()
