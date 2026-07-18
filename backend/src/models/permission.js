const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Permission = sequelize.define(
    "Permission",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "permissions",
      timestamps: false,
      underscored: true,
    },
  );

  Permission.associate = (models) => {
    // Relation N:N avec Role via la table pivot
    Permission.belongsToMany(models.Role, {
      through: models.RolePermission, // On passe maintenant le modèle Sequelize directement ici
      foreignKey: "permission_id",
      otherKey: "role_id",
      as: "roles",
    });
  };

  return Permission;
};
