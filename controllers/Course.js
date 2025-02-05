const { listenerCount } = require("nodemailer/lib/xoauth2");
const Course = require("../models/Course");
// const Tag = require("../models/Tag");
const User = require("../models/User");
const Cloudinary = require("cloudinary").v2;
// const { uploadImageToCloudinary } = require("../utils/imageUploader");
const { populate } = require("../models/OTP");
const Category = require("../models/Category");
const { model } = require("mongoose");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");
// const imageKit = require("../configs/imageKit");
const {
  convertSecondsToDuration,
} = require("../utils/convertSecondsToDuration");
require("dotenv").config();

const { imageKit } = require("../configs/imageKit");

const fs = require("fs");
const path = require("path");

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

  // console.log("Uploading file from path:", file.tempFilePath);

  try {
    const result = await imageKit.upload(options);
    // console.log("File uploaded successfully:", result);
    return result;
  } catch (error) {
    console.error("Error during file upload:", error.message);
    throw new Error("Error uploading file to ImageKit: " + error.message);
  }
}

//! course create
//* course only crated by instrucotr so we apply is Instrucotr middleware
exports.createCourse = async (req, res) => {
  try {
    const {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      tag: _tag,
      category,
      status,
      instructions: _instructions,
    } = req.body;

    // console.log(
    //   courseName,
    //   courseDescription,
    //   whatYouWillLearn,
    //   price,
    //   _tag,
    //   category
    // );
    if (!status || status === undefined) {
      status = "Draft";
    }
    const thumbnail = req.files.thumbnailImage;
    // console.log("thumbainal of course  create contolle=====r", thumbnail);

    const instructions = JSON.parse(_instructions);
    //* Convert the tag  from stringified Array to Array
    let tag; // Initialize tag variable
    try {
      // Try to parse _tag as JSON
      tag = JSON.parse(_tag);
      // Check if tag is an array
      if (!Array.isArray(tag)) {
        throw new Error("Tag should be an array");
      }
    } catch (error) {
      // If parsing fails, check if it's a single string
      if (typeof _tag === "string") {
        tag = [_tag]; // Convert the single string into an array
      } else {
        // If it's neither a valid JSON nor a string
        return res.status(400).json({
          success: false,
          message:
            "Invalid tag format, should be a JSON array or a single string",
        });
      }
    }
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag.length ||
      !thumbnail ||
      !instructions.length
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    //* check for instrutor
    const userId = req.user.id;
    const instructorDetailes = await User.findById(userId);
    // console.log("instrucore details", instructorDetailes);
    //TODO : verify that userId and instructorDeatils_id same or  different

    if (!instructorDetailes) {
      return res.status(400).json({
        success: false,
        message: "instructorinstructor detsails not found",
      });
    }

    //* check given category is valid or not
    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(400).json({
        success: false,
        message: "category detsails not found",
      });
    }
    const thumbnailImage = await uploadFileToImageKit(
      thumbnail,
      "Project_Media"
    );
    // console.log("after uploadind image========", thumbnailImage);

    //* create new couse entry
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: userId,
      whatYouWillLearn: whatYouWillLearn,
      price,
      tag,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.url,

      instructions,
      status: status,
    });

    //* add couse into User schema of instructor
    await User.findByIdAndUpdate(
      { _id: userId },
      {
        $push: {
          courses: newCourse._id, //* here push newCourse id into course array of user(instructor)
        },
      },
      { new: true }
    );

    //* Add the new course Category  schema
    const updateCategoryWithNewCourse = await Category.findByIdAndUpdate(
      { _id: categoryDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      {
        new: true,
      }
    );

    // console.log("updateCategoryWithNewCourse", updateCategoryWithNewCourse);

    return res.status(200).json({
      success: true,
      message: "course created succegully",
      data: newCourse,
    });
  } catch (error) {
    console.error("cousre createion  code error", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//! show all courses

exports.showAllCourse = async (req, res) => {
  try {
    const allCourses = await Course.find(
      { status: "Published" },
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReviews: true,
        studentsEnrolled: true,
      }
    )
      .populate("instructor")
      .exec();

    return res.status(200).json({
      success: true,
      message: "all course fetch succefully",
      data: allCourses,
    });
  } catch (error) {
    console.error("all courses fetch error", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//! getCourse details

exports.getCourseDetails = async (req, res) => {
  try {
    //* get course id
    const { courseId } = req.query;
    if (!courseId) {
      return res.status(400).json({
        message: "please provide course id",
        success: false,
      });
    }
    //* find ourse dtails
    const courseDetails = await Course.findOne({ _id: courseId })
      .populate({
        path: "instructor",
        //& -_id exclude id of instrcuor
        populate: {
          path: "additionalDetails",
          model: "Profile",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSections",
        },
      })
      .exec();
    // console.log("course detailes=>>>>", courseDetails);

    //* vlaidaiton

    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Course Details not  find with ${courseId}`,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Course details fectched succefully",
      data: courseDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "course fetch code error",
    });
  }
};

//! Edit Course Details

exports.editCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const updates = req.body;
    const findCourse = await Course.findById(courseId);
    if (!findCourse) {
      return res
        .status(404)
        .json({ success: false, message: "course not found" });
    }
    if (req.files) {
      const thumbnail = req.files.thumbnailImage;
      const updateThumbnial = await uploadFileToImageKit(
        thumbnail,
        "Project_Media"
      );
      findCourse.thumbnail = updateThumbnial.url;
    }

    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (key == "tag" || key == "instructions") {
          findCourse[key] = JSON.parse(updates[key]);
        } else {
          findCourse[key] = updates[key];
        }
      }
    }
    await findCourse.save();
    const updateCourse = await Course.findOne({ _id: courseId })
      .populate({
        path: "instructor",
        populate: { path: "additionalDetails" },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate([
        {
          path: "courseContent",
          populate: {
            path: "subSections",
          },
        },
      ])
      .exec();
    res.json({
      success: true,
      message: "Course updated successfully",
      data: updateCourse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

//! get full course details
exports.getFullCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;
    const courseDetails = await Course.findOne({
      _id: courseId,
    })
      .populate({
        path: "instructor",
        populate: {
          path: "additionalDetails",
        },
      })
      .populate("category")
      .populate("ratingAndReviews")
      .populate({
        path: "courseContent",
        populate: {
          path: "subSections",
        },
      })
      .exec();
    let courseProgressCount = await CourseProgress.findOne({
      courseID: courseId,
      userId: userId,
    });
    //console.log("courseProgressCount : ", courseProgressCount);
    if (!courseDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find course with id: ${courseId}`,
      });
    }
    let totalTimeInSeconds = 0;
    courseDetails.courseContent.forEach((content) => {
      content.subSections.forEach((subSection) => {
        const timeDurationInSeconds = parseInt(subSection.timeDuration);
        totalTimeInSeconds += timeDurationInSeconds;
      });
    });
    const totalTime = convertSecondsToDuration(totalTimeInSeconds);
    // console.log(
    //   "course Deatile-----",
    //   courseDetails,
    //   "   <<<<<<<<<<<< ======  ",
    //   totalTime
    // );

    return res.status(200).json({
      success: true,
      data: {
        courseDetails,
        totalTime,
        completedVideos: courseProgressCount?.completedVideos
          ? courseProgressCount?.completedVideos
          : [],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//! Get a list of Course for a given Instructor

exports.getInstructorCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("🔴🔴🔴🔴", userId);

    const instructorCourses = await Course.find({ instructor: userId }).sort({
      createdAt: -1,
    });
    // console.log(instructorCourses);

    return res.status(200).json({
      success: true,
      data: instructorCourses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve instructor courses",
      error: error.message,
    });
  }
};

//! delete  course

// exports.deleteCourse = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const findCourse = await Course.findById(courseId);
//     if (!findCourse) {
//       return res.status(404).json({ message: "Course not found" });
//     }
//     const studentsEnrolled = findCourse.studentsEnrolled;
//     for (const studentId of studentsEnrolled) {
//       await User.findByIdAndUpdate(studentId, {
//         $pull: {
//           courses: courseId,
//         },
//       });
//     }
//     const courseSection = findCourse.courseContent;
//     for (sectionId of courseSection) {
//       const section = await Section.findById(sectionId);
//       if (section) {
//         const subSections = section.subSections;
//         if (subSections) {
//           for (const subSectionId of subSectionId) {
//             await SubSection.findByIdAndDelete(subSectionId);
//           }
//         }
//       }
//       await Section.findByIdAndDelete(sectionId);
//     }
//     await Course.findByIdAndDelete(courseId);
//     return res.status(200).json({
//       success: true,
//       message: "Course deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Unenroll students from the course
    for (const studentId of course.studentsEnrolled) {
      await User.findByIdAndUpdate(studentId, {
        $pull: { courses: courseId },
      });
    }

    // Delete sections and sub-sections
    for (const sectionId of course.courseContent) {
      const section = await Section.findById(sectionId);
      if (section) {
        // Delete all sub-sections of the section
        await Promise.all(
          section.subSections.map((subSectionId) =>
            SubSection.findByIdAndDelete(subSectionId)
          )
        );
      }
      // Delete the section
      await Section.findByIdAndDelete(sectionId);
    }

    // Delete the course
    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.fakeBuyCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(404).json({
        message: "Course ID not provided",
        success: false,
      });
    }

    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
        success: false,
      });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Check if the user is already enrolled in the course
    const isAlreadyEnrolledInCourse = course.studentsEnrolled.some(
      (student) => student.toString() === userId
    );
    const isCourseInUserEnrolledList = user.courses.some(
      (enrolledCourse) => enrolledCourse.toString() === courseId
    );

    if (isAlreadyEnrolledInCourse || isCourseInUserEnrolledList) {
      return res.status(400).json({
        message: "You are already enrolled in this course",
        success: false,
      });
    }

    const courseProgress = new CourseProgress({
      courseID: courseId,
      userId: userId,
      completedVideos: [],
    });
    const savedProgress = await courseProgress.save();

    // Enroll the user in the course
    course.studentsEnrolled.push(userId);
    user.courses.push(courseId);
    user.courseProgress.push(savedProgress._id);
    await course.save();
    await user.save();

    return res.status(200).json({
      message: "Successfully enrolled in the course",
      success: true,
    });
  } catch (error) {
    console.error("Course enrollment failed:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
