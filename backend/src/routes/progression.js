const express = require("express");
const router = express.Router();
const { models } = require("../config/database");
const authMiddleware = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const { Op } = require("sequelize");

// ============================================================
// 1. CALCULER LA PROGRESSION POUR UNE CLASSE ET UNE DISCIPLINE
// ============================================================
router.get(
  "/:classeId/:disciplineId",
  authMiddleware,
  checkPermission("progression:view"), // Admin et Enseignant uniquement (configuré en BDD)
  async (req, res) => {
    try {
      const { classeId, disciplineId } = req.params;

      console.log(
        `📊 Calcul progression - Classe: ${classeId}, Discipline: ${disciplineId}`,
      );

      // 1. Récupérer la classe et la discipline
      const classe = await models.Classe.findByPk(classeId);
      if (!classe) {
        return res.status(404).json({ error: "Classe introuvable" });
      }

      const discipline = await models.Discipline.findByPk(disciplineId, {
        include: [
          {
            model: models.Classe,
            as: "Classe",
          },
        ],
      });

      if (!discipline) {
        return res.status(404).json({ error: "Discipline introuvable" });
      }

      // 2. Récupérer l'année académique active
      const anneeActive = await models.AnneeAcademique.findOne({
        where: { est_active: true },
      });

      if (!anneeActive) {
        return res
          .status(404)
          .json({ error: "Aucune année académique active" });
      }

      // 3. Récupérer le programme théorique total
      const programmesTheoriques = await models.ProgramTheorique.findAll({
        where: {
          promotion: classe.promotion,
          discipline: discipline.nom,
          annee_academique_id: anneeActive.id,
        },
      });

      console.log(
        `📚 Programmes théoriques trouvés: ${programmesTheoriques.length}`,
      );

      // Calculer le taux total prévu du programme
      const tauxTotal = programmesTheoriques.reduce((sum, prog) => {
        return sum + (parseFloat(prog.taux_prevu) || 0);
      }, 0);

      console.log(`📈 Taux total prévu: ${tauxTotal}%`);

      // 4. Récupérer toutes les entrées de cahier pour cette discipline et classe
      const cahierEntries = await models.CahierEntry.findAll({
        where: {
          discipline_id: disciplineId,
        },
        include: [
          {
            model: models.Discipline,
            as: "discipline",
            where: { classe_id: classeId },
            required: true,
          },
        ],
      });

      console.log(`📝 Entrées de cahier trouvées: ${cahierEntries.length}`);

      // 5. Calculer le taux réalisé total
      let tauxRealise = 0;

      for (const entry of cahierEntries) {
        // Récupérer les lots complets de cette entrée
        const lotsCompletsIds = entry.lots_activites_completes || [];

        console.log(
          `Entry ${entry.id}: ${lotsCompletsIds.length} lots complets`,
        );

        // Récupérer les programmes correspondants
        if (lotsCompletsIds.length > 0) {
          const programmesComplets = await models.ProgramTheorique.findAll({
            where: {
              id: { [Op.in]: lotsCompletsIds },
              promotion: classe.promotion,
              discipline: discipline.nom,
              annee_academique_id: anneeActive.id,
            },
          });

          // Additionner les taux prévus des lots complets
          const tauxEntry = programmesComplets.reduce((sum, prog) => {
            return sum + (parseFloat(prog.taux_prevu) || 0);
          }, 0);

          tauxRealise += tauxEntry;
        }
      }

      console.log(`✅ Taux réalisé calculé: ${tauxRealise}%`);

      // 6. Calculer la progression en pourcentage
      const progression =
        tauxTotal > 0 ? Math.round((tauxRealise / tauxTotal) * 100) : 0;

      // 7. Retourner les données
      const result = {
        classe: {
          id: classe.id,
          nom: classe.nom,
          promotion: classe.promotion,
        },
        discipline: {
          id: discipline.id,
          nom: discipline.nom,
        },
        taux_total: Math.round(tauxTotal * 100) / 100,
        taux_realise: Math.round(tauxRealise * 100) / 100,
        progression: Math.min(progression, 100), // Cap à 100%
        entries_count: cahierEntries.length,
        annee_academique: {
          id: anneeActive.id,
          libelle: anneeActive.libelle,
        },
      };

      console.log("📊 Résultat final:", result);

      res.json(result);
    } catch (error) {
      console.error("❌ Erreur calcul progression:", error);
      res.status(500).json({
        error: "Erreur lors du calcul de la progression",
        details: error.message,
      });
    }
  },
);

// ============================================================
// 2. RÉCUPÉRER LA PROGRESSION DES CLASSES D'UN ENSEIGNANT
// ============================================================
router.get(
  "/teacher/:teacherId",
  authMiddleware,
  checkPermission("progression:view-assigned"), // Admin et Enseignant
  async (req, res) => {
    try {
      const { teacherId } = req.params;

      // Récupérer toutes les disciplines de l'enseignant
      const enseignantDisciplines = await models.EnseignantDiscipline.findAll({
        where: { teacher_id: teacherId },
        include: [
          {
            model: models.Discipline,
            as: "Discipline",
            include: [
              {
                model: models.Classe,
                as: "Classe",
              },
            ],
          },
        ],
      });

      const progressions = [];

      for (const ed of enseignantDisciplines) {
        const discipline = ed.Discipline;
        const classe = discipline.Classe;

        // Calculer la progression pour chaque combinaison
        const progResponse = await fetch(
          `http://localhost:${process.env.PORT || 5000}/api/progression/${classe.id}/${discipline.id}`,
          {
            headers: {
              Authorization: req.headers.authorization,
            },
          },
        );

        if (progResponse.ok) {
          const progData = await progResponse.json();
          progressions.push(progData);
        }
      }

      res.json(progressions);
    } catch (error) {
      console.error("❌ Erreur récupération progressions enseignant:", error);
      res.status(500).json({
        error: "Erreur lors de la récupération des progressions",
        details: error.message,
      });
    }
  },
);

// ============================================================
// 3. STATISTIQUES GLOBALES DE PROGRESSION (EXCLUSIF ADMIN)
// ============================================================
router.get(
  "/stats/global",
  authMiddleware,
  checkPermission("progression:view-metrics"), // MODIFICATION : Plus aucun test de tableau de rôles en dur ici
  async (req, res) => {
    try {
      const anneeActive = await models.AnneeAcademique.findOne({
        where: { est_active: true },
      });

      if (!anneeActive) {
        return res
          .status(404)
          .json({ error: "Aucune année académique active" });
      }

      const classes = await models.Classe.findAll({
        include: [{ model: models.Discipline, as: "Disciplines" }],
      });

      const stats = {
        total_classes: classes.length,
        total_disciplines: 0,
        progressions_moyennes: [],
        classes_details: [],
      };

      for (const classe of classes) {
        const classeStats = {
          classe: {
            id: classe.id,
            nom: classe.nom,
            promotion: classe.promotion,
          },
          disciplines: [],
        };

        for (const discipline of classe.Disciplines) {
          stats.total_disciplines++;

          const programmesTheoriques = await models.ProgramTheorique.findAll({
            where: {
              promotion: classe.promotion,
              discipline: discipline.nom,
              annee_academique_id: anneeActive.id,
            },
          });

          const tauxTotal = programmesTheoriques.reduce(
            (sum, p) => sum + (parseFloat(p.taux_prevu) || 0),
            0,
          );

          const cahierEntries = await models.CahierEntry.findAll({
            where: { discipline_id: discipline.id },
          });

          let tauxRealise = 0;
          for (const entry of cahierEntries) {
            const lotsIds = entry.lots_activites_completes || [];
            if (lotsIds.length > 0) {
              const progs = await models.ProgramTheorique.findAll({
                where: { id: { [Op.in]: lotsIds } },
              });
              tauxRealise += progs.reduce(
                (sum, p) => sum + (parseFloat(p.taux_prevu) || 0),
                0,
              );
            }
          }

          const progression =
            tauxTotal > 0 ? Math.round((tauxRealise / tauxTotal) * 100) : 0;

          classeStats.disciplines.push({
            discipline: discipline.nom,
            progression,
            taux_realise: tauxRealise,
            taux_total: tauxTotal,
          });

          stats.progressions_moyennes.push(progression);
        }

        stats.classes_details.push(classeStats);
      }

      stats.progression_globale =
        stats.progressions_moyennes.length > 0
          ? Math.round(
              stats.progressions_moyennes.reduce((a, b) => a + b, 0) /
                stats.progressions_moyennes.length,
            )
          : 0;

      res.json(stats);
    } catch (error) {
      console.error("❌ Erreur stats globales:", error);
      res.status(500).json({
        error: "Erreur lors du calcul des statistiques",
        details: error.message,
      });
    }
  },
);

module.exports = router;
