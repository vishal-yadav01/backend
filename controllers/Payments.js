const { instance } = require("../configs/razorpay");
const Course = require("../models/Course");
const razopay = require("razorpay"); // Already correctly imported
// Ensure this is properly configured

const User = require("../models/User");
const mailSender = require("../utils/mailSender");
require("dotenv").config();
const {
  paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");
const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");
const crypto = require("crypto");
const CourseProgress = require("../models/CourseProgress");

exports.capturePayment = async (req, res) => {
  try {
    console.log("asdfd");

    console.log(req.body);

    const { courses } = req.body;
    const userId = req.user.id;
    if (courses.length === 0) {
      return res.status(404).json({
        message: "please provide  course id",
        success: false,
      });
    }

    //* total  amount calcualte and   coursees,studen  verification
    let totalAmount = 0; // ✅ Fixed typo: "totalAmmount" → "totalAmount"
    for (let course_id of courses) {
      const course = await Course.findById(course_id);
      if (!course) {
        return res.status(400).json({
          message: "course not found",
          success: false,
        });
      }

      const uid = new mongoose.Types.ObjectId(userId); // ✅ Fixed incorrect variable: 'useId' → 'userId'
      if (course.studentsEnrolled.includes(uid)) {
        return res.status(400).json({
          message: "student allready enrolled in these courses",
          success: false,
        });
      }
      totalAmount += course.price; // ✅ Fixed variable name: 'totalAmmount' → 'totalAmount'
    }

    //*this is my way of checking strudne enrolled or not

    // const verifyEnrolledStuden = await User.findOne({
    //   _id: userId,
    //   courses: { $all: courses },
    // });

    // if (verifyEnrolledStuden) {
    //   return res.status(400).json({
    //     message: "student allready enrolled in these courses",
    //     success: false,
    //   });
    // }

    const options = {
      amount: totalAmount * 100, // ✅ Fixed variable name: 'totalAmmount' → 'totalAmount'
      currency: "INR",
      receipt: Date.now().toString(), // ✅ Fixed: Removed invalid Math.random(Date.now())
    };

    try {
      const paymentResponse = await instance.orders.create(options);
      return res.status(200).json({ success: true, message: paymentResponse });
    } catch (error) {
      return res.status(400).json({
        message: "payment method not work",
        success: false,
      });
    }
  } catch (error) {
    console.log("capture pyment api   fail", error);
    return res.status(500).json({
      message: "order capture api fail ",
      success: false,
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    console.log(req.body);

    const razorpay_order_id = req.body?.razorpay_order_id; // ✅ Fixed typo: 'razopay_oder_id' → 'razorpay_order_id'
    const razorpay_payment_id = req.body?.razorpay_payment_id; // ✅ Fixed typo: 'razopay_payment_id' → 'razorpay_payment_id'
    const razorpay_signature = req.body?.razorpay_signature; // ✅ Fixed typo: 'razopay_signature' → 'razorpay_signature'
    const courses = req.body.courses;
    const userId = req.user.id; // ✅ Fixed incorrect variable: 'useId' → 'userId'

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !courses ||
      !userId
    ) {
      return res.status(200).json({
        success: false,
        message: "all  field requereid",
      });
    }

    let body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      await enrolledStudents(courses, userId, res);
      return res
        .status(200)
        .json({ message: "Payment verified", success: true });
    }

    return res.status(400).json({
      success: false,
      message: "payment faild",
    });
  } catch (error) {
    console.log(error);

    console.log("payment verification api  error");
    return res.status(500).json({
      success: false,
      message: "payment--api fail",
    });
  }
};

// *enroll the student in the courses

const enrolledStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(404).json({
      message: "Please Provide course id and user id",
      success: false,
    });
  }
  for (let courseId of courses) {
    try {
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnrolled: userId } },
        { new: true }
      );
      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" });
      }
      console.log("Updated course: ", enrolledCourse);
      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      });
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      );
      console.log("Enrolled student: ", enrolledStudent);
      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      );

      console.log("Email sent successfully: ", emailResponse.response);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ success: false, error: error.message });
    }
  }
};

exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body;
  const userId = req.user.id;

  if (!orderId || !paymentId || !amount || !userId) {
    return res.status(400).json({
      success: false,
      message: "Please provide all the details",
    });
  }

  try {
    const enrolledStudent = await User.findById(userId);
    if (!enrolledStudent) {
      // ✅ Added check to prevent sending email to non-existent user
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );

    return res.status(200).json({
      success: true,
      message: "Payment success email sent",
    });
  } catch (error) {
    console.log("Error in sending mail", error);
    return res.status(400).json({
      success: false,
      message: "Could not send email",
    });
  }
};
