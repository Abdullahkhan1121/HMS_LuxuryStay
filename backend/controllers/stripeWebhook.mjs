import Booking from "../models/Booking.mjs";
import Room from "../models/Room.mjs";
import stripeLib from "stripe";
const stripe = stripeLib(process.env.STRIPE_SECRET);

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Replace STRIPE_WEBHOOK_SECRET in env if using signed webhooks
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // If you can't verify, just respond 400
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const bookingId = pi.metadata?.bookingId;

    if (bookingId) {
      const booking = await Booking.findById(bookingId).populate("room");
      if (booking) {
        booking.paymentStatus = "paid";
        booking.status = "confirmed";
        booking.stripePaymentIntentId = pi.id;
        await booking.save();

        // mark room unavailable
        const room = await Room.findById(booking.room._id);
        room.isAvailable = false;
        await room.save();
      }
    }
  }

  // ack to stripe
  res.json({ received: true });
};
