const { DataTypes } = require("sequelize");
const sequelize = require("../data-access/database-connection");

const DonMaharitraSchema = sequelize.define("DonMaharitra", {
  idMaharitra: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  idDon: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // un don → une récurrence
  },
  annee: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = DonMaharitraSchema;
