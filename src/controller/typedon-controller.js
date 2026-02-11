const typeDonService = require("../service/typedon-service");

// Créer un type de don
async function createTypeDon(req, res) {
  try {
    const data = req.body;
    const result = await typeDonService.createTypeDon(data);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création du type de don" });
  }
}

// Lister tous les types
async function getAllTypes(req, res) {
  try {
    const types = await typeDonService.findAllTypes();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des types" });
  }
}

// Supprimer un type
async function deleteTypeDon(req, res) {
  try {
    await typeDonService.deleteTypeDon(req.params.id);
    res.json({ message: "Type de don supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du type de don" });
  }
}

// Obtenir un type par ID
async function getTypeById(req, res) {
  try {
    const type = await typeDonService.findById(req.params.id);
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération du type de don" });
  }
}

module.exports = {
  createTypeDon,
  getAllTypes,
  deleteTypeDon,
  getTypeById,
};
