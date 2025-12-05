// models/cahierEntryHistory.js
module.exports = (sequelize, DataTypes) => {
  const CahierEntryHistory = sequelize.define('CahierEntryHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cahier_entry_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cahier_entries',
        key: 'id'
      }
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    discipline_id: DataTypes.INTEGER, // ✅ AJOUT
    sa_number: DataTypes.STRING(50),
    sa_name: DataTypes.STRING(255),
    activites: DataTypes.TEXT,
    activites_status: { // ✅ AJOUT 
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    contenu: DataTypes.TEXT,
    date_cours: DataTypes.DATEONLY,
    heure_debut: DataTypes.TIME,
    heure_fin: DataTypes.TIME,
    trimestre: DataTypes.ENUM('1er', '2e', '3e'),
    mois: DataTypes.ENUM('SEPT', 'OCT', 'NOV', 'DEC', 'JANV', 'FEV', 'MARS', 'AVRIL', 'MAI', 'JUIN'),
    semaine_numero: DataTypes.INTEGER,
    annee_scolaire: DataTypes.STRING(20),
    pourcentage_realise: DataTypes.DECIMAL(5, 2),
    taux_prevu_programme: DataTypes.DECIMAL(5, 2), // ✅ AJOUT
    modified_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    modified_by: { // ✅ AJOUT
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    }
  }, {
    tableName: 'cahier_entries_history',
    timestamps: false,
    underscored: true
  });

  CahierEntryHistory.associate = (models) => {
    CahierEntryHistory.belongsTo(models.CahierEntry, { 
      foreignKey: 'cahier_entry_id',
      as: 'CahierEntry'
    });
    CahierEntryHistory.belongsTo(models.User, { 
      foreignKey: 'modified_by',
      as: 'ModifiedBy'
    });
  };

  return CahierEntryHistory;
};