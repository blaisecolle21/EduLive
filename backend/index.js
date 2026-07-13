require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sequelize } = require('./src/config/database');


const port = 6300;
const app = express();

// Active les 15 middlewares de sécurité par défaut de Helmet
app.use(helmet());


//Middleware pour lire les JSON
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json()); // indispensable


//// Middleware pour logs de requêtes simples
app.use((req, res, next) => {
  console.log(`🚀 Requête reçue : ${req.method} ${req.url}`);
  console.log("📦 req.body =", req.body);
  next();
});



// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/programs', require('./src/routes/programs'));
app.use('/api/cahier', require('./src/routes/cahier'));
app.use('/api/progressionAdmin', require('./src/routes/progressionAdmin'));
app.use('/api/progression', require('./src/routes/progression'));
app.use('/api/notifications', require('./src/routes/notifications'));
app.use('/api/user-modifications', require('./src/routes/userModifications'));



async function aunthenticateDb() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à MariaDB réussie !");

    // Synchronisation des modèles
    await sequelize.sync({ alter: false });
    console.log("✅ Modèles synchronisés avec succès !");
  } catch (error) {
    console.log("❌Impossible de se conecter à MariaDB!");
    console.log(error)
  };


}



app.use(bodyParser.json())
aunthenticateDb();


// Capture de toutes les erreurs non attrapées
process.on('uncaughtException', (err) => {
  console.error("❌ Exception non attrapée :", err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error("❌ Rejet de promesse non géré :", reason.stack || reason);
});

app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`)
});