import express from "express";
import { requireAuth } from "../middleware/authMiddleware.mjs";
import { requireRole } from "../middleware/roleMiddleware.mjs";
import adminController from "../controllers/adminController.mjs";

const { createStaff, getAllStaff, deactivateStaff } = adminController;

const adminRouter = express.Router();

// Only admin can access these
adminRouter.post(
  "/create-staff",
  requireAuth,
  requireRole("admin"),
  createStaff
);

adminRouter.get(
  "/staff",
  requireAuth,
  requireRole("admin"),
  getAllStaff
);

adminRouter.put(
  "/deactivate/:id",
  requireAuth,
  requireRole("admin"),
  deactivateStaff
);

export default adminRouter;
