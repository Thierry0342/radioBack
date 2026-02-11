// upload-config.js
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");


const upload_dest = path.join("public", "data", "uploads");
const eleveImage_dest = path.join(upload_dest, "pictures", "images");

// Crée le dossier s'il n'existe pas
fs.mkdirSync(eleveImage_dest, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, eleveImage_dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); // garde l'extension d’origine
    cb(null, crypto.randomUUID() + ext);
    
  },
});


const upload = multer({ storage });
//excelm
const excel_dest = path.join(upload_dest, "excels");
fs.mkdirSync(excel_dest, { recursive: true });

const excelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, excel_dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, crypto.randomUUID() + ext);
  },
});

const uploadExcel = multer({ storage: excelStorage });

module.exports = {
  upload,      
  uploadExcel   
};
