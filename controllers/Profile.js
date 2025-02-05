const { default: mongoose } = require("mongoose");
const Course = require("../models/Course");
const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
require("dotenv").config();
const CourseProgress = require("../models/CourseProgress");

const { imageKit } = require("../configs/imageKit");

const fs = require("fs");
// const { data } = require("autoprefixer");

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

//! update profile

exports.updateProfile = async (req, res) => {
  try {
    const { dob, about, contactNumber, gender, firstName, lastName } = req.body;
    const id = req.user.id;
    console.log("serer update profiel", req.body);

    if (!contactNumber || !gender) {
      return res.status(400).json({
        success: false,
        message: "all fields require",
      });
    }
    const userDetails = await User.findById(id).populate("additionalDetails");
    const profileId = userDetails.additionalDetails;

    //* this approach it take unnecessary two times profile db calls but the work in done in one so  use second approach
    // const profileDetails = await Profile.findById(profileId);
    // profileDetails.dateOfBirth = dob;
    // profileDetails.gender = gender;
    // profileDetails.about = about;
    // profileDetails.contactNumber = contactNumber;
    // await profileDetails.save();

    //* this is second approach
    const profileDetails = await Profile.findByIdAndUpdate(
      profileId,
      {
        dateOfBirth: dob,
        gender: gender,
        about: about,
        contactNumber: contactNumber,
      },
      { new: true }
    );

    if (firstName) userDetails.firstName = firstName;
    if (lastName) userDetails.lastName = lastName;
    await userDetails.save();
    const newUserData = await User.findById(id).populate("additionalDetails");
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: newUserData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "profile update  error",
    });
  }
};

//! account delete

exports.deleteAccount = async (req, res) => {
  try {
    //* get id
    //* verify id
    //*  delete profile
    //* delete from course
    //* delete user
    //* retunr response
    // *console.log(req.user.id);
    //!===================https://chatgpt.com/c/67481edc-ba9c-8008-896e-93f93a05dbea cron job
    const userId = req.user.id;
    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    //TODO: i want schedual  this to delte five or many days  Chat gpt use karo
    //TODO: find cron job ?

    //* delete profile
    console.log(userDetails.additionalDetails);

    if (userDetails.additionalDetails) {
      await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
    }

    // // //*delete all course of same id
    // await Course.deleteMany({ _id: { $in: userDetails.courses } });
    const uid = new mongoose.Types.ObjectId(userId);
    if (req.user.accountType === "Student") {
      await Course.updateMany(
        { studentsEnrolled: uid },
        { $pull: { studentsEnrolled: uid } }
      );
    }
    if (req.user.accountType === "Instructor") {
      try {
        //*******************       HERE I MIANTAIN DATABASE INTEGRITY       ************ */

        //**                               **********          flatMap and map usecase and different bewteen in topic file me  hai       ********                 */
        // await Course.deleteMany({ _id: { $in: userDetails.courses } });
        // await Course.deleteMany({ instructor: uid });
        const courses = await Course.find({ instructor: uid });

        const courseIds = courses.map((course) => course._id);
        const sectionIds = courses.flatMap((course) => course.courseContent);
        const sections = await Section.find({ _id: { $in: sectionIds } });
        const subSectionIds = sections.flatMap(
          (section) => section.subSections
        );
        await SubSection.deleteMany({ _id: { $in: subSectionIds } });
        await Section.deleteMany({ _id: { $in: sectionIds } });
        await Course.deleteMany({ _id: { $in: courseIds } });
      } catch (error) {
        console.error(
          "Error deleting instructor's courses and content:",
          error
        );
      }
    }
    //* here delete user from User collection
    await User.findByIdAndDelete(uid);

    return res.status(200).json({
      message: "account delete succefully",
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "profile delete  error",
    });
  }
};

//! find all details of User
exports.allDetailsOfUser = async (req, res) => {
  try {
    const id = req.user.id;
    if (req.user.accountType === "Instructor") {
      const allDetails = await User.findById(id)
        .populate({ path: "additionalDetails" })
        .populate({
          path: "courses",
          populate: {
            path: "courseContent",
            populate: { path: "subSections" },
          },
        })
        .exec();
      return res.status(200).json({
        success: true,
        message: "user data fetch succefully",
        allDetails,
      });
    } else if (req.user.accountType === "Student") {
      const allDetails = await User.findById(id)
        .populate("additionalDetails")
        .exec();
      return res.status(200).json({
        success: true,
        message: "user data fetch succefully",
        allDetails,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "all data find of user    error",
    });
  }
};

//! update display picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.files || !req.files.displayPicture) {
      return res.status(404).json({
        success: false,
        message: "Please choose a file to upload.",
      });
    }
    const newUserPicture = req.files.displayPicture;
    console.log("Image upload started...");

    const picutreDetails = await uploadFileToImageKit(
      newUserPicture,
      "Project_Media"
    );

    const updateProfilePicture = await User.findByIdAndUpdate(
      { _id: userId },
      { image: picutreDetails.url },
      { new: true }
    ).populate("additionalDetails");

    return res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",

      data: updateProfilePicture,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while uploading the profile picture.",
    });
  }
};
// here any error

//! get enrolled course
const convertSecondsToDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}h:${minutes
    .toString()
    .padStart(2, "0")}m:${secs.toString().padStart(2, "0")}s`;
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user and populate enrolled courses
    let userDetails = await User.findOne({ _id: userId })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent", // Populate sections
          populate: {
            path: "subSections", // Populate subsections
          },
        },
      })
      .exec();

    // Check if user exists
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userId}`,
      });
    }

    // Convert to plain object for modifications
    userDetails = userDetails.toObject();

    // Iterate through each course to calculate progress and duration
    for (let i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0;
      let totalSubsectionCount = 0;

      // Iterate through course content (sections)
      userDetails.courses[i].courseContent.forEach((section) => {
        // Calculate total duration from subsections
        section.subSections.forEach((subSection) => {
          const durationInSeconds = parseInt(
            subSection.timeDuration || "0",
            10
          );
          totalDurationInSeconds += durationInSeconds;
        });

        // Count all subsections
        totalSubsectionCount += section.subSections.length;
      });

      // Set total duration for the course
      userDetails.courses[i].totalDuration = convertSecondsToDuration(
        totalDurationInSeconds
      );

      // Fetch course progress
      let courseProgress = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      });

      const completedVideosCount = courseProgress?.completedVideos.length || 0;

      // Calculate progress percentage
      userDetails.courses[i].progressPercentage =
        totalSubsectionCount === 0
          ? 100
          : parseFloat(
              ((completedVideosCount / totalSubsectionCount) * 100).toFixed(2)
            );
    }

    // Respond with user courses
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//! instrutor DashBoard
exports.instructorDashboard = async (req, res) => {
  try {
    const courseDetails = await Course.find({ instructor: req.user.id });

    const courseData = courseDetails.map((course) => {
      const totalStudentsEnrolled = course.studentsEnrolled.length;
      const totalAmountGenerated = totalStudentsEnrolled * course.price;

      // Create a new object with the additional fields
      const courseDataWithStats = {
        _id: course._id,
        courseName: course.courseName,
        courseDescription: course.courseDescription,
        // Include other course properties as needed
        totalStudentsEnrolled,
        totalAmountGenerated,
      };

      return courseDataWithStats;
    });

    res.status(200).json({ courses: courseData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
