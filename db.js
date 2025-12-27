import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

export async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        console.log("Already connected");
        return;
    }

    if (mongoose.connection.readyState === 2) {
        console.log("Connecting...");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "theNigeriapropertiesGeneralDB",
        });
        console.log("MongoDB connected");
    } catch (err) {
        console.log("MongoDB connection error", err);
    }
}
export default connectDB;