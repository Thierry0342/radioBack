const Personne = require("../schemas/personne-schema");

// Créer une personne
async function createPersonne(data) {
  return Personne.create(data);
}

// Lister toutes les personnes
async function findAllPersonnes() {
  return Personne.findAll();
}

// Supprimer une personne
async function deletePersonne(idPersonne) {
  return Personne.destroy({ where: { idPersonne } });
}

// Trouver une personne par ID
async function findById(idPersonne) {
  return Personne.findByPk(idPersonne);
}

module.exports = {
  createPersonne,
  findAllPersonnes,
  deletePersonne,
  findById,
};
