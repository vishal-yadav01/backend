const mongoose = require("mongoose");
//& no need anyWhere

const profileScehma = new mongoose.Schema({
  gender: {
    type: String,
  },
  dateOfBirth: {
    type: String,
  },
  about: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model("Profile", profileScehma);
