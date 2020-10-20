const express = require("express");
const app = express();
const path = require("path");
const port = 9999;

const htmlPath = path.join(__dirname + "/dist");
console.log("htmlPath", htmlPath);

app.use(express.static(htmlPath));

app.listen(port, () => console.log(`app running at port ${port}`));