# Instagram Analytics Project

A powerful and scalable Instagram analytics dashboard using Apify for scraping, Kafka for message queuing, DynamoDB for data storage, and a React frontend for visualization.

---
## Overview

This project is designed to scrape Instagram profiles, process the data efficiently, and visualize insights in real-time. It consists of three main components:

### Backend
- Built with FastAPI to handle API requests.
- Uses Kafka for message queuing.
- Interacts with MongoDB and DynamoDB for data storage.

### Consumer
- A Python service that:
  - Listens to Kafka messages.
  - Scrapes Instagram profiles using Apify.
  - Stores data in DynamoDB or MongoDB.

### Frontend
- A React.js application that:
  - Displays Instagram analytics data.
  - Supports real-time updates via WebSockets.

---
## Features

- Real-time Updates: Fetches data dynamically using WebSockets.
- Scalable Architecture: Kafka ensures high scalability and reliability.
- Multiple Storage Options: Choose between MongoDB (local) and DynamoDB (AWS).
- Apify Integration: Efficient Instagram profile scraping.
- Rate Limiting: Prevents excessive API calls.
- Performance Monitoring: Logs execution times for MongoDB and DynamoDB queries.
- Error Handling: Provides meaningful error messages.

---
## Requirements

- Python 3.9+ (For backend and consumer services)
- Node.js 16+ (For frontend development)
- Docker (Optional, for containerization)
- AWS Account (For DynamoDB storage)
- Apify Account (For Instagram scraping)

---
## Directory Structure
```
└── suhaspalani-big_data_instagram/
    ├── README.md
    ├── docker-compose.yml
    ├── requirements.txt
    ├── backend/
    │   ├── config.py
    │   ├── Dockerfile
    │   ├── kafka_producer.py
    │   ├── main.py
    │   └── models.py
    ├── consumer/
    │   ├── app.py
    │   ├── data_processor.py
    │   ├── db_handler.py
    │   ├── Dockerfile
    │   └── instagram_scraper.py
    └── frontend/
        ├── Dockerfile
        ├── package-lock.json
        ├── package.json
        ├── public/
        │   └── index.html
        └── src/
            ├── app.css
            ├── App.js
            ├── index.js
            └── components/
                ├── AnalyticsDisplay.js
                ├── InfluencerForm.js
                ├── KafkaStatus.js
                └── PerformanceMetrics.js
```
---
## Setup

### Backend
```sh
# Clone the repository
git clone https://github.com/suhaspalani/instagram-analytics.git
cd instagram-analytics

# Install dependencies
pip install -r requirements.txt

cd backend
# Run the backend
uvicorn main:app --reload
```

### Environment Variables (`.env`)
```ini
# API Keys
APIFY_KEY=<your-apify-key>

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC_REQUESTS=instagram-requests
KAFKA_TOPIC_RESULTS=instagram-results

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=instagram_analytics
MONGO_COLLECTION_NAME=profiles

# AWS DynamoDB Configuration
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-2 # change according to the location
DYNAMODB_TABLE_NAME=instagram_analytics
```

### Consumer
```sh
cd instagram-analytics/consumer
python app.py
```

### Frontend
```sh
cd instagram-analytics/frontend
npm install
npm start
```

---
## Running Kafka & ZooKeeper with Docker

```sh
docker-compose up -d
```

or manually:

```sh
# Start ZooKeeper
docker run -d --name zookeeper -p 2181:2181 -e ALLOW_ANONYMOUS_LOGIN=yes wurstmeister/zookeeper:latest

# Start Kafka
docker run -d --name kafka -p 9092:9092 \
  -e KAFKA_ADVERTISED_HOST_NAME=localhost \
  -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
  -e KAFKA_CREATE_TOPICS="instagram-requests:1:1,instagram-results:1:1" \
  --net=host wurstmeister/kafka
```

---
## Usage

1. Open the frontend at http://localhost:3000.
2. Enter Instagram usernames (comma-separated).
3. Submit the request to analyze profiles.
4. View analytics data as it updates in real-time.

---
## Performance Metrics

The system automatically logs execution times for database operations:

- Write Execution Time:
  - MongoDB: `0.0034 seconds`
  - DynamoDB: `0.0379 seconds`

- Read Execution Time:
  - MongoDB & DynamoDB read performance is logged per request.

### Testing Options
- Enable MongoDB: Set `MONGO_URI` in `.env` to store profile data locally.
- Enable DynamoDB: Configure AWS credentials to use cloud-based storage.
- Run Performance Benchmarks: Use the `benchmark=True` flag in API requests.

---
## Troubleshooting

- Database Connection Issues: Ensure MongoDB and DynamoDB are running and accessible.
- Kafka or ZooKeeper Issues: Verify that containers are running using `docker ps`.
- Apify Errors: Ensure your API key is valid and has enough quota.

