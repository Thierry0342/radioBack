const authService = require("../service/auth-service");
const User = require("../schemas/user-schema");

async function login(req, res) {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        res.json(result);
    } catch (error) {
        // Gestion des messages d'erreur spécifiques
        if (error.message === "ACCOUNT_PENDING") {
            return res.status(403).json({ error: "Votre compte est en attente d'approbation par l'administrateur." });
        }
        if (error.message === "ACCOUNT_REJECTED") {
            return res.status(403).json({ error: "Votre demande d'accès a été refusée." });
        }
        res.status(401).json({ error: "Identifiants incorrects." });
    }
}
async function register(req, res) {
    try {
        const { username, password } = req.body;

        // 1. Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
        }

        // 2. Compter le nombre d'utilisateurs total
        const userCount = await User.count();

        // 3. Déterminer le statut et le rôle
        // Si c'est le TOUT PREMIER (count === 0), il est ADMIN et APPROVED
        let finalRole = 'CONSULTANT';
        let finalStatus = 'PENDING';

        if (userCount === 0) {
            finalRole = 'ADMIN';
            finalStatus = 'APPROVED';
            console.log("👑 Création du premier administrateur système...");
        }

        const hashedPassword = authService.hashPassword(password);
        
        // 4. Création de l'utilisateur
        const newUser = await User.create({
            username: username,
            password: hashedPassword,
            role: finalRole,
            status: finalStatus
        });

        const message = (finalStatus === 'APPROVED') 
            ? "Compte administrateur créé et activé." 
            : "Demande de création de compte envoyée à l'administrateur.";

        res.status(201).json({ message, role: newUser.role });

    } catch (error) {
        console.error("❌ Erreur register:", error);
        res.status(500).json({ error: "Erreur serveur lors de la création." });
    }
}

// 🎯 NOUVELLES FONCTIONS POUR L'ADMIN
async function getPending(req, res) {
    try {
        const users = await authService.getPendingUsers();
        // Si users est vide, Sequelize renvoie [], ce qui est correct
        res.status(200).json(users);
    } catch (e) {
        console.error("Erreur Backend getPending:", e);
        res.status(500).json({ message: "Erreur lors de la récupération des demandes", error: e.message });
    }
}

async function validateUser(req, res) {
    try {
        const { idUser, status } = req.body; // status: 'APPROVED' ou 'REJECTED'
        await authService.updateUserStatus(idUser, status);
        res.json({ message: `Utilisateur mis à jour : ${status}` });
    } catch (e) { res.status(500).json({ error: e.message }); }
}

module.exports = { login, register, getPending, validateUser };