const { DonMaharitra, Don } = require("../schemas/association");

// Créer un plan MAHARITRA (année)
async function createMaharitra(data) {
  return await DonMaharitra.create(data);
}

// Récupérer tous les MAHARITRA
async function findAllMaharitra() {
  return DonMaharitra.findAll({
    include: [{ model: Don }]
  });
}

// MAHARITRA d'un don
async function findByDon(idDon) {
  return DonMaharitra.findOne({ where: { idDon } });
}

module.exports = {
  createMaharitra,
  findAllMaharitra,
  findByDon,
};
