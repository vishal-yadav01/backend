const cloudinary = require("cloudinary").v2;
require("dotenv").config();

exports.cloudinaryConnect = async () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_secret: process.env.API_SECRET,
      api_key: process.env.API_KEY,
    });
    console.log("cloud connceted");
  } catch (error) {
    console.log(error);
  }
};
