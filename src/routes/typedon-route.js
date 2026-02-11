const express = require("express");
const router = express.Router();
const typeDonController = require("../controller/typedon-controller");

router.post("/", typeDonController.createTypeDon);
router.get("/", typeDonController.getAllTypes);
router.get("/:id", typeDonController.getTypeById);
router.delete("/:id", typeDonController.deleteTypeDon);

module.exports = router;
