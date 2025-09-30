const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProgramTheorique = sequelize.define('ProgramTheorique', {
    promotion: {
      type: DataTypes.ENUM('6e', '5e', '4e', '3e', '2nde AB', '2nde C', '2nde D', '1ere AB', '1ere C', '1ere D', 'Tle A1', 'Tle A2-B', 'Tle C', 'Tle D'),
      allowNull: false
    },
    discipline: {
      type: DataTypes.ENUM('PCT', 'Mathématiques', 'SVT', 'Histoire-Géographie', 'Français', 'Anglais', 'Lecture', 'Communication écrite', 'Philosophie'),
      allowNull: false
    },
    annee_academique_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'annees_academiques',
        key: 'id'
      }
    },
    trimestre: {
      type: DataTypes.ENUM('1er', '2e', '3e')
    },
    mois: {
      type: DataTypes.ENUM('SEPT', 'OCT', 'NOV', 'DEC', 'JANV', 'FEV', 'MARS', 'AVRIL', 'MAI', 'JUIN')
    },
    semaine_numero: {
      type: DataTypes.INTEGER
    },
    semaine_dates: {
      type: DataTypes.STRING(50)
    },
    sa: {
      type: DataTypes.STRING(50)
    },
    situation_apprentissage: {
      type: DataTypes.TEXT
    },
    activites: {
      type: DataTypes.TEXT
    },
    taux_prevu: {
      type: DataTypes.DECIMAL(5, 2)
    },
    taux_cumule_prevu: {
      type: DataTypes.DECIMAL(5, 2)
    },
    taux_realise: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    taux_cumule_realise: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    observations: {
      type: DataTypes.TEXT
    },
    statut: {
      type: DataTypes.ENUM('à venir', 'en cours', 'terminé', 'en retard'),
      defaultValue: 'à venir'
    },
    date_debut: {
      type: DataTypes.DATEONLY
    },
    date_fin: {
      type: DataTypes.DATEONLY
    }
  }, {
    tableName: 'programmes_theoriques',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['promotion', 'discipline'],
        name: 'idx_prom_disc' // Nom court pour l'index non unique
      },
      {
        fields: ['trimestre', 'semaine_numero'],
        name: 'idx_trim_sem' // Nom court pour l'index non unique
      },
      {
        unique: true,
        fields: ['promotion', 'discipline', 'annee_academique_id', 'trimestre', 'semaine_numero', 'sa'],
        name: 'uniq_prog_key' // Nom court pour l'index unique (11 caractères)
      }
    ]
  });

  return ProgramTheorique;
};