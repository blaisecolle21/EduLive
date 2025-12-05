// models/cahierEntryDeleted.js
module.exports = (sequelize, DataTypes) => {
  const CahierEntryDeleted = sequelize.define('CahierEntryDeleted', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    original_entry_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    discipline_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date_cours: DataTypes.DATEONLY,
    duree: DataTypes.INTEGER,
    contenu: DataTypes.TEXT,
    activites: DataTypes.TEXT,
    activites_status: DataTypes.JSON,
    taux_prevu_programme: DataTypes.DECIMAL(5, 2),
    deleted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_by: DataTypes.INTEGER
  }, {
    tableName: 'cahier_entries_deleted',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
  });

  return CahierEntryDeleted;
};