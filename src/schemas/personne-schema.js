const { DataTypes } = require("sequelize");
const sequelize = require("../data-access/database-connection");

const PersonneSchema = sequelize.define("Personne", {
  idPersonne: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
 
  contact: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = PersonneSchema;
