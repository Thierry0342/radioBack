const mysql = require("mysql2");
const { Sequelize } = require("sequelize");
require("dotenv").config();

const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_DIALECT = process.env.DB_DIALECT || "mysql";

// Étape 1 : Créer la base si elle n'existe pas
function createDatabaseIfNotExists() {
  const connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`,
    (err, results) => {
      if (err) {
        console.error("Erreur lors de la création de la base :", err);
      } else {
        console.log("✅ Base vérifiée ou créée avec succès.");
      }
      connection.end(); // Important : ferme la connexion
    }
  );
}

// Étape 2 : Créer la connexion Sequelize (ORM)
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT,
  logging: console.log,
  define: { 
    freezeTableName: true, // Ceci désactive la pluralisation automatique
},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
});

// Étape 3 : Vérifier la connexion Sequelize
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion Sequelize réussie.");
  } catch (error) {
    console.error("❌ Échec de la connexion Sequelize :", error);
  }
}

// Lancer les vérifications au démarrage
createDatabaseIfNotExists();
testConnection();

module.exports = sequelize;
