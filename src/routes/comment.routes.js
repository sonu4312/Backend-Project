import { Router } from "express";
import {
  addComment,
  deleteComment,
  updateCommment,
} from "../controllers/comment.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/add/:id").post(verifyToken, addComment);
export default router;
router.route("/update/:id").patch(verifyToken, updateCommment);
router.route("/delete/:id").delete(verifyToken, deleteComment);
