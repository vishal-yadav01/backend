const ImageKit = require("imagekit");

require("dotenv").config();

const imageKit = new ImageKit({
  publicKey: process.env.PUBLIC_KEY,
  privateKey: process.env.PRIVATE_KEY,
  urlEndpoint: process.env.URL_END,
});

exports.imageKit = imageKit;
