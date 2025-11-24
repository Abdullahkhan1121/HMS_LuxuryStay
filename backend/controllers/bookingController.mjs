import Booking from "../models/Booking.mjs";
import Room from "../models/Room.mjs";

// CREATE BOOKING
export const createBooking = async (req, res) => {
    try {
        const { guestName, guestEmail, roomId, checkInDate, checkOutDate } = req.body;

        // Check room availability
        const room = await Room.findById(roomId);
        if (!room || !room.isAvailable) {
            return res.status(400).json({ message: "Room not available" });
        }

        // Calculate total price
        const nights = (new Date(checkOutDate) - new Date(checkInDate)) / (1000*60*60*24);
        const totalPrice = nights * room.price;

        // Create booking
        const booking = await Booking.create({
            guestName,
            guestEmail,
            room: roomId,
            checkInDate,
            checkOutDate,
            totalPrice
        });

        // Mark room as unavailable
        room.isAvailable = false;
        await room.save();

        res.status(201).json({ message: "Booking created", booking });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET ALL BOOKINGS
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate("room");
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE BOOKING STATUS (check-in, check-out, cancel)
export const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const booking = await Booking.findById(id).populate("room");
        if (!booking) return res.status(404).json({ message: "Booking not found" });

        booking.status = status;

        // If checked-out or cancelled, free the room
        if (status === "checked-out" || status === "cancelled") {
            booking.room.isAvailable = true;
            await booking.room.save();
        }

        await booking.save();
        res.json({ message: "Booking updated", booking });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
