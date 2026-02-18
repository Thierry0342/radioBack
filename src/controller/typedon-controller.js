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
// Supprimer un type
async function deleteTypeDon(req, res) {
  try {
    const id = req.params.id;
    console.log("Tentative de suppression de l'ID :", id);

    const nbSupprime = await typeDonService.deleteTypeDon2(id);

    if (nbSupprime === 0) {
      console.log("❌ Échec : Aucun type trouvé avec cet ID dans la base.");
      return res.status(404).json({ error: "Type de don non trouvé dans la base de données." });
    }

    console.log("✅ Succès : Ligne supprimée.");
    res.json({ message: "Type de don supprimé avec succès" });
    
  } catch (error) {
    if (error.message === "CONSTRAINT_ERROR") {
      return res.status(400).json({
        error: `Suppression impossible : ce type est lié à ${error.count} don(s).`
      });
    }
    console.error("Erreur serveur :", error);
    res.status(500).json({ error: "Erreur lors de la suppression sur le serveur" });
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
