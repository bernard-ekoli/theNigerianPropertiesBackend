import express from "express"
import userRoute from "./routes/users.js"
import pricesRoute from './routes/prices.js'
import listingRoute from './routes/userlisting.js'
import connectDB from "./db.js";
import cookieParser from "cookie-parser";
import cors from "cors"

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
app.get('/', (req, res) => {
    console.log("from the real route")
    return
})
const PORT = 5000
app.listen(PORT, () => {
    console.log(`Nodejs server running on http://localhost:${PORT}`)
})