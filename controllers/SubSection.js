const subSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const SubSection = require("../models/SubSection");
// const { data } = require("autoprefixer");
require("dotenv").config();
//! create subSection

//*** */ https://chatgpt.com/c/6756de41-a450-8008-81a0-db4d246d18f6
const { imageKit } = require("../configs/imageKit");
const fs = require("fs");
const { response } = require("express");
const { log } = require("console");

async function uploadFileToImageKit(file, folder, quality) {
  const options = {
    file: fs.readFileSync(file.tempFilePath), // Read file as binary
    fileName: file.name || "uploaded-file", // Provide a fallback name
    useUniqueFileName: true, // Generate unique names
    tags: ["example", "upload"],
    isPrivateFile: false,
  };

  if (folder) {
    options.folder = folder;
  }

  if (quality) {
    options.quality = quality;
  }

  console.log("Uploading file from path:", file.tempFilePath);

  try {
    const result = await imageKit.upload(options);
    console.log("File uploaded successfully:", result);
    return result;
  } catch (error) {
    console.error("Error during file upload:", error.message);
    throw new Error("Error uploading file to ImageKit: " + error.message);
  }
}

exports.createSubSection = async (req, res) => {
  try {
    //* data fetch from req body
    //* extract video
    //* validation
    //* upload video to cloudinary
    //* create subSection
    //* update Section wtih this subsection
    //* retrun res
    console.log("bc run");

    const { sectionId, title, description } = req.body;
    console.log("data bc---", sectionId, title, description);
    console.log("     vidoe", req.files);

    const video = req.files.video;

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "gand mrao",
      });
    }
    if (!sectionId || !title || !description || !video) {
      return res.status(400).json({
        success: true,
        message: "all fields required",
      });
    }
    console.log("bg-");

    const reponse = await uploadFileToImageKit(video, "Project_Media");
    console.log("bc-respone");
    console.log("deho yar.......................................", reponse);

    const subSectionDetails = await subSection.create({
      title: title,
      description: description,
      videoUrl: reponse.url,
      timeDuration: reponse.duration,
    });

    const updateSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        $push: {
          subSections: subSectionDetails._id,
        },
      },
      { new: true }
    ).populate("subSections");

    console.log("sub section id", subSectionDetails._id);

    console.log(updateSection); //* here we log update Section

    return res.status(200).json({
      success: true,
      message: "Subsection created succefully",
      data: updateSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "sub section crestion error",
    });
  }
};

//! update subsection
//~here we update multiple fields so wait bro 👩‍💻

exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description } = req.body;
    const subSectionData = await SubSection.findById(subSectionId);

    console.log("req.body", req.body);

    if (!subSectionData) {
      return res.status(404).json({
        success: false,
        message: "sub section not found",
      });
    }

    if (title !== undefined) {
      subSectionData.title = title;
    }
    if (description !== undefined) {
      subSectionData.description = description;
    }
    if (req.files && req.files.video !== undefined) {
      const video = req.files.video;
      console.log(video, "vieo");

      const uploadData = await uploadFileToImageKit(video, "Project_Media");
      console.log("url**********************************", uploadData);

      subSectionData.videoUrl = uploadData.url;
      subSectionData.timeDuration = `${uploadData.duration}`;
    }

    await subSectionData.save();
    const updatedSection = await Section.findById(sectionId).populate(
      "subSections"
    );

    // console.log("updated section", updatedSection);

    return res.json({
      success: true,
      message: "Section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the section",
    });
  }
};

//!  delteSubSection

exports.deleteSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId } = req.body;
    const subSectionData = await SubSection.findById(subSectionId);
    if (!subSectionData) {
      return res.status(404).json({
        success: false,
        message: "sub section not found",
      });
    }

    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSections: subSectionId,
        },
      },
      { new: true }
    );

    await SubSection.findByIdAndDelete(subSectionId);

    const updatedSection = await Section.findById(sectionId).populate(
      "subSections"
    );
    return res.status(200).json({
      message: "subSection delted succefully",
      success: true,
      data: updatedSection,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "sub section detele code error",
      success: false,
    });
  }
};
