const express = require("express");
const router = express.Router();
const personneController = require("../controller/log-controller");

router.get("/logs", authMiddleware, logCtrl.getLogs);