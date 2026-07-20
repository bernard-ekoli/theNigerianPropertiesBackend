import express from "express"
import User from "../schemas/users.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()
const router = express.Router()

router.post("/login", async (req, res) => {
    try {
        const { email: rawEmail, password } = req.body ?? {}

        if (!rawEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            })
        }
        const email = rawEmail?.trim().toLowerCase()
        const existingUser = await User.findOne({ email })
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            })
        }

        const checkedPassword = await bcrypt.compare(password, existingUser.password)
        if (!checkedPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            })
        }

        // 1. Create JWT
        const token = jwt.sign(
            { id: existingUser._id, email: existingUser.email, role: existingUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        // 2. Set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        })

        // 3. Return success (no token in body, it's in the cookie)
        const { password: _, ...userWithoutPassword } = existingUser.toObject()
        return res.status(200).json({
            success: true,
            user: userWithoutPassword,
        })

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
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is not defined");
            return res.status(500).json({ success: false, message: "Server misconfiguration" });
        }

        const missing = []
        const body = req.body
        const { firstName, lastName, email, phone, password } = body ?? {};

        const trimmedEmail = email?.trim().toLowerCase();
        const trimmedFirst = firstName?.trim();
        const trimmedLast = lastName?.trim();
        const trimmedPhone = phone?.trim();

        if (!trimmedFirst) missing.push('firstName')
        if (!trimmedLast) missing.push('lastName')
        if (!trimmedEmail) missing.push('email')
        if (!password) missing.push('password')
        if (!phone) missing.push('phone')
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing field: ${missing.join(", ")}`
            })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        const existingUser = await User.findOne({ email: trimmedEmail });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            firstName: trimmedFirst,
            lastName: trimmedLast,
            email: trimmedEmail,
            phone: trimmedPhone,
            password: hashedPassword,
        })
        const newUser = await user.save()

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        const { password: _, ...userWithoutPassword } = newUser.toObject();
        return res.status(201).json({
            success: true,
            user: userWithoutPassword,
        })

    } catch (error) {
        console.log("An Error Occured during the Signup process", error)
        return res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
})

router.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
    })
    return res.status(200).json({ success: true, message: "Logged out" })
})

router.get('/me', async (req, res) => {
    try {
        const token = req.cookies?.token
        if (!token) return res.status(401).json({ success: false })

        // 👇 actually verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // 👇 fetch the actual user from DB
        const user = await User.findById(decoded.id).select("-password")
        if (!user) return res.status(401).json({ success: false })

        return res.status(200).json({
            success: true,
            user, // 👈 send back user data so your dashboard can use it
        })
    } catch (error) {
        return res.status(401).json({
            success: false
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({ _id: decoded.id }).lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { password, ...rest } = user;

        return res.status(200).json({
            success: true,
            rest
        });
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
    const updateFields = { firstName, lastName };
    if (phone !== undefined) {
        updateFields.phone = phone;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const updatedUser = await User.findOneAndUpdate(
            { _id: decoded.id },
            { $set: updateFields },
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