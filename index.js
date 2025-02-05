const express = require("express");
const app = express();
//~cloud conncetion
// const { cloudinaryConnect } = require("./configs/cloudinary");
// cloudinaryConnect();
const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const database = require("./configs/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const fileupload = require("express-fileupload");
const dotenv = require("dotenv");
dotenv.config();

const PORT = 8080;

//*databse connection
database.connection();

//*middlewares
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "https://study-app1.vercel.app",
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Content-Length",
      "Accept",
      "X-Custom-Header",
    ],
    exposedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use(
  fileupload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

//*cloudinary conncetions

//*routes mounts
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);

app.get("", (req, res) => {
  return res.send("<h1>app run succefully</h1>");
});

app.listen(PORT, () => {
  console.log(`server started ${PORT}`);
});
