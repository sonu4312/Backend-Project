import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { apiresponse } from "../utils/apiresponse.js";
import { extractPublicId } from "../utils/extractPublicId.js";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoFile = req.file;

  if (!title || !description) {
    throw new apierrors(400, "title and descriptions are required");
  }
  if (!videoFile) {
    throw new apierrors(400, "Video file is required");
  }
  try {
    const uploadVideo = await uploadOnCloudinary(videoFile.path);

    if (!uploadVideo || !uploadVideo.url) {
      throw new apierrors(500, "Failed to upload video");
    }

    const newVideo = await Video({
      videoFile: uploadVideo.url,
      thumbnail: uploadVideo.url, // for now considering the same file as thumbnail
      title,
      description,
      duration: uploadVideo.duration,
      views: 0,
      isPublished: true,
      videoOwner: req.user._id,
    });

    const createdVideo = await newVideo.save();
    return res
      .status(200)
      .json(
        new apiresponse(200, createdVideo, "Video published successffully")
      );
  } catch (error) {
    throw new apierrors(400, error.message || "Error while publishing video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apierrors(400, "VideoID is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apierrors(404, "Video not found");
  }

  return res
    .status(200)
    .json(new apiresponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoId } = req.params;
  const thumbnailFile = req.file;

  if (!videoId) {
    throw new apierrors(400, "VideoId not found");
  }
  if ([title, description].some((field) => field && field.trim() === "")) {
    throw new apierrors(400, "Invalid input: Fields cannot be empty");
  }

  const video = await Video.findById(videoId);

  if (thumbnailFile) {
    if (video.thumbnail) {
      const publicId = extractPublicId(video.thumbnail);
      await deleteFromCloudinary(publicId, "video");
    }

    const uploadThumbnail = await uploadOnCloudinary(thumbnailFile.path);
    if (!uploadThumbnail || !uploadThumbnail.url) {
      throw new apierrors(500, "Failed to upload thumbnail");
    }
    video.thumbnail = uploadThumbnail.url;
  }

  if (title) video.title = title;
  if (description) video.description = description;

  const updatedVideo = await video.save();

  return res
    .status(200)
    .json(
      new apiresponse(200, updatedVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new apierrors(400, "VideoId is required");
  }
  const video = await Video.findByIdAndDelete(videoId);

  if (video.videoFile) {
    const publicId = extractPublicId(video.videoFile);
    await deleteFromCloudinary(publicId, "video");
  }

  if (video.thumbnail && video.thumbnail !== video.videoFile) {
    const publicId = extractPublicId(video.thumbnail);
    await deleteFromCloudinary(publicId, "video");
  }

  return res
    .status(200)
    .json(new apiresponse(200, {}, "Video deleted successfully"));
});
export { publishVideo, getVideoById, updateVideo, deleteVideo };
