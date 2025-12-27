import express from "express"
import jwt from "jsonwebtoken"
import Listing from "../schemas/listings.js"
import upload from "./upload.js"
import cloudinary from "../cloudinary.js"

const router = express.Router()

router.post("/create-listing", upload.array("images", 5), async (req, res) => {

    let uploadedImages = [] // 👈 TRACK UPLOADED FILES

    try {
        const requiredFields = [
            'title', 'description', 'price', 'address', 'beds',
            'baths', 'sqft', 'type', 'listingType', 'duration'
        ]

        const missing = requiredFields.filter(field =>
            req.body[field] === undefined ||
            req.body[field] === null ||
            req.body[field] === ""
        )

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "You must upload at least one image."
            })
        }

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing or invalid fields: ${missing.join(", ")}`
            })
        }

        const token = req.cookies?.token
        if (!token) return res.status(401).json({ error: "No token provided" })

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const userId = decoded.userId

        const body = req.body

        const imageArray = req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        }))

        // 👇 SAVE PUBLIC IDs FOR CLEANUP
        uploadedImages = imageArray.map(img => img.public_id)

        const listingData = {
            title: body.title,
            description: body.description,
            price: body.price,
            address: body.address,
            beds: body.beds,
            baths: body.baths,
            sqft: body.sqft,
            type: body.type,
            listingType: body.listingType,
            duration: body.duration,
            images: imageArray,
            userId
        }

        const listing = new Listing(listingData)
        await listing.save()

        return res.status(200).json({
            success: true,
            message: "Listing Created"
        })

    } catch (error) {
        console.error("Listing creation error:", error)

        if (uploadedImages.length > 0) {
            await Promise.all(
                uploadedImages.map(public_id =>
                    cloudinary.uploader.destroy(public_id)
                )
            )
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})

export default router
