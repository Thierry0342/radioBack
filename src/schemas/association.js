// Import des schémas
const Personne = require("./personne-schema");
const TypeDon = require("./typedon-schema");
const Don = require("./don-schema");
const DonMaharitra = require("./donmaharitra-schema");
const DonMaharitraMensuel = require("./donmaharitraMensuel-schema");

// ----------------------
// RELATIONS PERSONNE - DON
// ----------------------
Personne.hasMany(Don, { foreignKey: "idPersonne" });
Don.belongsTo(Personne, { foreignKey: "idPersonne" });

// ----------------------
// RELATIONS TYPE_DON - DON
// ----------------------
TypeDon.hasMany(Don, { foreignKey: "idType" });
Don.belongsTo(TypeDon, { foreignKey: "idType" });

// ----------------------
// RELATIONS DON ↔ MAHARITRA
// ----------------------
Don.hasOne(DonMaharitra, { foreignKey: 'idDon', onDelete: 'CASCADE' }); 
DonMaharitra.belongsTo(Don, { foreignKey: 'idDon' });

DonMaharitra.hasMany(DonMaharitraMensuel, { foreignKey: 'idMaharitra', onDelete: 'CASCADE' }); 
DonMaharitraMensuel.belongsTo(DonMaharitra, { foreignKey: 'idMaharitra' });


module.exports = {
  Personne,
  TypeDon,
  Don,
  DonMaharitra,
  DonMaharitraMensuel
};
