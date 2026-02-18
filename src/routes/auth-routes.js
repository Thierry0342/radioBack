const express = require("express");
const router = express.Router();
const authController = require("../controller/auth-controller");

// Route pour se connecter
router.post("/login", authController.login);

// Route pour créer un compte (à protéger ou supprimer plus tard)
router.post("/register", authController.register);

module.exports = router;