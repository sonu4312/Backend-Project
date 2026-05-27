import { PasswordReset } from "../models/password.reset.modal.js";
import { User } from "../models/user.model.js";
import { apierrors } from "../utils/apierrors.js";
import { apiresponse } from "../utils/apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // 1. Validate email
  if (!email || !email.trim()) {
    throw new apierrors(400, "Email is required");
  }

  // 2. Find User
  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(200)
      .json(new apiresponse(200, {}, "If email exists, reset link sent"));
  }

  // 3. generate raw token
  const token = crypto.randomBytes(20).toString("hex");
  // 4. generate raw token
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  // 5. expiry in 10 min
  const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // 1000ms = 1sec

  // 6. save in db
  await PasswordReset.create({
    userId: user._id,
    tokenHash,
    expiredAt,
  });

  // 7. create reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  // 8. send email with reset link
  await sendEmail(
    user.email,
    "Reset Password",
    `
      <h2>Password Reset</h2>

      <p>
        Click below link to reset password
      </p>

      <a href="${resetLink}">
        Reset Password
      </a>
    `,
  );
  const loggger = {
    token,
    tokenHash,
    userId: user._id,
    resetLink,
  };

  return res.status(200).json(new apiresponse(200, loggger, "logges created"));

  // res.status(200).json(new apiresponse(200,user, "Email sent successfully"))
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  // 1. Validate input
  if (!newPassword) {
    throw new apierrors(400, "New Password is required");
  }
  if (!token) {
    throw new apierrors(400, "Token is missing");
  }
  // 2. Hash incoming token
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  // 3. Find reset document
  const resetDocument = await PasswordReset.findOne({
    tokenHash: resetTokenHash,
    used: false,
  });
  // 4. Validate token exists
  if (!resetDocument) {
    throw new apierrors(400, "Invalid token");
  }
  // 5. Check token already used (already covered in step 3.)
  // 6. Check token expiry
  if (resetDocument.expiredAt < Date.now()) {
    throw new apierrors(400, "Token expired");
  }
  // 7. Find User
  const user = await User.findById(resetDocument.userId);
  // 8. Hash Password(as it already happening in presave in model of the User)
  // 9. Update  and save password
  user.password = newPassword;
  await user.save();
  // 10. Mark token used
  resetDocument.used = true;
  resetDocument.save();

  // 11. Delete all the document for this user once successfully done this
  await PasswordReset.deleteMany({
    userId: user._id,
  });

  return res
    .status(200)
    .json(new apiresponse(200, user, "Password reset Successfully"));
});

export { forgotPassword, resetPassword };
