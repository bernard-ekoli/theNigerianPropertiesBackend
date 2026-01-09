import express from "express";
const router = express.Router();
import Listing from "../schemas/listings.js";

router.post("/", async (req, res) => {
    try {

        const { name, email, phone, message, listingId } = req.body;
        const listing = await Listing.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        listing.messages.push({ name, email, phone, message });
        await listing.save();
        res.status(200).json({ message: "Message sent successfully" });
    } catch (error) {
        console.error("Error sending agent message:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;