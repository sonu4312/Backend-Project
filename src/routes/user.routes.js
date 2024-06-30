import { Router } from "express";
import {
  changePassword,
  getCurrentUser,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccDetails,
  updateAvatar,
  updateCoverImg,
  userChannelProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImg", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyToken, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyToken, changePassword);
router.route("/current-user").get(verifyToken, getCurrentUser);
router.route("/update-profile").patch(verifyToken, updateAccDetails);
router
  .route("/avatar")
  .patch(verifyToken, upload.single("avatar"), updateAvatar);
router
  .route("/coverImage")
  .patch(verifyToken, upload.single("coverImg"), updateCoverImg);

router.route("/channel/:username").get(verifyToken, userChannelProfile);

router.route("/history").get(verifyToken, getWatchHistory);
export default router;
