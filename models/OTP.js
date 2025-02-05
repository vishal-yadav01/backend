const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

//& no need anywhere

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date, // Date is more suitable for createdAt
    default: Date.now, // Automatically set the creation date
    expires: 60 * 5, //& The document will be automatically deleted after 5 minutes of its creation time
  },
});

// *Function to send the verification email
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Verification Email from LS Academy ",
      emailTemplate(otp)
    );
    console.log("Email sent successfully", mailResponse);
  } catch (error) {
    console.log("Error occurred while sending mail:", error);
    throw error; // Ensure errors are properly thrown
  }
}

// Pre-save hook to send email before saving OTP document
otpSchema.pre("save", async function (next) {
  // *Only send an email when a new document is created
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});

module.exports = mongoose.model("OTP", otpSchema); // Corrected model export
