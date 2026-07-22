const { Sequelize, DataTypes } = require("sequelize");
// Charger les variables d'environnement du fichier .env
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    dialect: "mysql",
    port: process.env.DB_PORT || 3306,
    host: process.env.DB_HOST || "localhost",

    dialectOptions:
      process.env.NODE_ENV === "production"
        ? { ssl: { rejectUnauthorized: false } } //   Aiven exige TLS
        : {},
    define: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    // Désactiver le log SQL en production pour plus de sécurité et de performance
    logging:
      process.env.NODE_ENV === "production"
        ? false
        : (msg) => console.log("[SQL]", msg),
  },
);

const models = {
  Role: require("../models/role")(sequelize, DataTypes),
  Permission: require("../models/permission")(sequelize, DataTypes),
  RolePermission: require("../models/rolePermission")(sequelize, DataTypes),
  User: require("../models/user")(sequelize, DataTypes),
  Etablissement: require("../models/etablissement")(sequelize, DataTypes),
  ProgramTheorique: require("../models/programTheorique")(sequelize, DataTypes),
  AnneeAcademique: require("../models/anneeAcademique")(sequelize, DataTypes),
  Classe: require("../models/classes")(sequelize, DataTypes),
  Discipline: require("../models/disciplines")(sequelize, DataTypes),
  CahierEntry: require("../models/cahier_entries")(sequelize, DataTypes),
  EnseignantDiscipline: require("../models/enseignantDisciplines")(
    sequelize,
    DataTypes,
  ),
  ResponsableClasse: require("../models/ResponsableClasse")(
    sequelize,
    DataTypes,
  ),
  CahierEntryDeleted: require("../models/cahierEntryDeleted")(
    sequelize,
    DataTypes,
  ),
  CahierEntryHistory: require("../models/cahierEntryHistory")(
    sequelize,
    DataTypes,
  ),
  Notification: require("../models/notification")(sequelize, DataTypes),
  NotificationEnvoiAdmin: require("../models/notificationEnvoiAdmin")(
    sequelize,
    DataTypes,
  ),
  UserModification: require("../models/userModification")(sequelize, DataTypes),
};

// Configurer les relations
Object.values(models).forEach((model) => {
  if (model.associate) model.associate(models);
});

module.exports = { sequelize, models };
