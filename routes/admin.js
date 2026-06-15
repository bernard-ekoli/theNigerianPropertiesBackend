import express from "express";
import { getUserFromCookie } from "../utils/auth.js";
import User from "../schemas/users.js";
import Listing from "../schemas/listings.js";
import Settings from "../schemas/settings.js";

const router = express.Router()



router.get("/all_users", async (req, res) => {
    const auth = getUserFromCookie(req)
    if (!auth.success) {
        return res.status(404).json(auth)
    }
    if (auth.user.role !== "admin") {
        console.log("You aint an admin bruh")
        return res.status(403).json({
            success: false,
            message: "Admins only"
        });
    }
    try {
        const users = await User.find({}).select("-password")
        return res.status(200).json({ success: true, users })
    } catch (error) {
        return res.status(400).json({ success: false, error })
        console.log(error)
    }
})


router.get("/all_listings", async (req, res) => {
    const auth = getUserFromCookie(req)
    if (!auth.success) {
        return res.status(404).json(auth)
    }
    if (auth.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admins only"
        });
    }
    try {
        const listings = await Listing.find({})
        return res.status(200).json({ success: true, listings })
    } catch (error) {
        return res.status(400).json({ success: false, error })
        console.log(error)
    }
})


router.patch("/listing_review", async (req, res) => {
    const auth = getUserFromCookie(req);

    if (!auth.success) {
        return res.status(401).json(auth);
    }

    if (auth.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admins only"
        });
    }

    try {
        const { reviewMode } = req.body;

        if (!reviewMode) {
            return res.status(400).json({
                success: false,
                message: "Review mode is required"
            });
        }

        if (!["manual", "automatic"].includes(reviewMode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review mode"
            });
        }

        const updated = await Settings.findByIdAndUpdate(
            "global",
            { review: reviewMode },
            { new: true, upsert: true }
            ).select("-_id -__v")

        return res.status(200).json({
            success: true,
            message: `Review mode updated to ${reviewMode}`,
            settings: updated
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get("/admin_check", (_, res) => {
    return res.send("This route has been hit")
})

router.delete("/delete_listing", (req, res) => {
    const auth = getUserFromCookie(req);

    if (!auth.success) {
        return res.status(401).json(auth);
    }

    if (auth.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admins only"
        });
    }

    try{
        

    }catch(err){
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
})



export default router