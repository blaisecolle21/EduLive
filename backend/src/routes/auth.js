const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const router = express.Router();
const { models } = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const emailService = require("../services/emailService");
const rateLimit = require("express-rate-limit");

// Route d'inscription publique (accessible à tous)
router.post("/register", async (req, res) => {
  try {
    const { nom, prenoms, email, mot_de_passe, etablissement_id, telephone } =
      req.body;
    // ⚠️ role_id n'est plus extrait de req.body — il est fixé côté serveur

    const existingUser = await models.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    const ROLE_ENSEIGNANT_ID = 2; // seul rôle autorisé via inscription publique

    const user = await models.User.create({
      nom,
      prenoms,
      email,
      mot_de_passe,
      role_id: ROLE_ENSEIGNANT_ID, // toujours forcé, jamais depuis req.body
      etablissement_id,
      telephone,
      est_actif: false,
    });

    res.status(201).json({
      message:
        "Demande d'inscription enregistrée. En attente de validation par l'administrateur.",
      user: { id: user.id, email: user.email, role_id: user.role_id },
    });
  } catch (error) {
    console.error("❌ Erreur inscription:", error);
    res.status(400).json({
      error: "Erreur lors de l'inscription. Vérifiez vos informations.",
    });
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de tentatives de connexion. Veuillez réessayer plus tard.",
  },
});
// ==========================================
// 2. ROUTE DE CONNEXION (DISTRIBUTION RBAC)
// ==========================================
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, mot_de_passe, rememberMe } = req.body;

    // Trouver l'utilisateur EN INCLUANT son Rôle et ses Permissions
    const user = await models.User.findOne({
      where: { email },
      include: [
        {
          model: models.Role,
          as: "Role",
          include: [
            {
              model: models.Permission,
              as: "permissions",
              attributes: ["name"],
              through: { attributes: [] }, // Masque les champs de la table pivot
            },
          ],
        },
      ],
    });

    if (!user) {
      return res
        .status(401)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    // Vérifier le mot de passe via la méthode du prototype
    const isValid = await user.validPassword(mot_de_passe);
    if (!isValid) {
      return res
        .status(401)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    // Blocage si le compte n'est pas encore validé par l'admin
    if (!user.est_actif) {
      return res.status(403).json({
        error:
          "Votre compte est en attente de validation par l'administrateur.",
      });
    }

    // Mettre à jour la date de dernière connexion
    await user.update({ derniere_connexion: new Date() });

    // Extraction et mise à plat des permissions pour le JWT
    const userPermissions =
      user.Role && user.Role.permissions
        ? user.Role.permissions.map((p) => p.name)
        : [];

    // Déterminer la durée de validité du token
    const expiresIn = rememberMe ? "7d" : "1h";

    // On injecte le tableau des permissions et le nom du rôle dans le JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.Role ? user.Role.name : null,
        permissions: userPermissions, // Nécessaire pour checkPermission.js
      },
      process.env.JWT_SECRET,
      { expiresIn },
    );

    // Préparer l'objet à renvoyer au frontend Vue.js
    const userResponse = {
      id: user.id,
      nom: user.nom,
      prenoms: user.prenoms,
      email: user.email,
      role_id: user.role_id,
      role: user.Role ? user.Role.name : null,
      permissions: userPermissions,
      etablissement_id: user.etablissement_id,
      telephone: user.telephone,
      est_actif: user.est_actif,
    };

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error("❌ Erreur login:", error);
    res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
  }
});

// Route pour demander un reset du mot de passe
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await models.User.findOne({ where: { email } });

    // Toujours la même réponse, que l'utilisateur existe ou non
    const genericMessage = {
      message:
        "Si cet email est enregistré, un lien de réinitialisation a été envoyé.",
    };

    if (!user) {
      return res.json(genericMessage);
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expire = new Date(Date.now() + 3600000); // 1h

    await user.update({
      token_reset: token,
      token_reset_expire: expire,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await emailService.envoyerMailReinitialisation(email, resetUrl);

    res.json({ genericMessage });
  } catch (error) {
    console.error("❌ Erreur forgot-password:", error);
    // Même en cas d'erreur interne, on ne révèle rien de spécifique
    res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
  }
});

// Route pour réinitialiser le mot de passe
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await models.User.findOne({
      where: {
        token_reset: token,
        token_reset_expire: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }

    await user.update({
      mot_de_passe: newPassword,
      token_reset: null,
      token_reset_expire: null,
    });

    res.json({ message: "Mot de passe réinitialisé" });
  } catch (error) {
    console.error("❌ Erreur reset-password:", error);
    res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
  }
});

module.exports = router;
