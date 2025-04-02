from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from aiokafka import AIOKafkaConsumer
from models import InfluencerRequest
from kafka_producer import KafkaMessageProducer
from config import KAFKA_BOOTSTRAP_SERVERS, KAFKA_TOPIC_RESULTS
import logging
from typing import Optional
from pydantic import BaseModel

app = FastAPI(title="Instagram Analytics Pipeline API")

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
kafka_producer: KafkaMessageProducer = None  # Kafka producer instance
active_connections = {}  # Store active WebSocket connections
performance_data_store = {}  # Store performance metrics per request ID


class PerformanceMetric(BaseModel):
    db_type: str
    operation: str
    execution_time: float
    timestamp: float
    iterations: Optional[int] = None
    avg_time: Optional[float] = None
    min_time: Optional[float] = None
    max_time: Optional[float] = None
    std_dev: Optional[float] = None


@app.on_event("startup")
async def startup_event():
    """Initialize Kafka Producer at startup."""
    global kafka_producer
    kafka_producer = await KafkaMessageProducer.create()  # Use async factory method


@app.on_event("shutdown")
async def shutdown_event():
    """Close Kafka Producer on shutdown."""
    global kafka_producer
    if kafka_producer:
        await kafka_producer.close()


@app.post("/api/influencers/analyze")
async def analyze_influencers(request: InfluencerRequest):
    """
    Submit influencer usernames for analysis.
    """
    try:
        request_id = await kafka_producer.send_request(request)
        return {"request_id": request_id, "status": "processing"}
    except Exception as e:
        logging.error(f"Error sending request to Kafka: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/performance/{request_id}")
async def get_performance_metrics(request_id: str):
    """
    Get performance metrics for a specific request.
    """
    return performance_data_store.get(request_id, [])


@app.websocket("/ws/{request_id}")
async def websocket_endpoint(websocket: WebSocket, request_id: str):
    """
    WebSocket endpoint for streaming results from Kafka.
    """
    await websocket.accept()
    active_connections[request_id] = websocket
    performance_data_store.setdefault(request_id, [])  # Initialize if not present

    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC_RESULTS,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        group_id=f"client-{request_id}",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
    )

    await consumer.start()
    try:
        async for message in consumer:
            result = message.value
            if result.get("request_id") == request_id:
                # Store performance data if present
                if result.get("type") == "performance":
                    performance_data_store[request_id].extend(result.get("data", []))

                await websocket.send_json(result)

                # Close WebSocket if processing is completed
                if result.get("status") == "completed":
                    break
    except WebSocketDisconnect:
        logging.warning(f"WebSocket disconnected for request_id: {request_id}")
    except Exception as e:
        logging.error(f"WebSocket error for request_id {request_id}: {str(e)}")
    finally:
        await consumer.stop()
        active_connections.pop(request_id, None)  # Remove connection from active list
        await websocket.close()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
