require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sequelize } = require("./src/config/database");

const port = process.env.PORT || 6300; //  dynamique pour Railway
const app = express();

app.set("trust proxy", 1);

app.use(helmet());

//  CORS dynamique — accepte le frontend en prod ET localhost en dev
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Non autorisé par CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Trop de requêtes sur l'ensemble de l'application. Ralentissez un peu.",
  },
});
app.use(globalLimiter);

app.use((req, res, next) => {
  console.log(`🚀 Requête reçue : ${req.method} ${req.url}`);
  console.log("📦 req.body =", req.body);
  next();
});

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", timestamp: Date.now() }),
);

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
    await sequelize.sync({ alter: false });
    console.log("✅ Modèles synchronisés avec succès !");
  } catch (error) {
    console.log("❌ Impossible de se connecter à MariaDB!");
    console.log(error);
  }
}

app.use(bodyParser.json());
aunthenticateDb();

process.on("uncaughtException", (err) => {
  console.error("❌ Exception non attrapée :", err.stack);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Rejet de promesse non géré :", reason.stack || reason);
});

//  Middleware d'erreurs doit etre  AVANT app.listen()
app.use((err, req, res, next) => {
  console.error("--- ERREUR SERVEUR ---");
  console.error(err);
  res.status(500).json({
    message: "Une erreur interne est survenue. Veuillez réessayer plus tard.",
  });
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur le port ${port}`);
});
