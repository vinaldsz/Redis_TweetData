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

    const leaderboardKey = "leaderboard";
    await redisClient.del(leaderboardKey);
    console.log("Initialized leaderboard in Redis");

    const pipeline = [
      {
        $group: {
          _id: "$user.screen_name", 
          tweetCount: { $sum: 1 }, 
        },
      },
      {
        $sort: { tweetCount: -1 }, 
      },
      {
        $limit: 10, 
      },
    ];

    const topUsers = await tweetCollection.aggregate(pipeline).toArray();

    for (const user of topUsers) {
      const screenName = user._id;
      const tweetCount = user.tweetCount;
      await redisClient.zAdd(leaderboardKey, { score: tweetCount, value: screenName });
    }

    const leaderboard = await redisClient.zRangeWithScores(leaderboardKey, -10, -1, { REV: true });
    console.log("Top 10 Users Leaderboard:");
    leaderboard.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.value} - ${entry.score} tweets`);
    });

  } finally {
    await client.close();
    await redisClient.quit();
    console.log("Closed MongoDB and Redis connections");
  }
}

run().catch(console.dir);
