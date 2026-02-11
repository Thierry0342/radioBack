// src/service/don-service.js

// =========================================================================
// 1. IMPORTS
// =========================================================================

// Importez les modèles depuis le fichier d'association
const { 
  Personne, 
  Don, 
  TypeDon, // Nécessaire pour la recherche dynamique de l'ID Maharitra
  DonMaharitra, 
  DonMaharitraMensuel 
} = require('../schemas/association'); 

// Importez l'instance de sequelize pour les transactions.
// IMPORTANT : Assurez-vous que ce chemin est correct pour votre instance Sequelize
const sequelize = require('../data-access/database-connection'); 


// =========================================================================
// 2. FONCTION UTILITAIRE : Récupérer l'ID de Maharitra (Dynamique)
// =========================================================================

let maharitraTypeIdCache = null;

/**
* Récupère l'ID du type de don 'MAHARITRA' depuis la DB. Utilise un cache pour les appels futurs.
*/
async function getMaharitraTypeId() {
  // Utilise le cache si l'ID a déjà été trouvé
  if (maharitraTypeIdCache) {
      return maharitraTypeIdCache;
  }

  try {
      const maharitraType = await TypeDon.findOne({
          where: { libelle: 'MAHARITRA' },
          attributes: ['idType']
      });

      if (!maharitraType) {
          // Le type de don MAHARITRA doit exister pour que la logique Maharitra fonctionne.
          throw new Error("Erreur de configuration: Le Type de Don 'MAHARITRA' n'existe pas dans la base de données.");
      }

      maharitraTypeIdCache = maharitraType.idType;
      return maharitraTypeIdCache;

  } catch (error) {
      console.error("Erreur lors de la récupération de l'ID Maharitra:", error.message);
      throw error;
  }
}


// =========================================================================
// 3. FONCTION PRINCIPALE : createDon (Logique Transactionnelle)
// =========================================================================

/**
* Gère la création complexe d'un Don (Personne → Don → Maharitra/Mensuel) en transaction.
*/
async function createDon(data) {
  // Déstructure le payload reçu du frontend
  const { personne, don, maharitraDetails } = data;
  
  // Récupération dynamique de l'ID Maharitra pour la vérification
  const maharitraTypeId = await getMaharitraTypeId();

  // Démarrage de la transaction
  const t = await sequelize.transaction();

  try {
      // -------------------------------------------------------------------
      // 1. GESTION DE LA PERSONNE (Création ou Récupération de l'ID)
      // -------------------------------------------------------------------
      let idPersonne;
      
      if (personne.idPersonne) {
          // Cas 1: Donateur existant
          idPersonne = personne.idPersonne;
      } else {
          // Cas 2: Nouveau Donateur
          if (!personne.nom) {
               throw new Error("Le nom du donateur est requis pour la création.");
          }
          // Crée la personne dans la transaction
          const newPersonne = await Personne.create(personne, { transaction: t });
          idPersonne = newPersonne.idPersonne;
      }

      // -------------------------------------------------------------------
      // 2. CRÉATION DU DON (Base)
      // -------------------------------------------------------------------
      const donPayload = {
          ...don,
          // CORRECTION CRUCIALE : Ajout de l'ID de la Personne
          idPersonne: idPersonne, 
      };

      const newDon = await Don.create(donPayload, { transaction: t });
      const idDon = newDon.idDon;
      
      // -------------------------------------------------------------------
      // 3. GESTION MAHARITRA (si le type de don correspond à l'ID Maharitra)
      // -------------------------------------------------------------------
      if (parseInt(don.idType) === maharitraTypeId) {
          
          // Validation des données Maharitra
          if (!maharitraDetails || !maharitraDetails.mensuels || maharitraDetails.mensuels.length === 0) {
              throw new Error("Détails Maharitra (mensuels) manquants pour un Don Maharitra.");
          }
          
          // 3.1. Création de l'engagement DonMaharitra
          const newMaharitra = await DonMaharitra.create({
              idDon: idDon,
              annee: maharitraDetails.annee,
          }, { transaction: t });
          const idMaharitra = newMaharitra.idMaharitra;

          // 3.2. Création des paiements mensuels
          const mensuelCreations = maharitraDetails.mensuels.map(mensuel => ({
              // Données du paiement
              mois: mensuel.mois,
              montant: mensuel.montant,
              datePaiement: mensuel.datePaiement,
              // Liaison
              idMaharitra: idMaharitra, 
              statut: mensuel.statut || 'PAID' 
          }));
          
          await DonMaharitraMensuel.bulkCreate(mensuelCreations, { transaction: t });
      }

      // 4. Validation: Tout est OK, on enregistre définitivement les changements
      await t.commit();
      
      return { message: "Don enregistré avec succès!", idDon: idDon };

  } catch (error) {
      // 5. Annulation: Annule toutes les opérations en cas d'erreur
      await t.rollback();
      
      // Log l'erreur détaillée côté serveur pour le débug
      console.error("Erreur détaillée dans donService.createDon:", error); 
      
      // Relance l'erreur pour que le contrôleur la renvoie au frontend
      throw new Error("Échec de la transaction Don. Détails: " + error.message);
  }
}

async function findAllDons() {
    const dons = await Don.findAll({
      include: [
        { model: Personne, attributes: ['nom'] },
        { model: TypeDon, attributes: ['libelle'] }
      ]
    });
  
    // On transforme le résultat pour que React puisse lire "libelleType" directement
    return dons.map(d => {
      const item = d.get({ plain: true }); // Convertit en objet simple
      return {
        ...item,
        libelleType: item.TypeDon ? item.TypeDon.libelle : "Autre",
        nomDonateur: item.Personne ? item.Personne.nom : "Anonyme"
      };
    });
  }

// Supprimer un don
async function deleteDon(idDon) {
  return Don.destroy({ where: { idDon } });
}

// Trouver les dons par personne
async function findByPersonne(idPersonne) {
  return Don.findAll({
    where: { idPersonne },
    include: [{ model: TypeDon }]
  });
}


async function findRecentDons(limit) {
    const queryLimit = parseInt(limit) || 10;
    
    // Récupérer l'ID du type de don MAHARITRA (si nécessaire pour la condition WHERE/JOIN)
    const maharitraTypeId = await getMaharitraTypeId(); // Assurez-vous que cette fonction est toujours définie

    return await Don.findAll({
        attributes: [
            'idDon', 
            'montant', 
            'dateDon',
            // On peut aussi sélectionner l'idType pour la vérification rapide
            'idType', 
        ],
        
        include: [
            {
                model: Personne,
                required: true, 
                attributes: ['nom', 'contact', 'adresse'],
            },
            {
                model: TypeDon,
                required: true, 
                attributes: ['libelle'],
            },
            // 🚀 NOUVEAU : Jointure conditionnelle avec les paiements mensuels (LEFT JOIN)
            {
                model: DonMaharitra, // La table intermédiaire Maharitra
                required: false, // LEFT JOIN
                attributes: ['annee'], // Année de l'engagement
                include: [{
                    model: DonMaharitraMensuel, // La table des paiements mensuels
                    required: false, // LEFT JOIN
                    // N'inclure que le mois (pour minimiser la taille du résultat)
                    attributes: ['mois'], 
                }]
            }
        ],
        
        order: [
            ['dateDon', 'DESC'], 
            ['idDon', 'DESC']
        ],
        
        limit: queryLimit,

        // Gardez raw: false pour pouvoir manipuler la structure imbriquée complexe
        raw: false,
        nest: true, // Aide à organiser le résultat
    })
    .then(data => {
        // 🚀 NOUVEAU : Transformation des données pour aplatir et formater les mois
        return data.map(item => {
            
            // Si c'est un don Maharitra et qu'il y a des paiements mensuels
            let moisPayes = null;
            if (item.idType === maharitraTypeId && item.DonMaharitra && item.DonMaharitra.DonMaharitraMensuels) {
                // Extrait et joint les mois (ex: "JAN, FEV")
                moisPayes = item.DonMaharitra.DonMaharitraMensuels
                    .map(m => m.mois)
                    .join(', ');
            }
            
            return {
                idDon: item.idDon,
                montant: parseFloat(item.montant),
                dateDon: item.dateDon,
                
                // Détails de la personne
                nomDonateur: item.Personne.nom,
                contact: item.Personne.contact,
                adresse: item.Personne.adresse,
                
                // Type de don
                libelleType: item.TypeDon.libelle,
                
                // 🚀 NOUVEAU : Les mois payés
                moisPayes: moisPayes, 
            };
        });
    })
    .catch(error => {
        console.error("Erreur Sequelize lors de la récupération des dons récents:", error);
        throw error;
    });
}
async function getDonStatsByType() {
    try {
        const stats = await Don.findAll({
            attributes: [
                // Sélectionne l'ID et le Nom du Type de Don (doit être un attribut du modèle joint)
                [sequelize.col('TypeDon.idType'), 'idType'],
                [sequelize.col('TypeDon.libelle'), 'title'], 
                
                // Agrégation: Montant total pour ce type
                [sequelize.fn('SUM', sequelize.col('Don.montant')), 'totalMontant'], 
                
                // Agrégation: Nombre total de dons pour ce type
                [sequelize.fn('COUNT', sequelize.col('Don.idDon')), 'totalDons'], 
            ],
            include: [{
                model: TypeDon,
                // On s'assure que TypeDon est bien l'alias utilisé dans les associations
                attributes: [], 
                required: true // INNER JOIN pour n'inclure que les types ayant des dons
            }],
            // 🛑 IMPORTANT : Grouper par les colonnes sélectionnées et utilisées dans SELECT
            group: ['TypeDon.idType', 'TypeDon.libelle'], 
            raw: true 
        });

        return stats;

    } catch (error) {
        console.error("Erreur dans getDonStatsByType:", error);
        throw new Error("Erreur de calcul des statistiques par type de don: " + error.message);
    }
}


async function updateDon(payload) {
    const transaction = await sequelize.transaction();

    try {
        const { idDon, personne, don, maharitraDetails } = payload;
      
        // --- Étape 1 : Mettre à jour la Personne ---
        if (personne && personne.idPersonne) {
            await Personne.update(
                { nom: personne.nom, contact: personne.contact, adresse: personne.adresse },
                { where: { idPersonne: personne.idPersonne }, transaction }
            );
        }

        // --- Étape 2 : Mettre à jour le Don Principal ---
        // On ne met à jour que la date et l'idType (le montant est recalculé après les mensuels)
        const updatedDonData = {
            dateDon: don.dateDon,
            idType: don.idType,
        };

        // Si ce n'est pas un Maharitra (c'est un TSOTRA), mettez à jour le montant directement
        if (don.montant && !maharitraDetails) {
             updatedDonData.montant = parseFloat(don.montant);
        }

        await Don.update(updatedDonData, { where: { idDon: idDon }, transaction });


        // --- Étape 3 : Gérer les Nouveaux Paiements Mensuels (Maharitra) ---
        if (maharitraDetails && maharitraDetails.mensuels && maharitraDetails.mensuels.length > 0) {
            
            // Récupérer l'enregistrement DonMaharitra lié à ce don
            let donMaharitra = await DonMaharitra.findOne({
                where: { idDon: idDon },
                transaction
            });

            // Si l'enregistrement d'engagement n'existe pas, il faut le créer
            if (!donMaharitra) {
                // On doit déterminer l'idPersonne à partir du Don
                const existingDon = await Don.findByPk(idDon, { transaction });

                donMaharitra = await DonMaharitra.create({
                    idDon: idDon,
                    idPersonne: existingDon.idPersonne, 
                    annee: maharitraDetails.annee || new Date().getFullYear(),
                    // Les autres champs d'engagement (montant total, fréquence, etc.) devraient être gérés ici
                }, { transaction });
            }


            // Enregistrer chaque nouveau paiement mensuel
            const nouveauxPaiements = maharitraDetails.mensuels.map(m => ({
                idDon: idDon,
                idDonMaharitra: donMaharitra.idDonMaharitra, // Liaison correcte
                mois: m.mois,
                montant: parseFloat(m.montant),
                datePaiement: m.datePaiement,
            }));

            await DonMaharitraMensuel.bulkCreate(nouveauxPaiements, { transaction });
            
            // *** ÉTAPE CRUCIALE : RECALCULER LE MONTANT TOTAL DU DON PRINCIPAL ***
            // Après l'ajout de nouveaux paiements, le montant total du Don (Don.montant) doit être mis à jour.
            const totalPaye = await DonMaharitraMensuel.sum('montant', {
                where: { idDon: idDon },
                transaction
            });

            await Don.update(
                { montant: totalPaye },
                { where: { idDon: idDon }, transaction }
            );
        }

        await transaction.commit();
        return { success: true, idDon };

    } catch (error) {
        await transaction.rollback();
        
        // 🚀 CORRECTION : Afficher la cause détaillée et la relancer
        console.error("Erreur détaillée dans donService.updateDon:", error);

        // Au lieu de relancer un message générique, relancez l'erreur originale (si elle est de type Error)
        // ou un message incluant les détails de l'erreur.
        throw new Error("Échec de la mise à jour du don et des paiements mensuels. Détails: " + error.message);
    }
}
async function findAllDonorsWithStats() {
    try {
        const stats = await Personne.findAll({
            attributes: [
                'idPersonne',
                'nom',
                'contact',
                'adresse',
                // Syntaxe MariaDB : On utilise des backticks ` au lieu de "
                [sequelize.literal('COALESCE(SUM(`Dons`.`montant`), 0)'), 'totalVerse'],
                [sequelize.literal('COUNT(`Dons`.`idDon`)'), 'nombreDons'],
                [sequelize.literal('MAX(`Dons`.`dateDon`)'), 'dernierDon']
            ],
            include: [{
                model: Don,
                attributes: [], 
                required: false 
            }],
            group: [
                'Personne.idPersonne',
                'Personne.nom',
                'Personne.contact',
                'Personne.adresse'
            ],
            // Pour MariaDB, on trie sur l'alias directement sans guillemets complexes
            order: [[sequelize.literal('totalVerse'), 'DESC']],
            raw: true,
            subQuery: false
        });

        return stats;
    } catch (error) {
        console.error("ERREUR SQL MARIA DB :", error);
        throw error;
    }
}
async function getByPersonne(idPersonne) {
    try {
      return await Don.findAll({
        where: { idPersonne: idPersonne },
        include: [
          { 
            model: TypeDon,
            attributes: ['libelle'] // On récupère le nom du type (Tsotra, Maharitra...)
          }
        ],
        order: [['dateDon', 'DESC']] // Les plus récents en premier
      });
    } catch (error) {
      console.error("Erreur dans getByPersonne:", error);
      throw error;
    }
  }
  // =========================================================================
// 4. STATISTIQUES AVANCÉES POUR LE DASHBOARD
// =========================================================================

/**
 * Récupère toutes les stats d'une année (KPI, Évolution mensuelle, Répartition)
 */
async function getYearlyDashboardStats(year) {
    const targetYear = parseInt(year) || new Date().getFullYear();

    try {
        // 1. Résumé Global (Somme, Nombre de dons, Donateurs uniques)
        const summary = await Don.findOne({
            attributes: [
                [sequelize.col('TypeDon.libelle'), 'libelle'],
                [sequelize.fn('SUM', sequelize.col('montant')), 'totalMontant'],
                [sequelize.fn('COUNT', sequelize.col('idDon')), 'nombreDons'],
                [sequelize.fn('COUNT', sequelize.literal('DISTINCT idPersonne')), 'nombreDonateurs']
            ],
            where: sequelize.where(sequelize.fn('YEAR', sequelize.col('dateDon')), targetYear),
            raw: true
        });

        // 2. Évolution Mensuelle (Somme par mois)
        const evolution = await Don.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('dateDon')), 'moisIndex'],
                [sequelize.fn('SUM', sequelize.col('montant')), 'montant']
            ],
            where: sequelize.where(sequelize.fn('YEAR', sequelize.col('dateDon')), targetYear),
            group: [sequelize.fn('MONTH', sequelize.col('dateDon'))],
            order: [[sequelize.fn('MONTH', sequelize.col('dateDon')), 'ASC']],
            raw: true
        });

        // Mappage des noms de mois pour le frontend
        const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
        const evolutionMensuelle = moisNoms.map((nom, index) => {
            const dataMois = evolution.find(e => parseInt(e.moisIndex) === index + 1);
            return {
                mois: nom,
                montant: dataMois ? parseFloat(dataMois.montant) : 0
            };
        });

        // 3. Répartition par Type pour l'année spécifique
        const repartition = await Don.findAll({
            attributes: [
                [sequelize.col('TypeDon.libelle'), 'libelle'],
                [sequelize.fn('SUM', sequelize.col('Don.montant')), 'montant'],
                [sequelize.fn('COUNT', sequelize.col('Don.idDon')), 'count']
            ],
            include: [{
                model: TypeDon,
                attributes: [],
                required: true
            }],
            where: sequelize.where(sequelize.fn('YEAR', sequelize.col('dateDon')), targetYear),
            group: ['TypeDon.libelle'],
            raw: true
        });

        return {
            totalMontant: parseFloat(summary.totalMontant) || 0,
            nombreDons: parseInt(summary.nombreDons) || 0,
            nombreDonateurs: parseInt(summary.nombreDonateurs) || 0,
            repartitionParType: repartition.map(r => ({
                ...r,
                montant: parseFloat(r.montant)
            })),
            evolutionMensuelle
        };

    } catch (error) {
        console.error("Erreur dans getYearlyDashboardStats:", error);
        throw error;
    }
}
module.exports = {
  createDon,
  findAllDons,
  deleteDon,
  findByPersonne,
findRecentDons,
updateDon,
getDonStatsByType,
findAllDonorsWithStats,
getByPersonne,
getYearlyDashboardStats
};