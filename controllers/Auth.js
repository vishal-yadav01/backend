const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcrypt");
const otpGenerater = require("otp-generator");
const Profile = require("../models/Profile");
require("dotenv").config();
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
require("dotenv").config();
const jwt = require("jsonwebtoken");

//!otp  send
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const checkUserPresent = await User.findOne({ email });
    console.log("otp email vrification", email);

    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "user already presenet",
      });
    }

    var otp = otpGenerater.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    console.log("otp generated=>sss", otp);

    //* cheack otp unique or not
    //* this code too bad
    //* i find batter approach
    const resultOtpUnique = await OTP.findOne({ otp });
    console.log("Result", resultOtpUnique);
    while (resultOtpUnique) {
      var otp = otpGenerater.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      resultOtpUnique = await OTP.findOne({ otp });
    }

    const otpPayload = { email, otp };

    //create entry otp in db
    const otpBody = await OTP.create(otpPayload);
    console.log("otpBoay", otpBody);
    return res.status(200).json({
      success: true,
      message: "OTP sent Succefully",
      otp,
    });
  } catch (error) {
    console.log("otp generater code error", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//! signup

exports.singUp = async (req, res) => {
  // *data fetch
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,

      otp,
      accountType,
    } = req.body;

    if (
      accountType !== "Student" &&
      accountType !== "Admin" &&
      accountType !== "Instructor"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid account type ",
      });
    }

    //* all fiend requirement valdaiton
    if (
      !firstName ||
      !lastName ||
      !password ||
      !confirmPassword ||
      !otp ||
      !accountType
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields required",
      });
    }

    //* match password and confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "password and confirmPassword not match",
      });
    }

    //* chekc email  for new user
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "user already exist",
      });
    }

    //* find most recent OTP sotred for user
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    const dbOtp = recentOtp[0].otp;
    console.log("recent  Otp ", recentOtp);
    if (recentOtp.length === 0) {
      return res.status(400).json({
        success: false,
        message: "otp not found",
      });
    }

    console.log("db otp=>", dbOtp, "  user otp=>", otp);

    if (dbOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "invalid otp!",
      });
    }

    //*hashed pass bcypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    //* save in bd
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,

      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`,
    });

    //*retrun resposne
    return res.status(200).json({
      success: true,
      message: "user is registered succefully",
      user,
    });
  } catch (error) {
    console.log("signup code error", error);
    return res.status(500).json({
      success: false,
      message: "User can not registerd . try  again",
    });
  }
};

//! login

exports.login = async (req, res) => {
  try {
    //* get data from req body
    const { email, password } = req.body;

    // *valiation  data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: " all fields requiresd ",
      });
    }

    // *check user is exist or  not

    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "user not registred",
      });
    }

    // * password match bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "incrrect password",
      });
    }

    //* generate jwt
    const payload = {
      email: user.email,
      accountType: user.accountType,
      id: user.id,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "3h", // Corrected the option
    });

    user.token = token;
    user.password = undefined;

    //* create cooke and send repsonse
    const options = {
      httpsOnly: true,
      SameSite: "strict",
      expires: new Date(Date.now() + 3 * 60 * 60 * 1000), // * You're correct! Setting the cookie expiration to 3 days while the JWT token itself expires in 3 hours (expiresIn: "3h") can cause issues because the token inside the cookie will become invalid after 3 hours, but the cookie will still be present for 3 days. This could lead to confusion or failed API calls due to expired token
      //! two options for handle this first is make cookie life 3h and second best is use refeehs toekn conept
    };
    res.cookie("token", token, options).status(200).json({
      success: true,
      message: "Logged in Succefully",
      token,
      user,
    });
  } catch (error) {
    console.log("login code error", error);
    return res.status(500).json({
      message: "login fail try again",
      success: false,
    });
  }
};

//! change passowrd
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Check if all fields are provided
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Get user ID from request (assuming req.user is set by authentication middleware)
    const userID = req.user.id;
    const user = await User.findById(userID);

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Hash the new password and update it
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUserDetails = await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword },
      { new: true }
    );

    //* Send confirmation email
    const emailResponse = await mailSender(
      user.email,
      "Password Changed ",
      passwordUpdated(
        passwordUpdated.email,
        `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
      )
    );
    console.log("emial Response", emailResponse);

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Password changed and email sent successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error occurred while changing password or sending email",
      error: error.message,
    });
  }
};
