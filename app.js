import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import dns from "dns";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./db.js";

import userRoute from "./routes/users.js";
import pricesRoute from "./routes/prices.js";
import listingRoute from "./routes/userlisting.js";
import sendagentmessageRoute from "./routes/send-agent-message.js";
import cloudinaryRoutes from "./routes/cloudinarySignature.js";
import pay from "./routes/payments.js";
import adminRoute from './routes/admin.js'
import otpRoute from './routes/otp.js'

// Better DNS fallback (helps MongoDB Atlas in some networks)
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// mongoose safer config
mongoose.set("strictQuery", false);

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = [
  "https://thenigerianproperties.com",
  "https://www.thenigerianproperties.com",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
// Routes
app.use("/api/users", userRoute);
app.use("/api/prices", pricesRoute);
app.use("/api/listing", listingRoute);
app.use("/api/send-agent-message", sendagentmessageRoute);
app.use("/api/cloudinary", cloudinaryRoutes);
app.use("/api/payment", pay);
app.use("/api/admin", adminRoute);
app.use("/api/otp-request", otpRoute)
// Test route
app.get("/", (req, res) => {
  res.send("Route is working successfully");
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();