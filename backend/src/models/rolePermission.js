const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const RolePermission = sequelize.define(
    "RolePermission",
    {
      role_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "roles",
          key: "id",
        },
      },
      permission_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: {
          model: "permissions",
          key: "id",
        },
      },
    },
    {
      tableName: "role_permissions",
      timestamps: false, // Pas besoin d'historique de dates pour les liaisons
      underscored: true,
    },
  );

  return RolePermission;
};
