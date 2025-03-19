import pymongo
import logging
from typing import List, Dict, Any
from datetime import datetime
import json
from bson import ObjectId


class MongoDBHandler:
    def __init__(self, db_name: str, collection_name: str, mongo_uri: str = "mongodb://localhost:27017"):
        """
        Initialize the MongoDB handler.
        """
        self.client = pymongo.MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]
        self._ensure_collection_exists()

    def _ensure_collection_exists(self):
        """Ensure the collection exists."""
        if self.collection is not None:
            logging.info(f"Using MongoDB collection: {self.collection.name}")
        else:
            logging.error("Failed to connect to the collection.")

    async def save_analytics(self, analytics_data: List[Dict[str, Any]]):
        """Save analytics data to MongoDB."""
        try:
            timestamp = datetime.now().isoformat()
            for item in analytics_data:
                item["timestamp"] = timestamp

            self.collection.insert_many(analytics_data)
            logging.info(f"Saved {len(analytics_data)} records to MongoDB.")
            return True
        except Exception as e:
            logging.error(f"Error saving to MongoDB: {str(e)}")
            raise

    async def get_analytics_by_username(self, username: str) -> Dict[str, Any]:
        """Retrieve analytics for a specific username."""
        try:
            result = self.collection.find_one({"username": username})
            if result:
                result["_id"] = str(result["_id"])  # Convert ObjectId to string
            return result
        except Exception as e:
            logging.error(f"Error retrieving from MongoDB: {str(e)}")
            raise
