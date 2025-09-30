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
      references: {
        model: 'disciplines',
        key: 'id'
      }
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utilisateurs',
        key: 'id'
      }
    },
    sa_number: {
      type: DataTypes.STRING(50)
    },
    sa_name: {
      type: DataTypes.STRING(255)
    },
    activites: {
      type: DataTypes.TEXT
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
      type: DataTypes.INTEGER,
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
      references: {
        model: 'programmes_theoriques',
        key: 'id'
      }
    },
    pourcentage_realise: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 100
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    }
  }, {
    tableName: 'cahier_entries',
    timestamps: true,
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