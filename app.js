import dotenv from "dotenv"
dotenv.config()
import express from "express"
import userRoute from "./routes/users.js"
import pricesRoute from './routes/prices.js'
import listingRoute from './routes/userlisting.js'
import connectDB from "./db.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import sendagentmessageRoute from "./routes/send-agent-message.js";


const app = express()
connectDB()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))
app.use("/api/users", userRoute);
app.use("/api/prices", pricesRoute)
app.use("/api/listing", listingRoute)
app.use("/api/send-agent-message", sendagentmessageRoute)
app.get('/', (req, res) => {
    return res.send("Route is working successfully")
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Nodejs server running`)
})