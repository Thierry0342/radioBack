const { DataTypes } = require("sequelize");
const sequelize = require("../data-access/database-connection");

const DonMaharitraMensuelSchema = sequelize.define("DonMaharitraMensuel", {
  idMensuel: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  idMaharitra: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mois: {
    type: DataTypes.ENUM(
      "JAN","FEV","MAR","AVR","MAI","JUI","JUIL",
      "AOU","SEP","OCT","NOV","DEC"
    ),
    allowNull: false,
  },
  montant: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  datePaiement: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  statut: {
    type: DataTypes.STRING,
    allowNull:true
  },
});

module.exports = DonMaharitraMensuelSchema;
