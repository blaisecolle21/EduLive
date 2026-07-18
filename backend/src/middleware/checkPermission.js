const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Utilisateur non connecté ou non authentifié." });
    }

    // PASSE-DROIT ADMIN : Si role_id vaut 1 (Admin), on valide directement
    // (Ajuste le chiffre si l'ID de ton rôle Admin en base de données est différent)
    if (parseInt(req.user.role_id) === 1) {
      return next();
    }

    const userPermissions = req.user.permissions || [];

    if (userPermissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({
      error: `Accès refusé. Vous ne possédez pas la permission requise : [${requiredPermission}]`,
    });
  };
};

module.exports = checkPermission;
