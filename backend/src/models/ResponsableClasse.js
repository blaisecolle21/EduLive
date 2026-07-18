// models/ResponsableClasse.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ResponsableClasse = sequelize.define(
    "ResponsableClasse",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "utilisateurs", key: "id" },
      },
      classe_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "s_classes", key: "id" },
      },
    },
    {
      tableName: "responsable_classe",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  ResponsableClasse.associate = (models) => {
    ResponsableClasse.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "responsable",
    });
    ResponsableClasse.belongsTo(models.Classe, {
      foreignKey: "classe_id",
      as: "classe",
    });
  };

  return ResponsableClasse;
};
