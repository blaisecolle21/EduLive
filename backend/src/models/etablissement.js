const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Etablissement = sequelize.define('Etablissement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    adresse: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    directeur: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    code_etablissement: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
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
    tableName: 'etablissements',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Définir la relation avec la table utilisateurs
  Etablissement.associate = (models) => {
    Etablissement.hasMany(models.User, {
      foreignKey: 'etablissement_id',
      as: 'utilisateurs' // Alias pour la relation
    });
  };

  return Etablissement;
};