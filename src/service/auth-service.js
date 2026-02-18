const User = require("../schemas/user-schema");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Dans un vrai projet, on met cette clé dans un fichier .env
const SECRET_KEY = "ma_super_cle_secrete_12345"; 

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

async function login(username, password) {
    const hashedPassword = hashPassword(password);
    console.log("Tentative de login pour:", username);
    console.log("Password hashé calculé:", hashedPassword);
    // 1. Recherche de l'utilisateur
    const user = await User.findOne({ 
        where: { username, password: hashedPassword } 
      
    });

    if (!user) {
        console.log("❌ Utilisateur non trouvé ou mot de passe incorrect");
        throw new Error("Identifiants incorrects");
        
    }

    // 2. Création du Token
    // On met les infos importantes (id, role) dans le "payload" (le contenu du token)
    const token = jwt.sign(
        { 
            idUser: user.idUser, 
            username: user.username, 
            role: user.role 
        },
        SECRET_KEY,
        { expiresIn: '24h' } // Le token sera valide pendant 24 heures
    );

    // 3. Retourner les infos au contrôleur
    return {
        token,
        user: {
            id: user.idUser,
            username: user.username,
            role: user.role
        }
    };
}

module.exports = { login, hashPassword };