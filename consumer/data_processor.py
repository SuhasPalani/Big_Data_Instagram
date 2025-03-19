import asyncio
from apify_client import ApifyClient
from typing import List, Dict


async def process_data(instagram_scraper: ApifyClient, usernames: List[str]) -> List[Dict[str, str]]:
    try:
        run_input = {"usernames": usernames}
        run = instagram_scraper.actor("apify/instagram-profile-scraper").call(run_input=run_input)

        dataset_id = run["defaultDatasetId"]
        results = instagram_scraper.dataset(dataset_id).iterate_items()

        processed_results = []
        for item in results:
            processed_item = {
                "username": item["username"],
                "followersCount": item["followersCount"],
                "followsCount": item["followsCount"],
                "postsCount": item["postsCount"],
                "engagementRate": (
                    (item["latestPosts"][0]["likesCount"] + item["latestPosts"][0]["commentsCount"])
                    / item["followersCount"]
                    if item["followersCount"] > 0 and item["latestPosts"]
                    else 0
                ),
                "averageLikesPerPost": (
                    sum(post["likesCount"] for post in item["latestPosts"]) / len(item["latestPosts"])
                    if item["latestPosts"]
                    else 0
                ),
                "averageCommentsPerPost": (
                    sum(post["commentsCount"] for post in item["latestPosts"]) / len(item["latestPosts"])
                    if item["latestPosts"]
                    else 0
                ),
            }
            processed_results.append(processed_item)

        return processed_results

    except Exception as e:
        raise
