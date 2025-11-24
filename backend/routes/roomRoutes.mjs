import express from "express";
import { requireAuth } from "../middleware/authMiddleware.mjs";
import { requireRole } from "../middleware/roleMiddleware.mjs";
import { 
    createRoom, 
    getAllRooms, 
    getRoom, 
    updateRoom, 
    deleteRoom 
} from "../controllers/roomController.mjs";

const router = express.Router();

// Only ADMIN can manage rooms
router.post("/", requireAuth, requireRole("admin"), createRoom);
router.get("/", requireAuth, requireRole("admin"), getAllRooms);
router.get("/:id", requireAuth, requireRole("admin"), getRoom);
router.put("/:id", requireAuth, requireRole("admin"), updateRoom);
router.delete("/:id", requireAuth, requireRole("admin"), deleteRoom);

export default router;
