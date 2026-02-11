const express = require("express");
const router = express.Router();
const ctrl = require("../controller/donMaharitra-controller");

router.post("/", ctrl.createMaharitra);
router.get("/", ctrl.getAllMaharitra);

module.exports = router;
