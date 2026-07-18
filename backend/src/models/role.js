const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "roles",
      timestamps: false, // Pas besoin de created_at/updated_at pour les rôles de base
      underscored: true,
    },
  );

  Role.associate = (models) => {
    // Un rôle peut être attribué à plusieurs utilisateurs
    Role.hasMany(models.User, {
      foreignKey: "role_id",
      as: "utilisateurs",
    });

    // Relation N:N (Plusieurs à Plusieurs) avec Permission via la table pivot role_permissions
    Role.belongsToMany(models.Permission, {
      through: models.RolePermission, // On passe le modèle Sequelize directement ici
      foreignKey: "role_id",
      otherKey: "permission_id",
      as: "permissions",
    });
  };

  return Role;
};
