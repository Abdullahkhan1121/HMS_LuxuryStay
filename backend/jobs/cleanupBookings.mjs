import cron from "node-cron";
import Booking from "../models/Booking.mjs";
import Room from "../models/Room.mjs";

// run every day at 02:00 server time
export const startCleanupJob = () => {
  cron.schedule("0 2 * * *", async () => {
    try {
      const now = new Date();
      // find bookings that have checkOutDate < now and not checked-out yet
      const finished = await Booking.find({
        checkOutDate: { $lt: now },
        status: { $in: ["booked", "confirmed", "checked-in"] }
      }).populate("room");

      for (const b of finished) {
        // set booking to checked-out
        b.status = "checked-out";
        await b.save();

        // free room
        if (b.room) {
          b.room.isAvailable = true;
          await b.room.save();
        }
      }

      console.log(`Cleanup job ran: ${finished.length} bookings processed`);
    } catch (err) {
      console.error("Cleanup job error:", err);
    }
  });
};
