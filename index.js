const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;
const multer = require("multer");
const cors = require("cors");

const runOCR = require("./google-vision");

var NEW_FILENAME;

app.use(cors());

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    NEW_FILENAME = Date.now() + "-" + file.originalname;
    cb(null, NEW_FILENAME);
    // cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage }).single("file");

// app.use(express.static("public"));

// index page
app.get("/", function (req, res) {
  res.render("pages/index");
});

app.post("/upload", (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }
    let data = {
      companyName: "",
      invoiceNo: "",
      invoiceDate: "",
      dueDate: "",
      balanceDue: "",
    };
    runOCR(`./public/${NEW_FILENAME}`)
      .then((result) => {
        // console.log(res);
        data.companyName = result[1].description + " " + result[2].description;
        data.invoiceNo = result[14].description;
        data.invoiceDate = result[17].description;
        data.dueDate = result[20].description;
        data.balanceDue = result[41].description;
        // console.log(data);
        return res.status(200).send({ file: req.file, data });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({ message: err });
      });
  });
});

app.listen(PORT, () => console.log(`running application on ${PORT}`));
