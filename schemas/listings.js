import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    // Establish the relationship: This field links the listing back to the user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true,
    },
    status: { type: String, enum: ["pending", "active", "declined"], default: "pending" },
    title: { type: String, required: true },
    address: { type: String, required: true },
    beds: { type: Number, required: true },
    baths: { type: Number, required: true },
    sqft: { type: Number, required: true },
    price: { type: String, required: true },
    description: { type: String, required: true },
    type: {
        type: String,
        enum: ['house', 'flat', 'condo', 'eventp', 'office', 'land'],
        required: true
    },
    featured: { type: Boolean, default: false },
    listingType: { type: String, enum: ['sale', 'rent', 'lease'], required: true },
    duration: { type: Number, required: true },
    views: { type: Number, default: 0 },
    images: [
        {
            url: String,
            public_id: String,
        },
    ],
    expiresAt: { type: Date },
    expired: { type: Boolean, default: false },
    messages: [
        {
            name: String,
            email: String,
            phone: String,
            message: String,
            date: { type: Date, default: Date.now },
        },
    ],
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

export default Listing;