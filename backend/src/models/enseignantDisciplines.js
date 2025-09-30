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
    timestamps: true
  });

  return EnseignantDiscipline;
};