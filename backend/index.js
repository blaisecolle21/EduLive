require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sequelize } = require("./src/config/database");

const port = 6300;
const app = express();

// Dis à Express de faire confiance aux en-têtes X-Forwarded-For transmis par Nginx
app.set("trust proxy", 1);

// Active les 15 middlewares de sécurité par défaut de Helmet
app.use(helmet());

//Middleware pour lire les JSON
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json()); // indispensable

//Limiteur Global (Assez large)

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limite chaque IP à 150 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Trop de requêtes sur l'ensemble de l'application. Ralentissez un peu.",
  },
});

app.use(globalLimiter);

//// Middleware pour logs de requêtes simples
app.use((req, res, next) => {
  console.log(`🚀 Requête reçue : ${req.method} ${req.url}`);
  console.log("📦 req.body =", req.body);
  next();
});

// Routes
app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/users", require("./src/routes/users"));
app.use("/api/programs", require("./src/routes/programs"));
app.use("/api/cahier", require("./src/routes/cahier"));
app.use("/api/progressionAdmin", require("./src/routes/progressionAdmin"));
app.use("/api/progression", require("./src/routes/progression"));
app.use("/api/notifications", require("./src/routes/notifications"));
app.use("/api/user-modifications", require("./src/routes/userModifications"));

async function aunthenticateDb() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à MariaDB réussie !");

    // Synchronisation des modèles
    await sequelize.sync({ alter: false });
    console.log("✅ Modèles synchronisés avec succès !");
  } catch (error) {
    console.log("❌Impossible de se conecter à MariaDB!");
    console.log(error);
  }
}

app.use(bodyParser.json());
aunthenticateDb();

// Capture de toutes les erreurs non attrapées
process.on("uncaughtException", (err) => {
  console.error("❌ Exception non attrapée :", err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Rejet de promesse non géré :", reason.stack || reason);
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
});

// Middleware global de gestion des erreurs ( 4 arguments)
app.use((err, req, res, next) => {
  //  On log l'erreur complète sur le serveur Ubuntu (Détails visibles uniquement par le développeur)
  console.error("--- ERREUR SERVEUR ---");
  console.error(err);

  // 2. On masque les détails internes et on envoie un message propre au client
  res.status(500).json({
    message: "Une erreur interne est survenue. Veuillez réessayer plus tard.",
  });
});
