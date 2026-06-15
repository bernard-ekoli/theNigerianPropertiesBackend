import mongoose from "mongoose";


const settingSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: "global"
    },
    review: { type: String, enum: ["manual", "automatic"], default: "manual" }
});


const Settings = mongoose.models.Settings || mongoose.model('Settings', settingSchema)

export default Settings