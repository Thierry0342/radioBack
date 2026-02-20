const Log = require("../schemas/log-schema");

async function createLog(username, action, details) {
  try {
    await Log.create({
      username,
      action,
      details,
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement du log:", error);
  }
}

async function getAllLogs() {
  return await Log.findAll({ order: [["timestamp", "DESC"]] });
}

module.exports = { createLog, getAllLogs };