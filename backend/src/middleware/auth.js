const jwt = require("jsonwebtoken");
const { models } = require("../config/database");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Aucun token fourni." });
  }

  // 1. Vérification du JWT isolée — si ça échoue, c'est une vraie erreur d'auth
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error("❌ Token invalide/expiré:", error.message);
    return res.status(401).json({ error: "Token invalide ou expiré." });
  }

  // 2. Requête DB isolée — si ça échoue, c'est un problème technique, pas un problème de token

  try {
    // Récupérer l'utilisateur avec son rôle et ses permissions associées
    const user = await models.User.findByPk(decoded.id, {
      include: [
        {
          model: models.Role,
          as: "Role", // L'association Sequelize vers modèle Role
          include: [
            {
              model: models.Permission,
              as: "permissions", // L'association de la table pivot Role <=> Permission
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
    console.error(
      "❌ Erreur technique authMiddleware (DB injoignable ?):",
      error,
    );
    // 503, PAS 401 : le token était valide, c'est le serveur qui a un problème temporaire
    res.status(503).json({
      error: "Service temporairement indisponible. Veuillez réessayer.",
    });
  }
};

module.exports = authMiddleware;
