import express from 'express'
import prices from '../schemas/prices.js'

const router = express.Router()


router.get("/", async (req, res) => {

    await prices.updateOne(
        { _id: "LISTING_PRICES" },
        {
            _id: "LISTING_PRICES",
            prices: { "30": 5000, "60": 10000, "90": 15000, "featuredListing": 2500 },
            currency: "NGN",
            updatedAt: new Date(),
            version: 1
        },
        { upsert: true } // creates it if it doesn’t exist
    );


    const config = await prices.findOne({ _id: "LISTING_PRICES" }).lean();
    res.status(200).json({
        success: true,
        data: config
    })
})


  

export default router;