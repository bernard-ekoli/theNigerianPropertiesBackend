import mongoose from "mongoose";


const settingSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: "global"
    },
    siteEmail: {
        type: String,
        required: true,
        default: "bernardedetekoli@gmail.com"
    },
    siteNumber: {
        type: String,
        required: true,
        default: "+2348123456789"
    },
    toggleFreeListing: {
        type: String,
        enum: ["yes", "no"],
        default: "no"
    },
    prices: {
        thirtyDays: {
            duration: { type: String, default: "30 Days" },
            price: { type: Number, required: true }
        },
        sixtyDays: {
            duration: { type: String, default: "60 Days" },
            price: { type: Number, required: true }
        },
        ninetyDays: {
            duration: { type: String, default: "90 Days" },
            price: { type: Number, required: true }
        }
    },
    currency: {
        type: String,
        default: "NGN"
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});


const Settings = mongoose.models.Settings || mongoose.model('Settings', settingSchema)

export default Settings