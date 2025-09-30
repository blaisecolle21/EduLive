const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Aucun token fourni.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Ajoute les infos de l'utilisateur (id, email, role) à la requête
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide.' });
  }
};

module.exports = authMiddleware;