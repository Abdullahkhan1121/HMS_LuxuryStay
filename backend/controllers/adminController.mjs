import User from "../models/User.mjs";
import bcrypt from "bcryptjs";

// CREATE STAFF
let createStaff = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newStaff = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        res.status(201).json({
            message: "Staff created successfully",
            staff: newStaff
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL STAFF
let getAllStaff = async (req, res) => {
    try {
        const staff = await User.find({ role: { $ne: "guest" } });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DEACTIVATE STAFF
let deactivateStaff = async (req, res) => {
    try {
        const { id } = req.params;

        await User.findByIdAndUpdate(id, { isActive: false });

        res.json({ message: "Staff deactivated successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export default {
    createStaff,
    getAllStaff,
    deactivateStaff
};
