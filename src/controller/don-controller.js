const express = require("express"); 
const donService = require("../service/don-service"); 

// 🛑 CORRECTION 1 : Importer les Modèles Sequelize via le fichier d'association
// Assurez-vous que le chemin est correct et que ce fichier exporte bien les classes Model
const {
    Don, 
    DonMaharitra, 
    DonMaharitraMensuel,
    // Importez aussi Personne si vous en avez besoin ailleurs (même si non utilisé ici)
    Personne 
} = require('../schemas/association'); 

// Importation de l'instance de connexion Sequelize (pour les transactions)
const sequelize = require('../data-access/database-connection');
// =========================================================================
// FONCTIONS CRUD DE BASE
// =========================================================================

async function createDon(req, res) {
    try {
        const data = req.body;
        const result = await donService.createDon(data);
        res.status(201).json(result);
    } catch (error) {
        console.error("Erreur contrôleur createDon:", error);
        res.status(500).json({ error: "Erreur lors de la création du don" });
    }
}

async function getAllDons(req, res) {
    try {
        const dons = await donService.findAllDons();
        res.json(dons);
    } catch (error) {
        console.error("Erreur contrôleur getAllDons:", error);
        res.status(500).json({ error: "Erreur lors de la récupération des dons" });
    }
}

async function deleteDon(req, res) {
    try {
        await donService.deleteDon(req.params.id);
        res.json({ message: "Don supprimé" });
    } catch (error) {
        console.error("Erreur contrôleur deleteDon:", error);
        res.status(500).json({ error: "Erreur lors de la suppression du don" });
    }
}

async function getRecentDons(req, res) {
    const limit = req.query.limit; 
    
    try {
        const dons = await donService.findRecentDons(limit);
        res.status(200).json(dons);
    } catch (error) {
        console.error("Erreur dans le contrôleur getRecentDons:", error);
        res.status(500).json({ 
            message: "Erreur serveur lors de la récupération des dons récents.", 
            details: error.message 
        });
    }
}

// =========================================================================
// FONCTION UTILITAIRE : Recalcul du Montant Total du Don (MAHARITRA)
// =========================================================================
// don-controller.js
const recalculateDonAmount = async (idDon, idMaharitra, transaction) => {
    
  // 1. Calculer le total payé pour cet engagement Maharitra
  const totalPaye = await DonMaharitraMensuel.sum('montant', {
      where: { idMaharitra: idMaharitra }, 
      transaction
  });

  // 2. Compter les paiements restants
  const paiementsRestants = await DonMaharitraMensuel.count({
      where: { idMaharitra: idMaharitra }, 
      transaction
  });
  
  const donDeleted = (paiementsRestants === 0);

  if (donDeleted) {
      
      // 🚀 RÈGLE MÉTIER : Suppression en cascade
      
      // Supprimer l'engagement DonMaharitra (via idMaharitra)
      await DonMaharitra.destroy({
          where: { idMaharitra: idMaharitra },
          transaction
      });

      // Supprimer le Don principal (via idDon)
      await Don.destroy({
          where: { idDon: idDon },
          transaction
      });
      
      return { totalPaye: 0, donDeleted: true };
      
  } else {
      // 3. Mettre à jour le montant du Don principal
      await Don.update(
          { montant: totalPaye || 0 },
          { where: { idDon: idDon }, transaction }
      );
      
      return { totalPaye: totalPaye || 0, donDeleted: false };
  }
};

// =========================================================================
// 1. MISE À JOUR DU DON PRINCIPAL (PUT /dons/:id) - DÉLÉGATION AU SERVICE
// =========================================================================
async function updateDon(req, res) {
  const idDon = req.params.id;
  // Déstructuration initiale pour vérifier la présence des données
  const { personne, don, maharitraDetails } = req.body; 
  
  // ✅ Créer le payload pour le Service
  const payload = {
      idDon: idDon,
      personne: personne,
      don: don,
      maharitraDetails: maharitraDetails
  };

  try {
      // 🚀 Le contrôleur délègue la transaction et toute la logique au Service
      const result = await donService.updateDon(payload); 

      res.status(200).json({ message: `Don ID ${idDon} mis à jour avec succès.`, ...result });

  } catch (error) {
      // Le service a déjà géré le rollback. Le contrôleur renvoie l'erreur.
      console.error("Erreur contrôleur updateDon:", error);
      res.status(500).json({ 
          message: "Échec de la mise à jour du don (Erreur service/transaction).", 
          details: error.message 
      });
  }
};


// =========================================================================
// 2. MISE À JOUR D'UN PAIEMENT MENSUEL SPÉCIFIQUE (PUT /dons/mensuel/:id)
// =========================================================================
// Note: Ces fonctions conservent la logique de transaction ici,
// elles doivent donc utiliser les VRAIS modèles (Personne, Don, etc.)
async function updateDonMensuel(req, res) {
  const idMensuel = req.params.id;
  const { montant, datePaiement } = req.body; 

  const transaction = await sequelize.transaction();

  try {
      const paiement = await DonMaharitraMensuel.findByPk(idMensuel, { transaction });
      if (!paiement) {
          await transaction.rollback();
          return res.status(404).json({ message: "Paiement mensuel non trouvé." });
      }
      
      const idDon = paiement.idDon; 
      const idMaharitra = paiement.idMaharitra;

      await paiement.update({ 
          montant: parseFloat(montant), 
          datePaiement: datePaiement 
      }, { transaction });

      // Recalcul du montant principal (pas de suppression ici, juste update)
      await recalculateDonAmount(idDon, idMaharitra, transaction); 

      await transaction.commit();
      res.status(200).json({ message: `Paiement mensuel ID ${idMensuel} mis à jour.`, idDon: idDon });
  } catch (error) {
      await transaction.rollback();
      console.error("Erreur contrôleur updateDonMensuel:", error);
      res.status(500).json({ message: "Échec de la mise à jour du paiement mensuel.", details: error.message });
  }
}
// =========================================================================
// 3. SUPPRESSION D'UN PAIEMENT MENSUEL SPÉCIFIQUE (DELETE /dons/mensuel/:id)
// =========================================================================
// don-controller.js
// don-controller.js (Fonction deleteDonMensuel)

async function deleteDonMensuel(req, res) {
  const idMensuel = req.params.id;

  const transaction = await sequelize.transaction();

  try {
      const paiement = await DonMaharitraMensuel.findByPk(idMensuel, { 
          include: [{ model: DonMaharitra }], 
          transaction 
      });

      if (!paiement) {
          await transaction.rollback();
          return res.status(404).json({ message: "Paiement mensuel non trouvé." });
      }
      
      // 🛑 L'objet joint doit être vérifié
      const donMaharitraJoint = paiement.DonMaharitra; 
      
      if (!donMaharitraJoint || !donMaharitraJoint.idDon) {
          await transaction.rollback();
          // L'ID est undefined
          throw new Error("ID Don principal (idDon) manquant après la jointure. Vérifiez l'alias de l'association.");
      }
      
      // ✅ Récupération sécurisée
      const idDon = donMaharitraJoint.idDon; 
      const idMaharitra = paiement.idMaharitra; 
      
      // 1. Suppression du paiement mensuel
      await paiement.destroy({ transaction });

      // 2. Recalcul et vérification de la suppression du Don principal
      const { donDeleted } = await recalculateDonAmount(idDon, idMaharitra, transaction);
      
      await transaction.commit();
      
      // ... (Reste de la réponse) ...
      if (donDeleted) {
          res.status(200).json({ 
              message: `Paiement mensuel ID ${idMensuel} supprimé. L'engagement Maharitra ID ${idMaharitra} a été complètement supprimé car il ne restait plus de paiements.`, 
              idDon: idDon,
              deleted: true
          });
      } else {
          res.status(200).json({ 
              message: `Paiement mensuel ID ${idMensuel} supprimé.`, 
              idDon: idDon,
              deleted: false
          });
      }
      
  } catch (error) {
      await transaction.rollback();
      // ... (Logique d'erreur) ...
      let errorMessage = "Échec de la suppression du paiement mensuel.";
      if (error.name === 'SequelizeForeignKeyConstraintError') {
          errorMessage += " Conflit de clé étrangère: " + error.parent.detail;
      } else {
          errorMessage += " Détails: " + error.message;
      }
      res.status(500).json({ 
          message: errorMessage, 
          details: error.message 
      });
  }
}
// =========================================================================
// 4. RÉCUPÉRATION DU STATUT MAHARITRA (GET /maharitra/status/:idPersonne/:annee)
// =========================================================================
async function getMaharitraStatus(req, res) {
  const { idPersonne, annee } = req.params;
  
  try {
      const paiements = await DonMaharitraMensuel.findAll({
          attributes: ['mois', 'montant', 'datePaiement', 'idDonMaharitraMensuel'],
          include: [{
              model: DonMaharitra,
              where: { idPersonne: idPersonne, annee: annee },
              required: true,
          }],
          raw: true
      });

      res.status(200).json(paiements); 
      
  } catch (error) {
      console.error("Erreur contrôleur getMaharitraStatus:", error);
      res.status(500).json({ 
          message: "Échec de la récupération du statut Maharitra.", 
          details: error.message 
      });
  }
}
async function getDonStats(req, res) {
  try {
      const stats = await donService.getDonStatsByType();
      res.status(200).json(stats);
  } catch (error) {
      console.error("Erreur contrôleur getDonStats:", error);
      res.status(500).json({ 
          message: "Erreur lors de la récupération des statistiques de dons par type.", 
          details: error.message 
      });
  }
}
async function getDonorsStats(req, res) {
    try {
        const data = await donService.findAllDonorsWithStats();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}

const getByPersonne = async (req, res) => {
    try {
        const { idPersonne } = req.params;
        const dons = await donService.getByPersonne(idPersonne); // Vérifie que ton service a cette fonction
        res.status(200).json(dons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
    }
};
async function getStats (req, res) {
    try {
        const { year } = req.params;
        
        // Validation simple de l'année
        if (!year || isNaN(year)) {
            return res.status(400).json({ 
                message: "L'année fournie est invalide." 
            });
        }

        const stats = await donService.getYearlyDashboardStats(year);
        
        res.status(200).json(stats);
    } catch (error) {
        console.error("Erreur Controller Stats:", error);
        res.status(500).json({ 
            message: "Erreur lors de la récupération des statistiques.",
            error: error.message 
        });
    }
}

// -------------------------------------------------------------------------
// EXPORTATION FINALE
// -------------------------------------------------------------------------
module.exports = {
    createDon,
    getAllDons,
    deleteDon,
    getRecentDons,
    // 3. CORRECTION : Ajout des fonctions manquantes (probablement cause du TypeError)
    updateDon, 
    getMaharitraStatus,
    updateDonMensuel,
    deleteDonMensuel,
    getDonStats,
    getDonorsStats,
    getByPersonne,
    getStats
};