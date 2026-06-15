import mongoose from "mongoose";

const ListingPriceSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: "LISTING_PRICES"
    },
    prices: {
        type: Object,
        required: true
    },
    currency: {
        type: String,
        default: "NGN"
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    collection: "prices"
});

export default mongoose.models.prices || mongoose.model("prices", ListingPriceSchema);
