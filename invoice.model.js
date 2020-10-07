const Sequelize = require("sequelize");
const { sequelize } = require("./database.config");

const InvoiceModel = sequelize.define("invoice", {
  companyName: {
    type: Sequelize.STRING,
  },
  invoiceNo: {
    type: Sequelize.STRING,
  },
  invoiceDate: {
    type: Sequelize.STRING,
  },
  dueDate: {
    type: Sequelize.STRING,
  },
  balanceDue: {
    type: Sequelize.STRING,
  },
});

module.exports = { InvoiceModel };
