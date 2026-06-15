import mongoose from "mongoose";


const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference the User model
        required: true,
    },
    status: { type: String, enum: ["pending", "active"], default: "pending" },
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing', // Reference the Listing model
        required: true,
    },
    amountPaid: {type: Number,}
})

const TransactionHistory = mongoose.model.TransactionHistory || mongoose.model('TransactionHistory', transactionSchema)

export default TransactionHistory;