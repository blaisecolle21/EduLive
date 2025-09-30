const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { models } = require('../config/database');


// Middleware pour vérifier si admin
const isAdmin = (req, res, next) => {
  console.log('User role:', req.user.role); // Débogage
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// Lister les utilisateurs (Read)
router.get('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await models.User.findAll({
      attributes: ['id','nom', 'prenoms', 'email', 'role', 'etablissement_id', 'est_actif', 'derniere_connexion'],
      include: [{
        model: models.Etablissement,
        as: 'Etablissement',
        attributes: ['nom'] // Récupérer seulement le nom de l'établissement
      }]
    });
    console.log('Utilisateurs envoyés:', users); // Débogage
    res.json(users);
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    res.status(500).json({ error: error.message });
  }
});


// Mettre à jour un utilisateur (Update)
router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await models.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    await user.update(req.body); // Champs comme nom, role, est_actif ; mot_de_passe sera hashé si fourni
    res.json({ message: 'Utilisateur mis à jour' });
  } catch (error) {
    console.error('Erreur mise à jour:', error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un utilisateur (Delete)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await models.User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    await user.destroy();
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Erreur suppression:', error);
    res.status(500).json({ error: error.message });
  }
});


// Profil utilisateur
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await models.User.findByPk(req.user.id, {
      attributes: ['id','nom', 'prenoms', 'email', 'role', 'etablissement_id', 'est_actif', 'derniere_connexion']
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;