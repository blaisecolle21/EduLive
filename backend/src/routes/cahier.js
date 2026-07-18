const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const { models } = require("../config/database");
const { Op } = require("sequelize");
const progressionAnalyzer = require("../services/progressionAnalyzer");

// ============================================================
// 1. LISTER TOUTES LES CLASSES (ADMIN & ENSEIGNANT)
// ============================================================
router.get(
  "/classes",
  authMiddleware,
  checkPermission("classes:list"),
  async (req, res) => {
    try {
      const classes = await models.Classe.findAll({
        attributes: ["id", "nom", "promotion", "niveau"],
      });
      res.json(classes);
    } catch (error) {
      console.error("Erreur récupération classes:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 2. AJOUTER UNE NOUVELLE CLASSE (EXCLUSIF ADMIN)
// ============================================================
router.post(
  "/classes",
  authMiddleware,
  checkPermission("classes:create"),
  async (req, res) => {
    try {
      const { nom, promotion, niveau } = req.body;
      console.log("Données reçues pour création:", { nom, promotion, niveau }); // Log pour débogage

      // Validation des champs
      if (!nom || !promotion || !niveau) {
        return res.status(400).json({
          error: "Tous les champs (nom, promotion, niveau) sont requis.",
        });
      }

      // Création de la classe
      const newClass = await models.Classe.create({ nom, promotion, niveau });
      console.log("Classe créée avec succès:", newClass.toJSON()); // Log pour confirmer

      res.status(201).json(newClass); // Renvoie la nouvelle classe
    } catch (error) {
      console.error("Erreur création classe:", error);
      // Vérifie les erreurs spécifiques de Sequelize
      if (error.name === "SequelizeValidationError") {
        return res
          .status(400)
          .json({ error: error.errors.map((e) => e.message).join(", ") });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 3. METTRE À JOUR UNE CLASSE (EXCLUSIF ADMIN)
// ============================================================
router.put(
  "/classes/:id",
  authMiddleware,
  checkPermission("classes:update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, promotion, niveau } = req.body;
      const classe = await models.Classe.findByPk(id);
      if (!classe) {
        return res.status(404).json({ error: "Classe non trouvée." });
      }
      await classe.update({ nom, promotion, niveau });
      res.json(classe); // Renvoie la classe mise à jour
    } catch (error) {
      console.error("Erreur mise à jour classe:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 4. SUPPRIMER UNE CLASSE (EXCLUSIF ADMIN)
// ============================================================
router.delete(
  "/classes/:id",
  authMiddleware,
  checkPermission("classes:delete"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await models.Classe.destroy({ where: { id } });
      if (deleted) {
        res.status(200).json({ message: "Classe supprimée avec succès." });
      } else {
        res.status(404).json({ error: "Classe non trouvée." });
      }
    } catch (error) {
      console.error("Erreur suppression classe:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 5. LISTER LES DISCIPLINES (ADMIN OU SÉCURISÉ ENSEIGNANT)
// ============================================================
router.get(
  "/disciplines",
  authMiddleware,
  checkPermission("disciplines:list"),
  async (req, res) => {
    try {
      const { classe_id } = req.query;
      const userId = req.user.id;

      // Déterminer dynamiquement si l'utilisateur a le droit global (l'admin possède disciplines:create)
      const hasGlobalAccess =
        req.user.permissions &&
        req.user.permissions.includes("disciplines:create");

      const includeClause = [];

      // Si ce n'est pas un admin, on restreint la recherche à ses seules matières assignées
      if (!hasGlobalAccess) {
        includeClause.push({
          model: models.EnseignantDiscipline,
          as: "EnseignantDisciplines",
          where: { teacher_id: userId },
          attributes: [],
        });
      }

      const disciplines = await models.Discipline.findAll({
        include: includeClause,
        where: classe_id ? { classe_id } : {},
      });

      res.json(disciplines);
    } catch (error) {
      console.error("Erreur récupération disciplines:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 6. AJOUTER UNE NOUVELLE DISCIPLINE (EXCLUSIF ADMIN)
// ============================================================
router.post(
  "/disciplines",
  authMiddleware, // Ajout du middleware d'authentification manquant
  checkPermission("disciplines:create"),
  async (req, res) => {
    try {
      const { nom, classe_id, coefficient, heures_par_semaine, teacher_ids } =
        req.body;

      const discipline = await models.Discipline.create({
        nom,
        classe_id,
        coefficient,
        heures_par_semaine,
      });

      if (teacher_ids && Array.isArray(teacher_ids)) {
        const associations = teacher_ids.map((teacher_id) => ({
          teacher_id,
          discipline_id: discipline.id,
        }));
        await models.EnseignantDiscipline.bulkCreate(associations);
      }

      res.status(201).json(discipline);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

// ============================================================
// 7. METTRE À JOUR UNE DISCIPLINE (EXCLUSIF ADMIN)
// ============================================================
router.put(
  "/disciplines/:id",
  authMiddleware,
  checkPermission("disciplines:update"), // Nettoyage de isTeacherOrAdmin en dur
  async (req, res) => {
    try {
      const { id } = req.params;
      const { nom, classe_id, coefficient, heures_par_semaine } = req.body;

      const discipline = await models.Discipline.findOne({
        where: { id: parseInt(id) },
      });

      if (!discipline) {
        return res.status(404).json({ error: "Discipline non trouvée." });
      }

      if (classe_id) {
        const classe = await models.Classe.findOne({
          where: { id: parseInt(classe_id) },
        });
        if (!classe) {
          return res.status(404).json({ error: "Classe non trouvée." });
        }
      }

      const updateData = {};
      if (nom !== undefined) updateData.nom = nom;
      if (classe_id !== undefined) updateData.classe_id = parseInt(classe_id);
      if (coefficient !== undefined)
        updateData.coefficient = parseFloat(coefficient);
      if (heures_par_semaine !== undefined)
        updateData.heures_par_semaine = parseInt(heures_par_semaine);

      await discipline.update(updateData);

      await discipline.reload({
        include: [{ model: models.Classe, as: "Classe" }],
      });

      res.json(discipline);
    } catch (error) {
      console.error("❌ Erreur mise à jour discipline:", error);
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          error: "Erreur de validation",
          details: error.errors.map((e) => e.message),
        });
      }
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 8. SUPPRIMER UNE DISCIPLINE (EXCLUSIF ADMIN)
// ============================================================
router.delete(
  "/disciplines/:id",
  authMiddleware,
  checkPermission("disciplines:delete"), // Nettoyage de isTeacherOrAdmin en dur
  async (req, res) => {
    try {
      const { id } = req.params;
      const discipline = await models.Discipline.findByPk(id);

      if (!discipline) {
        return res.status(404).json({ error: "Discipline non trouvée." });
      }

      await discipline.destroy();
      res.status(200).json({ message: "Discipline supprimée avec succès." });
    } catch (error) {
      console.error("Erreur suppression discipline:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 9. RÉCUPÉRER LES CLASSES ASSIGNÉES À UN ENSEIGNANT
// ============================================================
router.get(
  "/classes/teacher",
  authMiddleware,
  checkPermission("classes:list-assigned"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const classes = await models.Classe.findAll({
        include: [
          {
            model: models.Discipline,
            as: "Disciplines",
            required: true,
            include: [
              {
                model: models.EnseignantDiscipline,
                as: "EnseignantDisciplines",
                required: true,
                where: { teacher_id: userId },
                attributes: [],
              },
            ],
          },
        ],
        distinct: true,
      });

      res.json(classes);
    } catch (error) {
      console.error("Erreur récupération classes enseignant:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 10. LISTER LES ENSEIGNANTS ET LEURS COURS (EXCLUSIF ADMIN)
// ============================================================
router.get(
  "/enseignants",
  authMiddleware,
  checkPermission("teachers:list"),
  async (req, res) => {
    try {
      const enseignants = await models.User.findAll({
        where: { role_id: 2, est_actif: true }, // Filtre métier sur la table User
        attributes: ["id", "nom", "prenoms", "email"],
        include: [
          {
            model: models.EnseignantDiscipline,
            as: "EnseignantDisciplines",
            attributes: ["discipline_id"],
            include: [
              {
                model: models.Discipline,
                as: "Discipline",
                attributes: ["nom"],
                include: [
                  {
                    model: models.Classe,
                    as: "Classe",
                    attributes: ["nom", "promotion"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["nom", "ASC"]],
      });
      res.json(enseignants);
    } catch (error) {
      console.error("Erreur récupération enseignants:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 11. CRÉER UNE AFFECTATION (EXCLUSIF ADMIN)
// ============================================================
router.post(
  "/affectations",
  authMiddleware,
  checkPermission("affectations:create"),
  async (req, res) => {
    try {
      const {
        enseignant_id,
        discipline_nom,
        classe_id,
        coefficient,
        heures_par_semaine,
      } = req.body;

      const enseignant = await models.User.findByPk(enseignant_id);
      if (!enseignant || parseInt(enseignant.role_id) !== 2) {
        return res.status(400).json({ error: "Enseignant invalide" });
      }

      const classe = await models.Classe.findByPk(classe_id);
      if (!classe) {
        return res.status(404).json({ error: "Classe non trouvée" });
      }

      let discipline = await models.Discipline.findOne({
        where: { nom: discipline_nom, classe_id },
      });

      if (!discipline) {
        discipline = await models.Discipline.create({
          nom: discipline_nom,
          classe_id,
          coefficient: coefficient || 1.0,
          heures_par_semaine: heures_par_semaine || 4,
        });
      }

      const existingAffectation = await models.EnseignantDiscipline.findOne({
        where: { teacher_id: enseignant_id, discipline_id: discipline.id },
      });
      if (existingAffectation) {
        return res.status(400).json({ error: "Affectation déjà existante" });
      }

      const affectation = await models.EnseignantDiscipline.create({
        teacher_id: enseignant_id,
        discipline_id: discipline.id,
      });

      res
        .status(201)
        .json({ message: "Affectation créée avec succès", affectation });
    } catch (error) {
      console.error("Erreur création affectation:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 12. LISTER TOUTES LES AFFECTATIONS (EXCLUSIF ADMIN)
// ============================================================
router.get(
  "/affectations",
  authMiddleware,
  checkPermission("affectations:list"),
  async (req, res) => {
    try {
      const affectations = await models.EnseignantDiscipline.findAll({
        include: [
          {
            model: models.User,
            as: "User",
            attributes: ["id", "nom", "prenoms", "email"],
          },
          {
            model: models.Discipline,
            as: "Discipline",
            include: [
              {
                model: models.Classe,
                as: "Classe",
                attributes: ["id", "nom", "promotion"],
              },
            ],
          },
        ],
      });
      res.json(affectations);
    } catch (error) {
      console.error("Erreur récupération affectations:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 13. MODIFIER UNE AFFECTATION (EXCLUSIF ADMIN)
// ============================================================
router.put(
  "/affectations/:id",
  authMiddleware,
  checkPermission("affectations:update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { enseignant_id, discipline_id } = req.body;

      const affectation = await models.EnseignantDiscipline.findByPk(id);
      if (!affectation) {
        return res.status(404).json({ error: "Affectation non trouvée" });
      }

      const exists = await models.EnseignantDiscipline.findOne({
        where: {
          teacher_id: enseignant_id,
          discipline_id,
          id: { [Op.ne]: id },
        },
      });
      if (exists) {
        return res.status(400).json({ error: "Cette affectation existe déjà" });
      }

      await affectation.update({ teacher_id: enseignant_id, discipline_id });
      res.json({ message: "Affectation mise à jour", affectation });
    } catch (error) {
      console.error("Erreur mise à jour affectation:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 14. SUPPRIMER UNE AFFECTATION (EXCLUSIF ADMIN)
// ============================================================
router.delete(
  "/affectations/:id",
  authMiddleware,
  checkPermission("affectations:delete"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const affectation = await models.EnseignantDiscipline.findByPk(id);
      if (!affectation) {
        return res.status(404).json({ error: "Affectation non trouvée" });
      }
      await affectation.destroy();
      res.json({ message: "Affectation supprimée avec succès" });
    } catch (error) {
      console.error("Erreur suppression affectation:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 15. RÉCUPÉRER LES ENTRÉES DU CAHIER DE TEXTE (LECTURE SÉCURISÉE)
// ============================================================
router.get(
  "/cahier-entries",
  authMiddleware,
  checkPermission("cahier-entries:read"),
  async (req, res) => {
    try {
      const { classe_id } = req.query;
      const userId = req.user.id;

      // Déterminer dynamiquement si l'utilisateur a des droits globaux d'administrateur
      // (l'admin possède le droit d'affecter les profs "affectations:create")
      const hasGlobalAccess =
        req.user.permissions &&
        req.user.permissions.includes("affectations:create");

      // Si c'est un enseignant, il ne voit que ses fiches. S'il est admin, il voit tout.
      const whereClause = hasGlobalAccess ? {} : { teacher_id: userId };

      const includeOptions = [
        {
          model: models.Discipline,
          as: "discipline",
          attributes: ["id", "nom", "classe_id"],
          required: true,
          include: [
            {
              model: models.Classe,
              as: "Classe",
              attributes: ["id", "nom", "promotion"],
              required: true,
            },
          ],
        },
      ];

      if (classe_id) {
        includeOptions[0].include[0].where = { id: parseInt(classe_id) };
      }

      const entries = await models.CahierEntry.findAll({
        where: whereClause,
        include: includeOptions,
        order: [["date_cours", "DESC"]],
      });

      res.json(entries);
    } catch (error) {
      console.error("❌ Erreur récupération entrées cahier:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 16. CRÉER UNE NOUVELLE ENTRÉE DE SÉANCE (AVEC NOTIFICATION)
// ============================================================
router.post(
  "/cahier-entries",
  authMiddleware,
  checkPermission("cahier-entries:create"),
  async (req, res) => {
    try {
      const {
        discipline_id,
        sa_number,
        teacher_id,
        sa_name,
        activites,
        activites_status,
        contenu,
        date_cours,
        heure_debut,
        heure_fin,
        trimestre,
        mois,
        semaine_numero,
        annee_scolaire,
      } = req.body;

      if (
        !discipline_id ||
        !sa_number ||
        !date_cours ||
        !heure_debut ||
        !heure_fin
      ) {
        return res.status(400).json({ error: "Champs obligatoires manquants" });
      }

      const discipline = await models.Discipline.findByPk(discipline_id, {
        include: [{ model: models.Classe, as: "Classe" }],
      });

      if (!discipline) {
        return res.status(404).json({ error: "Discipline non trouvée" });
      }

      const classe = discipline.Classe;
      const normalizedSa = sa_number.replace(/\s+/g, "").toUpperCase();

      const programmes = await models.ProgramTheorique.findAll({
        where: {
          promotion: classe.promotion,
          discipline: discipline.nom,
          [Op.or]: [
            { sa: { [Op.like]: `%${normalizedSa}%` } },
            { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } },
          ],
        },
      });

      const lotsComplets = [];
      let tauxRealiseEntry = 0;

      const activitesEntry = activites
        .split("\n")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      programmes.forEach((prog) => {
        let activitesLot = [];
        try {
          activitesLot =
            typeof prog.activites === "string"
              ? JSON.parse(prog.activites)
              : Array.isArray(prog.activites)
                ? prog.activites
                : [];
        } catch (e) {
          activitesLot = [];
        }

        const activitesLotClean = activitesLot
          .filter((a) => a && a.trim().length > 0)
          .map((a) => a.trim());
        if (activitesLotClean.length === 0) return;

        const toutesLeActivitesDuLotSontFaites = activitesLotClean.every(
          (activite) =>
            activitesEntry.includes(activite) &&
            activites_status?.[activite] === "fait",
        );

        if (toutesLeActivitesDuLotSontFaites) {
          lotsComplets.push(prog.id);
          tauxRealiseEntry += parseFloat(prog.taux_prevu) || 0;
        }
      });

      // ==========================================================
      // NOUVELLE LOGIQUE : déterminer le statut selon l'auteur
      // ==========================================================
      const estResponsable = parseInt(req.user.role_id) === 3;
      const targetTeacherId = teacher_id || req.user.id;

      let statut = "validee";
      let soumisPar = null;
      let qrToken = null;

      if (estResponsable) {
        // Vérifier que le responsable a bien le droit d'agir pour cette classe
        const responsableClasse = await models.ResponsableClasse.findOne({
          where: { user_id: req.user.id, classe_id: classe.id },
        });

        if (!responsableClasse) {
          return res.status(403).json({
            error: "Vous n'êtes pas responsable de cette classe.",
          });
        }

        if (!teacher_id) {
          return res.status(400).json({
            error:
              "L'enseignant destinataire (teacher_id) est requis pour une soumission.",
          });
        }

        // Vérifier que l'enseignant ciblé est bien assigné à cette discipline
        const estAssigne = await models.EnseignantDiscipline.findOne({
          where: { teacher_id, discipline_id },
        });

        if (!estAssigne) {
          return res.status(400).json({
            error: "Cet enseignant n'est pas assigné à cette discipline.",
          });
        }

        statut = "en_attente";
        soumisPar = req.user.id;
        qrToken = require("crypto").randomBytes(32).toString("hex");
      }

      const entry = await models.CahierEntry.create({
        discipline_id,
        teacher_id: targetTeacherId,
        sa_number,
        sa_name,
        activites,
        activites_status,
        contenu,
        date_cours,
        heure_debut,
        heure_fin,
        trimestre,
        mois,
        semaine_numero,
        annee_scolaire,
        lots_activites_completes: lotsComplets,
        taux_realise_entry: tauxRealiseEntry,
        statut,
        soumis_par: soumisPar,
        qr_token: qrToken,
      });

      // La notification/progression ne se déclenche QUE si l'entrée est validée directement
      if (statut === "validee") {
        try {
          const analyse = await progressionAnalyzer.analyserProgression(
            entry.teacher_id,
            classe.id,
            discipline_id,
          );

          await models.Notification.create({
            enseignant_id: entry.teacher_id,
            type: "auto_progression",
            categorie: analyse.categorie,
            titre: analyse.titre,
            message: analyse.message,
            classe_id: classe.id,
            discipline_id: discipline_id,
            progression_actuelle: analyse.progression_actuelle,
            ecart_jours: analyse.ecart_jours,
            semaine_attendue: analyse.semaine_attendue,
            mois_attendu: analyse.mois_attendu,
            probleme_chronologie: analyse.probleme_chronologie,
            details_chronologie: analyse.details_chronologie,
            email_envoye: false,
          });
        } catch (notifError) {
          console.error(
            "⚠️ Erreur création notification (non bloquant):",
            notifError,
          );
        }
      }

      res.status(201).json({
        message:
          statut === "en_attente"
            ? "Entrée soumise pour validation"
            : "Entrée enregistrée avec succès",
        entry,
        tauxRealise: tauxRealiseEntry,
        lotsComplets: lotsComplets.length,
        notification_creee: statut === "validee",
      });
    } catch (error) {
      console.error("❌ Erreur création entrée:", error);
      res.status(500).json({
        error: "Erreur lors de la création de l'entrée",
        details: "Erreur serveur, veuillez réessayer.",
      });
      next(error);
    }
  },
);
// ============================================================
// 17. METTRE À JOUR UNE ENTRÉE EXISTANTE (AVEC HISTORISATION)
// ============================================================
router.put(
  "/cahier-entries/:id",
  authMiddleware,
  checkPermission("cahier-entries:update"), // Remplacement de isTeacherOrAdmin en dur
  async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await models.CahierEntry.findByPk(id, {
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            include: [{ model: models.Classe, as: "Classe" }],
          },
        ],
      });

      if (!entry) {
        return res.status(404).json({ error: "Entrée non trouvée" });
      }

      // Vérification contextuelle (ABAC)
      const hasGlobalAccess =
        req.user.permissions &&
        req.user.permissions.includes("affectations:create");
      if (entry.teacher_id !== req.user.id && !hasGlobalAccess) {
        return res
          .status(403)
          .json({ error: "Accès réservé à l'enseignant responsable" });
      }

      // SAUVEGARDER L'HISTORIQUE DE MODIFICATION
      try {
        const historyCount = await models.CahierEntryHistory.count({
          where: { cahier_entry_id: id },
        });

        await models.CahierEntryHistory.create({
          cahier_entry_id: id,
          version: historyCount + 1,
          discipline_id: entry.discipline_id,
          sa_number: entry.sa_number,
          sa_name: entry.sa_name,
          activites: entry.activites,
          activites_status: entry.activites_status,
          contenu: entry.contenu,
          date_cours: entry.date_cours,
          heure_debut: entry.heure_debut,
          heure_fin: entry.heure_fin,
          trimestre: entry.trimestre,
          mois: entry.mois,
          semaine_numero: entry.semaine_numero,
          annee_scolaire: entry.annee_scolaire,
          taux_prevu_programme: entry.taux_prevu_programme,
          modified_by: req.user.id,
          modified_at: new Date(),
        });
      } catch (histError) {
        console.warn(
          "⚠️ Erreur sauvegarde historique (non bloquant):",
          histError,
        );
      }

      const discipline = entry.discipline;
      const classe = discipline.Classe;
      const normalizedSa = req.body.sa_number.replace(/\s+/g, "").toUpperCase();

      const programmes = await models.ProgramTheorique.findAll({
        where: {
          promotion: classe.promotion,
          discipline: discipline.nom,
          [Op.or]: [
            { sa: { [Op.like]: `%${normalizedSa}%` } },
            { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } },
          ],
        },
      });

      const lotsComplets = [];
      let tauxRealiseEntry = 0;

      const activitesEntry = req.body.activites
        .split("\n")
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      programmes.forEach((prog) => {
        let activitesLot = [];
        try {
          if (typeof prog.activites === "string") {
            activitesLot = JSON.parse(prog.activites);
          } else if (Array.isArray(prog.activites)) {
            activitesLot = prog.activites;
          }
        } catch (e) {
          activitesLot = [];
        }

        const activitesLotClean = activitesLot
          .filter((a) => a && a.trim().length > 0)
          .map((a) => a.trim());

        if (activitesLotClean.length === 0) return;

        const toutesLeActivitesDuLotSontFaites = activitesLotClean.every(
          (activite) => {
            return (
              activitesEntry.includes(activite) &&
              req.body.activites_status?.[activite] === "fait"
            );
          },
        );

        if (toutesLeActivitesDuLotSontFaites) {
          lotsComplets.push(prog.id);
          tauxRealiseEntry += parseFloat(prog.taux_prevu) || 0;
        }
      });

      await entry.update({
        discipline_id: req.body.discipline_id,
        sa_number: req.body.sa_number,
        sa_name: req.body.sa_name,
        activites: req.body.activites,
        activites_status: req.body.activites_status,
        contenu: req.body.contenu,
        date_cours: req.body.date_cours,
        heure_debut: req.body.heure_debut,
        heure_fin: req.body.heure_fin,
        trimestre: req.body.trimestre,
        mois: req.body.mois,
        semaine_numero: req.body.semaine_numero,
        lots_activites_completes: lotsComplets,
        taux_realise_entry: tauxRealiseEntry,
      });

      // Recalcul et mise à jour de la notification de suivi
      try {
        const analyse = await progressionAnalyzer.analyserProgression(
          entry.teacher_id,
          classe.id,
          entry.discipline_id,
        );

        await models.Notification.create({
          enseignant_id: entry.teacher_id,
          type: "auto_progression",
          categorie: analyse.categorie,
          titre: "🔄 " + analyse.titre + " (Mise à jour)",
          message: `Suite à la modification de votre entrée de cahier :\n\n${analyse.message}`,
          classe_id: classe.id,
          discipline_id: entry.discipline_id,
          progression_actuelle: analyse.progression_actuelle,
          ecart_jours: analyse.ecart_jours,
          semaine_attendue: analyse.semaine_attendue,
          mois_attendu: analyse.mois_attendu,
          probleme_chronologie: analyse.probleme_chronologie,
          details_chronologie: analyse.details_chronologie,
          email_envoye: false,
        });
      } catch (notifError) {
        console.error(
          "⚠️ Erreur création notification (non bloquant):",
          notifError,
        );
      }

      res.json({
        message: "Entrée mise à jour avec succès",
        entry,
        tauxRealise: tauxRealiseEntry,
        lotsComplets: lotsComplets.length,
        notification_creee: true,
      });
    } catch (error) {
      console.error("❌ Erreur mise à jour entrée:", error);
      res.status(500).json({
        error: "Erreur lors de la mise à jour",
        details: "Erreur serveur, veuillez réessayer.",
      });
      next(error);
    }
  },
);
// ============================================================
// 18. SUPPRIMER UNE ENTRÉE DU CAHIER DE TEXTES
// ============================================================
router.delete(
  "/cahier-entries/:id",
  authMiddleware,
  checkPermission("cahier-entries:delete"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const entry = await models.CahierEntry.findByPk(id);

      if (!entry) {
        return res.status(404).json({ error: "Entrée non trouvée" });
      }

      // Vérification contextuelle (ABAC) : l'auteur ou un administrateur global
      const hasGlobalAccess =
        req.user.permissions &&
        req.user.permissions.includes("affectations:create");
      if (entry.teacher_id !== req.user.id && !hasGlobalAccess) {
        return res.status(403).json({
          error:
            "Accès réservé à l'enseignant responsable ou à l'administration",
        });
      }

      await entry.destroy();

      console.log("✅ Entrée supprimée:", id);
      res.json({ message: "Entrée supprimée avec succès" });
    } catch (error) {
      console.error("❌ Erreur suppression entrée:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 19. METTRE À JOUR LE STATUT D'UNE ACTIVITÉ SPÉCIFIQUE
// ============================================================
router.patch(
  "/cahier-entries/:id/activite-status",
  authMiddleware,
  checkPermission("cahier-entries:update"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { activite, status } = req.body;

      if (!activite || !status || !["en_cours", "fait"].includes(status)) {
        return res.status(400).json({
          error: "Paramètres invalides",
          required: { activite: "string", status: "en_cours | fait" },
        });
      }

      const entry = await models.CahierEntry.findByPk(id);

      if (!entry) {
        return res.status(404).json({ error: "Entrée non trouvée" });
      }

      // Vérification contextuelle (ABAC)
      const hasGlobalAccess =
        req.user.permissions &&
        req.user.permissions.includes("affectations:create");
      if (entry.teacher_id !== req.user.id && !hasGlobalAccess) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      // Mettre à jour le statut
      const currentStatus = entry.activites_status || {};
      currentStatus[activite] = status;

      await entry.update({ activites_status: currentStatus });

      console.log("✅ Statut activité mis à jour:", { activite, status });

      res.json({
        message: "Statut mis à jour",
        activites_status: currentStatus,
        pourcentage_realise: entry.pourcentage_realise,
      });
    } catch (error) {
      console.error("❌ Erreur mise à jour statut:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 20. RÉCUPÉRER L'HISTORIQUE DES MODIFICATIONS D'UNE ENTRÉE
// ============================================================
router.get(
  "/cahier-entries/:id/history",
  authMiddleware,
  checkPermission("cahier-entries:read"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const entry = await models.CahierEntry.findByPk(id);

      if (!entry) {
        return res.status(404).json({ error: "Entrée non trouvée" });
      }

      // Vérification contextuelle (ABAC)
      const hasGlobalAccess =
        req.user.permissions &&
        req.user.permissions.includes("affectations:create");
      if (entry.teacher_id !== req.user.id && !hasGlobalAccess) {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      // Vérifier si le modèle CahierEntryHistory existe dans votre instance Sequelize
      if (!models.CahierEntryHistory) {
        console.warn("⚠️ Modèle CahierEntryHistory non trouvé");
        return res.json([]);
      }

      const history = await models.CahierEntryHistory.findAll({
        where: { cahier_entry_id: id },
        order: [["version", "DESC"]],
      });

      res.json(history);
    } catch (error) {
      console.error("❌ Erreur récupération historique:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 21. RÉCUPÉRER LES ACTIVITÉS DU PROGRAMME THÉORIQUE POUR UNE SA
// ============================================================
router.get(
  "/programme-activites",
  authMiddleware,
  checkPermission("programmes:read"),
  async (req, res) => {
    try {
      const { classe_id, discipline_nom, sa_number } = req.query;

      console.log("📥 Requête activités programme théorique:", {
        classe_id,
        discipline_nom,
        sa_number,
      });

      if (!classe_id || !discipline_nom || !sa_number) {
        return res.status(400).json({
          error: "Paramètres manquants",
          required: ["classe_id", "discipline_nom", "sa_number"],
        });
      }

      // Récupérer la classe pour obtenir la promotion
      const classe = await models.Classe.findByPk(classe_id);
      if (!classe) {
        return res.status(404).json({ error: "Classe non trouvée" });
      }

      console.log(
        "🎯 Classe trouvée:",
        classe.nom,
        "- Promotion:",
        classe.promotion,
      );

      // Récupérer le programme théorique correspondant
      // Normaliser le numéro de SA (SA1, SA 1, etc.)
      const normalizedSa = sa_number.replace(/\s+/g, "").toUpperCase();

      const programmes = await models.ProgramTheorique.findAll({
        where: {
          promotion: classe.promotion,
          discipline: discipline_nom,
          [Op.or]: [
            { sa: { [Op.like]: `%${normalizedSa}%` } },
            { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } },
          ],
        },
        order: [
          ["semaine_numero", "ASC"],
          ["id", "ASC"],
        ],
        attributes: [
          "id",
          "activites",
          "sa",
          "situation_apprentissage",
          "semaine_numero",
          "import_batch_id",
        ],
      });

      console.log(
        `📚 ${programmes.length} programme(s) trouvé(s) pour ${normalizedSa}`,
      );

      if (!programmes.length) {
        return res.json({
          activites: [],
          saName: "",
          message: "Aucun programme trouvé",
        });
      }

      // Extraire toutes les activités (en évitant les doublons) et le taux prévu
      const activitesSet = new Set();
      let saName = "";
      let tauxPrevu = 0;

      programmes.forEach((prog) => {
        // Récupérer le nom de la SA
        if (!saName && prog.situation_apprentissage) {
          saName = prog.situation_apprentissage;
        }

        // ✅ Accumuler les taux prévus
        if (prog.taux_prevu) {
          tauxPrevu += parseFloat(prog.taux_prevu);
        }

        // Parser les activités (JSON ou string)
        let activites = [];
        try {
          if (typeof prog.activites === "string") {
            activites = JSON.parse(prog.activites);
          } else if (Array.isArray(prog.activites)) {
            activites = prog.activites;
          }
        } catch (e) {
          console.error("Erreur parsing activités:", e);
          activites = [];
        }

        // Ajouter chaque activité (sans doublons)
        activites.forEach((act) => {
          if (act && act.trim().length > 0) {
            activitesSet.add(act.trim());
          }
        });
      });

      const activitesList = Array.from(activitesSet);

      console.log(
        `✅ ${activitesList.length} activité(s) unique(s) extraite(s)`,
      );
      console.log(`📊 Taux prévu total: ${tauxPrevu}%`);

      res.json({
        activites: activitesList,
        saName: saName || "",
        taux_prevu: tauxPrevu,
        count: activitesList.length,
        programmes: programmes.length,
      });
    } catch (error) {
      console.error("❌ Erreur récupération activités programme:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 22. RÉCUPÉRER LES ACTIVITÉS EN EXCLUANT CELLES DÉJÀ ACCOMPLIES
// ============================================================
router.get(
  "/programme-activites-filtrees",
  authMiddleware,
  checkPermission("programmes:read"),
  async (req, res) => {
    try {
      const { classe_id, discipline_nom, sa_number, discipline_id } = req.query;

      console.log("📥 Requête activités filtrées:", {
        classe_id,
        discipline_nom,
        sa_number,
        discipline_id,
      });

      if (!classe_id || !discipline_nom || !sa_number || !discipline_id) {
        return res.status(400).json({
          error: "Paramètres manquants",
          required: [
            "classe_id",
            "discipline_nom",
            "sa_number",
            "discipline_id",
          ],
        });
      }

      const classe = await models.Classe.findByPk(classe_id);
      if (!classe) {
        return res.status(404).json({ error: "Classe non trouvée" });
      }

      const normalizedSa = sa_number.replace(/\s+/g, "").toUpperCase();

      const programmes = await models.ProgramTheorique.findAll({
        where: {
          promotion: classe.promotion,
          discipline: discipline_nom,
          [Op.or]: [
            { sa: { [Op.like]: `%${normalizedSa}%` } },
            { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } },
          ],
        },
        order: [
          ["semaine_numero", "ASC"],
          ["id", "ASC"],
        ],
        attributes: [
          "id",
          "activites",
          "sa",
          "situation_apprentissage",
          "semaine_numero",
          "taux_prevu",
        ],
      });

      if (!programmes.length) {
        return res.json({
          activites: [],
          saName: "",
          taux_prevu: 0,
          message: "Aucun programme trouvé",
        });
      }

      const activitesSet = new Set();
      let saName = "";
      let tauxPrevu = 0;

      programmes.forEach((prog) => {
        if (!saName && prog.situation_apprentissage) {
          saName = prog.situation_apprentissage;
        }
        if (prog.taux_prevu) {
          tauxPrevu += parseFloat(prog.taux_prevu);
        }

        let activites = [];
        try {
          if (typeof prog.activites === "string") {
            activites = JSON.parse(prog.activites);
          } else if (Array.isArray(prog.activites)) {
            activites = prog.activites;
          }
        } catch (e) {
          console.error("Erreur parsing activités:", e);
          activites = [];
        }

        activites.forEach((act) => {
          if (act && act.trim().length > 0) {
            activitesSet.add(act.trim());
          }
        });
      });

      // Récupérer toutes les fiches d'activités validées précédemment par l'enseignant connecté
      const previousEntries = await models.CahierEntry.findAll({
        where: {
          teacher_id: req.user.id,
          discipline_id: parseInt(discipline_id),
          sa_number: sa_number,
        },
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            where: { classe_id: parseInt(classe_id) },
            attributes: ["id", "nom"],
          },
        ],
        attributes: ["id", "activites_status"],
        order: [["created_at", "DESC"]],
      });

      const activitesFaites = new Set();
      const activitesEnCours = new Set();
      const activitesStatus = {};

      previousEntries.forEach((entry) => {
        if (entry.activites_status) {
          Object.entries(entry.activites_status).forEach(
            ([activite, status]) => {
              if (status === "fait") {
                activitesFaites.add(activite);
              } else if (status === "en_cours") {
                activitesEnCours.add(activite);
                activitesStatus[activite] = "en_cours";
              }
            },
          );
        }
      });

      const activitesFiltrees = Array.from(activitesSet).filter(
        (act) => !activitesFaites.has(act),
      );

      res.json({
        activites: activitesFiltrees,
        activitesStatus: activitesStatus,
        saName: saName || "",
        taux_prevu: tauxPrevu,
        count: activitesFiltrees.length,
        programmes: programmes.length,
        stats: {
          total: activitesSet.size,
          faites: activitesFaites.size,
          en_cours: activitesEnCours.size,
          disponibles: activitesFiltrees.length,
        },
      });
    } catch (error) {
      console.error("❌ Erreur récupération activités filtrées:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 23. AUDITER L'ENSEMBLE DES ENTRÉES (EXCLUSIF ADMIN)
// ============================================================
router.get(
  "/toutes-les-entrees-admin",
  authMiddleware,
  checkPermission("cahier-entries:read-all"), // Remplacement du contrôle de rôle en dur
  async (req, res) => {
    try {
      console.log(
        "📥 Admin: Récupération globale de toutes les entrées de fiches",
      );

      const entries = await models.CahierEntry.findAll({
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            attributes: ["id", "nom", "classe_id"],
            include: [
              {
                model: models.Classe,
                as: "Classe",
                attributes: ["id", "nom", "promotion", "niveau"],
              },
            ],
          },
          {
            model: models.User,
            as: "teacher",
            attributes: ["id", "nom", "prenoms", "email"],
          },
        ],
        order: [
          ["date_cours", "DESC"],
          ["created_at", "DESC"],
        ],
      });

      res.json(entries);
    } catch (error) {
      console.error("❌ Erreur récupération toutes les entrées:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 24. RÉCUPÉRER LES LOTS STRUCTURÉS DU PROGRAMME THÉORIQUE
// ============================================================
router.get(
  "/programme-lots",
  authMiddleware,
  checkPermission("programmes:read"),
  async (req, res) => {
    try {
      const { classe_id, discipline_nom, sa_number, discipline_id } = req.query;

      console.log("📥 Requête lots d'activités:", {
        classe_id,
        discipline_nom,
        sa_number,
      });

      if (!classe_id || !discipline_nom || !sa_number) {
        return res.status(400).json({
          error: "Paramètres manquants",
          required: ["classe_id", "discipline_nom", "sa_number"],
        });
      }

      const classe = await models.Classe.findByPk(classe_id);
      if (!classe) {
        return res.status(404).json({ error: "Classe non trouvée" });
      }

      const normalizedSa = sa_number.replace(/\s+/g, "").toUpperCase();

      const programmes = await models.ProgramTheorique.findAll({
        where: {
          promotion: classe.promotion,
          discipline: discipline_nom,
          [Op.or]: [
            { sa: { [Op.like]: `%${normalizedSa}%` } },
            { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } },
          ],
        },
        order: [
          ["semaine_numero", "ASC"],
          ["id", "ASC"],
        ],
        attributes: [
          "id",
          "activites",
          "sa",
          "situation_apprentissage",
          "taux_prevu",
          "semaine_numero",
        ],
      });

      if (!programmes.length) {
        return res.json({
          lots: [],
          saName: "",
          tauxTotal: 0,
          message: "Aucun programme trouvé",
        });
      }

      // Déterminer quels lots et activités sont déjà enregistrés comme complets/faits
      const previousEntries = await models.CahierEntry.findAll({
        where: {
          teacher_id: req.user.id,
          discipline_id: parseInt(discipline_id),
          sa_number: sa_number,
        },
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            where: { classe_id: parseInt(classe_id) },
            attributes: ["id"],
          },
        ],
        attributes: ["id", "lots_activites_completes", "activites_status"],
      });

      const lotsDejaComplets = new Set();
      const activitesDejaFaites = new Set();

      previousEntries.forEach((entry) => {
        if (
          entry.lots_activites_completes &&
          Array.isArray(entry.lots_activites_completes)
        ) {
          entry.lots_activites_completes.forEach((lotId) =>
            lotsDejaComplets.add(lotId),
          );
        }

        if (entry.activites_status) {
          Object.entries(entry.activites_status).forEach(
            ([activite, status]) => {
              if (status === "fait") {
                activitesDejaFaites.add(activite);
              }
            },
          );
        }
      });

      let saName = "";
      let tauxTotal = 0;
      const lots = [];

      programmes.forEach((prog) => {
        if (!saName && prog.situation_apprentissage) {
          saName = prog.situation_apprentissage;
        }

        let activites = [];
        try {
          if (typeof prog.activites === "string") {
            activites = JSON.parse(prog.activites);
          } else if (Array.isArray(prog.activites)) {
            activites = prog.activites;
          }
        } catch (e) {
          console.error("Erreur parsing activités:", e);
          activites = [];
        }

        const activitesClean = activites
          .filter((a) => a && a.trim().length > 0)
          .map((a) => a.trim());

        if (activitesClean.length === 0) return;

        const tauxPrevu = parseFloat(prog.taux_prevu) || 0;
        tauxTotal += tauxPrevu;

        const estComplet = lotsDejaComplets.has(prog.id);

        const activitesDisponibles = estComplet
          ? []
          : activitesClean.filter((a) => !activitesDejaFaites.has(a));

        lots.push({
          id: prog.id,
          activites: activitesClean,
          activitesDisponibles: activitesDisponibles,
          tauxPrevu: tauxPrevu,
          estComplet: estComplet,
          semaineNumero: prog.semaine_numero,
        });
      });

      res.json({
        lots: lots,
        saName: saName,
        tauxTotal: tauxTotal,
        lotsComplets: Array.from(lotsDejaComplets),
        stats: {
          totalLots: lots.length,
          lotsComplets: lotsDejaComplets.size,
          lotsDisponibles: lots.filter((l) => !l.estComplet).length,
        },
      });
    } catch (error) {
      console.error("❌ Erreur récupération lots:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 25. LISTER LES DISCIPLINES DE LA CLASSE DU RESPONSABLE
// ============================================================
router.get(
  "/responsable/disciplines",
  authMiddleware,
  checkPermission("classes:responsable"),
  async (req, res) => {
    try {
      const responsableClasse = await models.ResponsableClasse.findOne({
        where: { user_id: req.user.id },
      });

      if (!responsableClasse) {
        return res.status(404).json({
          error: "Aucune classe assignée à ce responsable.",
        });
      }

      const disciplines = await models.Discipline.findAll({
        where: { classe_id: responsableClasse.classe_id },
        include: [
          {
            model: models.EnseignantDiscipline,
            as: "EnseignantDisciplines",
            include: [
              {
                model: models.User,
                as: "User",
                attributes: ["id", "nom", "prenoms"],
              },
            ],
          },
        ],
      });

      res.json({
        classe_id: responsableClasse.classe_id,
        disciplines,
      });
    } catch (error) {
      console.error("❌ Erreur récupération disciplines responsable:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================================
// 26. LISTER LES ENTRÉES EN ATTENTE DE VALIDATION (ENSEIGNANT)
// ============================================================
router.get(
  "/cahier-entries/en-attente",
  authMiddleware,
  checkPermission("cahier-entries:validate"),
  async (req, res) => {
    try {
      const entries = await models.CahierEntry.findAll({
        where: {
          teacher_id: req.user.id,
          statut: "en_attente",
        },
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            include: [{ model: models.Classe, as: "Classe" }],
          },
          {
            model: models.User,
            as: "soumetteur",
            attributes: ["id", "nom", "prenoms"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.json(entries);
    } catch (error) {
      console.error("❌ Erreur récupération entrées en attente:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 27. VALIDER UNE ENTRÉE SOUMISE PAR UN RESPONSABLE
// ============================================================
router.patch(
  "/cahier-entries/:id/valider",
  authMiddleware,
  checkPermission("cahier-entries:validate"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const entry = await models.CahierEntry.findByPk(id, {
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            include: [{ model: models.Classe, as: "Classe" }],
          },
        ],
      });

      if (!entry) {
        return res.status(404).json({ error: "Entrée non trouvée" });
      }

      if (entry.statut !== "en_attente") {
        return res
          .status(400)
          .json({ error: "Cette entrée n'est pas en attente de validation." });
      }

      // Sécurité : seul l'enseignant assigné à cette entrée peut valider
      if (entry.teacher_id !== req.user.id) {
        return res.status(403).json({
          error: "Vous n'êtes pas l'enseignant responsable de cette entrée.",
        });
      }

      await entry.update({
        statut: "validee",
        valide_par: req.user.id,
        date_validation: new Date(),
        commentaire_rejet: null,
        qr_token: null, // invalide le QR une fois traité
      });

      // Déclenchement du calcul de progression + notification
      try {
        const classe = entry.discipline.Classe;
        const analyse = await progressionAnalyzer.analyserProgression(
          entry.teacher_id,
          classe.id,
          entry.discipline_id,
        );

        await models.Notification.create({
          enseignant_id: entry.teacher_id,
          type: "auto_progression",
          categorie: analyse.categorie,
          titre: analyse.titre,
          message: analyse.message,
          classe_id: classe.id,
          discipline_id: entry.discipline_id,
          progression_actuelle: analyse.progression_actuelle,
          ecart_jours: analyse.ecart_jours,
          semaine_attendue: analyse.semaine_attendue,
          mois_attendu: analyse.mois_attendu,
          probleme_chronologie: analyse.probleme_chronologie,
          details_chronologie: analyse.details_chronologie,
          email_envoye: false,
        });
      } catch (notifError) {
        console.error(
          "⚠️ Erreur création notification (non bloquant):",
          notifError,
        );
      }

      res.json({ message: "Entrée validée avec succès", entry });
    } catch (error) {
      console.error("❌ Erreur validation entrée:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 28. REJETER UNE ENTRÉE SOUMISE
// ============================================================
router.patch(
  "/cahier-entries/:id/rejeter",
  authMiddleware,
  checkPermission("cahier-entries:validate"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { commentaire } = req.body;

      if (!commentaire || !commentaire.trim()) {
        return res
          .status(400)
          .json({ error: "Un commentaire de rejet est requis." });
      }

      const entry = await models.CahierEntry.findByPk(id);

      if (!entry) {
        return res.status(404).json({ error: "Entrée non trouvée" });
      }

      if (entry.statut !== "en_attente") {
        return res
          .status(400)
          .json({ error: "Cette entrée n'est pas en attente de validation." });
      }

      if (entry.teacher_id !== req.user.id) {
        return res.status(403).json({
          error: "Vous n'êtes pas l'enseignant responsable de cette entrée.",
        });
      }

      await entry.update({
        statut: "rejetee",
        commentaire_rejet: commentaire,
        valide_par: req.user.id,
        date_validation: new Date(),
      });

      res.json({ message: "Entrée rejetée", entry });
    } catch (error) {
      console.error("❌ Erreur rejet entrée:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// ============================================================
// 29. RÉCUPÉRER UNE ENTRÉE VIA QR CODE (AVEC DOUBLE VÉRIFICATION)
// ============================================================
router.get(
  "/cahier-entries/qr/:qrToken",
  authMiddleware,
  checkPermission("cahier-entries:validate"),
  async (req, res) => {
    try {
      const { qrToken } = req.params;

      const entry = await models.CahierEntry.findOne({
        where: { qr_token: qrToken, statut: "en_attente" },
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            include: [{ model: models.Classe, as: "Classe" }],
          },
          {
            model: models.User,
            as: "soumetteur",
            attributes: ["id", "nom", "prenoms"],
          },
        ],
      });

      if (!entry) {
        return res
          .status(404)
          .json({ error: "Entrée introuvable, déjà traitée, ou lien expiré." });
      }

      // ⚠️ VÉRIFICATION CRITIQUE : l'utilisateur connecté doit être l'enseignant assigné
      if (entry.teacher_id !== req.user.id) {
        return res.status(403).json({
          error:
            "Vous n'êtes pas l'enseignant assigné à cette entrée. Validation refusée.",
        });
      }

      res.json(entry);
    } catch (error) {
      console.error("❌ Erreur récupération entrée via QR:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

// Le responsable consulte ses propres soumissions (avec statut)
router.get(
  "/responsable/mes-entrees",
  authMiddleware,
  checkPermission("cahier-entries:submit"),
  async (req, res) => {
    try {
      const { discipline_id } = req.query;
      const where = { soumis_par: req.user.id };
      if (discipline_id) where.discipline_id = discipline_id;

      const entries = await models.CahierEntry.findAll({
        where,
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            attributes: ["id", "nom"],
          },
          {
            model: models.User,
            as: "teacher",
            attributes: ["id", "nom", "prenoms"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      res.json(entries);
    } catch (error) {
      console.error("❌ Erreur récupération soumissions responsable:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);

//Resoumission après rejet
router.put(
  "/cahier-entries/:id/resoumettre",
  authMiddleware,
  checkPermission("cahier-entries:submit"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await models.CahierEntry.findByPk(id);

      if (!entry) return res.status(404).json({ error: "Entrée non trouvée" });
      if (entry.soumis_par !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Vous n'êtes pas l'auteur de cette soumission." });
      }
      if (entry.statut !== "rejetee") {
        return res
          .status(400)
          .json({ error: "Seule une entrée rejetée peut être resoumise." });
      }

      const {
        sa_number,
        sa_name,
        activites,
        activites_status,
        contenu,
        date_cours,
        heure_debut,
        heure_fin,
        trimestre,
        mois,
        semaine_numero,
      } = req.body;

      const qrToken = require("crypto").randomBytes(32).toString("hex");

      await entry.update({
        sa_number,
        sa_name,
        activites,
        activites_status,
        contenu,
        date_cours,
        heure_debut,
        heure_fin,
        trimestre,
        mois,
        semaine_numero,
        statut: "en_attente",
        commentaire_rejet: null,
        qr_token: qrToken,
      });

      res.json({ message: "Entrée resoumise avec succès", entry });
    } catch (error) {
      console.error("❌ Erreur resoumission entrée:", error);
      res.status(500).json({ error: "Erreur serveur, veuillez réessayer." });
      next(error);
    }
  },
);
module.exports = router;
