const express = require("express");
const router = express.Router();
const { contactUsEmailController } = require("../controllers/ContactUs");
router.post("/contact-us", contactUsEmailController);

module.exports = router;
