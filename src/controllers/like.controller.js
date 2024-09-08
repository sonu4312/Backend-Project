import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { apiresponse } from "../utils/apiresponse.js";
import { Like } from "../models/like.model.js";

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new apierrors(400, "Invalid Video Id");
  }
  const likedVideo = await Like.findOne({
    video: id,
    likedBy: req.user?._id,
  });

  if (likedVideo) {
    await Like.findByIdAndDelete(likedVideo?._id);

    return res
      .status(200)
      .json(new apiresponse(200, null, "Video disliked Successfully"));
  }
  const newLike = await Like.create({
    video: id,
    likedBy: req.user?._id,
  });
  return res
    .status(201)
    .json(
      new apiresponse(201, { LikedVideo: newLike }, "Video Liked Successfully")
    );
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new apierrors(401, "Invalid commment Id.");
  }

  const likedComment = await Like.findOne({
    comment: id,
    likedBy: req.user?._id,
  });
  if (likedComment) {
    await Like.findByIdAndDelete(likedComment?._id);
    return res
      .status(201)
      .json(new apiresponse(201, null, "Comment Unliked Succefully."));
  }

  const newLike = Like.create({
    comment: id,
    likedBy: req.user?._id,
  });
  return res
    .status(201)
    .json(
      new apiresponse(
        201,
        { LikedComment: newLike },
        "Comment Liked Successfully."
      )
    );
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new apierrors(401, "Invalid Tweet Id");
  }

  const likedTweet = await Like.findOne({
    tweet: id,
    likedBy: req.user?._id,
  });
  if (likedTweet) {
    await Like.findByIdAndDelete(likedTweet?._id);

    return res.status(200).json(new apiresponse(200, null, "Tweet Unliked"));
  }

  const newLike = await Like.create({
    tweet: id,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new apiresponse(200, { LikedTweet: newLike }, "Tweet Liked"));
});
