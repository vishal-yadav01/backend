const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const User = require("../models/User");
const { ConnectionStates, default: mongoose } = require("mongoose");
require("dotenv").config();
//! create  ratirng and review

exports.createRatingAndReview = async (req, res) => {
  try {
    //* get user id from req.user.id
    //* get data from req.body
    //* check user is enrolled in course or not
    //* check user is alredy  reviewed or not
    //*  create it
    //* update course with this ratinig and review

    const { rating = "", review = "", courseId } = req.body;

    const userId = req.user.id;

    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(400).json({
        message: "student not enrolled in this course",
        success: false,
      });
    }
    //*check if user already reviewed the course
    const alreadyReviewed = await RatingAndReview.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return res.status(403).json({
        message: "Course already reviewd by user",
        success: false,
      });
    }

    const newReviewReveiw = await RatingAndReview.create({
      user: userId,
      rating: rating,
      review: review,
      course: courseId,
    });

    //* update course with rating and reviews
    const updateCourse = await Course.findByIdAndUpdate(
      courseId,
      { $push: { ratingAndReviews: newReviewReveiw._di } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "reveiw and rating add succefully",
      data: newReviewReveiw,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "reveiw and rating code error",
    });
  }
};

//! get average ratring

exports.getAverageRating = async (req, res) => {
  try {
    //* get course id
    const course_Id = req.body.courseId;

    //*calculate avg rating
    const result = await RatingAndReview.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(course_Id),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    //*return rating
    if (result.length > 0) {
      return res.status(200).json({
        success: true,
        averageRating: result[0].averageRating,
      });
    }

    //* if no review rating
    return res.status(200).json({
      success: true,
      message: "average rating 0",
      averageRating: 0,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "avg rating code error",
    });
  }
};

//! get all rating

exports.getAllRating = async (req, res) => {
  try {
    //* find all review and ratirngs

    //&   this is simple way but not fullfil all that provide third and second ways
    // const allData = await RatingAndReview.find(
    //   {},
    //   { user: true, rating: true, review: true, course: true }
    // )
    //   .sort({ rating: "desc" })
    //   .populate("user")
    //   .populate("course");
    //& second good way
    // const allData = await RatingAndReview.find(
    //   {},
    //   { user: true, rating: true, review: true, course: true }
    // )
    //   .sort({ rating: "desc" })
    //   .populate("user", "firstName lastName email image")
    //   .populate("course", "courseName");
    //& third good way
    const allData = await RatingAndReview.find(
      {},
      { user: true, rating: true, review: true, course: true }
    )
      .sort({ rating: "desc" })
      .populate({
        path: "user",
        // populate:{
        //   path:'addtitonalDetailes'
        // }
        select: "firstName lastName email image",
      })
      .populate({
        path: "course",
        select: "courseName",
      });

    //* return resposne
    return res.status(200).json({
      success: true,
      message: "all reviews and rating fetched succefully",
      data: allData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "get rating code error",
    });
  }
};
