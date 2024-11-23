import { MongoClient } from "mongodb";
import { createClient } from "redis";

// Initialize Redis client
const redisClient = createClient();

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

// MongoDB connection URI
const uri = "mongodb://localhost:27017" || process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await redisClient.connect();
    await client.connect();

    const db = client.db("ieeevisTweets");
    const tweetCollection = db.collection("tweet");

    await redisClient.set("favoritesSum", 0);
    console.log("Initialized favoritesSum in Redis to 0");

    const cursor = tweetCollection.find(); 
 
    while (await cursor.hasNext()) {
      const tweet = await cursor.next(); 
      const favorites = tweet.favorite_count || 0; 
      await redisClient.incrBy("favoritesSum", favorites);
    }

    const totalFavorites = await redisClient.get("favoritesSum");
    console.log(`The total number of favorites in the dataset is ${totalFavorites}`);

  } finally {
    await client.close();
    await redisClient.quit();
    console.log("Closed MongoDB and Redis connections");
  }
}

run().catch(console.dir);
