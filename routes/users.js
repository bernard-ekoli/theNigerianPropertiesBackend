import express from "express"
import User from "../schemas/users.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()
const router = express.Router()
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body ?? {}

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            })
        }

        const existingUser = await User.findOne({ email })
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        const checkedPassword = await bcrypt.compare(
            password,
            existingUser.password
        )

        if (!checkedPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            })
        }
        const { existingUserpassword, ...userWithoutPassword } = existingUser.toObject();
        return res.status(200).json({ success: true, user: userWithoutPassword })
    } catch (error) {
        console.error("Login error:", error)
        return res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
})

router.post('/signup', async (req, res) => {
    try {
        const missing = []
        const body = req.body
        const { firstName, lastName, email, password } = body ?? {};
        if (!firstName) missing.push('firstName')
        if (!lastName) missing.push('lastName')
        if (!email) missing.push('email')
        if (!password) missing.push('password')
        if (missing.length > 0) {
            return res.status(400).json(
                {
                    success: false,
                    message: `Missing field: ${missing.join(", ")}`
                }
            )
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        })
        await user.save()
        console.log("Created this user in the db:", user)
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "24h" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        })
        return res.status(201).json({
            success: true
        })
    } catch (error) {
        console.log("An Error Occured during the Signup process", error)
        return res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
})

router.get('/', async (req, res) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({
            "error": "No token provided"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({ _id: decoded.userId }).lean();
        const { password, ...rest } = user;
        return res.status(200).json({
            success: true,
            rest
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            success: false,
            message: "An error occured while fetching user info"
        })
    }
})
router.get('/public-info', async (req, res) => {
    try {
        const agentId = req.query.agentId;
        const user = await User.findOne({ _id: agentId }).lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        return res.status(200).json({ email: user.email, phone: user.phone, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {

    }
});

router.post('/edit-user-details', async (req, res) => {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const missing = [];
    const { firstName, lastName, phone } = req.body ?? {};
    if (!firstName) missing.push('firstName');
    if (!lastName) missing.push('lastName');
    if (missing.length > 0) return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const updatedUser = await User.findOneAndUpdate(
            { _id: decoded.userId },
            { $set: { firstName, lastName, phone } },
            { new: true, runValidators: true, lean: true }
        );
        const { password, ...rest } = updatedUser
        return res.status(200).json({ success: true, rest });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "An error occurred while editing user info" });
    }
});

export default router