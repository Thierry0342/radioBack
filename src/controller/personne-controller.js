const personneService = require("../service/personne-service");

// Créer une personne
async function createPersonne(req, res) {
  try {
    const data = req.body;
    const result = await personneService.createPersonne(data);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la création de la personne" });
  }
}

// Lister toutes les personnes
async function getAllPersonnes(req, res) {
  try {
    const personnes = await personneService.findAllPersonnes();
    res.json(personnes);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des personnes" });
  }
}

// Supprimer une personne
async function deletePersonne(req, res) {
  try {
    await personneService.deletePersonne(req.params.id);
    res.json({ message: "Personne supprimée" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression de la personne" });
  }
}

// Obtenir une personne par ID
async function getPersonneById(req, res) {
  try {
    const personne = await personneService.findById(req.params.id);
    res.json(personne);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de la personne" });
  }
}

module.exports = {
  createPersonne,
  getAllPersonnes,
  deletePersonne,
  getPersonneById,
};
