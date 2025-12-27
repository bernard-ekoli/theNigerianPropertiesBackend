import multer from "multer";
import pkg from "multer-storage-cloudinary";
import cloudinary from "../cloudinary.js";

// Try every possible hiding spot for the constructor
const CloudinaryStorage = pkg.CloudinaryStorage || (pkg.default && pkg.default.CloudinaryStorage) || pkg.default || pkg;


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "theNigerianPropertiesListingImages",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });
export default upload;