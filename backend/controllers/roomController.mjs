import Room from "../models/Room.mjs";

// CREATE ROOM
export const createRoom = async (req, res) => {
    try {
        const room = await Room.create(req.body);
        res.status(201).json({ message: "Room created", room });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL ROOMS
export const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ isDeleted: false });
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET SINGLE ROOM
export const getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room || room.isDeleted) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.json(room);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE ROOM
export const updateRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json({ message: "Room updated", room });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// SOFT DELETE ROOM
export const deleteRoom = async (req, res) => {
    try {
        await Room.findByIdAndUpdate(req.params.id, { isDeleted: true });
        res.json({ message: "Room deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
