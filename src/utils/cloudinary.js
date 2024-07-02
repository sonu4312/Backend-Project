import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// const uploadOnCloudinary = async (localpath) => {
//   try {
//     if (!localpath) return null;
//     const response = await cloudinary.uploader.upload(localpath, {
//       resource_type: "auto",
//     });
//     // console.log("file has successfully uploaded", response.url);
//     fs.unlinkSync(localpath);
//     return response;
//   } catch (error) {
//     fs.unlinkSync(localpath);
//     console.log("Error in upload Cloudinary", error);
//   }
// };
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // Example: 100MB

const uploadOnCloudinary = async (localpath) => {
  try {
    if (!localpath) return null;

    // Check file size before uploading
    const stats = fs.statSync(localpath);
    const fileSizeInBytes = stats.size;
    if (fileSizeInBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error("File size exceeds the maximum limit allowed.");
    }

    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: "auto", // Ensure correct resource type for videos
    });

    fs.unlinkSync(localpath); // Delete local file after successful upload

    return response;
  } catch (error) {
    fs.unlinkSync(localpath); // Ensure local file is deleted on error as well
    console.log("Error in upload Cloudinary", error);
    throw error; // Propagate the error for proper error handling in the controller
  }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return response;
  } catch (error) {
    console.log("Error in deleting from Cloudinary", error);
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
