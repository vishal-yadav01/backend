const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
require("dotenv").config();
const crypto = require("crypto");

//! reset password token
exports.resetPassWordToken = async (req, res) => {
  try {
    //get email req body
    const email = req.body.email;
    console.log(email);

    // check user for this email, validation,
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: `This Email:    "${email}"   is not Registered  `,
      });
    }

    //generate token
    const token = crypto.randomUUID();
    // update user by adding token and expiration time
    const updateDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000, // Corrected to multiply by 1000
      },
      { new: true }
    );

    console.log("details", updateDetails);

    // create url
    const url = `https://front-end-jade-nu.vercel.app/reset-password/${token}`;
    //send mail containing url
    await mailSender(
      email,
      "Password Reset Link",
      `Your Link for email verification is ${url}. Please click this url to reset your password.`
    );
    //return response

    return res.status(200).json({
      success: true,
      message: "Email sent successfully, check",
    });
  } catch (error) {
    console.log("reset password code error", error);
    return res.status(500).json({
      success: false,
      message: "something wrong during reset password",
    });
  }
};

//! reset password
exports.resetPassWord = async (req, res) => {
  try {
    //*data fetch

    const { password, confirmPassword, token } = req.body; //* user not send token in body  druing send  password,confirmPassword  front developer send token from url
    //*validation
    if (password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "password not matching",
      });
    }
    //*get user details from db using token
    const userdetails = await User.findOne({ token });
    // *if no entry - invalid token
    if (!userdetails) {
      return res.status(401).json({
        success: false,
        message: "token not valid",
      });
    }
    //*token time check
    if (userdetails.resetPasswordExpires < Date.now()) {
      return res.status(401).json({
        success: false,
        message: "token expired again try",
      });
    }
    //*hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    //*update password
    await User.findOneAndUpdate(
      { token: token }, //* search on the basisc of token
      { password: hashedPassword }, //* update password
      { new: true }
    );
    //*return response
    return res.status(200).json({
      success: true,
      message: "password reset successfully",
    });
  } catch (error) {
    console.log("error during reset password", error);
    return res.status(500).json({
      success: false,
      message: "wrong during reset password",
    });
  }
};
