import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { apiresponse } from "../utils/apiresponse.js";

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

export { publishVideo };
