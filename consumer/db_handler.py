import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal


class DynamoDBHandler:
    def __init__(self, table_name):
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)

    async def save_analytics(self, analytics_data):
        try:
            for item in analytics_data:
                # Convert float values to Decimal
                item = {
                    k: Decimal(str(v)) if isinstance(v, float) else v
                    for k, v in item.items()
                }
                self.table.put_item(Item=item)
            return True
        except Exception as e:
            print(f"Error saving to DynamoDB: {str(e)}")
            raise

    async def get_analytics_by_username(self, username):
        try:
            response = self.table.get_item(Key={"username": username})
            item = response.get("Item")
            return item
        except Exception as e:
            print(f"Error retrieving from DynamoDB: {str(e)}")
            raise
