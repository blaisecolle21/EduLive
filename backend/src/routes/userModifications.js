const express = require('express');
const router = express.Router();
const { models } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    next();
};

// ── Enseignant : créer une demande ──────────────────────────
router.post('/', authMiddleware, async (req, res) => {


    try {
        const { champ, ancienne_valeur, nouvelle_valeur } = req.body;



        const champsAutorises = ['nom', 'prenoms', 'email', 'telephone'];
        if (!champsAutorises.includes(champ)) {
            return res.status(400).json({ error: 'Champ non autorisé' });
        }

        // Bloquer si une demande en attente existe déjà pour ce champ
        const dejaEnAttente = await models.UserModification.findOne({
            where: { user_id: req.user.id, champ, statut: 'en attente' }
        });
        if (dejaEnAttente) {
            return res.status(400).json({
                error: `Une demande est déjà en attente pour le champ "${champ}"`
            });
        }

        const demande = await models.UserModification.create({
            user_id: req.user.id,
            champ,
            ancienne_valeur: ancienne_valeur || null,
            nouvelle_valeur,
            statut: 'en attente'
        });

        res.status(201).json({ message: 'Demande soumise avec succès', demande });
    } catch (error) {
        console.error('Erreur création demande:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── Admin : lister toutes les demandes en attente ────────────
router.get('/', authMiddleware, isAdmin, async (req, res) => {
    try {
        const modifications = await models.UserModification.findAll({
            where: { statut: 'en attente' },
            include: [{
                model: models.User,
                as: 'user',
                attributes: ['id', 'nom', 'prenoms', 'email', 'telephone']
            }],
            order: [['created_at', 'ASC']]
        });
        res.json(modifications);
    } catch (error) {
        console.error('Erreur récupération:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── Admin : valider ──────────────────────────────────────────
router.post('/:id/validate', authMiddleware, isAdmin, async (req, res) => {
    try {
        const modif = await models.UserModification.findByPk(req.params.id);
        if (!modif) return res.status(404).json({ error: 'Demande non trouvée' });
        if (modif.statut !== 'en attente') {
            return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
        }

        const user = await models.User.findByPk(modif.user_id);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        await user.update({ [modif.champ]: modif.nouvelle_valeur });
        await modif.update({ statut: 'validé' });

        res.json({ message: 'Modification validée et appliquée' });
    } catch (error) {
        console.error('Erreur validation:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── Admin : refuser ──────────────────────────────────────────
router.post('/:id/reject', authMiddleware, isAdmin, async (req, res) => {
    try {
        const modif = await models.UserModification.findByPk(req.params.id);
        if (!modif) return res.status(404).json({ error: 'Demande non trouvée' });
        if (modif.statut !== 'en attente') {
            return res.status(400).json({ error: 'Cette demande a déjà été traitée' });
        }

        await modif.update({
            statut: 'refusé',
            commentaire: req.body.commentaire || null
        });

        res.json({ message: 'Demande refusée' });
    } catch (error) {
        console.error('Erreur refus:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;