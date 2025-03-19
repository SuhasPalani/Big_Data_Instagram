import os
from dotenv import load_dotenv
from kafka import KafkaProducer
from models import InfluencerRequest
import json
import uuid

load_dotenv()

# Kafka configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC_REQUESTS = os.getenv("KAFKA_TOPIC_REQUESTS", "instagram-requests")

class KafkaMessageProducer:
    def __init__(self):
        self.producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        self.topic = KAFKA_TOPIC_REQUESTS

    def send_request(self, influencer_request: InfluencerRequest):
        # Generate a unique request ID if not provided
        if not influencer_request.request_id:
            influencer_request.request_id = str(uuid.uuid4())
        
        # Send message to Kafka
        self.producer.send(
            self.topic,
            value=influencer_request.dict()
        )
        self.producer.flush()
        
        return influencer_request.request_id
