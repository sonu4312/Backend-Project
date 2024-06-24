import { asyncHandler } from "../utils/asyncHandler.js";
import { apierrors } from "../utils/apierrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiresponse } from "../utils/apiresponse.js";

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

export { registerUser };
