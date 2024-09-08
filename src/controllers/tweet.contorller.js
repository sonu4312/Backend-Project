import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { apiresponse } from "../utils/apiresponse.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose, { isValidObjectId } from "mongoose";
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new apierrors(400, "Tweet cannot be empty");
  }

  const newTweet = await Tweet.create({
    content,
    owner: req.user?._id,
  });
  if (!newTweet) {
    throw new apierrors(400, "Failed to create tweet, try again");
  }

  return res
    .status(200)
    .json(new apiresponse(200, newTweet, "Tweet created successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(id)) {
    throw new apierrors(400, "Invalid Tweet Id");
  }

  const oldTweet = await Tweet.findById(id);
  if (!oldTweet) {
    throw new apierrors(400, "Tweet not found");
  }

  if (!content) {
    throw new apierrors(400, "Tweet cannot be empty");
  }

  if (oldTweet.owner.toString() === req.user?._id.toString()) {
    const newTweet = await Tweet.findByIdAndUpdate(
      id,
      {
        $set: { content },
      },
      {
        new: true,
      }
    );

    return res
      .status(200)
      .json(new apiresponse(200, newTweet, "Tweet Updated Successfully"));
  }

  throw new apierrors(400, "Sorry, This is not your Tweet");
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new apierrors(400, "Invalid Tweet");
  }

  const myTweet = await Tweet.findById(id);
  if (myTweet.owner.toString() === req.user?._id.toString()) {
    await Tweet.findByIdAndDelete(id);

    return res
      .status(200)
      .json(new apiresponse(200, {}, "Tweet Deleted Successfully"));
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    throw new apierrors(400, "User not found");
  }

  const tweet = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likeDetails",
        pipeline: [
          {
            $project: {
              likedBy: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likeDetails",
        },
        ownerDetails: {
          $first: "$ownerDetails",
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, "$likeDetails.likedBy"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        ownerDetails: 1,
        likesCount: 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new apiresponse(200, tweet, "Tweets fetched successfully"));
});
export { createTweet, updateTweet, deleteTweet, getUserTweets };
