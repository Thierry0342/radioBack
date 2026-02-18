const User = require("../schemas/user-schema");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Dans un vrai projet, on met cette clé dans un fichier .env
const SECRET_KEY = "ma_super_cle_secrete_12345"; 

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// ... (imports et hashPassword inchangés)

async function login(username, password) {
    const hashedPassword = hashPassword(password);
    
    const user = await User.findOne({ 
        where: { username, password: hashedPassword } 
    });

    if (!user) {
        throw new Error("NOT_FOUND"); // Identifiants faux
    }

    // 🚩 VERIFICATION DU STATUT
    if (user.status === 'PENDING') {
        throw new Error("ACCOUNT_PENDING");
    }
    if (user.status === 'REJECTED') {
        throw new Error("ACCOUNT_REJECTED");
    }

    const token = jwt.sign(
        { idUser: user.idUser, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '24h' }
    );

    return {
        token,
        user: { id: user.idUser, username: user.username, role: user.role }
    };
}

// Ajoute cette fonction pour que l'admin puisse lister les demandes
async function getPendingUsers() {
    return await User.findAll({ where: { status: 'PENDING' } });
}

// Ajoute cette fonction pour valider/refuser
async function updateUserStatus(idUser, newStatus) {
    return await User.update({ status: newStatus }, { where: { idUser } });
}

module.exports = { login, hashPassword, getPendingUsers, updateUserStatus };
