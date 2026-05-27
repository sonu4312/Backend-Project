import { Router } from "express";
import { forgotPassword, resetPassword } from "../controllers/auth.controller.js";

const router = Router();

// forgot password
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

export default router;
