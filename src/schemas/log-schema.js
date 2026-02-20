const { DataTypes } = require("sequelize");
const sequelize = require("../data-access/database-connection");

const LogSchema = sequelize.define("Log", {
  idLog: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING, // Ex: "PAY_MONTH", "LOGIN", "REGISTER"
    allowNull: false,
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = LogSchema;