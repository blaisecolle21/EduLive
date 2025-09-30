const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnneeAcademique = sequelize.define('AnneeAcademique', {
    libelle: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    date_debut: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    date_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    est_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'annees_academiques',
    timestamps: true,
    underscored: true
  });

  return AnneeAcademique;
};