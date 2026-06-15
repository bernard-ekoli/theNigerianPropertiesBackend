import express from "express"
import jwt from "jsonwebtoken"
import cloudinary from "../cloudinary.js"

const router = express.Router()

router.get("/signature", (req, res) => {
    try {
        console.log("Generating Cloudinary signature");

        // check for token
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // verify user
        jwt.verify(token, process.env.JWT_SECRET);

        const timestamp = Math.round(Date.now() / 1000);

        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp,
                folder: "theNigeriaProperties/listings",
            },
            process.env.CLOUDINARY_API_SECRET
        );

        res.json({
            timestamp,
            signature,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_NAME,
            folder: "theNigeriaProperties/listings",
        });
    } catch (err) {
        res.status(500).json({ message: "Could not generate signature" });
    }
});

export default router;
