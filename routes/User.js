//* import modules

const express = require("express");
const router = express.Router();
const { form } = require("../controllers/ContactUs");

const {
  login,
  sendOTP,
  singUp,
  changePassword,
} = require("../controllers/Auth");

const {
  resetPassWord,
  resetPassWordToken,
} = require("../controllers/ResetPassword");

const { auth } = require("../middlewares/auth");

//! Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

//& user login route
router.post("/login", login);

//& user signUp route
router.post("/signup", singUp);

//& Route for sending OTP to the user's email
router.post("/sendotp", sendOTP);

// &Route for Changing the password
router.post("/changepassword", auth, changePassword);

// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************

// &Route for generating a reset password token
router.post("/reset-password-token", resetPassWordToken);

// &Route for resetting user's password after verification
router.post("/reset-password", resetPassWord);

//*******contact us*********************/
router.post("/contact", form);

// &Export the router for use in the main application
module.exports = router;
