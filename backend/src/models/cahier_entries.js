const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CahierEntry = sequelize.define('CahierEntry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    discipline_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'disciplines', key: 'id' }
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'utilisateurs', key: 'id' }
    },
    sa_number: {
      type: DataTypes.STRING(50)
    },
    sa_name: {
      type: DataTypes.STRING(255)
    },
    activites: {
      type: DataTypes.TEXT // Sera stocké comme JSON string
    },
    // ✅ NOUVEAU: État de progression de chaque activité
    activites_status: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Format: { "activite_text": "en_cours" | "fait" }'
    },
    contenu: {
      type: DataTypes.TEXT
    },
    date_cours: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    heure_debut: {
      type: DataTypes.TIME,
      allowNull: false
    },
    heure_fin: {
      type: DataTypes.TIME,
      allowNull: false
    },
    duree_minutes: {
      type: DataTypes.VIRTUAL,
      get() {
        const start = this.getDataValue('heure_debut');
        const end = this.getDataValue('heure_fin');
        if (start && end) {
          return Math.floor((new Date(`1970-01-01 ${end}Z`) - new Date(`1970-01-01 ${start}Z`)) / 60000);
        }
        return null;
      }
    },
    trimestre: {
      type: DataTypes.ENUM('1er', '2e', '3e'),
      allowNull: false
    },
    mois: {
      type: DataTypes.ENUM('SEPT', 'OCT', 'NOV', 'DEC', 'JANV', 'FEV', 'MARS', 'AVRIL', 'MAI', 'JUIN')
    },
    semaine_numero: {
      type: DataTypes.INTEGER
    },
    annee_scolaire: {
      type: DataTypes.STRING(20),
      defaultValue: '2025-2026'
    },
    programme_theorique_id: {
      type: DataTypes.INTEGER,
      references: { model: 'programmes_theoriques', key: 'id' }
    },
    // ✅ MODIFIÉ: Calcul automatique basé sur activites_status
    pourcentage_realise: {
      type: DataTypes.VIRTUAL,
      get() {
        const status = this.getDataValue('activites_status') || {};
        const activites = this.getDataValue('activites');
        
        if (!activites) return 0;
        
        let activitesList = [];
        try {
          activitesList = typeof activites === 'string' ? 
            activites.split('\n').filter(a => a.trim()) : 
            activites;
        } catch (e) {
          return 0;
        }
        
        if (activitesList.length === 0) return 0;
        
        const faites = Object.values(status).filter(s => s === 'fait').length;
        return Math.round((faites / activitesList.length) * 100);
      }
    },
    // ✅ NOUVEAU: Taux prévu du programme théorique
    taux_prevu_programme: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: 'Taux prévu extrait du programme théorique'
    },

     // ✅ NOUVEAUX CHAMPS
    lots_activites_completes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'IDs des lots du programme théorique complètement terminés'
    },
    taux_realise_entry: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Somme des taux prévus des lots complets dans cette entrée'
    }
  }, {
    tableName: 'cahier_entries',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CahierEntry.associate = (models) => {
    CahierEntry.belongsTo(models.Discipline, {
      foreignKey: 'discipline_id',
      as: 'discipline'
    });
    CahierEntry.belongsTo(models.User, {
      foreignKey: 'teacher_id',
      as: 'teacher'
    });
    CahierEntry.belongsTo(models.ProgramTheorique, {
      foreignKey: 'programme_theorique_id',
      as: 'programTheorique'
    });
  };

  return CahierEntry;
};