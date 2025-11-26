import express from "express";
import { requireAuth } from "../middlewares/authMiddleware.mjs";
import { requireRole } from "../middlewares/roleMiddleware.mjs";
import {
  createBooking,
  getBookings,
  updateBookingStatus,
  confirmStripePayment
} from "../controllers/bookingController.mjs";
import { stripeWebhookHandler } from "../controllers/stripeWebhook.mjs";

const router = express.Router();

// Public-ish: create booking (requires login)
router.post("/", requireAuth, createBooking);

// Admin: view all bookings
router.get("/", requireAuth, requireRole("admin"), getBookings);

// Admin: update status
router.put("/:id/status", requireAuth, requireRole("admin"), updateBookingStatus);

// Manual confirm (for testing) - protect this in prod
router.post("/confirm-payment", requireAuth, confirmStripePayment);

// Stripe webhook - do not require auth (Stripe will call it)
router.post("/webhook/stripe", express.raw({ type: 'application/json' }), stripeWebhookHandler);

export default router;
