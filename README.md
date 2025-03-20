
# Instagram Analytics Project

This project provides a comprehensive Instagram analytics dashboard using Apify for scraping, Kafka for message queuing, DynamoDB for data storage, and a React frontend for visualization.

## Overview

The project consists of three main components:

1. **Backend**: Built with FastAPI, it handles API requests, interacts with Kafka for message queuing, and processes data.
2. **Consumer**: Written in Python, it consumes Kafka messages, scrapes Instagram profiles using Apify, and saves data to DynamoDB.
3. **Frontend**: A React application that displays analytics data fetched from the backend via WebSockets.

## Features

- **Real-time Updates**: Uses WebSockets for real-time updates.
- **Scalable Architecture**: Kafka ensures scalability and reliability.
- **DynamoDB Storage**: Efficient data storage with DynamoDB.
- **Apify Integration**: Leverages Apify for Instagram profile scraping.
- **Rate Limiting**: Protects against abuse with rate limiting.
- **Robust Error Handling**: Provides meaningful error messages to users.

## Requirements

- **Python 3.9+**: For backend and consumer scripts.
- **Node.js 16+**: For frontend development.
- **Docker (Optional)**: For containerization.
- **AWS Account**: For DynamoDB and IAM setup.
- **Apify Account**: For Instagram scraping.

## Setup

### Backend

1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt`
3. Set environment variables in `.env` 
4. Run the backend: `uvicorn main:app --reload`


### .env file
```

# API Keys
APIFY_KEY=<key>

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_REQUESTS=instagram-requests
KAFKA_TOPIC_RESULTS=instagram-results

# MongoDB Configuration for Local Testing
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=instagram_analytics
MONGO_COLLECTION_NAME=profiles

# AWS DynamoDB Configuration
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<key>
AWS_REGION=us-east-2  # Change to your region
DYNAMODB_TABLE_NAME=instagram_analytics
```

### Consumer

1. Install dependencies: `pip install -r requirements.txt`
2. Set environment variables in `.env`.
3. Run the consumer: `python app.py`

### Frontend

1. Navigate to the frontend directory.
2. Install dependencies: `npm install`
3. Start the frontend: `npm start`


### Run Docker Compose:
This will install the Kafka and Zookeeper locally 
   ```bash
   docker-compose up -d
   ```

### Kafka and ZooKeeper Setup

To run Kafka and ZooKeeper using Docker, you can use the following commands:

```bash
# Run ZooKeeper
docker run -d --name zookeeper -p 2181:2181 -e ALLOW_ANONYMOUS_LOGIN=yes wurstmeister/zookeeper:latest

# Run Kafka
docker run -d --name kafka -p 9092:9092 -e KAFKA_ADVERTISED_HOST_NAME=localhost -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 -e KAFKA_CREATE_TOPICS="instagram-requests:1:1,instagram-results:1:1" --net=host wurstmeister/kafka
```



## Usage

1. Open the frontend at `http://localhost:3000`.
2. Enter Instagram usernames separated by commas.
3. Submit the request to analyze profiles.
4. View analytics data as it becomes available.

