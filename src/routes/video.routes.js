import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  deleteVideo,
  getVideoById,
  publishVideo,
  updateVideo,
} from "../controllers/video.controller.js";

const router = Router();

router
  .route("/publish-video")
  .post(verifyToken, upload.single("videoFile"), publishVideo);

router.route("/videobyid/:videoId").get(verifyToken, getVideoById);
router
  .route("/update/:videoId")
  .put(verifyToken, upload.single("thumbnail"), updateVideo);

router.route("/delete/:videoId").delete(verifyToken, deleteVideo);
export default router;
