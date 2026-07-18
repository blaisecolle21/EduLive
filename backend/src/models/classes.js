// models/classe.js
module.exports = (sequelize, DataTypes) => {
  const Classe = sequelize.define(
    "Classe",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nom: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      promotion: {
        type: DataTypes.ENUM(
          "6e",
          "5e",
          "4e",
          "3e",
          "2nde AB",
          "2nde C",
          "2nde D",
          "1ere AB",
          "1ere C",
          "1ere D",
          "Tle A1",
          "Tle A2-B",
          "Tle C",
          "Tle D",
        ),
        allowNull: false,
      },
      niveau: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
    },
    {
      tableName: "s_classes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    },
  );

  Classe.associate = (models) => {
    Classe.hasMany(models.Discipline, {
      foreignKey: "classe_id",
      as: "Disciplines",
    });

    Classe.hasOne(models.ResponsableClasse, {
      foreignKey: "classe_id",
      as: "ResponsableClasse",
    });
  };
  return Classe;
};
