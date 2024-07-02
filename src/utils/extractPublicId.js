const extractPublicId = (url) => {
  const parts = url.split("/");
  const publicIdWithExtension = parts[parts.length - 1];
  const publicId = publicIdWithExtension.split(".")[0]; // Remove the file extension
  return publicId;
};

export { extractPublicId };
