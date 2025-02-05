const mongoose = require("mongoose");
require("dotenv").config();
exports.connection = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("database connected succefully");
  } catch (error) {
    console.log("database connection error", error);
    process.exit(1);
  }
};
