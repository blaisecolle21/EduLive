const express = require("express");
const router = express.Router();
const { models } = require("../config/database");
const authMiddleware = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission"); // MODIFICATION : Import du middleware RBAC
const progressionAnalyzer = require("../services/progressionAnalyzer");
const emailService = require("../services/emailService");
const { Op } = require("sequelize");

// ============================================================
// 1. RÉCUPÉRER LES NOTIFICATIONS DE L'ENSEIGNANT CONNECTÉ
// ============================================================
router.get(
  "/enseignant",
  authMiddleware,
  checkPermission("notifications:read"),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0, non_lues_seulement = false } = req.query;

      const where = { enseignant_id: req.user.id };
      if (non_lues_seulement === "true") {
        where.est_lue = false;
      }

      const notifications = await models.Notification.findAll({
        where,
        include: [
          {
            model: models.Classe,
            as: "classe",
            attributes: ["id", "nom", "promotion"],
          },
          {
            model: models.Discipline,
            as: "discipline",
            attributes: ["id", "nom"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const total = await models.Notification.count({ where });

      res.json({
        notifications,
        total,
        non_lues: await models.Notification.count({
          where: { ...where, est_lue: false },
        }),
      });
    } catch (error) {
      console.error("❌ Erreur récupération notifications:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ============================================================
// 2. RÉCUPÉRER TOUTES LES NOTIFICATIONS (EXCLUSIF ADMIN)
// ============================================================
router.get(
  "/admin/toutes",
  authMiddleware,
  checkPermission("notifications:view-all"),
  async (req, res) => {
    try {
      const { limit = 100, offset = 0, enseignant_id, categorie } = req.query;

      const where = {};
      if (enseignant_id) where.enseignant_id = enseignant_id;
      if (categorie) where.categorie = categorie;

      const notifications = await models.Notification.findAll({
        where,
        include: [
          {
            model: models.User,
            as: "enseignant",
            attributes: ["id", "nom", "prenoms", "email"],
          },
          {
            model: models.Classe,
            as: "classe",
            attributes: ["id", "nom", "promotion"],
          },
          {
            model: models.Discipline,
            as: "discipline",
            attributes: ["id", "nom"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      const total = await models.Notification.count({ where });
      res.json({ notifications, total });
    } catch (error) {
      console.error("❌ Erreur récupération notifications admin:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ============================================================
// 3. MARQUER UNE NOTIFICATION COMME LUE (CONTEXTUEL)
// ============================================================
router.put(
  "/:id/marquer-lue",
  authMiddleware,
  checkPermission("notifications:read"),
  async (req, res) => {
    try {
      const notification = await models.Notification.findByPk(req.params.id);

      if (!notification) {
        return res.status(404).json({ error: "Notification introuvable" });
      }

      // MODIFICATION : Vérification contextuelle de propriété de la donnée (ABAC)
      // On autorise la modification si c'est la sienne OU s'il possède le pouvoir de tout voir (Admin)
      const hasViewAllPermission =
        req.user.permissions &&
        req.user.permissions.includes("notifications:view-all");

      if (notification.enseignant_id !== req.user.id && !hasViewAllPermission) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      await notification.update({
        est_lue: true,
        date_lecture: new Date(),
      });

      res.json({ message: "Notification marquée comme lue", notification });
    } catch (error) {
      console.error("❌ Erreur marquage notification:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ============================================================
// 4. ENVOYER DES NOTIFICATIONS ET EMAILS (EXCLUSIF ADMIN)
// ============================================================
router.post(
  "/admin/envoyer",
  authMiddleware,
  checkPermission("notifications:manage"),
  async (req, res) => {
    try {
      const {
        type_envoi,
        message_personnalise,
        titre_personnalise,
        enseignants_cibles = [],
      } = req.body;

      console.log("📨 Envoi de notifications:", type_envoi);

      let enseignants = [];
      let notificationsCreees = [];

      if (type_envoi === "personnalisé") {
        if (!enseignants_cibles || enseignants_cibles.length === 0) {
          return res
            .status(400)
            .json({ error: "Aucun enseignant sélectionné" });
        }

        enseignants = await models.User.findAll({
          where: {
            id: { [Op.in]: enseignants_cibles },
            role_id: 2, // Ici 'role_id' sert de filtre de données métier, pas de barrière d'accès
          },
        });

        for (const enseignant of enseignants) {
          const notification = await models.Notification.create({
            enseignant_id: enseignant.id,
            type: "admin_personnalisée",
            categorie: "info",
            titre: titre_personnalise || "Message de l'administration",
            message: message_personnalise,
            email_envoye: false,
          });

          notificationsCreees.push(notification);

          const emailEnvoye = await emailService.envoyerMessagePersonnalise(
            [enseignant],
            titre_personnalise || "Message de l'administration",
            message_personnalise,
            `${req.user.prenoms} ${req.user.nom}`,
          );

          if (emailEnvoye[0]?.success) {
            await notification.update({
              email_envoye: true,
              date_envoi_email: new Date(),
            });
          }
        }
      } else {
        enseignants = await models.User.findAll({
          where: { role_id: 2, est_actif: true },
          include: [
            {
              model: models.EnseignantDiscipline,
              as: "EnseignantDisciplines",
              include: [
                {
                  model: models.Discipline,
                  as: "Discipline",
                  include: [{ model: models.Classe, as: "Classe" }],
                },
              ],
            },
          ],
        });

        for (const enseignant of enseignants) {
          for (const ed of enseignant.EnseignantDisciplines) {
            const discipline = ed.Discipline;
            const classe = discipline.Classe;

            try {
              const analyse = await progressionAnalyzer.analyserProgression(
                enseignant.id,
                classe.id,
                discipline.id,
              );

              let doitEnvoyer = false;

              if (type_envoi === "tous") {
                doitEnvoyer = true;
              } else if (type_envoi === "retard_excessif") {
                doitEnvoyer = ["alerte", "critique"].includes(
                  analyse.categorie,
                );
              } else if (type_envoi === "avance_excessive") {
                doitEnvoyer = analyse.categorie === "avance_excessive";
              }

              if (doitEnvoyer) {
                const notification = await models.Notification.create({
                  enseignant_id: enseignant.id,
                  type: type_envoi === "tous" ? "admin_global" : "admin_ciblée",
                  categorie: analyse.categorie,
                  titre: analyse.titre,
                  message: analyse.message,
                  classe_id: classe.id,
                  discipline_id: discipline.id,
                  progression_actuelle: analyse.progression_actuelle,
                  ecart_jours: analyse.ecart_jours,
                  semaine_attendue: analyse.semaine_attendue,
                  mois_attendu: analyse.mois_attendu,
                  probleme_chronologie: analyse.probleme_chronologie,
                  details_chronologie: analyse.details_chronologie,
                  email_envoye: false,
                });

                notificationsCreees.push(notification);

                const emailEnvoye = await emailService.envoyerNotification(
                  enseignant,
                  notification,
                );

                if (emailEnvoye) {
                  await notification.update({
                    email_envoye: true,
                    date_envoi_email: new Date(),
                  });
                }
              }
            } catch (error) {
              console.error(
                `❌ Erreur analyse enseignant ${enseignant.id}:`,
                error,
              );
            }
          }
        }
      }

      await models.NotificationEnvoiAdmin.create({
        admin_id: req.user.id,
        type_envoi,
        message_personnalise:
          type_envoi === "personnalisé" ? message_personnalise : null,
        enseignants_cibles:
          type_envoi === "personnalisé" ? enseignants_cibles : null,
        nombre_envois: notificationsCreees.length,
      });

      res.json({
        message: "Notifications envoyées avec succès",
        nombre_notifications: notificationsCreees.length,
        enseignants_notifies: enseignants.length,
      });
    } catch (error) {
      console.error("❌ Erreur envoi notifications:", error);
      res.status(500).json({
        error: "Erreur lors de l'envoi des notifications",
        details: error.message,
      });
    }
  },
);

// ============================================================
// 5. CRÉER UNE NOTIFICATION AUTOMATIQUE APPRÈS AJOUT D'ENTRÉE
// ============================================================
router.post(
  "/auto-progression",
  authMiddleware,
  checkPermission("notifications:auto-generate"),
  async (req, res) => {
    try {
      const { enseignant_id, classe_id, discipline_id } = req.body;

      console.log("🔔 Création notification auto-progression");

      const analyse = await progressionAnalyzer.analyserProgression(
        enseignant_id,
        classe_id,
        discipline_id,
      );

      const notification = await models.Notification.create({
        enseignant_id,
        type: "auto_progression",
        categorie: analyse.categorie,
        titre: analyse.titre,
        message: analyse.message,
        classe_id,
        discipline_id,
        progression_actuelle: analyse.progression_actuelle,
        ecart_jours: analyse.ecart_jours,
        semaine_attendue: analyse.semaine_attendue,
        mois_attendu: analyse.mois_attendu,
        probleme_chronologie: analyse.probleme_chronologie,
        details_chronologie: analyse.details_chronologie,
        email_envoye: false,
      });

      res.json({ message: "Notification créée", notification });
    } catch (error) {
      console.error("❌ Erreur création notification auto:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ============================================================
// 6. STATISTIQUES DES NOTIFICATIONS (EXCLUSIF ADMIN)
// ============================================================
router.get(
  "/statistiques",
  authMiddleware,
  checkPermission("notifications:view-all"),
  async (req, res) => {
    try {
      const stats = {
        total: await models.Notification.count(),
        par_categorie: {},
        par_type: {},
        non_lues: await models.Notification.count({
          where: { est_lue: false },
        }),
        emails_envoyes: await models.Notification.count({
          where: { email_envoye: true },
        }),
      };

      const categories = [
        "felicitations",
        "encouragement",
        "avertissement",
        "alerte",
        "critique",
        "avance_excessive",
        "info",
      ];
      for (const cat of categories) {
        stats.par_categorie[cat] = await models.Notification.count({
          where: { categorie: cat },
        });
      }

      const types = [
        "auto_progression",
        "admin_global",
        "admin_ciblée",
        "admin_personnalisée",
      ];
      for (const type of types) {
        stats.par_type[type] = await models.Notification.count({
          where: { type },
        });
      }

      res.json(stats);
    } catch (error) {
      console.error("❌ Erreur statistiques:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

module.exports = router;
