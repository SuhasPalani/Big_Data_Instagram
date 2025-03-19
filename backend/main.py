from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from aiokafka import AIOKafkaConsumer
from models import InfluencerRequest, InfluencerAnalytics
from kafka_producer import KafkaMessageProducer
from config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_TOPIC_RESULTS
import logging

app = FastAPI(title="Instagram Analytics Pipeline API")

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Kafka producer
kafka_producer = KafkaMessageProducer()

# Store active WebSocket connections
active_connections = {}

@app.post("/api/influencers/analyze")
async def analyze_influencers(request: InfluencerRequest):
    """
    Submit influencer usernames for analysis
    """
    try:
        request_id = kafka_producer.send_request(request)
        return {"request_id": request_id, "status": "processing"}
    except Exception as e:
        logging.error(f"Error sending request to Kafka: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{request_id}")
async def websocket_endpoint(websocket: WebSocket, request_id: str):
    await websocket.accept()
    active_connections[request_id] = websocket
    
    try:
        # Create a consumer for this specific connection
        consumer = AIOKafkaConsumer(
            KAFKA_TOPIC_RESULTS,
            bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
            group_id=f"client-{request_id}",
            value_deserializer=lambda m: json.loads(m.decode('utf-8'))
        )
        
        await consumer.start()
        
        try:
            async for message in consumer:
                result = message.value
                if result.get("request_id") == request_id:
                    await websocket.send_json(result)
                    # If this is the final message, break the loop
                    if result.get("status") == "completed":
                        break
        finally:
            await consumer.stop()
            
    except WebSocketDisconnect:
        if request_id in active_connections:
            del active_connections[request_id]
    except Exception as e:
        logging.error(f"WebSocket error: {str(e)}")
        await websocket.close()
        if request_id in active_connections:
            del active_connections[request_id]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)