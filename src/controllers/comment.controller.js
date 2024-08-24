import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { apiresponse } from "../utils/apiresponse.js";
import { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { id } = req.params;
  if (!content || content.trim() === "") {
    throw new apierrors(400, "Comment is required");
  }

  if (!isValidObjectId(id)) {
    throw new apierrors(400, "Invalid video Id");
  }

  const newComment = await Comment.create({
    content,
    video: id,
    owner: req.user?._id,
  });

  return res
    .status(200)
    .json(new apiresponse(200, newComment, "Comment added successfully"));
});

const updateCommment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { id } = req.params;

  if (!content || content.trim() === "") {
    throw new apierrors(400, "Comment is required");
  }

  if (!isValidObjectId(id)) {
    throw new apierrors(400, "Invalid Comment Id");
  }

  const oldComment = await Comment.findById(id);

  console.log("Old Comment:", oldComment.owner.toString());

  console.log("Req:", req.user?._id.toString());

  if (oldComment?.owner.toString() === req.user?._id.toString()) {
    const newComment = await Comment.findByIdAndUpdate(
      id,
      {
        $set: { content },
      },
      { new: true }
    );
    return res
      .status(200)
      .json(new apiresponse(200, newComment, "Comment updated Successfully."));
  }

  throw new apierrors(401, "this is not your comment.");
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new apierrors("Comment not found");
  if (!isValidObjectId(id)) {
    throw new apierrors(400, "Invalid Comment Id");
  }

  const myComment = await Comment.findById(id);
  if (myComment.owner.toString() === req.user?._id.toString()) {
    await Comment.findByIdAndDelete(id);

    return res
      .status(200)
      .json(new apiresponse(200, {}, "Comment deleted Successfully"));
  }

  throw new apierrors(400, "Its not your comment");
});

export { addComment, updateCommment, deleteComment };
