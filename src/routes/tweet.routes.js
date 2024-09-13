import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getAllTweets,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.contorller.js";

const router = Router();

router.use(verifyToken);
router.route("/add").post(createTweet);
router.route("/update/:id").patch(updateTweet);
router.route("/delete/:id").delete(deleteTweet);
router.route("/my-tweet/:id").get(getUserTweets);
router.route("/all-tweet").get(getAllTweets);

export default router;
