const Section = require("../models/Section");
const Course = require("../models/Course");
const { populate } = require("dotenv");
const SubSection = require("../models/SubSection");
// const { data } = require("autoprefixer");
require("dotenv").config();
//! create section

exports.createSection = async (req, res) => {
  try {
    //*data fetch
    //*data validation
    //*create course
    //* update course which id come in data
    //* return resposne

    const { sectionName, courseId } = req.body;
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "all fields required",
      });
    }

    const newSection = await Section.create({ sectionName });
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    ).populate({ path: "courseContent", populate: { path: "subSections" } });

    return res.status(200).json({
      success: true,
      message: "Section crested succefully",
      data: updatedCourseDetails,
    });
  } catch (error) {
    console.error("Section creation error", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//! update section
exports.updateSection = async (req, res) => {
  try {
    const { courseId, sectionName, sectionId } = req.body;
    if (!sectionId || !sectionName) {
      return res.status(400).json({
        success: false,
        message: "all fields required",
      });
    }

    const updateSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName: sectionName },
      { new: true }
    );
    const course = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: {
        path: "subSections",
      },
    });
    return res.status(200).json({
      success: true,
      message: updateSection,
      data: course,
    });
  } catch (error) {
    console.error("Section updation creation error", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//! delete section
exports.deleteSection = async (req, res) => {
  try {
    //* get id
    //* use findByIdAndDelte
    //* return res

    const { sectionId, courseId } = req.body;
    if (!sectionId || !courseId) {
      return res.status(400).json({ success: false, message: "missing data" });
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }
    //TODO (testing) delete the entry  from Course schema

    //! We need to delete the section ID from wherever it is stored; this is not done automatically.

    //* There are two ways to handle this. First, we can delete the section ID from all Course documents (in the course collection), since a section might be used in multiple courses. In our current code, this scenario doesn’t occur, but it's good to know about it for reference.

    //* The second approach is to delete the section ID only from the specific course where this section was added. We will use this second approach.

    //* Now, we also have two options for deletion: 1. We could use pre or post middleware on the Section schema to handle this deletion automatically whenever the remove operation is performed on a section. 2. Or, we could write the deletion code directly in the controller.

    //* I chose the second approach: handling the deletion in the controller.

    //*using updateOne it not return
    //* thats why i use here  findByIdAndUpdate
    // const updatedCourseDetails = await Course.updateOne(
    //   { id: courseId, courseContent: sectionId },
    //   { $pull: { courseContent: sectionId } },
    //   { new: true }
    // );
    await SubSection.deleteMany({ _id: { $in: section.subSections } });
    await Section.findByIdAndDelete(sectionId);
    await Course.findByIdAndUpdate(
      courseId,
      { $pull: { courseContent: sectionId } },
      { new: true }
    ).populate({
      path: "courseContent",
      populate: {
        path: "subSections",
      },
    });
    const updatedCourseDetails = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: { path: "subSections" },
    });
    return res.status(200).json({
      success: true,
      message: "section id deleted succefully",
      data: updatedCourseDetails,
    });
  } catch (error) {
    console.error("Section deletion error", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
