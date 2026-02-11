const express = require("express");
const router = express.Router();
const personneController = require("../controller/personne-controller");

router.post("/", personneController.createPersonne);
router.get("/", personneController.getAllPersonnes);
router.get("/:id", personneController.getPersonneById);
router.delete("/:id", personneController.deletePersonne);

module.exports = router;
