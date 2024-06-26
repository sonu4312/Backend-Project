import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiresponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken";

const genrateAccessRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (error) {
    throw new apierrors(
      500,
      "Something went wrong while generating refresh and genrate token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;
  // console.log("req:", req);

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new apierrors(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new apierrors(410, "username or email already exist");
  }

  // console.log("files:", req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path; // this files comes from multer to send file
  // const coverImgLocalPath = req.files?.coverImg[0]?.path;

  let coverImgLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImg) &&
    req.files.coverImg.length > 0
  ) {
    coverImgLocalPath = req.files.coverImg[0].path;
  }
  // console.log("Avatar:", avatarLocalPath);

  if (!avatarLocalPath) {
    throw new apierrors(400, "Avatar file is required");
  }
  const UpAvatar = await uploadOnCloudinary(avatarLocalPath);
  const UpcoverImg = await uploadOnCloudinary(coverImgLocalPath);

  if (!UpAvatar) {
    throw new apierrors(400, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    avatar: UpAvatar.url,
    coverImg: UpcoverImg?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new apierrors(500, "Server problem while registering the user");
  }

  res
    .status(201)
    .json(new apiresponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new apierrors(400, "username or email is required for login");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new apierrors(404, "User does not exist");
  }

  const passwordCheck = user.isPasswordCorrect(password);
  if (!passwordCheck) {
    throw new apierrors(401, "Invalid Credentials");
  }

  const { refreshToken, accessToken } = await genrateAccessRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiresponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiresponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefToken = req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefToken) {
    throw new apierrors(400, "Unauthorizes request");
  }
  try {
    const decodedToken = await jwt.verify(
      incomingRefToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new apierrors(400, "Invalid RefreshToken");
    }

    if (incomingRefToken !== user?.refreshToken) {
      throw new apierrors(400, "Refresh Token in expired or used");
    }

    const { newAccessToken, newRefToken } = genrateAccessRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefToken, options)
      .json(
        new apiresponse(
          200,
          {
            accessToken: newAccessToken,
            refreshToken: newRefToken,
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new apierrors(400, error?.messsage || "Invalid RefreshToken");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPassCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPassCorrect) {
    throw new apierrors(401, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiresponse(200, {}, "Password changed successfuly"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new apiresponse(200, req.user, "Current user fetched successfully"));
});
const updateAccDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new apierrors(401, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(apiresponse(200, user, "User details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarImgPath = req.file.path;
  if (!avatarImgPath) {
    throw new apierrors(401, "Avatar file is missing");
  }

  const uploadAvatar = await uploadOnCloudinary(avatarImgPath);
  if (!uploadAvatar.url) {
    throw new apierrors(401, "Error while uploading");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: uploadAvatar.url,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new apiresponse(200, user, "Avatar updated successfully"));
});
const updateCoverImg = asyncHandler(async (req, res) => {
  const coverImgPath = req.file.path;
  if (!coverImgPath) {
    throw new apierrors(401, "Cover Image file is missing");
  }

  const uploadcoverImg = await uploadOnCloudinary(coverImgPath);
  if (!uploadcoverImg.url) {
    throw new apierrors(401, "Error while uploading");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImg: uploadcoverImg.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new apiresponse(200, user, "Cover Image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccDetails,
  updateAvatar,
  updateCoverImg,
};
