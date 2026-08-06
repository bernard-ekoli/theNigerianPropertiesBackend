import express from "express"
import jwt from "jsonwebtoken"
import Listing from "../schemas/listings.js"
import cloudinary from "../cloudinary.js"
import User from "../schemas/users.js"
import Settings from "../schemas/settings.js"

const router = express.Router()
router.get("/", async (req, res) => {
    try {
        const listings = await Listing.find({ featured: true, status: "active" }).limit(10);
        console.log("Featured listings fetched:", listings);
        if (listings.length === 0) {
            const otherListings = await Listing.find({}).limit(10);
            return res.status(200).json({ listings: otherListings });
        }
        res.status(200).json({ listings })
    } catch (error) {
        console.error("Error fetching featured listings:", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})
router.get("/all-listings", async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1); // ✅ same as Next.js
        const limit = 10;
        const skip = (page - 1) * limit;

        const listings = await Listing.find({ status: "active" })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({ listings });
    } catch (error) {
        console.error("Error fetching all listings:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
router.get("/get-property", async (req, res) => {
    try {
        const id = req.query.id;
        const listing = await Listing.findById(id);
        res.status(200).json({ listing })
    } catch (error) {
        console.error("Error fetching featured listing:", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})
router.post("/create-listing", async (req, res) => {
    try {
        const requiredFields = [
            'title', 'description', 'price', 'address', 'beds',
            'baths', 'sqft', 'type', 'listingType', 'duration'
        ];

        const missing = requiredFields.filter(field =>
            !req.body[field] || req.body[field].toString().trim() === ""
        );

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing or invalid fields: ${missing.join(", ")}`
            });
        }

        const token = req.cookies?.token;
        if (!token) return res.status(401).json({ success: false, message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        const settings = await Settings.findById("global");
        const freeListingsEnabled = settings?.toggleFreeListing === "yes";
        const isAdmin = user.role === "admin";
        const isFree = isAdmin || freeListingsEnabled;

        const now = new Date();
        const durationDays = parseInt(req.body.duration) || 0;
        const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

        const listingData = {
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            address: req.body.address,
            beds: req.body.beds,
            baths: req.body.baths,
            sqft: req.body.sqft,
            type: req.body.type,
            listingType: req.body.listingType,
            featured: req.body.featured === true || false,
            duration: durationDays,
            expiresAt,
            images: req.body.images,
            userId,
            status: isFree ? 'active' : 'pending'
        };

        const listing = new Listing(listingData);
        const savedListing = await listing.save();

        return res.status(200).json({
            success: true,
            message: isFree ? "Listing Created and Published" : "Listing Created",
            data: {
                listingId: savedListing._id,
                requiresPayment: !isFree
            }
        });

    } catch (error) {
        console.error("Listing creation error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

router.get("/activate-listing/:listingId", async (req, res, next) => {
    try {
        const token = req.cookies?.token
        const listingId = req.params.listingId
        if (!token) return res.status(401).json({ error: "No token provided" })
        if (!listingId) return res.status(400).json({ error: "Listing ID is required" })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) return res.status(401).json({ error: "Invalid token" })

        const updated = await Listing.findOneAndUpdate(
            { _id: listingId },
            { status: "active" },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: "Listing not found" })
        }
        res.status(200).json({ success: true })
    } catch (error) {
        console.log(error)
        next(error)
    }
})

router.get("/user-listings", async (req, res) => {
    // This route fetches listings for the authenticated user
    try {
        const token = req.cookies?.token
        if (!token) return res.status(401).json({ error: "No token provided" })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded) return res.status(401).json({ error: "Invalid token" })
        const userId = decoded.id

        const listings = await Listing.find({ userId })
        res.status(200).json({ listings })
    } catch (error) {
        console.error("Error fetching user listings:", error)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

router.post("/user-listings", async (req, res) => {
    // This route updates a user's listing
    let token = req.cookies?.token;
    const propertyId = req.query.id;
    console.log("Token :", token);
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }

    if (!propertyId) {
        return res.status(400).json({ error: "Property ID required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userId = decoded.id;

        const imagetodelete = req.body.imagesToDelete || [];

        // 1️⃣ Delete from Cloudinary
        if (imagetodelete.length > 0) {
            await Promise.all(
                imagetodelete.map(id => cloudinary.uploader.destroy(id))
            );
        }

        // 2️⃣ ONE Database call
        const updatedListing = await Listing.findOneAndUpdate(
            { _id: propertyId, userId }, // ✅ match schema field
            {
                $set: {
                    title: req.body.title,
                    description: req.body.description,
                    price: req.body.price,
                    beds: req.body.beds,
                    baths: req.body.baths,
                    sqft: req.body.sqft,
                },
                $pull: {
                    images: { public_id: { $in: imagetodelete } }
                }
            },
            { new: true }
        );

        if (!updatedListing) {
            return res
                .status(404)
                .json({ error: "Listing not found or unauthorized" });
        }
        return res.status(200).json({
            message: "Listing updated successfully.",
            listing: updatedListing
        });

    } catch (error) {
        console.error("Update listing error:", error);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
});
router.delete("/user-listing", async (req, res) => {
    const token = req.cookies?.token
    if (!token) {
        return res.status(401).json({ error: "No token provided" })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.id
        const listingId = req.query.id
        const listingImages = await Listing.findById(listingId).select('images');
        if (listingImages && listingImages.images.length > 0) {
            await Promise.all(
                listingImages.images.map(image =>
                    cloudinary.uploader.destroy(image.public_id)
                )
            );
        }
        const listing = await Listing.findOneAndDelete({
            _id: listingId,
            userId
        })
        if (!listing) {
            return res.status(404).json({ error: "Listing not found or unauthorized" })
        }
        return res.status(200).json({ message: "Listing deleted successfully" })

    } catch (error) {
        console.error("Error deleting listing:", error)
        return res.status(500).json({ error: "Internal Server Error" })
    }
})

export default router