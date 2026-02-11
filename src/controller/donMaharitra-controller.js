const maharitraService = require("../service/donMaharitra-service");
const mensuelService = require("../service/donMensuel-service");

async function createMaharitra(req, res) {
  try {
    const data = req.body;

    // Créer la ligne MAHARITRA
    const maharitra = await maharitraService.createMaharitra(data);

    // Générer les 12 mois
    await mensuelService.createAllMonths(maharitra.idMaharitra, data.montant);

    res.status(201).json({ message: "MAHARITRA créé + 12 mois générés", maharitra });
  } catch (error) {
    res.status(500).json({ error: "Erreur création MAHARITRA" });
  }
}

async function getAllMaharitra(req, res) {
  try {
    const data = await maharitraService.findAllMaharitra();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erreur récupération MAHARITRA" });
  }
}

module.exports = {
  createMaharitra,
  getAllMaharitra,
};
