import express from "express";
import { getUserFromCookie } from "../utils/auth.js";
import User from "../schemas/users.js";
import Listing from "../schemas/listings.js";
import Settings from "../schemas/settings.js";

const router = express.Router()



router.get("/all_users", async (req, res) => {
    const auth = getUserFromCookie(req);

    if (!auth.success) {
        return res.status(404).json(auth);
    }

    if (auth.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admins only",
        });
    }

    try {
        const users = await User.find({}).select("-password").lean();

        const usersWithCounts = await Promise.all(
            users.map(async (user) => ({
                ...user,
                listingsCount: await Listing.countDocuments({
                    userId: user._id,
                }),
            }))
        );

        return res.status(200).json({
            success: true,
            users: usersWithCounts,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message,
        });
    }
});


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
            .populate("userId", "firstName lastName email")
            .lean();
        return res.status(200).json({ success: true, listings })
    } catch (error) {
        console.log(error)
        return res.status(400).json({ success: false, error: error.message })
    }
})


router.get("/", (_, res) => {
    return res.send("This route has been hit")
})

router.delete("/delete_listing", async (req, res) => {
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

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Listing id is required"
        });
    }

    try {
        const listing = await Listing.findByIdAndDelete(id);

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Listing deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
})

router.get("/settings", async (req, res, next) => {
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
        const settings = await Settings.findById("global");
        if (!settings) {
            console.log("No settings found yet!");
            return null;
        }

        return res.status(200).json({ success: true, message: "Successfully fetched settings", settings })
    } catch (err) {
        next(err)
    }
})

router.post("/settings", async (req, res, next) => {
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

    const { email, number, toggleFreeListing, prices } = req.body;

    // top-level required fields
    const requiredFields = { email, number, toggleFreeListing };
    const missing = Object.keys(requiredFields).filter(
        (field) => !requiredFields[field] || String(requiredFields[field]).trim() === ""
    );

    if (missing.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing or invalid fields: ${missing.join(", ")}`
        });
    }

    if (!["yes", "no"].includes(toggleFreeListing)) {
        return res.status(400).json({
            success: false,
            message: "toggleFreeListing must be 'yes' or 'no'"
        });
    }

    // prices validation — all three plans required, price must be a positive number
    const planKeys = ["thirtyDays", "sixtyDays", "ninetyDays"];
    if (!prices || typeof prices !== "object") {
        return res.status(400).json({
            success: false,
            message: "Missing or invalid field: prices"
        });
    }

    const badPlans = planKeys.filter((key) => {
        const price = prices[key]?.price;
        return price === undefined || price === null || isNaN(price) || Number(price) <= 0;
    });

    if (badPlans.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing or invalid prices for: ${badPlans.join(", ")}`
        });
    }

    try {
        const settings = await Settings.findByIdAndUpdate(
            "global",
            {
                $set: {
                    siteEmail: email,
                    siteNumber: number,
                    toggleFreeListing,
                    "prices.thirtyDays.price": Number(prices.thirtyDays.price),
                    "prices.sixtyDays.price": Number(prices.sixtyDays.price),
                    "prices.ninetyDays.price": Number(prices.ninetyDays.price),
                    updatedAt: Date.now(),
                }
            },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({ success: true, message: "Settings Updated successfully", settings });

    } catch (err) {
        next(err);
    }
});

router.get("/contact-info", async (req, res, next) => {
    try {
        const contact = await Settings.findById("global")
        console.log(contact)

        return res.json({
            success: true, contactInformation: {
                email: contact.siteEmail
            }
        })
    } catch (error) {
        next(error)
    }
})

router.patch("/make_admin/:userId", async (req, res, next) => {
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

    const { userId } = req.params;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { role: "admin" } },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User promoted to admin",
            user
        });
    } catch (err) {
        next(err);
    }
});

router.delete("/delete_user/:userId", async (req, res, next) => {
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

    const { userId } = req.params;

    if (userId === auth.user._id?.toString()) {
        return res.status(400).json({
            success: false,
            message: "You cannot delete your own account"
        });
    }

    try {
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        next(err);
    }
});


router.patch("/demote_admin/:userId", async (req, res, next) => {
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

    const { userId } = req.params;

    if (userId === auth.user._id?.toString()) {
        return res.status(400).json({
            success: false,
            message: "You cannot demote your own account"
        });
    }

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { role: "user" } },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User demoted from admin",
            user
        });
    } catch (err) {
        next(err);
    }
});

router.patch("/approve_listing/:id", async (req, res, next) => {
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
        const listing = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: { status: "active" } },
            { new: true, runValidators: true }
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Listing approved",
            listing
        });
    } catch (err) {
        next(err);
    }
})

router.patch("/reject_listing/:id", async (req, res, next) => {
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
        const listing = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: { status: "declined" } },
            { new: true, runValidators: true }
        );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "Listing not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Listing declined",
            listing
        });
    } catch (err) {
        next(err);
    }
})
export default router