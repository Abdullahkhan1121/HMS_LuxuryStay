import express from "express";
import { requireAuth } from "../middleware/authMiddleware.mjs";
import { requireRole } from "../middleware/roleMiddleware.mjs";
import { createBooking, getBookings, updateBookingStatus } from "../controllers/bookingController.mjs";

const router = express.Router();

// Admin can view all bookings
router.get("/", requireAuth, requireRole("admin"), getBookings);

// Admin or guest can create a booking
router.post("/", requireAuth, createBooking);

// Admin can update status
router.put("/:id/status", requireAuth, requireRole("admin"), updateBookingStatus);

export default router;
