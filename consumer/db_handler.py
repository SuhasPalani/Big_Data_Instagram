import time
import statistics
import asyncio
import boto3
import motor.motor_asyncio
import logging
from typing import Dict, Any
from decimal import Decimal
import pymongo


class DatabaseHandler:
    """Abstract base class for database operations"""

    async def save_analytics(self, analytics_data):
        """Save analytics data to the respective database"""
        raise NotImplementedError

    async def get_analytics_by_username(self, username):
        """Retrieve analytics by username from the respective database"""
        raise NotImplementedError

    async def benchmark_write(self, data, iterations=100):
        """Run benchmark for write operations"""
        raise NotImplementedError

    async def benchmark_read(self, username, iterations=100):
        """Run benchmark for read operations"""
        raise NotImplementedError


class DynamoDBHandler(DatabaseHandler):
    def __init__(self, table_name):
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)
        self.db_type = "dynamodb"

    async def save_analytics(self, analytics_data):
        try:
            start_time = time.time()
            for item in analytics_data:
                item = {
                    k: Decimal(str(v)) if isinstance(v, float) else v
                    for k, v in item.items()
                }
                self.table.put_item(Item=item)
            end_time = time.time()

            execution_time = end_time - start_time
            logging.info(f"DynamoDB write execution time: {execution_time:.4f} seconds")
            return True, execution_time

        except Exception as e:
            logging.error(f"Error saving to DynamoDB: {str(e)}")
            raise

    async def get_analytics_by_username(self, username):
        try:
            start_time = time.time()
            response = self.table.get_item(Key={"username": username})
            item = response.get("Item")
            end_time = time.time()

            execution_time = end_time - start_time
            logging.info(f"DynamoDB read execution time: {execution_time:.4f} seconds")
            return item, execution_time

        except Exception as e:
            logging.error(f"Error retrieving from DynamoDB: {str(e)}")
            raise

    async def benchmark_write(self, data, iterations=100):
        total_time = 0
        for _ in range(iterations):
            _, execution_time = await self.save_analytics([data])
            total_time += execution_time

        avg_time = total_time / iterations
        return {
            "db_type": self.db_type,
            "operation": "write",
            "iterations": iterations,
            "total_time": total_time,
            "avg_time": avg_time,
        }

    async def benchmark_read(self, username, iterations=100):
        total_time = 0
        for _ in range(iterations):
            _, execution_time = await self.get_analytics_by_username(username)
            total_time += execution_time

        avg_time = total_time / iterations
        return {
            "db_type": self.db_type,
            "operation": "read",
            "iterations": iterations,
            "total_time": total_time,
            "avg_time": avg_time,
        }


class MongoDBHandler(DatabaseHandler):
    def __init__(self, uri, db_name, collection_name):
        self.client = motor.motor_asyncio.AsyncIOMotorClient(uri)
        self.db = self.client[db_name]
        self.collection = self.db[collection_name]
        self.db_type = "mongodb"

    async def save_analytics(self, analytics_data):
        try:
            start_time = time.time()

            processed_data = []
            for item in analytics_data:
                processed_item = {
                    k: float(v) if isinstance(v, Decimal) else v
                    for k, v in item.items()
                }
                processed_data.append(processed_item)

            if len(processed_data) == 1:
                await self.collection.replace_one(
                    {"username": processed_data[0]["username"]},
                    processed_data[0],
                    upsert=True,
                )
            else:
                ops = []
                for doc in processed_data:
                    ops.append(
                        pymongo.ReplaceOne(
                            {"username": doc["username"]}, doc, upsert=True
                        )
                    )
                await self.collection.bulk_write(ops, ordered=False)

            end_time = time.time()
            execution_time = end_time - start_time
            logging.info(f"MongoDB write execution time: {execution_time:.4f} seconds")
            return True, execution_time

        except Exception as e:
            logging.error(f"Error saving to MongoDB: {str(e)}")
            raise

    async def get_analytics_by_username(self, username):
        try:
            start_time = time.time()
            document = await self.collection.find_one({"username": username})
            end_time = time.time()

            execution_time = end_time - start_time
            logging.info(f"MongoDB read execution time: {execution_time:.4f} seconds")
            return document, execution_time

        except Exception as e:
            logging.error(f"Error retrieving from MongoDB: {str(e)}")
            raise

    async def benchmark_write(self, data, iterations=100):
        total_time = 0
        for _ in range(iterations):
            _, execution_time = await self.save_analytics([data])
            total_time += execution_time

        avg_time = total_time / iterations
        return {
            "db_type": self.db_type,
            "operation": "write",
            "iterations": iterations,
            "total_time": total_time,
            "avg_time": avg_time,
        }

    async def benchmark_read(self, username, iterations=100):
        total_time = 0
        for _ in range(iterations):
            _, execution_time = await self.get_analytics_by_username(username)
            total_time += execution_time

        avg_time = total_time / iterations
        return {
            "db_type": self.db_type,
            "operation": "read",
            "iterations": iterations,
            "total_time": total_time,
            "avg_time": avg_time,
        }
