// anneeAcademiqueService.js
const { models } = require('../config/database'); // Assurez-vous que le chemin est correct

const getActiveAnneeAcademiqueId = async () => {
  try {
    const activeAnnee = await models.AnneeAcademique.findOne({
      where: { est_active: true },
      attributes: ['id']
    });

    if (!activeAnnee) {
      throw new Error('Aucune année académique active trouvée');
    }

    return activeAnnee.id;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'année académique active:', error);
    throw error;
  }
};

module.exports = { getActiveAnneeAcademiqueId };