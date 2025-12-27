import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true } // store the hashed password here
}, { timestamps: true })


const User = mongoose.models.User || mongoose.model("User", UserSchema)

export default User

