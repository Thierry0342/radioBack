const express = require("express");
const router = express.Router();
const donController = require("../controller/don-controller");

router.post("/", donController.createDon);
router.get("/", donController.getAllDons);
router.delete("/:id", donController.deleteDon);
// Dans votre fichier de routes (ex: don-route.js)
router.get("/recent", donController.getRecentDons);
// PUT /api/don/:id
router.put("/:id", donController.updateDon);
router.get('/stats/:year', donController.getStats);
// =========================================================================
// ROUTES DES PAIEMENTS MENSUELS (MAHARITRA)
// =========================================================================


// PUT /mensuel/:id : Mettre à jour un paiement mensuel spécifique (Montant, Date)
// Le paramètre :id est l'ID du Paiement Mensuel (idDonMaharitraMensuel).
router.get("/maharitra/status/:idPersonne/:annee", donController.getMaharitraStatus);
router.put("/mensuel/:id", donController.updateDonMensuel);
router.get("/personne/:idPersonne", donController.getByPersonne);
// DELETE /mensuel/:id : Supprimer un paiement mensuel spécifique
// Le paramètre :id est l'ID du Paiement Mensuel (idDonMaharitraMensuel).
router.delete("/mensuel/:id", donController.deleteDonMensuel);
router.get("/stats-by-type", donController.getDonStats);
router.get("/donors-stats", donController.getDonorsStats);
module.exports = router;
