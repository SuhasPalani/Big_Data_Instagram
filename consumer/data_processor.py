import asyncio
from apify_client import ApifyClient
from typing import List, Dict, Any
from decimal import Decimal


async def process_data(instagram_scraper: ApifyClient, usernames: List[str]) -> List[Dict[str, Any]]:
    try:
        run_input = {"usernames": usernames}
        run = instagram_scraper.actor("apify/instagram-profile-scraper").call(run_input=run_input)

        dataset_id = run["defaultDatasetId"]
        results = instagram_scraper.dataset(dataset_id).iterate_items()

        processed_results = []
        for item in results:
            # Calculate metrics first
            engagement_rate = 0
            avg_likes = 0
            avg_comments = 0
            
            if item["followersCount"] > 0 and item["latestPosts"]:
                engagement_rate = (
                    (item["latestPosts"][0]["likesCount"] + item["latestPosts"][0]["commentsCount"])
                    / item["followersCount"]
                )
            
            if item["latestPosts"]:
                avg_likes = sum(post["likesCount"] for post in item["latestPosts"]) / len(item["latestPosts"])
                avg_comments = sum(post["commentsCount"] for post in item["latestPosts"]) / len(item["latestPosts"])
            
            # Create the item with proper Decimal conversions
            processed_item = {
                "username": item["username"],
                "followersCount": item["followersCount"],
                "followsCount": item["followsCount"],
                "postsCount": item["postsCount"],
                "engagementRate": Decimal(str(engagement_rate)),
                "averageLikesPerPost": Decimal(str(avg_likes)),
                "averageCommentsPerPost": Decimal(str(avg_comments)),
            }
            
            processed_results.append(processed_item)

        return processed_results

    except Exception as e:
        raise

