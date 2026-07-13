const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const router = express.Router();
const { models } = require("../config/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const emailService = require("../services/emailService");

// Route d'inscription
router.post("/register", async (req, res) => {
  try {
    const {
      nom,
      prenoms,
      email,
      mot_de_passe,
      role,
      etablissement_id,
      telephone,
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await models.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    // Créer l'utilisateur (mot_de_passe sera hashé via le hook)
    const user = await models.User.create({
      nom,
      prenoms,
      email,
      mot_de_passe,
      role,
      etablissement_id,
      telephone,
      est_actif: false, // Par défaut, l'utilisateur n'est pas actif
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route de connexion
router.post("/login", async (req, res) => {
  console.log("req.body:", req.body); // Débogage

  try {
    const { email, mot_de_passe, rememberMe } = req.body;

    // Trouver l'utilisateur
    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ error: "Email ou mot de passe incorrect." });
    }

    // Vérifier le mot de passe
    const isValid = await user.validPassword(mot_de_passe);
    if (!isValid) {
      return res
        .status(401)
        .json({ error: "Email ou mot de passe incorrect." });
    }
    // Vérification de validation du compte

    if (!user.est_actif) {
      return res.status(403).json({
        error: "Votre compte est désactivé ou en attente de validation.",
      });
    }

    // Mettre à jour la dernière connexion
    await user.update({ derniere_connexion: new Date() });

    // Générer le token JWT

    const expiresIn = rememberMe ? "7d" : "1h"; // 7 jours si "se souvenir de moi"
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn },
    );
    // Préparer l'objet user à renvoyer (exclure mot_de_passe)
    const userResponse = {
      id: user.id,
      nom: user.nom,
      prenoms: user.prenoms,
      email: user.email,
      role: user.role,
      etablissement_id: user.etablissement_id,
      telephone: user.telephone,
      est_actif: user.est_actif,
    };

    console.log("JWT_SECRET:", process.env.JWT_SECRET);
    console.log("Token généré:", token);

    res.json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour demander un reset du mot de passe
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await models.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    const token = crypto.randomBytes(20).toString("hex");
    const expire = new Date(Date.now() + 3600000); // 1h

    await user.update({
      token_reset: token,
      token_reset_expire: expire,
    });

    const resetUrl = `http://localhost:5173/reset-password/${token}`;

    await emailService.envoyerMailReinitialisation(email, resetUrl);

    res.json({ message: "Email de réinitialisation envoyé" });
  } catch (error) {
    console.error("Erreur envoi email:", error);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email" });
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
