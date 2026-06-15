import mongoose from "mongoose";

export async function connectDB() {
    // Already connected
    if (mongoose.connection.readyState === 1) {
        console.log("Already connected");
        return;
    }

    // Wait for pending connection instead of returning early
    if (mongoose.connection.readyState === 2) {
        console.log("Connection in progress, waiting...");
        await new Promise((resolve, reject) => {
            mongoose.connection.once("connected", resolve);
            mongoose.connection.once("error", reject);
        });
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "theNigeriapropertiesGeneralDB",
        });
        console.log("MongoDB connected successfully");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        throw err; // ✅ Re-throw so startServer() exits cleanly
    }
}

export default connectDB;