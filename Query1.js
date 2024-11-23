import { MongoClient } from "mongodb";
import { createClient } from 'redis';

const redisClient = createClient();

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

const uri = "mongodb://localhost:27017" || process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
    try {
        await redisClient.connect();
        await client.connect();
    
        const db = client.db("ieeevisTweets");
        const tweetCollection = db.collection("tweet");
    
        await redisClient.set("tweetCount", 0);
        console.log("Initialized tweetCount in Redis to 0");

        const tweetCount = await tweetCollection.countDocuments();
    
        await redisClient.set("tweetCount", tweetCount);
    
        const finalTweetCount = await redisClient.get("tweetCount");
        console.log(`There were ${finalTweetCount} tweets`);
      
      } finally {
        await client.close();
        await redisClient.quit();
        console.log("Closed MongoDB and Redis connections");
      }
    }
    
    run().catch(console.dir);