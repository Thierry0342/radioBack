const express = require("express");
const router = express.Router();
const ctrl = require("../controller/donMensuel-controller");

// ✅ ROUTES FIXES D’ABORD
router.get("/status", ctrl.getMaharitraStatus);
router.get("/all-stats", ctrl.getAllMaharitraStats);
router.put("/pay/:idMensuel", ctrl.payMonth);


router.get("/:idMaharitra", ctrl.getMensuelByMaharitra);

module.exports = router;
