import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["booked", "confirmed", "checked-in", "checked-out", "cancelled"], 
    default: "booked" 
  },
  paymentMethod: { type: String, enum: ["stripe", "cash_on_arrival"], default: "cash_on_arrival" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  stripePaymentIntentId: { type: String, default: null },
  totalPrice: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
