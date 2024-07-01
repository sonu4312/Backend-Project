import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { publishVideo } from "../controllers/video.controller.js";

const router = Router();

router
  .route("/publish-video")
  .post(verifyToken, upload.single("videoFile"), publishVideo);

export default router;
