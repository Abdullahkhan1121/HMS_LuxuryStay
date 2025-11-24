import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.mjs";
import adminRoutes from "./routes/adminRoutes.mjs";
import roomRoutes from "./routes/roomRoutes.mjs";
import bookingRoutes from "./routes/bookingRoutes.mjs";


dotenv.config();

const port = process.env.PORT
const app = express();

//middleware
app.use(cors());
app.use(express.json());

// Connect Database
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("DB is connected")
}

app.get("/", (req, res) => {
    res.send("LuxuryStay Backend Running...");
});


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
