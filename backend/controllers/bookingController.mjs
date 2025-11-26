import Booking from "../models/Booking.mjs";
import Room from "../models/Room.mjs";
import stripeLib from "stripe";
const stripe = stripeLib(process.env.STRIPE_SECRET);

// Helper: check overlap for date ranges (exclusive of checkOut)
const isOverlapping = (startA, endA, startB, endB) => {
  // convert to ms
  const aStart = new Date(startA).setHours(0,0,0,0);
  const aEnd = new Date(endA).setHours(0,0,0,0);
  const bStart = new Date(startB).setHours(0,0,0,0);
  const bEnd = new Date(endB).setHours(0,0,0,0);
  // overlap if startA < endB && startB < endA
  return (aStart < bEnd) && (bStart < aEnd);
};

export const createBooking = async (req, res) => {
  try {
    const { guestName, guestEmail, roomId, checkInDate, checkOutDate, paymentMethod } = req.body;

    if (!guestName || !guestEmail || !roomId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Validate dates
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: "Invalid check-in/check-out dates" });
    }

    // Prevent double booking: find bookings for this room that overlap and are not cancelled or checked-out
    const existing = await Booking.find({
      room: roomId,
      status: { $in: ["booked", "confirmed", "checked-in"] }
    });

    for (const b of existing) {
      if (isOverlapping(b.checkInDate, b.checkOutDate, start, end)) {
        return res.status(409).json({ message: "Room is already booked for the selected dates" });
      }
    }

    // Calculate nights (difference in days)
    const msInDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((end.setHours(0,0,0,0) - start.setHours(0,0,0,0)) / msInDay);
    const totalPrice = nights * room.price;

    // Create booking record (paymentState handled below)
    const booking = await Booking.create({
      guestName,
      guestEmail,
      room: roomId,
      checkInDate: start,
      checkOutDate: end,
      totalPrice,
      paymentMethod: paymentMethod || "cash_on_arrival",
      paymentStatus: paymentMethod === "stripe" ? "pending" : "pending"
    });

    // If Cash on arrival → mark room as unavailable immediately and keep paymentStatus pending
    if (paymentMethod === "cash_on_arrival" || !paymentMethod) {
      room.isAvailable = false;
      await room.save();
      // booking.status remains 'booked'
      return res.status(201).json({ message: "Booking created (Cash on Arrival)", booking });
    }

    // If Stripe → create PaymentIntent and return client_secret
    if (paymentMethod === "stripe") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // cents
        currency: "usd",
        metadata: { bookingId: booking._id.toString(), roomId: roomId.toString() },
        description: `Booking for room ${room.roomNumber} (${nights} nights)`
      });

      // Attach intent id to booking
      booking.stripePaymentIntentId = paymentIntent.id;
      await booking.save();

      return res.status(201).json({
        message: "Booking created (Stripe). Complete payment to confirm.",
        booking,
        clientSecret: paymentIntent.client_secret
      });
    }

    // fallback
    res.status(201).json({ message: "Booking created", booking });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin: view all bookings (with room populated)
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("room");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update booking status (admin)
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await Booking.findById(id).populate("room");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = status;

    // If checked-out or cancelled → free room
    if (["checked-out", "cancelled"].includes(status)) {
      const room = await Room.findById(booking.room._id);
      room.isAvailable = true;
      await room.save();
    }

    await booking.save();
    res.json({ message: "Booking updated", booking });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Webhook or manual endpoint to confirm Stripe payment (you should protect the webhook)
export const confirmStripePayment = async (req, res) => {
  // This route is used if you don't want to use webhook flow.
  // In production prefer Stripe webhooks for reliability (below we give webhook example)
  try {
    const { bookingId, paymentIntentId } = req.body;
    const booking = await Booking.findById(bookingId).populate("room");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Verify with Stripe
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status === "succeeded") {
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      booking.stripePaymentIntentId = paymentIntentId;
      await booking.save();

      // mark room unavailable
      const room = await Room.findById(booking.room._id);
      room.isAvailable = false;
      await room.save();

      return res.json({ message: "Payment confirmed and booking confirmed", booking });
    } else {
      booking.paymentStatus = "failed";
      await booking.save();
      return res.status(400).json({ message: "Payment not successful", status: pi.status });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
