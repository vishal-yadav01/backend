//* tag creating is done by admin only  isko admin middleawere laga dege isko admin kebal api se hi access kr sakte hsi

const Tag = require("../models/Tags");
require("dotenv").config();
//! create Tag ka handler function
exports.createTag = async (req, res) => {
  try {
    // * fetch data
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }
    const tagSavedData = await Tag.create({
      name: name,
      description: description,
    });
    console.log("tagsavedData", tagSavedData);
    return res.status(200).json({
      success: true,
      message: "Tag Created Succefully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//! get all tags
exports.showAlltags = async (req, res) => {
  try {
    const allTags = await Tag.find({}, { name: true, description: true });
    
    return res.status(200).json({
      success: true,
      message: " all tags  returend succefully",
      allTags,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
