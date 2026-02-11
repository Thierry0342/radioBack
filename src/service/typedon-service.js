const TypeDon = require("../schemas/typedon-schema");

// Créer un type de don
async function createTypeDon(data) {
  return TypeDon.create(data);
}

// Lister tous les types de don
async function findAllTypes() {
  return TypeDon.findAll();
}

// Supprimer un type de don
async function deleteTypeDon(idType) {
  return TypeDon.destroy({ where: { idType } });
}

// Trouver un type de don par ID
async function findById(idType) {
  return TypeDon.findByPk(idType);
}

module.exports = {
  createTypeDon,
  findAllTypes,
  deleteTypeDon,
  findById,
};
