const express = require("express");
const app = express();
const PORT = process.env.PORT || 3001;
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const { sequelize } = require("./database.config");
const { InvoiceModel } = require("./invoice.model");
const runOCR = require("./google-vision");

var NEW_FILENAME;

//===========================================
// EXPRESS MIDDLEWARE CONFIGURATION
//===========================================
app.use(cors());
app.use(express.json());
app.use(bodyParser.json()); //utilizes the body-parser package
app.use(bodyParser.urlencoded({ extended: false }));

//===========================================
// DATABASE CONFIGURATION
//===========================================
sequelize
  .authenticate()
  .then(() => console.log("Connection has been established successfully"))
  .catch((err) => console.log("Unable to connect to the database", err));

// Note: using `force: true` will drop the table if it already exists
InvoiceModel.sync({ force: true });

//===========================================
// MULTER CONFIGURATION
//===========================================
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "/public"));
  },
  filename: function (req, file, cb) {
    NEW_FILENAME = Date.now() + "-" + file.originalname;
    cb(null, NEW_FILENAME);
    // cb(null, file.originalname);
  },
});

var upload = multer({ storage: storage }).single("file");

//===========================================
// ROOT ROUTE
//===========================================
app.get("/", function (req, res) {
  res.send("ping");
});

//===========================================
// UPLOAD ROUTES
//===========================================
app.post("/upload-invoice", (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log("1", err);
      return res.status(500).json(err);
    } else if (err) {
      console.log("2", err);
      return res.status(500).json(err);
    }
    let data = {
      companyName: "",
      invoiceNo: "",
      invoiceDate: "",
      dueDate: "",
      balanceDue: "",
    };
    runOCR(path.join(__dirname, `/public/${NEW_FILENAME}`))
      .then((result) => {
        data.companyName = result[1].description + " " + result[2].description;
        data.invoiceNo = result[14].description;
        data.invoiceDate = result[17].description;
        data.dueDate = result[20].description;
        data.balanceDue = result[41].description;
        return res.status(200).send({ file: req.file, data });
      })
      .catch((err) => {
        return res
          .status(500)
          .send({ message: "Error on upload-invoice route", err });
      });
  });
});

app.post("/upload-bank-statement", (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log("1", err);
      return res.status(500).json(err);
    } else if (err) {
      console.log("2", err);
      return res.status(500).json(err);
    }
    runOCR(path.join(__dirname, `/public/${NEW_FILENAME}`))
      .then((result) => {
        /*
        result[0].description: "lorem/n ipsum" <- sample string we receive
        .split(/n): split based on new line "/n"
        .slice(): remove the beginning part of the array (data we don't need)
        .pop(): last element is an empty string so we remove it
        */
        let dataArray = result[0].description.split("\n").slice(13);
        dataArray.pop();
        // We loop to get our data in a format that the frontend can accept
        // and put into a table

        let data = [];
        for (let i = 0; i < dataArray.length; i = i + 4) {
          temp = dataArray.slice(i, i + 4);
          let date = temp[0];
          let description = temp[1];
          let withdrawal = temp[2].includes("-") ? temp[2] : 0;
          let deposit = withdrawal === 0 ? temp[2] : 0;
          let total = temp[3];
          data.push({ date, description, withdrawal, deposit, total });
        }
        console.log(data);
        return res.status(200).send({
          file: req.file,
          data,
        });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).send({ message: "upload-bank-statement", err });
      });
  });
});

//===========================================
// INVOICE CRUD ROUTES
//===========================================
app.post("/seed", async (req, res) => {
  try {
    let data ={}
    for (let i = 0; i < 4; i++) {
      data.companyName = `Company ${i}`;
      data.invoiceNo = `Invoice ${i}`;
      data.invoiceDate = `01/02/202${i}`;
      data.dueDate = `12/04/202${i}`;
      data.balanceDue = `${i}000`;

      const newInvoice = new InvoiceModel(data);
      await newInvoice.save();
    }
    
    res.status(200).json({ message: 'success' });
  } catch (err) {
    res.status(500).json({ message: "Error on new-invoice route", err });
  }
});

app.post("/new-invoice", async (req, res) => {
  try {
    const newInvoice = new InvoiceModel(req.body);
    await newInvoice.save();
    res.status(200).json({ invoice: newInvoice });
  } catch (err) {
    res.status(500).json({ message: "Error on new-invoice route", err });
  }
});

app.get("/invoices", async (req, res) => {
  try {
    const invoices = await InvoiceModel.findAll();
    console.log(invoices);
    res.status(200).json({ invoices });
  } catch (err) {
    res.status(500).json({ message: "Error on invoices route", err });
  }
});

app.put("/edit-invoices/:id", async (req, res) => {
  try {
    const newInstance = await InvoiceModel.update();
    // {title: req.body.title},
    // {where: req.params.bookId}
    res.status(200).json({ invoices });
  } catch (err) {
    res.status(500).json({ message: "Error on edit invoices route", err });
  }
});

app.listen(PORT, () => console.log(`running application on ${PORT}`));
