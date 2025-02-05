const express = require("express");
const router = express.Router();

//*Course Controllers
const {
  getCourseDetails,
  createCourse,
  showAllCourse,
  editCourse,
  getFullCourseDetails,
  getInstructorCourses,
  deleteCourse,
  fakeBuyCourse,
} = require("../controllers/Course");

//*Category Controllers
const {
  showAllCategories,
  createCategory,
  categoryPageDetails,
} = require("../controllers/Category");

//*Section Controllers
const {
  createSection,
  deleteSection,
  updateSection,
} = require("../controllers/Section");

//*SubSection Controllers
const {
  createSubSection,
  deleteSubSection,
  updateSubSection,
} = require("../controllers/SubSection");

//* Rating and Review Controllers
const {
  createRatingAndReview,
  getAverageRating,
  getAllRating,
} = require("../controllers/RatingAndReview");

//* middlewares
const {
  isAdmin,
  isInstructor,
  isStudent,
  auth,
} = require("../middlewares/auth");

const { updateCourseProgress } = require("../controllers/courseProgress");

//********************************************************************************************************
//*                                                   Course Routes
//*********************************************************************************************************

router.post("/createCourse", auth, isInstructor, createCourse);

router.post("/addSection", auth, isInstructor, createSection);

router.post("/updateSection", auth, isInstructor, updateSection);

router.delete("/deleteSection", auth, isInstructor, deleteSection);

router.post("/updateSubSection", auth, isInstructor, updateSubSection);

router.post("/deleteSubSection", auth, isInstructor, deleteSubSection);

router.post("/addSubSection", auth, isInstructor, createSubSection);

router.get("/getAllCourses", showAllCourse);

router.get("/getCourseDetails", getCourseDetails);

router.post("/getFullCourseDetails", auth, getFullCourseDetails);

router.post("/editCourse", auth, isInstructor, editCourse);

router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);

router.delete("/deleteCourse", deleteCourse);

router.post("/updateCourseProgress", auth, isStudent, updateCourseProgress);
router.post("/buyFakeCourse", auth, isStudent, fakeBuyCourse);
// ********************************************************************************************************
//                                     ! Category routes (Only by Admin)
// ********************************************************************************************************
//~ Category can Only be Created by Admin
router.post("/createCategory", auth, isAdmin, createCategory);
router.get("/showAllCategories", showAllCategories);
router.post("/getCategoryPageDetails", categoryPageDetails);

// ********************************************************************************************************
//                                      !Rating and Review
// ********************************************************************************************************
router.post("/createRating", auth, isStudent, createRatingAndReview);
router.get("/getAverageRating", getAverageRating);
router.get("/getReviews", getAllRating);

module.exports = router;
