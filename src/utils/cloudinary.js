import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localpath) => {
  try {
    if (!localpath) return null;
    const response = await cloudinary.uploader.upload(localpath, {
      resource_type: "auto",
    });
    // console.log("file has successfully uploaded", response.url);
    fs.unlinkSync(localpath);
    return response;
  } catch (error) {
    fs.unlinkSync(localpath);
    console.log("Error in upload Cloudinary", error);
  }
};

export { uploadOnCloudinary };
