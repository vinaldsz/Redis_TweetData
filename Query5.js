import { MongoClient } from "mongodb";
import { createClient } from "redis";

const redisClient = createClient();

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

const uri = "mongodb://localhost:27017" || process.env.MONGO_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await redisClient.connect();
    await client.connect();

    const db = client.db("ieeevisTweets");
    const tweetCollection = db.collection("tweet");

    const cursor = tweetCollection.find();

    while (await cursor.hasNext()) {
      const tweet = await cursor.next();

      const screenName = tweet.user?.screen_name;
      const tweetId = tweet.id_str; 

      if (screenName && tweetId) {
        const userTweetKey = `tweets:${screenName}`;
        await redisClient.rPush(userTweetKey, tweetId);

        const tweetKey = `tweet:${tweetId}`;
        await redisClient.hSet(tweetKey, {
          user_name: tweet.user.name,
          screen_name: screenName,
          text: tweet.text,
          created_at: tweet.created_at,
        });
      }
    }

    console.log("Tweets and user lists have been stored in Redis.");

  } finally {
    await client.close();
    await redisClient.quit();
    console.log("Closed MongoDB and Redis connections");
  }
}

run().catch(console.dir);
