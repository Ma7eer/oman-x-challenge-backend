const Sequelize = require("sequelize");

// The environment variable is from Heroku
const sequelize = new Sequelize(process.env.DATABASE_URL);

module.exports = { sequelize };
