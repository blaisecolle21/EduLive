// models/disciplines.js
module.exports = (sequelize, DataTypes) => {
  const Discipline = sequelize.define('Discipline', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nom: {
      type: DataTypes.ENUM('PCT', 'Mathématiques', 'SVT', 'Histoire-Géographie', 'Français', 'Anglais', 'Lecture', 'Communication écrite', 'Philosophie'),
      allowNull: false
    },
    classe_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 's_classes',
        key: 'id'
      }
    },
    coefficient: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      defaultValue: 1.0
    },
    heures_par_semaine: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4
    }
  }, {
    tableName: 'disciplines',
    timestamps: true,
    createdAt: 'created_at', // Mappe createdAt au champ existant created_at
    updatedAt: 'updated_at' // Mappe updatedAt au champ existant updated_at
  });

  Discipline.associate = (models) => {
    Discipline.belongsTo(models.Classe, {
      foreignKey: 'classe_id',
      as: 'Classe' // Alias défini ici, doit correspondre à l'inclusion
    });
    Discipline.belongsToMany(models.User, {
      through: models.EnseignantDiscipline,
      foreignKey: 'discipline_id',
      otherKey: 'teacher_id'
    });
      // AJOUTE CETTE ASSOCIATION :
    Discipline.hasMany(models.EnseignantDiscipline, {
      foreignKey: 'discipline_id',
      as: 'EnseignantDisciplines'
    });
  };

  return Discipline;
};