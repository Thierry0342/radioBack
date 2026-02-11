const mensuelService = require("../service/donMensuel-service"); // Assurez-vous que le chemin est correct

// Récupérer les mois d’un MAHARITRA (Existant)
async function getMensuelByMaharitra(req, res) {
    try {
        const id = req.params.idMaharitra;
        const mois = await mensuelService.findByMaharitra(id);
        res.json(mois);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la récupération des mois" });
    }
}

// Marquer un mois payé (Existant)
async function payMonth(req, res) {
    try {
        const id = req.params.idMensuel;
        const { datePaiement } = req.body;

        await mensuelService.payMonth(id, datePaiement); 
        res.json({ message: "Mois marqué payé" });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors du paiement" });
    }
}

// ----------------------------------------------------------------
// NOUVELLE FONCTION : Contrôleur pour le statut Maharitra
// ----------------------------------------------------------------
// Cette fonction récupère l'historique des paiements mensuels d'une personne pour une année donnée.
async function getMaharitraStatus(req, res) {
    // Le front-end envoie idPersonne et annee via les paramètres de requête (req.query)
    const { idPersonne, annee } = req.query; 
  

    if (!idPersonne || !annee) {
        return res.status(400).json({ message: "Les paramètres idPersonne et annee sont requis." });
    }

    try {
        // Appelle la fonction correspondante dans le service
        const paiements = await mensuelService.getMaharitraStatus(
            idPersonne, 
            annee
        );
        
        // Retourne le tableau des paiements (même s'il est vide)
        res.status(200).json(paiements); 

    } catch (error) {
        console.error("Erreur lors de la récupération du statut Maharitra:", error);
        res.status(500).json({ 
            error: "Erreur serveur lors de la récupération du statut mensuel Maharitra.", 
            details: error.message 
        });
    }
}
async function deleteMensuel(req, res) {
    try {
        const idMensuel = req.params.idMensuel;
        const result = await mensuelService.deleteMensuel(idMensuel);
        
        if (result === 0) {
            return res.status(404).json({ message: "Paiement mensuel non trouvé." });
        }
        
        return res.status(200).json({ message: "Paiement mensuel supprimé avec succès." });
    } catch (error) {
        console.error("Erreur lors de la suppression du paiement mensuel:", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression.", details: error.message });
    }
}


module.exports = {
    getMensuelByMaharitra,
    payMonth,
    getMaharitraStatus,
    deleteMensuel
};