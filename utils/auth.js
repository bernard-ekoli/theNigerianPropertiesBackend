// utils/auth.js
import jwt from "jsonwebtoken";

export const getUserFromCookie = (req) => {
    const token = req.cookies?.token;

    if (!token) {
        return { success: false, message: "No token found" };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return {
            success: true,
            user: decoded
        };
    } catch (err) {
        return {
            success: false,
            message: "Invalid token"
        };
    }
};