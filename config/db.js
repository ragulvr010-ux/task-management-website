const mongoose = require("mongoose");

// Uses a real MongoDB when `MONGO_URI` is provided and reachable.
// Otherwise starts an in-memory MongoDB instance for development.
const connectDB = async () => {
  // If user provided a URI, try connecting to it first
  if (process.env.MONGO_URI) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
      console.warn("Falling back to in-memory MongoDB for development...");
    }
  } else {
    console.warn("No MONGO_URI provided — using in-memory MongoDB for development");
  }

  // Dynamic fallback to mongodb-memory-server
  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`In-memory MongoDB started: ${conn.connection.host}`);

    // Keep process alive while mongod instance exists
    process.on("exit", async () => {
      try {
        await mongoose.disconnect();
        await mongod.stop();
      } catch (e) {
        // ignore
      }
    });
  } catch (err) {
    console.error("Failed to start in-memory MongoDB:", err.message);
    console.warn("Continuing server execution without DB connection...");
  }
};

module.exports = connectDB;
