const { DataTypes } = require("sequelize");
const sequelize = require("../data-access/database-connection");

const TypeDonSchema = sequelize.define("TypeDon", {
  idType: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  libelle: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,   // TSOTRA, MAHARITRA, etc.
  },
});

module.exports = TypeDonSchema;
