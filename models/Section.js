const mongoose = require("mongoose");
//& no need anywhere

const sectionScehma = new mongoose.Schema({
  sectionName: {
    type: String,
  },
  subSections: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSection",
      required: true,
    },
  ],
});

module.exports = mongoose.model("Section", sectionScehma);
