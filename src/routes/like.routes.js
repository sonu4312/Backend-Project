import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  toggleVideoLike,
  toggleCommentLike,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyToken); //used as middleware to all route for likes
router.route("/toggle-like/video/:id").post(toggleVideoLike);
router.route("/toggle-like/comment/:id").post(toggleCommentLike);

export default router;
