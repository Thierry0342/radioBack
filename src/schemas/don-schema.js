const { DataTypes } = require("sequelize");
const sequelize = require("../data-access/database-connection");

const DonSchema = sequelize.define("Don", {
  idDon: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  montant: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateDon: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  idPersonne: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  idType: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
});

module.exports = DonSchema;
