const logService = require("../service/log-service");

async function getLogs(req, res) {
  try {
    const logs = await logService.getAllLogs();
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { getLogs };