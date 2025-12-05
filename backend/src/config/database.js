const { Sequelize, DataTypes } = require("sequelize");
const notificationEnvoiAdmin = require("../models/notificationEnvoiAdmin");

const sequelize = new Sequelize('cahier_texte_platform', 'root','', {
    dialect: 'mariadb',
    port: 3306,
    host : 'localhost',
    define: {
        charset: 'utf8mb4', // Encodage UTF-8 pour gérer les caractères spéciaux
        collate: 'utf8mb4_unicode_ci',
    },
    logging : (msg) => {
        console.log('[SQL]', msg);
    }
})

const models = {
    User: require('../models/user')(sequelize, DataTypes),
    Etablissement: require('../models/etablissement')(sequelize, DataTypes),
    ProgramTheorique: require('../models/programTheorique')(sequelize, DataTypes),
    AnneeAcademique: require('../models/anneeAcademique')(sequelize, DataTypes),
    Classe: require('../models/classes')(sequelize, DataTypes),
    Discipline: require('../models/disciplines')(sequelize, DataTypes),
    CahierEntry: require('../models/cahier_entries')(sequelize, DataTypes),
    EnseignantDiscipline: require('../models/enseignantDisciplines')(sequelize, DataTypes),
    CahierEntryDeleted: require('../models/cahierEntryDeleted')(sequelize, DataTypes),
    CahierEntryHistory: require('../models/cahierEntryHistory')(sequelize, DataTypes),
    Notification: require('../models/notification')(sequelize, DataTypes),
    NotificationEnvoiAdmin: require('../models/notificationEnvoiAdmin')(sequelize, DataTypes)
}

// Configurer les relations
Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

module.exports = {sequelize, models};