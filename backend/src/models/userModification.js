// models/UserModification.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserModification = sequelize.define('UserModification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'utilisateurs', // table User
                key: 'id'
            }
        },
        champ: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        ancienne_valeur: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        nouvelle_valeur: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        statut: {
            type: DataTypes.ENUM('en attente', 'validé', 'refusé'),
            defaultValue: 'en attente'
        },
        commentaire_admin: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW
        }
    }, {
        tableName: 'user_modifications',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    // Relation avec User
    UserModification.associate = (models) => {
        UserModification.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return UserModification;
};
