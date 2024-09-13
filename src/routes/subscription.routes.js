import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getSubscribedChannel,
  getUserSubscriber,
  toggleSubscription,
} from "../controllers/subscription.contoller.js";

const router = Router();
router.use(verifyToken);
router.route("/toggle/:channelId").post(toggleSubscription);
router.route("/my/:channelId").get(getUserSubscriber);
router.route("/subscribed/:id").get(getSubscribedChannel);

export default router;
