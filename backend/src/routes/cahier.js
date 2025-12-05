const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { models } = require('../config/database');
const { Op } = require('sequelize');
const progressionAnalyzer = require('../services/progressionAnalyzer');


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

// routes/cahier.js
router.put('/disciplines/:id', authMiddleware, isTeacherOrAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, classe_id, coefficient, heures_par_semaine } = req.body;
        
        console.log('Mise à jour discipline:', { id, nom, classe_id, coefficient, heures_par_semaine });

        // Trouver la discipline
        const discipline = await models.Discipline.findOne({
            where: { id: parseInt(id) }
        });
        
        if (!discipline) {
            return res.status(404).json({ error: 'Discipline non trouvée.' });
        }

        // Vérifier si la classe existe
        if (classe_id) {
            const classe = await models.Classe.findOne({
                where: { id: parseInt(classe_id) }
            });
            if (!classe) {
                return res.status(404).json({ error: 'Classe non trouvée.' });
            }
        }

        // Construire l'objet de mise à jour
        const updateData = {};
        if (nom !== undefined) updateData.nom = nom;
        if (classe_id !== undefined) updateData.classe_id = parseInt(classe_id);
        if (coefficient !== undefined) updateData.coefficient = parseFloat(coefficient);
        if (heures_par_semaine !== undefined) updateData.heures_par_semaine = parseInt(heures_par_semaine);

        // Mettre à jour
        await discipline.update(updateData);
        
        // Recharger avec les associations
        await discipline.reload({
            include: [{
                model: models.Classe,
                as: 'Classe'
            }]
        });
        
        console.log('✅ Discipline mise à jour:', discipline.toJSON());
        res.json(discipline);
        
    } catch (error) {
        console.error('❌ Erreur mise à jour discipline:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ 
                error: 'Erreur de validation', 
                details: error.errors.map(e => e.message) 
            });
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






// GET /cahier/enseignants - Lister les enseignants
router.get('/enseignants', authMiddleware, async (req, res) => {
  try {
    const enseignants = await models.User.findAll({
      where: { role: 'enseignant', est_actif: true },
      attributes: ['id', 'nom', 'prenoms', 'email'],
      include: [{
        model: models.EnseignantDiscipline,
        as: 'EnseignantDisciplines',
        attributes: ['discipline_id'],
        include: [{
          model: models.Discipline,
          as: 'Discipline',
          attributes: ['nom'],
          include: [{
            model: models.Classe,
            as: 'Classe',
            attributes: ['nom', 'promotion']
          }]
        }]
      }],
      order: [['nom', 'ASC']]
    });
    res.json(enseignants);
  } catch (error) {
    console.error('Erreur récupération enseignants:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /cahier/affectations - Affecter un enseignant à une matière/classe
router.post('/affectations', authMiddleware, async (req, res) => {
  try {
    const { enseignant_id, discipline_nom, classe_id, coefficient, heures_par_semaine } = req.body;

    // Vérifier l'enseignant
    const enseignant = await models.User.findByPk(enseignant_id);
    if (!enseignant || enseignant.role !== 'enseignant') {
      return res.status(400).json({ error: 'Enseignant invalide' });
    }

    // Vérifier la classe
    const classe = await models.Classe.findByPk(classe_id);
    if (!classe) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }

    // Créer ou récupérer la discipline
    let discipline = await models.Discipline.findOne({ where: { nom: discipline_nom, classe_id } });
    if (!discipline) {
      discipline = await models.Discipline.create({
        nom: discipline_nom,
        classe_id,
        coefficient: coefficient || 1.0,
        heures_par_semaine: heures_par_semaine || 4
      });
    }

    // Vérifier si l'affectation existe déjà
    const existingAffectation = await models.EnseignantDiscipline.findOne({
      where: { teacher_id: enseignant_id, discipline_id: discipline.id }
    });
    if (existingAffectation) {
      return res.status(400).json({ error: 'Affectation déjà existante' });
    }

    // Créer l'affectation
    const affectation = await models.EnseignantDiscipline.create({
      teacher_id: enseignant_id,
      discipline_id: discipline.id
    });

    res.status(201).json({ message: 'Affectation créée avec succès', affectation });
  } catch (error) {
    console.error('Erreur création affectation:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /cahier/affectations - Lister toutes les affectations
// routes/cahier.js - Route GET affectations
router.get('/affectations', authMiddleware, async (req, res) => {
  try {
    const affectations = await models.EnseignantDiscipline.findAll({
      include: [
        {
          model: models.User,
          as: 'User',
          attributes: ['id', 'nom', 'prenoms', 'email']
        },
        {
          model: models.Discipline,
          as: 'Discipline',
          include: [{
            model: models.Classe,
            as: 'Classe',
            attributes: ['id', 'nom', 'promotion']
          }]
        }
      ]
    });
    res.json(affectations);
  } catch (error) {
    console.error('Erreur récupération affectations:', error);
    res.status(500).json({ error: error.message });
  }
});

//Modifier une affectation
// routes/cahier.js
router.put('/affectations/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { enseignant_id, discipline_id } = req.body;

    const affectation = await models.EnseignantDiscipline.findByPk(id);
    if (!affectation) {
      return res.status(404).json({ error: 'Affectation non trouvée' });
    }

    // Vérifier que l'affectation n'existe pas déjà (sauf pour elle-même)
    const exists = await models.EnseignantDiscipline.findOne({
      where: {
        teacher_id: enseignant_id,
        discipline_id,
        id: { [Op.ne]: id }
      }
    });
    if (exists) {
      return res.status(400).json({ error: 'Cette affectation existe déjà' });
    }

    await affectation.update({ teacher_id: enseignant_id, discipline_id });
    res.json({ message: 'Affectation mise à jour', affectation });
  } catch (error) {
    console.error('Erreur mise à jour affectation:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /cahier/affectations/:id - Supprimer une affectation
router.delete('/affectations/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const affectation = await models.EnseignantDiscipline.findByPk(id);
    if (!affectation) {
      return res.status(404).json({ error: 'Affectation non trouvée' });
    }
    await affectation.destroy();
    res.json({ message: 'Affectation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression affectation:', error);
    res.status(500).json({ error: error.message });
  }
});



















// GET /cahier-entries - Récupérer les entrées du cahier de texte pour l'enseignant connecté
router.get('/cahier-entries', authMiddleware, async (req, res) => {
  try {
    console.log('📥 Requête reçue : GET /api/cahier/cahier-entries');
    console.log('🔍 req.query =', req.query);
    console.log('👤 req.user.id =', req.user.id);
    
    const { classe_id } = req.query;
    const teacherId = req.user.id;
    
    // Construire la clause WHERE de base
    const whereClause = { teacher_id: teacherId };
    
    // Construire les options d'inclusion
    const includeOptions = [{
      model: models.Discipline,
      as: 'discipline',
      attributes: ['id', 'nom', 'classe_id'],
      required: true, // INNER JOIN pour s'assurer que la discipline existe
      include: [{
        model: models.Classe,
        as: 'Classe',
        attributes: ['id', 'nom', 'promotion'],
        required: true // INNER JOIN pour s'assurer que la classe existe
      }]
    }];
    
    // Si classe_id est fourni, filtrer par classe
    if (classe_id) {
      console.log('🎯 Filtrage par classe:', classe_id);
      
      // Ajouter une condition sur la classe dans l'include
      includeOptions[0].include[0].where = { id: parseInt(classe_id) };
    }
    
    console.log('🔍 Clause WHERE:', JSON.stringify(whereClause));
    
    const entries = await models.CahierEntry.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['date_cours', 'DESC']]
    });
    
    console.log('✅ Entrées trouvées:', entries.length);
    
    // Logger chaque entrée pour debug
    entries.forEach((entry, index) => {
      console.log(`Entrée ${index + 1}:`, {
        id: entry.id,
        sa_number: entry.sa_number,
        sa_name: entry.sa_name,
        discipline: entry.discipline?.nom,
        classe: entry.discipline?.Classe?.nom,
        date_cours: entry.date_cours
      });
    });
    
    res.json(entries);
    
  } catch (error) {
    console.error('❌ Erreur récupération entrées cahier:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


/**
 * POST /api/cahier/cahier-entries
 * Créer une nouvelle entrée de cahier avec notification automatique
 */
router.post('/cahier-entries', authMiddleware, isTeacherOrAdmin, async (req, res) => {
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
      taux_prevu_programme
    } = req.body;

    // Validation
    if (!discipline_id || !teacher_id || !sa_number || !date_cours || !heure_debut || !heure_fin) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }
    
    console.log('📝 Création entrée avec activités:', activites);
    console.log('📊 Statuts:', activites_status);
    
    // Récupérer la discipline et la classe
    const discipline = await models.Discipline.findByPk(discipline_id, {
      include: [{
        model: models.Classe,
        as: 'Classe'
      }]
    });
    
    if (!discipline) {
      return res.status(404).json({ error: 'Discipline non trouvée' });
    }

    const classe = discipline.Classe;
    
    // Récupérer les lots du programme théorique
    const normalizedSa = sa_number.replace(/\s+/g, '').toUpperCase();
    const programmes = await models.ProgramTheorique.findAll({
      where: {
        promotion: classe.promotion,
        discipline: discipline.nom,
        [Op.or]: [
          { sa: { [Op.like]: `%${normalizedSa}%` } },
          { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } }
        ]
      }
    });
    
    // ✅ CALCULER LES LOTS COMPLETS
    const lotsComplets = [];
    let tauxRealiseEntry = 0;
    
    // Parser les activités de l'entrée
    const activitesEntry = activites.split('\n').map(a => a.trim()).filter(a => a.length > 0);
    
    programmes.forEach(prog => {
      // Parser les activités du lot
      let activitesLot = [];
      try {
        if (typeof prog.activites === 'string') {
          activitesLot = JSON.parse(prog.activites);
        } else if (Array.isArray(prog.activites)) {
          activitesLot = prog.activites;
        }
      } catch (e) {
        activitesLot = [];
      }
      
      const activitesLotClean = activitesLot
        .filter(a => a && a.trim().length > 0)
        .map(a => a.trim());
      
      if (activitesLotClean.length === 0) return;
      
      // Vérifier si TOUTES les activités du lot sont marquées comme "fait"
      const toutesLeActivitesDuLotSontFaites = activitesLotClean.every(activite => {
        return activitesEntry.includes(activite) && 
               activites_status?.[activite] === 'fait';
      });
      
      if (toutesLeActivitesDuLotSontFaites) {
        lotsComplets.push(prog.id);
        tauxRealiseEntry += parseFloat(prog.taux_prevu) || 0;
        console.log(`✅ Lot ${prog.id} COMPLET - Taux: ${prog.taux_prevu}%`);
      } else {
        console.log(`⏳ Lot ${prog.id} incomplet (${activitesLotClean.length} activités)`);
      }
    });
    
    console.log(`📊 Taux réalisé dans cette entrée: ${tauxRealiseEntry}%`);
    console.log(`✔️ ${lotsComplets.length} lot(s) complet(s):`, lotsComplets);
    
    // Créer l'entrée avec les lots complets
    const entry = await models.CahierEntry.create({
      discipline_id,
      teacher_id: teacher_id || req.user.id,
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
      taux_realise_entry: tauxRealiseEntry
    });
    
    console.log('✅ Entrée créée avec succès, ID:', entry.id);

    // ✅ CRÉER UNE NOTIFICATION AUTOMATIQUE
    try {
      console.log('🔔 Création notification automatique...');
      
      const analyse = await progressionAnalyzer.analyserProgression(
        entry.teacher_id,
        classe.id,
        discipline_id
      );

      console.log('📊 Analyse progression:', {
        categorie: analyse.categorie,
        titre: analyse.titre,
        progression: analyse.progression_actuelle,
        ecart: analyse.ecart_jours
      });

      const notification = await models.Notification.create({
        enseignant_id: entry.teacher_id,
        type: 'auto_progression',
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
        email_envoye: false // Pas d'email pour notification auto
      });

      console.log('✅ Notification créée, ID:', notification.id);

    } catch (notifError) {
      console.error('⚠️ Erreur création notification (non bloquant):', notifError);
      // Ne pas faire échouer la création de l'entrée si la notification échoue
    }
    
    res.status(201).json({ 
      message: 'Entrée enregistrée avec succès', 
      entry,
      tauxRealise: tauxRealiseEntry,
      lotsComplets: lotsComplets.length,
      notification_creee: true
    });
    
  } catch (error) {
    console.error('❌ Erreur création entrée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création de l\'entrée',
      details: error.message 
    });
  }
});

/**
 * PUT /api/cahier/cahier-entries/:id
 * Mettre à jour une entrée existante avec recalcul et notification
 */
router.put('/cahier-entries/:id', authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await models.CahierEntry.findByPk(id, {
      include: [{
        model: models.Discipline,
        as: 'discipline',
        include: [{
          model: models.Classe,
          as: 'Classe'
        }]
      }]
    });
    
    if (!entry) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }
    
    // Vérification des droits
    if (entry.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé à l\'enseignant responsable' });
    }

    console.log('✏️ Mise à jour entrée ID:', id);

    // ✅ SAUVEGARDER L'HISTORIQUE
    try {
      const historyCount = await models.CahierEntryHistory.count({ 
        where: { cahier_entry_id: id } 
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
        modified_at: new Date()
      });

      console.log('✅ Historique sauvegardé, version:', historyCount + 1);

    } catch (histError) {
      console.warn('⚠️ Erreur sauvegarde historique (non bloquant):', histError);
    }

    // Récupérer la discipline et la classe
    const discipline = entry.discipline;
    const classe = discipline.Classe;
    
    // Récupérer les programmes théoriques
    const normalizedSa = req.body.sa_number.replace(/\s+/g, '').toUpperCase();
    const programmes = await models.ProgramTheorique.findAll({
      where: {
        promotion: classe.promotion,
        discipline: discipline.nom,
        [Op.or]: [
          { sa: { [Op.like]: `%${normalizedSa}%` } },
          { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } }
        ]
      }
    });
    
    // ✅ RECALCULER LES LOTS COMPLETS
    const lotsComplets = [];
    let tauxRealiseEntry = 0;
    
    const activitesEntry = req.body.activites.split('\n').map(a => a.trim()).filter(a => a.length > 0);
    
    programmes.forEach(prog => {
      // Parser les activités du lot
      let activitesLot = [];
      try {
        if (typeof prog.activites === 'string') {
          activitesLot = JSON.parse(prog.activites);
        } else if (Array.isArray(prog.activites)) {
          activitesLot = prog.activites;
        }
      } catch (e) {
        activitesLot = [];
      }
      
      const activitesLotClean = activitesLot
        .filter(a => a && a.trim().length > 0)
        .map(a => a.trim());
      
      if (activitesLotClean.length === 0) return;
      
      // Vérifier si TOUTES les activités du lot sont marquées comme "fait"
      const toutesLeActivitesDuLotSontFaites = activitesLotClean.every(activite => {
        return activitesEntry.includes(activite) && 
               req.body.activites_status?.[activite] === 'fait';
      });
      
      if (toutesLeActivitesDuLotSontFaites) {
        lotsComplets.push(prog.id);
        tauxRealiseEntry += parseFloat(prog.taux_prevu) || 0;
        console.log(`✅ Lot ${prog.id} COMPLET - Taux: ${prog.taux_prevu}%`);
      }
    });
    
    console.log(`📊 Nouveau taux réalisé: ${tauxRealiseEntry}%`);
    console.log(`✔️ ${lotsComplets.length} lot(s) complet(s)`);
    
    // ✅ METTRE À JOUR L'ENTRÉE
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
      taux_realise_entry: tauxRealiseEntry
    });

    console.log(`✅ Entrée ${id} mise à jour avec succès`);

    // ✅ CRÉER UNE NOTIFICATION DE MISE À JOUR
    try {
      console.log('🔔 Création notification mise à jour...');
      
      const analyse = await progressionAnalyzer.analyserProgression(
        entry.teacher_id,
        classe.id,
        entry.discipline_id
      );

      console.log('📊 Analyse progression après MAJ:', {
        categorie: analyse.categorie,
        titre: analyse.titre,
        progression: analyse.progression_actuelle,
        ecart: analyse.ecart_jours
      });

      const notification = await models.Notification.create({
        enseignant_id: entry.teacher_id,
        type: 'auto_progression',
        categorie: analyse.categorie,
        titre: '🔄 ' + analyse.titre + ' (Mise à jour)',
        message: `Suite à la modification de votre entrée de cahier :\n\n${analyse.message}`,
        classe_id: classe.id,
        discipline_id: entry.discipline_id,
        progression_actuelle: analyse.progression_actuelle,
        ecart_jours: analyse.ecart_jours,
        semaine_attendue: analyse.semaine_attendue,
        mois_attendu: analyse.mois_attendu,
        probleme_chronologie: analyse.probleme_chronologie,
        details_chronologie: analyse.details_chronologie,
        email_envoye: false
      });

      console.log('✅ Notification MAJ créée, ID:', notification.id);

    } catch (notifError) {
      console.error('⚠️ Erreur création notification (non bloquant):', notifError);
    }
    
    res.json({ 
      message: 'Entrée mise à jour avec succès', 
      entry,
      tauxRealise: tauxRealiseEntry,
      lotsComplets: lotsComplets.length,
      notification_creee: true
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour entrée:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour',
      details: error.message 
    });
  }
});

// ✅ Route DELETE
router.delete('/cahier-entries/:id', authMiddleware, isTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const entry = await models.CahierEntry.findByPk(id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }
    
    if (entry.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé à l\'enseignant responsable' });
    }
    
    await entry.destroy();
    
    console.log('✅ Entrée supprimée:', id);
    res.json({ message: 'Entrée supprimée avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur suppression entrée:', error);
    res.status(500).json({ error: error.message });
  }
});



// ✅ Route pour mettre à jour le statut d'une activité
router.patch('/cahier-entries/:id/activite-status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { activite, status } = req.body;
    
    if (!activite || !status || !['en_cours', 'fait'].includes(status)) {
      return res.status(400).json({ 
        error: 'Paramètres invalides',
        required: { activite: 'string', status: 'en_cours | fait' }
      });
    }
    
    const entry = await models.CahierEntry.findByPk(id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }
    
    if (entry.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Mettre à jour le statut
    const currentStatus = entry.activites_status || {};
    currentStatus[activite] = status;
    
    await entry.update({ activites_status: currentStatus });
    
    console.log('✅ Statut activité mis à jour:', { activite, status });
    
    res.json({ 
      message: 'Statut mis à jour',
      activites_status: currentStatus,
      pourcentage_realise: entry.pourcentage_realise
    });
    
  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    res.status(500).json({ error: error.message });
  }
});




// GET /cahier-entries/:id/history - Récupérer l'historique d'une entrée
router.get('/cahier-entries/:id/history', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const entry = await models.CahierEntry.findByPk(id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Entrée non trouvée' });
    }
    
    if (entry.teacher_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    // Vérifier si le modèle CahierEntryHistory existe
    if (!models.CahierEntryHistory) {
      console.warn('⚠️ Modèle CahierEntryHistory non trouvé');
      return res.json([]);
    }
    
    const history = await models.CahierEntryHistory.findAll({
      where: { cahier_entry_id: id },
      order: [['version', 'DESC']]
    });
    
    res.json(history);
    
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({ error: error.message });
  }
});






// Route pour récupérer les activités du programme théorique

// GET /cahier/programme-activites - Récupérer les activités pour une SA donnée
router.get('/programme-activites', authMiddleware, async (req, res) => {
  try {
    const { classe_id, discipline_nom, sa_number } = req.query;
    
    console.log('📥 Requête activités programme théorique:', { classe_id, discipline_nom, sa_number });
    
    if (!classe_id || !discipline_nom || !sa_number) {
      return res.status(400).json({ 
        error: 'Paramètres manquants', 
        required: ['classe_id', 'discipline_nom', 'sa_number'] 
      });
    }
    
    // Récupérer la classe pour obtenir la promotion
    const classe = await models.Classe.findByPk(classe_id);
    if (!classe) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }
    
    console.log('🎯 Classe trouvée:', classe.nom, '- Promotion:', classe.promotion);
    
    // Récupérer le programme théorique correspondant
    // Normaliser le numéro de SA (SA1, SA 1, etc.)
    const normalizedSa = sa_number.replace(/\s+/g, '').toUpperCase();
    
    const programmes = await models.ProgramTheorique.findAll({
      where: {
        promotion: classe.promotion,
        discipline: discipline_nom,
        [Op.or]: [
          { sa: { [Op.like]: `%${normalizedSa}%` } },
          { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } }
        ]
      },
      order: [['semaine_numero', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'activites', 'sa', 'situation_apprentissage', 'semaine_numero', 'import_batch_id']
    });
    
    console.log(`📚 ${programmes.length} programme(s) trouvé(s) pour ${normalizedSa}`);
    
    if (!programmes.length) {
      return res.json({ 
        activites: [], 
        saName: '', 
        message: 'Aucun programme trouvé' 
      });
    }
    
    // Extraire toutes les activités (en évitant les doublons) et le taux prévu
    const activitesSet = new Set();
    let saName = '';
    let tauxPrevu = 0;
    
    programmes.forEach(prog => {
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
        if (typeof prog.activites === 'string') {
          activites = JSON.parse(prog.activites);
        } else if (Array.isArray(prog.activites)) {
          activites = prog.activites;
        }
      } catch (e) {
        console.error('Erreur parsing activités:', e);
        activites = [];
      }
      
      // Ajouter chaque activité (sans doublons)
      activites.forEach(act => {
        if (act && act.trim().length > 0) {
          activitesSet.add(act.trim());
        }
      });
    });
    
    const activitesList = Array.from(activitesSet);
    
    console.log(`✅ ${activitesList.length} activité(s) unique(s) extraite(s)`);
    console.log(`📊 Taux prévu total: ${tauxPrevu}%`);
    
    res.json({ 
      activites: activitesList,
      saName: saName || '',
      taux_prevu: tauxPrevu,
      count: activitesList.length,
      programmes: programmes.length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération activités programme:', error);
    res.status(500).json({ error: error.message });
  }
});


// GET /cahier/programme-activites-filtrees - Récupérer les activités en excluant celles déjà "fait"
router.get('/programme-activites-filtrees', authMiddleware, async (req, res) => {
  try {
    const { classe_id, discipline_nom, sa_number, discipline_id } = req.query;
    
    console.log('📥 Requête activités filtrées:', { classe_id, discipline_nom, sa_number, discipline_id });
    
    if (!classe_id || !discipline_nom || !sa_number || !discipline_id) {
      return res.status(400).json({ 
        error: 'Paramètres manquants', 
        required: ['classe_id', 'discipline_nom', 'sa_number', 'discipline_id'] 
      });
    }
    
    // 1. Récupérer toutes les activités du programme théorique
    const classe = await models.Classe.findByPk(classe_id);
    if (!classe) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }
    
    const normalizedSa = sa_number.replace(/\s+/g, '').toUpperCase();
    
    const programmes = await models.ProgramTheorique.findAll({
      where: {
        promotion: classe.promotion,
        discipline: discipline_nom,
        [Op.or]: [
          { sa: { [Op.like]: `%${normalizedSa}%` } },
          { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } }
        ]
      },
      order: [['semaine_numero', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'activites', 'sa', 'situation_apprentissage', 'semaine_numero', 'taux_prevu']
    });
    
    if (!programmes.length) {
      return res.json({ 
        activites: [], 
        saName: '', 
        taux_prevu: 0,
        message: 'Aucun programme trouvé' 
      });
    }
    
    // 2. Extraire toutes les activités du programme
    const activitesSet = new Set();
    let saName = '';
    let tauxPrevu = 0;
    
    programmes.forEach(prog => {
      if (!saName && prog.situation_apprentissage) {
        saName = prog.situation_apprentissage;
      }
      if (prog.taux_prevu) {
        tauxPrevu += parseFloat(prog.taux_prevu);
      }
      
      let activites = [];
      try {
        if (typeof prog.activites === 'string') {
          activites = JSON.parse(prog.activites);
        } else if (Array.isArray(prog.activites)) {
          activites = prog.activites;
        }
      } catch (e) {
        console.error('Erreur parsing activités:', e);
        activites = [];
      }
      
      activites.forEach(act => {
        if (act && act.trim().length > 0) {
          activitesSet.add(act.trim());
        }
      });
    });
    
    // 3. Récupérer toutes les entrées précédentes pour cette SA/discipline/classe
    const previousEntries = await models.CahierEntry.findAll({
      where: {
        teacher_id: req.user.id,
        discipline_id: parseInt(discipline_id),
        sa_number: sa_number
      },
      include: [{
        model: models.Discipline,
        as: 'discipline',
        where: { classe_id: parseInt(classe_id) },
        attributes: ['id', 'nom']
      }],
      attributes: ['id', 'activites_status'],
      order: [['created_at', 'DESC']]
    });
    
    console.log(`📚 ${previousEntries.length} entrée(s) précédente(s) trouvée(s)`);
    
    // 4. Construire la liste des activités déjà "fait"
    const activitesFaites = new Set();
    const activitesEnCours = new Set();
    const activitesStatus = {};
    
    previousEntries.forEach(entry => {
      if (entry.activites_status) {
        Object.entries(entry.activites_status).forEach(([activite, status]) => {
          if (status === 'fait') {
            activitesFaites.add(activite);
          } else if (status === 'en_cours') {
            activitesEnCours.add(activite);
            activitesStatus[activite] = 'en_cours';
          }
        });
      }
    });
    
    console.log(`✅ ${activitesFaites.size} activité(s) déjà faite(s)`);
    console.log(`🔄 ${activitesEnCours.size} activité(s) en cours`);
    
    // 5. Filtrer : enlever les activités "fait", garder celles "en cours" et "non faites"
    const activitesFiltrees = Array.from(activitesSet).filter(act => 
      !activitesFaites.has(act)
    );
    
    console.log(`📋 ${activitesFiltrees.length} activité(s) disponible(s) après filtrage`);
    
    res.json({ 
      activites: activitesFiltrees,
      activitesStatus: activitesStatus, // Retourner les statuts "en_cours"
      saName: saName || '',
      taux_prevu: tauxPrevu,
      count: activitesFiltrees.length,
      programmes: programmes.length,
      stats: {
        total: activitesSet.size,
        faites: activitesFaites.size,
        en_cours: activitesEnCours.size,
        disponibles: activitesFiltrees.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération activités filtrées:', error);
    res.status(500).json({ error: error.message });
  }
});




// GET /cahier/toutes-les-entrees-admin - Récupérer TOUTES les entrées (admin uniquement)
router.get('/toutes-les-entrees-admin', authMiddleware, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }

    console.log('📥 Admin: Récupération de toutes les entrées');

    const entries = await models.CahierEntry.findAll({
      include: [
        {
          model: models.Discipline,
          as: 'discipline',
          attributes: ['id', 'nom', 'classe_id'],
          include: [{
            model: models.Classe,
            as: 'Classe',
            attributes: ['id', 'nom', 'promotion', 'niveau']
          }]
        },
        {
          model: models.User,
          as: 'teacher',
          attributes: ['id', 'nom', 'prenoms', 'email']
        }
      ],
      order: [['date_cours', 'DESC'], ['created_at', 'DESC']]
    });

    console.log(`✅ ${entries.length} entrée(s) trouvée(s)`);
    res.json(entries);

  } catch (error) {
    console.error('❌ Erreur récupération toutes les entrées:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /cahier/programme-lots - Récupérer les lots d'activités structurés
router.get('/programme-lots', authMiddleware, async (req, res) => {
  try {
    const { classe_id, discipline_nom, sa_number, discipline_id } = req.query;
    
    console.log('📥 Requête lots d\'activités:', { classe_id, discipline_nom, sa_number });
    
    if (!classe_id || !discipline_nom || !sa_number) {
      return res.status(400).json({ 
        error: 'Paramètres manquants', 
        required: ['classe_id', 'discipline_nom', 'sa_number'] 
      });
    }
    
    // Récupérer la classe pour obtenir la promotion
    const classe = await models.Classe.findByPk(classe_id);
    if (!classe) {
      return res.status(404).json({ error: 'Classe non trouvée' });
    }
    
    const normalizedSa = sa_number.replace(/\s+/g, '').toUpperCase();
    
    // Récupérer TOUS les lots (lignes) du programme théorique pour cette SA
    const programmes = await models.ProgramTheorique.findAll({
      where: {
        promotion: classe.promotion,
        discipline: discipline_nom,
        [Op.or]: [
          { sa: { [Op.like]: `%${normalizedSa}%` } },
          { situation_apprentissage: { [Op.like]: `%${normalizedSa}%` } }
        ]
      },
      order: [['semaine_numero', 'ASC'], ['id', 'ASC']],
      attributes: ['id', 'activites', 'sa', 'situation_apprentissage', 'taux_prevu', 'semaine_numero']
    });
    
    if (!programmes.length) {
      return res.json({ 
        lots: [],
        saName: '',
        tauxTotal: 0,
        message: 'Aucun programme trouvé'
      });
    }
    
    // Récupérer les entrées précédentes pour savoir quels lots sont déjà complets
    const previousEntries = await models.CahierEntry.findAll({
      where: {
        teacher_id: req.user.id,
        discipline_id: parseInt(discipline_id),
        sa_number: sa_number
      },
      include: [{
        model: models.Discipline,
        as: 'discipline',
        where: { classe_id: parseInt(classe_id) },
        attributes: ['id']
      }],
      attributes: ['id', 'lots_activites_completes', 'activites_status']
    });
    
    // Construire la liste des lots déjà complets
    const lotsDejaComplets = new Set();
    const activitesDejaFaites = new Set();
    
    previousEntries.forEach(entry => {
      if (entry.lots_activites_completes && Array.isArray(entry.lots_activites_completes)) {
        entry.lots_activites_completes.forEach(lotId => lotsDejaComplets.add(lotId));
      }
      
      // Récupérer aussi les activités déjà faites
      if (entry.activites_status) {
        Object.entries(entry.activites_status).forEach(([activite, status]) => {
          if (status === 'fait') {
            activitesDejaFaites.add(activite);
          }
        });
      }
    });
    
    // Structurer les données par lot
    let saName = '';
    let tauxTotal = 0;
    const lots = [];
    
    programmes.forEach(prog => {
      if (!saName && prog.situation_apprentissage) {
        saName = prog.situation_apprentissage;
      }
      
      // Parser les activités du lot
      let activites = [];
      try {
        if (typeof prog.activites === 'string') {
          activites = JSON.parse(prog.activites);
        } else if (Array.isArray(prog.activites)) {
          activites = prog.activites;
        }
      } catch (e) {
        console.error('Erreur parsing activités:', e);
        activites = [];
      }
      
      // Nettoyer et filtrer les activités
      const activitesClean = activites
        .filter(a => a && a.trim().length > 0)
        .map(a => a.trim());
      
      if (activitesClean.length === 0) return; // Ignorer les lots vides
      
      const tauxPrevu = parseFloat(prog.taux_prevu) || 0;
      tauxTotal += tauxPrevu;
      
      // Vérifier si le lot est déjà complet
      const estComplet = lotsDejaComplets.has(prog.id);
      
      // Filtrer les activités : enlever celles déjà faites (sauf si tout le lot est complet)
      const activitesDisponibles = estComplet 
        ? [] // Si lot complet, ne plus afficher les activités
        : activitesClean.filter(a => !activitesDejaFaites.has(a));
      
      lots.push({
        id: prog.id,
        activites: activitesClean,
        activitesDisponibles: activitesDisponibles,
        tauxPrevu: tauxPrevu,
        estComplet: estComplet,
        semaineNumero: prog.semaine_numero
      });
    });
    
    console.log(`✅ ${lots.length} lot(s) structuré(s)`);
    console.log(`📊 Taux total: ${tauxTotal}%`);
    console.log(`✔️ ${lotsDejaComplets.size} lot(s) déjà complet(s)`);
    
    res.json({
      lots: lots,
      saName: saName,
      tauxTotal: tauxTotal,
      lotsComplets: Array.from(lotsDejaComplets),
      stats: {
        totalLots: lots.length,
        lotsComplets: lotsDejaComplets.size,
        lotsDisponibles: lots.filter(l => !l.estComplet).length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération lots:', error);
    res.status(500).json({ error: error.message });
  }
});

 
module.exports = router;