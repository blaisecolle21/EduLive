const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { Hooks } = require('sequelize/lib/hooks');


module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    prenoms: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    mot_de_passe: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('enseignant', 'admin'),
      allowNull: false
    },
    etablissement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'etablissements',
        key: 'id'
      }
    },
    est_actif: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },

    // Migration / modèle User : ajouter
    est_valide: {
      type: DataTypes.BOOLEAN,
      defaultValue: false  // false = jamais validé par l'admin
    },
    derniere_connexion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    token_reset: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    token_reset_expire: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    preferences_notifications: {
      type: DataTypes.JSON,
      allowNull: true
    },
    photo_profil: {
      type: DataTypes.STRING(255),
      allowNull: true
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
    tableName: 'utilisateurs',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.mot_de_passe) {
          const salt = await bcrypt.genSalt(10);
          user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.mot_de_passe && user.changed('mot_de_passe')) {
          const salt = await bcrypt.genSalt(10);
          user.mot_de_passe = await bcrypt.hash(user.mot_de_passe, salt);
        }
      }
    }
  });

  // Comparaison mot de passe
  User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.mot_de_passe);
  };



  // Définir la relation avec les tables etablissements et enseignants_disciplines
  User.associate = (models) => {
    User.belongsTo(models.Etablissement, {
      foreignKey: 'etablissement_id',
      as: 'Etablissement'
    });
    User.belongsToMany(models.Discipline, {
      through: models.EnseignantDiscipline,
      foreignKey: 'teacher_id',
      otherKey: 'discipline_id',
      as: 'disciplines'
    });
    User.hasMany(models.EnseignantDiscipline, {
      foreignKey: 'teacher_id',
      as: 'EnseignantDisciplines'
    });
  };

  return User;
};