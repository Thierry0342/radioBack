const TypeDon = require("../schemas/typedon-schema");
const Don = require("../schemas/don-schema"); // Importation nécessaire pour compter
const { Sequelize } = require("sequelize");

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
// Lister tous les types avec le nombre de dons associés
async function findAllTypes2() {
  return TypeDon.findAll({
    attributes: {
      include: [
        // Ajoute un champ virtuel 'countDons' via une sous-requête SQL
        [
          Sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM Dons AS d
                    WHERE d.idType = TypeDon.idType
                )`),
          "countDons",
        ],
      ],
    },
  });
}

// Supprimer un type de don avec vérification
async function deleteTypeDon2(idRecu) {
  // 1. Vérifier si des dons existent
  // Note: Assure-toi que la colonne dans 'Don' est bien 'idType'
  const count = await Don.count({ where: { idType: idRecu } });

  if (count > 0) {
    const error = new Error("CONSTRAINT_ERROR");
    error.count = count;
    throw error;
  }

  // 2. Suppression et récupération du résultat
  // ⚠️ VERIFIE ICI : est-ce 'idType' ou 'idTypeDon' dans ton modèle TypeDon ?
  const result = await TypeDon.destroy({ 
    where: { idType: idRecu } 
  });

  return result; // Renvoie 1 si supprimé, 0 si non trouvé
}
module.exports = {
  createTypeDon,
  findAllTypes,
  deleteTypeDon,
  findById,
  findAllTypes2,
  deleteTypeDon2

};
