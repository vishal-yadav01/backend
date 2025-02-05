const { contactUsEmail } = require("../mail/templates/contactFormRes");
const mailSender = require("../utils/mailSender");

exports.form = async (req, res) => {
  try {
    console.log(req.body.data);

    const { email, firstname, lastname, message, phoneNo, countrycode } =
      req.body;

    if (
      !email ||
      !firstname ||
      !lastname ||
      !message ||
      !phoneNo ||
      !countrycode
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailContent = contactUsEmail(
      email,
      firstname,
      lastname,
      message,
      phoneNo,
      countrycode
    );

    await mailSender(
      email,
      "Contact Us Form Submission Confirmation",
      emailContent
    );

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Error sending contact email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send your message. Please try again later.",
    });
  }
};
