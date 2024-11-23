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
    
    await redisClient.set("UserCount", 0);
    console.log("Initialized distinct users in Redis to 0");

    const distinctUserNames = await tweetCollection.distinct("user.screen_name");
    const distinctUserCount = distinctUserNames.length;

    await redisClient.set("userCount", distinctUserCount);
    const finalUserCount = await redisClient.get("userCount");
    console.log(`There were ${finalUserCount} tweets`);

  } finally {
    await client.close();
    await redisClient.quit();
    console.log("Closed MongoDB and Redis connections");
  }
}

run().catch(console.dir);
