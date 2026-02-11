var express = require("express");
var logger = require("morgan");
var path = require("path");
var cookieParser = require("cookie-parser");
var cors = require("cors");



const DB = require("./src/data-access/database-connection");
//router
var don_route=require("./src/routes/don-route")
var donMaharitra_route=require("./src/routes/donMaharitra-route")
var donMensuel_route=require("./src/routes/donMensuel-route")
var personne_route=require("./src/routes/personne-route")
var typeDon_route=require("./src/routes/typedon-route")


const { log } = require("console");

var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// Association et synchronisation BDD
require("./src/schemas/association");
DB.sync({ alter: true })
  .then(() => {
    console.log("✅ Database synchronized");
  })
  .catch((err) => {
    console.error("❌ Database sync error:", err.message);
    console.error(err); // affiche le stack trace complet
  });


// Middleware global de logs
app.use("/api/personne",personne_route);
app.use("/api/typedon",typeDon_route);
app.use("/api/don",don_route);
app.use("/api/don-maharitra",donMaharitra_route);
app.use("/api/don-mensuel/",donMensuel_route);



// ** IMPORTANT : servir les images AVANT le React SPA **
app.use('/data/uploads', express.static(path.join(__dirname, 'public/data/uploads')));



// Servir le front React/Vite (SPA)
//app.use(express.static(path.join(__dirname, '../eleveGendarmeFrontVite/dist')));

// ** Ne pas intercepter les routes /data/uploads et /api dans ce fallback SPA **
 /*app.get('*', (req, res, next) => {
  if (req.path.startsWith('/data/uploads') || req.path.startsWith('/api')) {
    return next(); // laisse Express gérer ces routes
  }
  res.sendFile(path.join(__dirname, '../eleveGendarmeFrontVite/dist/index.html'));
});
*/
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).send("404 not found");
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  console.log(err);
  res.status(err.status || 500);
  res.send("error");
});

module.exports = app;
