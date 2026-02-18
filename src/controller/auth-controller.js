const authService = require("../service/auth-service");
const User = require("../schemas/user-schema");

async function login(req, res) {
    try {
        const { username, password } = req.body;
        const result = await authService.login(username, password);
        res.json(result); // Envoie le token et les infos user au Front
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
}

// Optionnel : Une fonction pour créer le premier utilisateur (Admin)
async function register(req, res) {
    try {
        const { username, password } = req.body;
        
        // On n'oublie pas de hasher avant d'enregistrer !
        const hashedPassword = authService.hashPassword(password);
        
        const newUser = await User.create({
            username,
            password: hashedPassword,
            role: 'ADMIN'
        });
        
        res.status(201).json({ message: "Utilisateur créé !", id: newUser.idUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { login, register };