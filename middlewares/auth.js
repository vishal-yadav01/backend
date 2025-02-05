const jwt = require("jsonwebtoken");
const User = require("../models/User");

//! auth middleware
exports.auth = async (req, res, next) => {
  try {
    // extract token from cookies, body, or headers
    const token =
      req.cookies.token ||
      req.body.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    try {
      // Verify token and attach user info to the request
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next(); // Call next if verification is successful
    } catch (err) {
      console.log(err.name);

      return res.status(401).json({
        success: false,
        message: "Token invalid",
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Something went wrong while validating the token",
    });
  }
};

//! isStudent middleware
exports.isStudent = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No user information available",
      });
    }
    if (req.user.accountType !== "Student") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route only for Students",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified. Please try again",
    });
  }
};

//! isInstructor middleware
exports.isInstructor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No user information available",
      });
    }
    if (req.user.accountType !== "Instructor") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route only for Instructors",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified. Please try again",
    });
  }
};

//! isAdmin middleware
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. No user information available",
      });
    }
    if (req.user.accountType !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "This is a protected route only for Admins",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "User role cannot be verified. Please try again",
    });
  }
};
