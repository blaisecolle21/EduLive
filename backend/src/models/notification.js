// models/notification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    enseignant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utilisateurs',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'auto_progression',
        'admin_global',
        'admin_ciblée',
        'admin_personnalisée'
      ),
      allowNull: false
    },
    categorie: {
      type: DataTypes.ENUM(
        'felicitations',
        'encouragement',
        'avertissement',
        'alerte',
        'critique',
        'avance_excessive',
        'info'
      ),
      defaultValue: 'info'
    },
    titre: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    classe_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 's_classes',
        key: 'id'
      }
    },
    discipline_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'disciplines',
        key: 'id'
      }
    },
    progression_actuelle: {
      type: DataTypes.DECIMAL(5, 2)
    },
    ecart_jours: {
      type: DataTypes.INTEGER,
      comment: 'Positif = avance, Négatif = retard'
    },
    semaine_attendue: {
      type: DataTypes.STRING(50)
    },
    mois_attendu: {
      type: DataTypes.ENUM('SEPT','OCT','NOV','DEC','JANV','FEV','MARS','AVRIL','MAI','JUIN')
    },
    probleme_chronologie: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    details_chronologie: {
      type: DataTypes.TEXT
    },
    est_lue: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    date_lecture: {
      type: DataTypes.DATE
    },
    email_envoye: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    date_envoi_email: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'enseignant_id',
      as: 'enseignant'
    });
    Notification.belongsTo(models.Classe, {
      foreignKey: 'classe_id',
      as: 'classe'
    });
    Notification.belongsTo(models.Discipline, {
      foreignKey: 'discipline_id',
      as: 'discipline'
    });
  };

  return Notification;
};
