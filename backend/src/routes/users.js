const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission"); // Import du nouveau middleware
const { models } = require("../config/database");

// ==========================================
// 1. LISTER LES UTILISATEURS
// ==========================================
router.get(
  "/",
  authMiddleware,
  checkPermission("users:list"), // Remplace isAdmin
  async (req, res) => {
    try {
      const where = {};
      if (req.query.est_actif !== undefined)
        where.est_actif = req.query.est_actif === "true";
      if (req.query.est_valide !== undefined)
        where.est_valide = req.query.est_valide === "true";

      const users = await models.User.findAll({
        where,
        attributes: [
          "id",
          "nom",
          "prenoms",
          "email",
          "role_id", // Utilisation de role_id
          "etablissement_id",
          "est_actif",
          "derniere_connexion",
          "telephone",
        ],
        include: [
          {
            model: models.Etablissement,
            as: "Etablissement",
            attributes: ["nom"],
          },
          {
            model: models.Role,
            as: "Role",
            attributes: ["name"],
          },
        ],
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ==========================================
// 2. METTRE À JOUR UN UTILISATEUR
// ==========================================
router.put(
  "/:id",
  authMiddleware,
  checkPermission("users:update"), // Remplace isAdmin
  async (req, res) => {
    try {
      const user = await models.User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      await user.update(req.body);
      res.json({ message: "Utilisateur mis à jour" });
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ==========================================
// 3. SUPPRIMER UN UTILISATEUR
// ==========================================
router.delete(
  "/:id",
  authMiddleware,
  checkPermission("users:delete"), // Remplace isAdmin
  async (req, res) => {
    try {
      const user = await models.User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      await user.destroy();
      res.json({ message: "Utilisateur supprimé" });
    } catch (error) {
      console.error("Erreur suppression:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ==========================================
// 4. PROFIL PERSONNEL (ACCESSIBLE À TOUS LES CONNECTÉS)
// ==========================================
router.get(
  "/me",
  authMiddleware, // Seule l'authentification est requise ici
  async (req, res) => {
    try {
      const user = await models.User.findByPk(req.user.id, {
        attributes: [
          "id",
          "nom",
          "prenoms",
          "email",
          "role_id",
          "etablissement_id",
          "est_actif",
          "derniere_connexion",
          "telephone",
        ],
        include: [
          {
            model: models.Role,
            as: "Role",
            attributes: ["name"],
          },
        ],
      });
      if (!user)
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ==========================================
// 5. ACTIVER / VALIDER UN COMPTE CANDIDAT
// ==========================================
router.post(
  "/:id/activate",
  authMiddleware,
  checkPermission("users:validate"), // Remplace isAdmin
  async (req, res) => {
    try {
      const user = await models.User.findByPk(req.params.id);
      if (!user)
        return res.status(404).json({ error: "Utilisateur introuvable" });

      await user.update({ est_actif: true, est_valide: true });
      res.json({ message: "Utilisateur activé avec succès" });
    } catch (error) {
      console.error("Erreur activation utilisateur:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ==========================================
// 6. DÉSACTIVER / BLOQUER UN COMPTE
// ==========================================
router.post(
  "/:id/deactivate",
  authMiddleware,
  checkPermission("users:validate"), // Remplace isAdmin
  async (req, res) => {
    try {
      const user = await models.User.findByPk(req.params.id);
      if (!user)
        return res.status(404).json({ error: "Utilisateur introuvable" });

      await user.update({ est_actif: false });
      res.json({ message: "Utilisateur désactivé avec succès" });
    } catch (error) {
      console.error("Erreur désactivation utilisateur:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ==========================================
// 7. CRÉER UN UTILISATEUR DIRECTEMENT (ADMIN)
// ==========================================
router.post(
  "/",
  authMiddleware,
  checkPermission("users:create"),
  async (req, res) => {
    try {
      const {
        nom,
        prenoms,
        email,
        mot_de_passe,
        role_id,
        etablissement_id,
        telephone,
      } = req.body;

      if (
        !nom ||
        !prenoms ||
        !email ||
        !mot_de_passe ||
        !role_id ||
        !etablissement_id
      ) {
        return res
          .status(400)
          .json({ error: "Champs obligatoires manquants." });
      }

      const existing = await models.User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: "Cet email est déjà utilisé." });
      }

      const user = await models.User.create({
        nom,
        prenoms,
        email,
        mot_de_passe,
        role_id,
        etablissement_id,
        telephone,
        est_actif: true, // créé directement par l'admin, pas de validation à attendre
        est_valide: true,
      });

      res.status(201).json({
        message: "Utilisateur créé avec succès",
        user: { id: user.id, email: user.email, role_id: user.role_id },
      });
    } catch (error) {
      console.error("❌ Erreur création utilisateur:", error);
      res
        .status(500)
        .json({ error: "Erreur lors de la création de l'utilisateur." });
    }
  },
);

module.exports = router;
