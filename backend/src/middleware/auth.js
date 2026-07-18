const jwt = require("jsonwebtoken");
const { models } = require("../config/database");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur avec son rôle et ses permissions associées
    const user = await models.User.findByPk(decoded.id, {
      include: [
        {
          model: models.Role,
          as: "Role", // L'association Sequelize vers ton modèle Role
          include: [
            {
              model: models.Permission,
              as: "permissions", // L'association de ta table pivot Role <=> Permission
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable." });
    }

    // On reconstruit req.user en utilisant strictement le role_id de la base de données
    req.user = {
      id: user.id,
      email: user.email,
      role_id: user.role_id, // Utilisation de role_id (ex: 1 pour admin, 2 pour enseignant)
      role_nom: user.Role?.name || user.Role?.nom || "", // Optionnel : pour garder le nom lisible
      permissions: user.Role?.permissions?.map((p) => p.name) || [],
    };

    next();
  } catch (error) {
    console.error("❌ Erreur authMiddleware:", error);
    res.status(401).json({ error: "Token invalide ou expiré." });
  }
};

module.exports = authMiddleware;
