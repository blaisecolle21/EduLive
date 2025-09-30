const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { models } = require('../config/database');
const { Op } = require('sequelize');

// Middleware pour vérifier si enseignant ou admin
const isTeacherOrAdmin = (req, res, next) => {
    if (req.user.role !== 'enseignant' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès réservé aux enseignants ou administrateurs' });
    }
    next();
};

// GET /classes - Lister toutes les classes
router.get('/classes', authMiddleware, async (req, res) => {
    try {
        const classes = await models.Classe.findAll({
            attributes: ['id', 'nom', 'promotion', 'niveau']
        });
        res.json(classes);
    } catch (error) {
        console.error('Erreur récupération classes:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /classes - Ajouter une nouvelle classe
router.post('/classes', authMiddleware, async (req, res) => {
    try {
        const { nom, promotion, niveau } = req.body;
        console.log('Données reçues pour création:', { nom, promotion, niveau }); // Log pour débogage

        // Validation des champs
        if (!nom || !promotion || !niveau) {
            return res.status(400).json({ error: 'Tous les champs (nom, promotion, niveau) sont requis.' });
        }

        // Création de la classe
        const newClass = await models.Classe.create({ nom, promotion, niveau });
        console.log('Classe créée avec succès:', newClass.toJSON()); // Log pour confirmer

        res.status(201).json(newClass); // Renvoie la nouvelle classe
    } catch (error) {
        console.error('Erreur création classe:', error);
        // Vérifie les erreurs spécifiques de Sequelize
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
});

// PUT /classes/:id - Mettre à jour une classe
router.put('/classes/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, promotion, niveau } = req.body;
        const classe = await models.Classe.findByPk(id);
        if (!classe) {
            return res.status(404).json({ error: 'Classe non trouvée.' });
        }
        await classe.update({ nom, promotion, niveau });
        res.json(classe); // Renvoie la classe mise à jour
    } catch (error) {
        console.error('Erreur mise à jour classe:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /classes/:id - Supprimer une classe
router.delete('/classes/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await models.Classe.destroy({ where: { id } });
        if (deleted) {
            res.status(200).json({ message: 'Classe supprimée avec succès.' });
        } else {
            res.status(404).json({ error: 'Classe non trouvée.' });
        }
    } catch (error) {
        console.error('Erreur suppression classe:', error);
        res.status(500).json({ error: error.message });
    }
});


// routes/cahier.js
router.get('/disciplines', authMiddleware, async (req, res) => {
  try {
    const { classe_id } = req.query;
    const userId = req.user.id;
    console.log('Début recherche des disciplines pour userId:', userId, 'classe_id:', classe_id);
    const disciplines = await models.Discipline.findAll({
      include: [{
        model: models.EnseignantDiscipline,
        as: 'EnseignantDisciplines',
        where: { teacher_id: userId },
        attributes: []
      }],
      where: classe_id ? { classe_id } : {}
    });
    console.log('Disciplines trouvées:', disciplines);
    res.json(disciplines);
  } catch (error) {
    console.error('Erreur récupération disciplines:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

router.post('/disciplines', async (req, res) => {
  try {
    const { nom, classe_id, coefficient, heures_par_semaine, teacher_ids } = req.body;
    const discipline = await models.Discipline.create({
      nom,
      classe_id,
      coefficient,
      heures_par_semaine
    });

    if (teacher_ids && Array.isArray(teacher_ids)) {
      const associations = teacher_ids.map(teacher_id => ({
        teacher_id,
        discipline_id: discipline.id
      }));
      await models.EnseignantDiscipline.bulkCreate(associations);
    }

    res.status(201).json(discipline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/disciplines/:id', authMiddleware, isTeacherOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, classe_id, coefficient, heures_par_semaine } = req.body;
        console.log('Données reçues pour mise à jour de la discipline:', { id, nom, classe_id, coefficient, heures_par_semaine });

        // Vérifier si la discipline existe
        const discipline = await models.Discipline.findByPk(id);
        if (!discipline) {
            return res.status(404).json({ error: 'Discipline non trouvée.' });
        }

        // Vérifier si la classe existe (si classe_id est fourni)
        if (classe_id) {
            const classe = await models.SClass.findByPk(classe_id);
            if (!classe) {
                return res.status(404).json({ error: 'Classe non trouvée.' });
            }
        }

        // Mettre à jour la discipline
        await discipline.update({
            nom,
            classe_id,
            coefficient: coefficient ? parseFloat(coefficient) : undefined,
            heures_par_semaine: heures_par_semaine ? parseInt(heures_par_semaine) : undefined
        });
        console.log('Discipline mise à jour avec succès:', discipline.toJSON());

        res.json(discipline); // Renvoie la discipline mise à jour
    } catch (error) {
        console.error('Erreur mise à jour discipline:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors.map(e => e.message).join(', ') });
        }
        res.status(500).json({ error: error.message });
    }
});

router.delete('/disciplines/:id', authMiddleware, isTeacherOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Tentative de suppression de la discipline avec ID:', id);

        // Vérifier si la discipline existe
        const discipline = await models.Discipline.findByPk(id);
        if (!discipline) {
            return res.status(404).json({ error: 'Discipline non trouvée.' });
        }

        // Supprimer la discipline
        await discipline.destroy();
        console.log('Discipline supprimée avec succès:', id);

        res.status(200).json({ message: 'Discipline supprimée avec succès.' });
    } catch (error) {
        console.error('Erreur suppression discipline:', error);
        res.status(500).json({ error: error.message });
    }
});

// Dans routes/cahier.js
router.get('/classes/teacher', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Début recherche des classes pour userId:', userId);
    console.log('req.user:', req.user);
    const classes = await models.Classe.findAll({
      include: [{
        model: models.Discipline,
        as: 'Disciplines',  // Ajout de l'alias correspondant à l'association dans classe.js
        required: true,
        include: [{
          model: models.EnseignantDiscipline,
          as: 'EnseignantDisciplines',  // Ajout de l'alias correspondant à l'association dans classe.js
          required: true,
          where: { teacher_id: userId },
          attributes: []
        }]
      }],
      distinct: true
    });
    console.log('Classes trouvées:', JSON.stringify(classes, null, 2));
    res.json(classes);
  } catch (error) {
    console.error('Erreur récupération classes enseignant:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// GET /cahier-entries - Récupérer les entrées du cahier de texte pour l'enseignant connecté
// Dans routes/cahier.js
router.get('/cahier-entries', authMiddleware, async (req, res) => {
  try {
    console.log('📥 Requête reçue : GET /api/cahier/cahier-entries');
    console.log('🔍 req.query =', req.query);
    
    const { classe_id } = req.query;
    const teacherId = req.user.id;
    
    const whereClause = { teacher_id: teacherId };
    
    if (classe_id) {
      // Récupérer d'abord les IDs des disciplines de cette classe
      const disciplines = await models.Discipline.findAll({
        where: { classe_id: classe_id },
        attributes: ['id']
      });
      
      const disciplineIds = disciplines.map(d => d.id);
      
      if (disciplineIds.length > 0) {
        whereClause.discipline_id = {
          [Op.in]: disciplineIds // ✅ Maintenant Op est défini
        };
      } else {
        // Si aucune discipline trouvée, retourner un tableau vide
        return res.json([]);
      }
    }
    
    const entries = await models.CahierEntry.findAll({
      where: whereClause,
      include: [{
        model: models.Discipline,
        as: 'discipline',
        attributes: ['nom', 'classe_id'],
        include: [{
          model: models.Classe,
          as: 'Classe',
          attributes: ['nom', 'promotion']
        }]
      }],
      order: [['date_cours', 'DESC']]
    });
    
    console.log('✅ Entrées trouvées:', entries.length);
    res.json(entries);
  } catch (error) {
    console.error('❌ Erreur récupération entrées cahier:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
});


// POST /cahier-entries - Créer une nouvelle entrée dans le cahier de texte
router.post('/cahier-entries', authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const entryData = {
      discipline_id: req.body.discipline_id,
      teacher_id: req.user.id,
      sa_number: req.body.sa_number,
      sa_name: req.body.sa_name,
      activites: req.body.activites,
      contenu: req.body.contenu,
      date_cours: req.body.date_cours,
      heure_debut: req.body.heure_debut,
      heure_fin: req.body.heure_fin,
      trimestre: req.body.trimestre,
      mois: req.body.mois,
      semaine_numero: req.body.semaine_numero,
      annee_scolaire: '2025-2026'
    };
    const entry = await models.CahierEntry.create(entryData);
    res.status(201).json({ message: 'Entrée enregistrée avec succès', entry });
  } catch (error) {
    console.error('Erreur création entrée cahier:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /cahier-entries/:id
router.put('/cahier-entries/:id', authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await models.CahierEntry.findByPk(id);
    if (!entry || entry.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès réservé à l\'enseignant responsable' });
    }

    // Enregistrer l'ancienne version dans l'historique
    await models.CahierEntryHistory.create({
      cahier_entry_id: id,
      version: (await models.CahierEntryHistory.count({ where: { cahier_entry_id: id } }) + 1),
      sa_number: entry.sa_number,
      sa_name: entry.sa_name,
      activites: entry.activites,
      contenu: entry.contenu,
      date_cours: entry.date_cours,
      heure_debut: entry.heure_debut,
      heure_fin: entry.heure_fin,
      trimestre: entry.trimestre,
      mois: entry.mois,
      semaine_numero: entry.semaine_numero,
      annee_scolaire: entry.annee_scolaire,
      pourcentage_realise: entry.pourcentage_realise
    });

    // Mettre à jour l'entrée
    await entry.update({
      sa_number: req.body.sa_number,
      sa_name: req.body.sa_name,
      activites: req.body.activites,
      contenu: req.body.contenu,
      date_cours: req.body.date_cours,
      heure_debut: req.body.heure_debut,
      heure_fin: req.body.heure_fin,
      trimestre: req.body.trimestre,
      mois: req.body.mois,
      semaine_numero: req.body.semaine_numero
    });

    res.json({ message: 'Entrée mise à jour avec succès', entry });
  } catch (error) {
    console.error('Erreur mise à jour entrée cahier:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /cahier-entries/:id/history - Récupérer l'historique d'une entrée
router.get('/cahier-entries/:id/history', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await models.CahierEntry.findByPk(id);
    if (!entry || entry.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const history = await models.CahierEntryHistory.findAll({
      where: { cahier_entry_id: id },
      order: [['version', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /cahier-entries/:id - Modifier une entrée avec historique
router.put('/cahier-entries/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { discipline_id, sa_number, sa_name, activites, contenu, date_cours, heure_debut, heure_fin, trimestre, mois, semaine_numero } = req.body;
    const entry = await models.CahierEntry.findByPk(id);
    if (!entry || entry.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Enregistrer l'ancienne version dans l'historique
    const oldVersion = await models.CahierEntryHistory.create({
      cahier_entry_id: id,
      version: (await models.CahierEntryHistory.count({ where: { cahier_entry_id: id } }) + 1),
      sa_number: entry.sa_number,
      sa_name: entry.sa_name,
      activites: entry.activites,
      contenu: entry.contenu,
      date_cours: entry.date_cours,
      heure_debut: entry.heure_debut,
      heure_fin: entry.heure_fin,
      trimestre: entry.trimestre,
      mois: entry.mois,
      semaine_numero: entry.semaine_numero,
      annee_scolaire: entry.annee_scolaire,
      pourcentage_realise: entry.pourcentage_realise
    });

    // Mettre à jour l'entrée
    await entry.update({
      discipline_id,
      sa_number,
      sa_name,
      activites,
      contenu,
      date_cours,
      heure_debut,
      heure_fin,
      trimestre,
      mois,
      semaine_numero
    });

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;