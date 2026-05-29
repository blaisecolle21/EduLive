// routes/progressionAdmin.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { models } = require('../config/database');
const { Op } = require('sequelize');

// Middleware pour vérifier si admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ✅ GET /progression/admin/overview - Vue d'ensemble pour l'admin
router.get('/admin/overview', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('📊 Admin overview - Récupération de toutes les classes');
    
    // Récupérer TOUTES les classes avec leurs disciplines
    const classes = await models.Classe.findAll({
      include: [{
        model: models.Discipline,
        as: 'Disciplines',
        required: false, // LEFT JOIN pour avoir les classes même sans disciplines
        include: [{
          model: models.EnseignantDiscipline,
          as: 'EnseignantDisciplines',
          required: false, // LEFT JOIN pour avoir les disciplines même sans enseignant
          include: [{
            model: models.User,
            as: 'User',
            attributes: ['id', 'nom', 'prenoms', 'email']
          }]
        }]
      }],
      order: [
        ['promotion', 'ASC'], 
        ['nom', 'ASC'],
        [{ model: models.Discipline, as: 'Disciplines' }, 'nom', 'ASC']
      ]
    });

    console.log(`✅ ${classes.length} classe(s) trouvée(s)`);

    // Formater les données pour le frontend
    const formattedClasses = await Promise.all(classes.map(async (classe) => {
      const disciplines = await Promise.all((classe.Disciplines || []).map(async (discipline) => {
        // Trouver l'enseignant affecté
        const affectation = discipline.EnseignantDisciplines?.[0];
        const enseignant = affectation?.User;

        // Initialiser les valeurs par défaut
        let progression = 0;
        let entriesCount = 0;
        let tauxRealise = 0;

        // Calculer la progression si un enseignant est affecté
        if (enseignant) {
          try {
            // Récupérer les entrées de cahier pour cet enseignant/discipline
            const entries = await models.CahierEntry.findAll({
              where: {
                discipline_id: discipline.id,
                teacher_id: enseignant.id
              },
              attributes: ['id', 'taux_realise_entry']
            });

            entriesCount = entries.length;

            // ✅ NOUVEAU CALCUL : Somme des taux_realise_entry
            tauxRealise = entries.reduce((sum, entry) => {
              return sum + (parseFloat(entry.taux_realise_entry) || 0);
            }, 0);

            // La progression = taux réalisé (car le maximum est 100)
            progression = Math.min(Math.round(tauxRealise), 100);

            console.log(`✅ Discipline ${discipline.nom} - Progression: ${progression}% (${entriesCount} entrées, taux réalisé: ${tauxRealise})`);
          } catch (calcError) {
            console.error(`❌ Erreur calcul progression pour discipline ${discipline.id}:`, calcError);
          }
        }

        return {
          id: discipline.id,
          nom: discipline.nom,
          coefficient: discipline.coefficient,
          heures_par_semaine: discipline.heures_par_semaine,
          enseignant: enseignant ? {
            id: enseignant.id,
            nom: enseignant.nom,
            prenoms: enseignant.prenoms,
            email: enseignant.email
          } : null,
          progression,
          tauxRealise: tauxRealise.toFixed(2),
          entriesCount
        };
      }));

      return {
        id: classe.id,
        nom: classe.nom,
        promotion: classe.promotion,
        niveau: classe.niveau,
        disciplines: disciplines
      };
    }));

    console.log(`✅ Données formatées pour ${formattedClasses.length} classe(s)`);
    res.json(formattedClasses);

  } catch (error) {
    console.error('❌ Erreur récupération overview admin:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET /progression/admin/discipline/:disciplineId - Détails d'une discipline
router.get('/admin/discipline/:disciplineId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { disciplineId } = req.params;
    
    console.log(`📊 Récupération détails discipline ${disciplineId}`);

    const discipline = await models.Discipline.findByPk(disciplineId, {
      include: [
        {
          model: models.Classe,
          as: 'Classe'
        },
        {
          model: models.EnseignantDiscipline,
          as: 'EnseignantDisciplines',
          include: [{
            model: models.User,
            as: 'User',
            attributes: ['id', 'nom', 'prenoms', 'email']
          }]
        }
      ]
    });

    if (!discipline) {
      return res.status(404).json({ error: 'Discipline non trouvée' });
    }

    const enseignant = discipline.EnseignantDisciplines?.[0]?.User;

    // Récupérer les entrées de cahier
    const entries = enseignant ? await models.CahierEntry.findAll({
      where: {
        discipline_id: disciplineId,
        teacher_id: enseignant.id
      },
      order: [['date_cours', 'DESC']],
      include: [{
        model: models.User,
        as: 'teacher',
        attributes: ['id', 'nom', 'prenoms']
      }]
    }) : [];

    // Récupérer l'historique de chaque entrée
    const entriesWithHistory = await Promise.all(entries.map(async (entry) => {
      const history = await models.CahierEntryHistory.findAll({
        where: { cahier_entry_id: entry.id },
        order: [['version', 'DESC']],
        include: [{
          model: models.User,
          as: 'ModifiedBy',
          attributes: ['id', 'nom', 'prenoms'],
          required: false
        }]
      });

      return {
        ...entry.toJSON(),
        history
      };
    }));

    // Récupérer les entrées supprimées (si le modèle existe)
    let deletedEntries = [];
    if (models.CahierEntryDeleted && enseignant) {
      deletedEntries = await models.CahierEntryDeleted.findAll({
        where: {
          discipline_id: disciplineId,
          teacher_id: enseignant.id
        },
        order: [['deleted_at', 'DESC']]
      });
    }

    // ✅ NOUVEAU CALCUL : Somme des taux_realise_entry
    const tauxRealise = entries.reduce((sum, entry) => {
      return sum + (parseFloat(entry.taux_realise_entry) || 0);
    }, 0);

    const progression = Math.min(Math.round(tauxRealise), 100);
    const tauxTotal = 100; // Le taux total est toujours 100

    console.log(`✅ Discipline ${discipline.nom} - ${entries.length} entrées, progression: ${progression}%`);

    res.json({
      discipline: {
        id: discipline.id,
        nom: discipline.nom,
        classe: discipline.Classe,
        enseignant,
        progression,
        taux_realise: tauxRealise.toFixed(2),
        taux_total: tauxTotal.toFixed(2)
      },
      entries: entriesWithHistory,
      deletedEntries
    });

  } catch (error) {
    console.error('❌ Erreur détails discipline admin:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});


// Route de test
router.get('/admin/test', authMiddleware, isAdmin, async (req, res) => {
  try {
    const classesCount = await models.Classe.count();
    const disciplinesCount = await models.Discipline.count();
    const entriesCount = await models.CahierEntry.count();
    
    res.json({
      success: true,
      counts: {
        classes: classesCount,
        disciplines: disciplinesCount,
        entries: entriesCount
      },
      message: 'API admin fonctionnelle'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;