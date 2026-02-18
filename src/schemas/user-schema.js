const { DataTypes } = require("sequelize");
const sequelize = require("../data-access/database-connection");

const User = sequelize.define("User", {
    idUser: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Ce nom d'utilisateur est déjà pris." },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        defaultValue: "CONSULTANT", // Un nouvel inscrit est consultant par défaut
    },
    // 🛡️ NOUVEAU : État du compte
    status: {
        type: DataTypes.STRING,
        defaultValue: "PENDING", // PENDING, APPROVED, REJECTED
    }
}, {
    tableName: "Users",
    timestamps: true 
});

module.exports = User;