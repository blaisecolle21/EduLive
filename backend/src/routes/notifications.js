// routes/notifications.js
const express = require('express');
const router = express.Router();
const { models } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const progressionAnalyzer = require('../services/progressionAnalyzer');
const emailService = require('../services/emailService');
const { Op } = require('sequelize');

/**
 * Middleware pour vérifier si l'utilisateur est admin
 */
const isAdmin = (req, res, next) => {
  if (!['admin', 'coordinateur', 'directeur'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

/**
 * ✅ GET /api/notifications/enseignant
 * Récupérer les notifications d'un enseignant
 */
router.get('/enseignant', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, offset = 0, non_lues_seulement = false } = req.query;

    const where = { enseignant_id: req.user.id };
    if (non_lues_seulement === 'true') {
      where.est_lue = false;
    }

    const notifications = await models.Notification.findAll({
      where,
      include: [
        {
          model: models.Classe,
          as: 'classe',
          attributes: ['id', 'nom', 'promotion']
        },
        {
          model: models.Discipline,
          as: 'discipline',
          attributes: ['id', 'nom']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await models.Notification.count({ where });

    res.json({
      notifications,
      total,
      non_lues: await models.Notification.count({ 
        where: { ...where, est_lue: false } 
      })
    });

  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * ✅ GET /api/notifications/admin/toutes
 * Récupérer toutes les notifications (admin)
 */
router.get('/admin/toutes', authMiddleware, isAdmin, async (req, res) => {
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
          as: 'enseignant',
          attributes: ['id', 'nom', 'prenoms', 'email']
        },
        {
          model: models.Classe,
          as: 'classe',
          attributes: ['id', 'nom', 'promotion']
        },
        {
          model: models.Discipline,
          as: 'discipline',
          attributes: ['id', 'nom']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await models.Notification.count({ where });

    res.json({ notifications, total });

  } catch (error) {
    console.error('❌ Erreur récupération notifications admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * ✅ PUT /api/notifications/:id/marquer-lue
 * Marquer une notification comme lue
 */
router.put('/:id/marquer-lue', authMiddleware, async (req, res) => {
  try {
    const notification = await models.Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification introuvable' });
    }

    // Vérifier que c'est bien la notification de l'utilisateur
    if (notification.enseignant_id !== req.user.id && 
        !['admin', 'coordinateur', 'directeur'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await notification.update({
      est_lue: true,
      date_lecture: new Date()
    });

    res.json({ message: 'Notification marquée comme lue', notification });

  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * ✅ POST /api/notifications/admin/envoyer
 * Envoyer des notifications (admin)
 */
router.post('/admin/envoyer', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { 
      type_envoi, // 'tous', 'retard_excessif', 'avance_excessive', 'personnalisé'
      message_personnalise,
      titre_personnalise,
      enseignants_cibles = [] // Pour envoi personnalisé
    } = req.body;

    console.log('📨 Envoi de notifications:', type_envoi);

    let enseignants = [];
    let notificationsCreees = [];

    // 1. Récupérer les enseignants selon le type d'envoi
    if (type_envoi === 'personnalisé') {
      // Envoi personnalisé à des enseignants spécifiques
      if (!enseignants_cibles || enseignants_cibles.length === 0) {
        return res.status(400).json({ error: 'Aucun enseignant sélectionné' });
      }

      enseignants = await models.User.findAll({
        where: { 
          id: { [Op.in]: enseignants_cibles },
          role: 'enseignant'
        }
      });

      // Créer notification personnalisée pour chaque enseignant
      for (const enseignant of enseignants) {
        const notification = await models.Notification.create({
          enseignant_id: enseignant.id,
          type: 'admin_personnalisée',
          categorie: 'info',
          titre: titre_personnalise || 'Message de l\'administration',
          message: message_personnalise,
          email_envoye: false
        });

        notificationsCreees.push(notification);

        // Envoyer email
        const emailEnvoye = await emailService.envoyerMessagePersonnalise(
          [enseignant],
          titre_personnalise || 'Message de l\'administration',
          message_personnalise,
          `${req.user.prenoms} ${req.user.nom}`
        );

        if (emailEnvoye[0]?.success) {
          await notification.update({
            email_envoye: true,
            date_envoi_email: new Date()
          });
        }
      }

    } else {
      // Envoi automatique basé sur la progression
      enseignants = await models.User.findAll({
        where: { role: 'enseignant', est_actif: true },
        include: [{
          model: models.EnseignantDiscipline,
          as: 'EnseignantDisciplines',
          include: [{
            model: models.Discipline,
            as: 'Discipline',
            include: [{
              model: models.Classe,
              as: 'Classe'
            }]
          }]
        }]
      });

      for (const enseignant of enseignants) {
        // Pour chaque discipline enseignée
        for (const ed of enseignant.EnseignantDisciplines) {
          const discipline = ed.Discipline;
          const classe = discipline.Classe;

          try {
            // Analyser la progression
            const analyse = await progressionAnalyzer.analyserProgression(
              enseignant.id,
              classe.id,
              discipline.id
            );

            // Filtrer selon le type d'envoi
            let doitEnvoyer = false;

            if (type_envoi === 'tous') {
              doitEnvoyer = true;
            } 
            else if (type_envoi === 'retard_excessif') {
              doitEnvoyer = ['alerte', 'critique'].includes(analyse.categorie);
            }
            else if (type_envoi === 'avance_excessive') {
              doitEnvoyer = analyse.categorie === 'avance_excessive';
            }

            if (doitEnvoyer) {
              // Créer la notification
              const notification = await models.Notification.create({
                enseignant_id: enseignant.id,
                type: type_envoi === 'tous' ? 'admin_global' : 'admin_ciblée',
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
                email_envoye: false
              });

              notificationsCreees.push(notification);

              // Envoyer email
              const emailEnvoye = await emailService.envoyerNotification(
                enseignant,
                notification
              );

              if (emailEnvoye) {
                await notification.update({
                  email_envoye: true,
                  date_envoi_email: new Date()
                });
              }
            }

          } catch (error) {
            console.error(`❌ Erreur analyse enseignant ${enseignant.id}:`, error);
          }
        }
      }
    }

    // 2. Enregistrer l'envoi admin
    await models.NotificationEnvoiAdmin.create({
      admin_id: req.user.id,
      type_envoi,
      message_personnalise: type_envoi === 'personnalisé' ? message_personnalise : null,
      enseignants_cibles: type_envoi === 'personnalisé' ? enseignants_cibles : null,
      nombre_envois: notificationsCreees.length
    });

    res.json({
      message: 'Notifications envoyées avec succès',
      nombre_notifications: notificationsCreees.length,
      enseignants_notifies: enseignants.length
    });

  } catch (error) {
    console.error('❌ Erreur envoi notifications:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi des notifications',
      details: error.message 
    });
  }
});

/**
 * ✅ POST /api/notifications/auto-progression
 * Créer une notification automatique après ajout d'entrée (appelé par cahier routes)
 */
router.post('/auto-progression', authMiddleware, async (req, res) => {
  try {
    const { enseignant_id, classe_id, discipline_id } = req.body;

    console.log('🔔 Création notification auto-progression');

    // Analyser la progression
    const analyse = await progressionAnalyzer.analyserProgression(
      enseignant_id,
      classe_id,
      discipline_id
    );

    // Créer la notification
    const notification = await models.Notification.create({
      enseignant_id,
      type: 'auto_progression',
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
      email_envoye: false // Pas d'email pour notification auto
    });

    res.json({ 
      message: 'Notification créée',
      notification 
    });

  } catch (error) {
    console.error('❌ Erreur création notification auto:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * ✅ GET /api/notifications/statistiques
 * Statistiques des notifications (admin)
 */
router.get('/statistiques', authMiddleware, isAdmin, async (req, res) => {
  try {
    const stats = {
      total: await models.Notification.count(),
      par_categorie: {},
      par_type: {},
      non_lues: await models.Notification.count({ where: { est_lue: false } }),
      emails_envoyes: await models.Notification.count({ where: { email_envoye: true } })
    };

    // Stats par catégorie
    const categories = ['felicitations', 'encouragement', 'avertissement', 'alerte', 'critique', 'avance_excessive', 'info'];
    for (const cat of categories) {
      stats.par_categorie[cat] = await models.Notification.count({ 
        where: { categorie: cat } 
      });
    }

    // Stats par type
    const types = ['auto_progression', 'admin_global', 'admin_ciblée', 'admin_personnalisée'];
    for (const type of types) {
      stats.par_type[type] = await models.Notification.count({ 
        where: { type } 
      });
    }

    res.json(stats);

  } catch (error) {
    console.error('❌ Erreur statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;