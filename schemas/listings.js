import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    // Establish the relationship: This field links the listing back to the user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true,
    },
    title: { type: String, required: true },
    address: { type: String, required: true },
    beds: { type: Number, required: true },
    baths: { type: Number, required: true },
    sqft: { type: Number, required: true },
    price: { type: String, required: true },
    listingType: { type: String, enum: ['sale', 'rent', 'lease'], required: true },
    views: { type: Number, default: 0 },
    images: [
        {
            url: String,
            public_id: String,
        },
    ],
    // You don't need 'earnings' or 'expiresAt' if you manage expiration differently, 
    // but based on your code, you should include them:
    expiresAt: { type: Date },
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

export default Listing;