from apify_client import ApifyClient
import logging
from typing import List, Dict, Any

class InstagramScraper:
    def __init__(self, api_token: str):
        self.client = ApifyClient(api_token)
        self.actor_name = "apify/instagram-profile-scraper"
        
    async def scrape_profiles(self, usernames: List[str]) -> List[Dict[str, Any]]:
        """
        Scrape Instagram profiles using Apify
        """
        try:
            # Prepare the actor input
            run_input = {
                "usernames": usernames,
            }
            
            # Run the actor and wait for it to finish
            run = self.client.actor(self.actor_name).call(run_input=run_input)
            
            # Fetch and process the results
            dataset_id = run["defaultDatasetId"]
            
            # Define the fields to extract from each profile
            fields_to_extract = [
                "username",
                "followersCount",
                "followsCount",
                "postsCount",
            ]
            
            # Define additional calculated fields
            additional_fields = {
                "engagementRate": lambda item: (
                    (item["latestPosts"][0]["likesCount"] + item["latestPosts"][0]["commentsCount"])
                    / item["followersCount"]
                    if item["followersCount"] > 0 and item["latestPosts"]
                    else 0
                ),
                "averageLikesPerPost": lambda item: (
                    sum(post["likesCount"] for post in item["latestPosts"])
                    / len(item["latestPosts"])
                    if item["latestPosts"]
                    else 0
                ),
                "averageCommentsPerPost": lambda item: (
                    sum(post["commentsCount"] for post in item["latestPosts"])
                    / len(item["latestPosts"])
                    if item["latestPosts"]
                    else 0
                ),
            }
            
            # Process the results
            results = []
            for item in self.client.dataset(dataset_id).iterate_items():
                extracted_data = {field: item.get(field) for field in fields_to_extract}
                extracted_data.update(
                    {field: func(item) for field, func in additional_fields.items()}
                )
                results.append(extracted_data)
                
            return results
            
        except Exception as e:
            logging.error(f"Error scraping Instagram profiles: {str(e)}")
            raise