const mongoose = require("mongoose");
//& no need anywhere

const subSectionScehma = new mongoose.Schema({
  title: {
    type: String,
  },
  timeDuration: {
    type: String,
    default: "0",
  },
  description: {
    type: String,
  },
  videoUrl: {
    type: String,
  },
});

module.exports = mongoose.model("SubSection", subSectionScehma);
