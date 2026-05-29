// models/enseignantDiscipline.js
module.exports = (sequelize, DataTypes) => {
  const EnseignantDiscipline = sequelize.define('EnseignantDiscipline', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    teacher_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'utilisateurs',
        key: 'id'
      }
    },
    discipline_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'disciplines',
        key: 'id'
      }
    }
  }, {
    tableName: 'enseignants_disciplines',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  EnseignantDiscipline.associate = (models) => {
    EnseignantDiscipline.belongsTo(models.User, {
      foreignKey: 'teacher_id',
      as: 'User'
    });
    EnseignantDiscipline.belongsTo(models.Discipline, {
      foreignKey: 'discipline_id',
      as: 'Discipline'
    });
  };

  return EnseignantDiscipline;
};