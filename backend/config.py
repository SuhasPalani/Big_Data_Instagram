import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
APIFY_KEY = os.getenv("APIFY_KEY")

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC_REQUESTS = os.getenv("KAFKA_TOPIC_REQUESTS", "instagram-requests")
KAFKA_TOPIC_RESULTS = os.getenv("KAFKA_TOPIC_RESULTS", "instagram-results")

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "instagram_analytics")