import express from "express";
import authController from "../controllers/authController.mjs";

const { loginUser,registerUser } = authController;

const authRouter = express.Router();

authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);



export default authRouter;
