// Remplacez les imports de schéma par l'importation depuis votre fichier d'associations
// C'est essentiel pour que les jointures (include) fonctionnent.
const { DonMaharitraMensuel, DonMaharitra, Don} = require("../schemas/association"); 

const { Sequelize } = require('sequelize');

// Créer un mois MAHARITRA (Existant)
async function createMensuel(data) {
    return await DonMaharitraMensuel.create(data);
}

// Créer les 12 mois automatiquement (Existant)
async function createAllMonths(idMaharitra, montant) {
    const moisList = ["JAN","FEV","MAR","AVR","MAI","JUI","JUIL",
                      "AOU","SEP","OCT","NOV","DEC"];

    const records = moisList.map(mois => ({
        idMaharitra,
        mois,
        montant,
        statut: "NON_PAYE"
    }));

    return await DonMaharitraMensuel.bulkCreate(records);
}

// Récupérer les mois d’un MAHARITRA (Existant)
async function findByMaharitra(idMaharitra) {
    return DonMaharitraMensuel.findAll({ 
        where: { idMaharitra }
    });
}

// Marquer un mois payé (Existant)
async function payMonth(idMensuel, datePaiement) {
    // NOTE: Il est préférable de faire un 'CREATE' pour un nouveau paiement mensuel
    // plutôt qu'un 'UPDATE' si des paiements multiples pour le même mois sont possibles.
    // Cependant, nous laissons le 'UPDATE' pour le moment, car c'était votre fonction originale.
    return DonMaharitraMensuel.update(
        { statut: "PAYE", datePaiement },
        { where: { idMensuel } }
    );
}

// ----------------------------------------------------------------
// NOUVELLE FONCTION : Récupérer l'historique de paiement Maharitra
// C'est cette fonction qui était manquante et causait l'erreur "not a function".
// ----------------------------------------------------------------
// Dans src/service/donMensuel-service.js (dans la fonction getMaharitraStatus)
// Fichier : src/service/donMensuel-service.js (dans getMaharitraStatus)

async function getMaharitraStatus(idPersonne, annee) {
    return await DonMaharitraMensuel.findAll({
        attributes: ['idMensuel', 'montant', 'mois', 'datePaiement'],
        include: [{
            model: DonMaharitra,
            required: true,
            attributes: [],
            where: { annee: String(annee) },
            include: [{
                model: Don,
                required: true,
                attributes: [],
                where: { idPersonne: parseInt(idPersonne) }
            }]
        }],
        raw: true
    });
    
}
async function deleteMensuel(idMensuel) {
    return await DonMaharitraMensuel.destroy({
        where: { idMensuel: parseInt(idMensuel) }
    });
}
async function updateMensuel(idMensuel, nouveauMontant, nouvelleDate) {
    const transaction = await Sequelize.transaction();
    try {
        const paiement = await DonMaharitraMensuel.findByPk(idMensuel, { transaction });
        if (!paiement) throw new Error("Paiement mensuel non trouvé.");

        await paiement.update({ 
            montant: parseFloat(nouveauMontant), 
            datePaiement: nouvelleDate 
        }, { transaction });

        // Recalcul du montant total du Don lié
        const totalPaye = await DonMaharitraMensuel.sum('montant', {
            where: { idDon: paiement.idDon },
            transaction
        });

        await Don.update(
            { montant: totalPaye },
            { where: { idDon: paiement.idDon }, transaction }
        );

        await transaction.commit();
        return { success: true };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}
async function getAllMaharitraStats(annee) {
    return await DonMaharitraMensuel.findAll({
        attributes: ['montant', 'mois', 'datePaiement'],
        include: [{
            model: DonMaharitra,
            required: true,
            where: { annee: String(annee) },
            include: [{
                model: Don,
                required: true,
                include: ['Personne'] // Pour avoir le nom du donateur
            }]
        }],
        raw: true,
        nest: true // Pour garder une structure d'objet propre
    });
}

module.exports = {
    createMensuel,
    createAllMonths,
    findByMaharitra,
    payMonth,
    getMaharitraStatus, 
    deleteMensuel,
    getAllMaharitraStats
};