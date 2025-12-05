// services/progressionAnalyzer.js
const { models } = require('../config/database');
const { Op } = require('sequelize');

class ProgressionAnalyzer {
  /**
   * Analyser la progression d'un enseignant pour une discipline/classe
   */
  async analyserProgression(enseignantId, classeId, disciplineId) {
    try {
      // 1. Récupérer les données de base
      const classe = await models.Classe.findByPk(classeId);
      const discipline = await models.Discipline.findByPk(disciplineId);
      const anneeActive = await models.AnneeAcademique.findOne({ 
        where: { est_active: true } 
      });

      if (!classe || !discipline || !anneeActive) {
        throw new Error('Données de base introuvables');
      }

      // 2. Récupérer les programmes théoriques (ordre chronologique)
      const programmesTheoriques = await models.ProgramTheorique.findAll({
        where: {
          promotion: classe.promotion,
          discipline: discipline.nom,
          annee_academique_id: anneeActive.id
        },
        order: [
          ['trimestre', 'ASC'],
          ['semaine_numero', 'ASC'],
          ['id', 'ASC']
        ]
      });

      // 3. Récupérer les entrées de cahier
      const cahierEntries = await models.CahierEntry.findAll({
        where: {
          teacher_id: enseignantId,
          discipline_id: disciplineId
        },
        include: [{
          model: models.Discipline,
          as: 'discipline',
          where: { classe_id: classeId }
        }],
        order: [['date_cours', 'DESC']]
      });

      // 4. Identifier les lots terminés
      const lotsTerminesIds = new Set();
      cahierEntries.forEach(entry => {
        const lots = entry.lots_activites_completes || [];
        lots.forEach(id => lotsTerminesIds.add(id));
      });

      // 5. Vérifier la chronologie
      const chronologieResult = this.verifierChronologie(
        Array.from(lotsTerminesIds),
        programmesTheoriques
      );

      // 6. Calculer le taux réalisé
      const { tauxRealise, dernierLotTermine } = this.calculerTauxRealise(
        chronologieResult.lotsChronologiques,
        programmesTheoriques
      );

      // 7. Déterminer la période attendue
      const periodeAttendue = this.determinerPeriodeAttendue(
        dernierLotTermine,
        programmesTheoriques
      );

      // 8. Calculer l'écart
      const ecartJours = this.calculerEcartJours(
        cahierEntries[0]?.date_cours,
        periodeAttendue,
        anneeActive.libelle
      );

      // 9. Déterminer la catégorie et le message
      const analyse = this.genererAnalyse(
        ecartJours,
        tauxRealise,
        periodeAttendue,
        chronologieResult
      );

      return {
        enseignant_id: enseignantId,
        classe_id: classeId,
        discipline_id: disciplineId,
        progression_actuelle: tauxRealise,
        ecart_jours: ecartJours,
        semaine_attendue: periodeAttendue.semaine_dates,
        mois_attendu: periodeAttendue.mois,
        probleme_chronologie: !chronologieResult.respecteChronologie,
        details_chronologie: chronologieResult.message,
        ...analyse
      };

    } catch (error) {
      console.error('Erreur analyse progression:', error);
      throw error;
    }
  }

  /**
   * Vérifier si les lots suivent la chronologie
   */
  verifierChronologie(lotsTerminesIds, programmesTheoriques) {
    const lotsChronologiques = [];
    let respecteChronologie = true;
    let message = '';

    // Créer un index des programmes par ID
    const progMap = new Map();
    programmesTheoriques.forEach(prog => progMap.set(prog.id, prog));

    // Parcourir les programmes dans l'ordre chronologique
    for (let i = 0; i < programmesTheoriques.length; i++) {
      const prog = programmesTheoriques[i];
      
      if (lotsTerminesIds.includes(prog.id)) {
        // Ce lot est terminé
        
        // Vérifier si les lots précédents sont aussi terminés
        const lotsPrecedents = programmesTheoriques.slice(0, i);
        const lotsPrecedentsNonTermines = lotsPrecedents.filter(
          p => !lotsTerminesIds.includes(p.id)
        );

        if (lotsPrecedentsNonTermines.length > 0) {
          respecteChronologie = false;
          message = `Attention : ${lotsPrecedentsNonTermines.length} lot(s) précédent(s) non terminé(s). ` +
                   `Veuillez suivre la chronologie de la planification annuelle.`;
          break; // Arrêter dès qu'on détecte un problème
        }

        lotsChronologiques.push(prog.id);
      }
    }

    return {
      respecteChronologie,
      lotsChronologiques,
      message
    };
  }

  /**
   * Calculer le taux réalisé basé sur les lots chronologiques
   */
  calculerTauxRealise(lotsChronologiquesIds, programmesTheoriques) {
    let tauxRealise = 0;
    let dernierLotTermine = null;

    programmesTheoriques.forEach(prog => {
      if (lotsChronologiquesIds.includes(prog.id)) {
        tauxRealise += parseFloat(prog.taux_prevu) || 0;
        dernierLotTermine = prog;
      }
    });

    return {
      tauxRealise: Math.round(tauxRealise * 100) / 100,
      dernierLotTermine
    };
  }

  /**
   * Déterminer la période attendue (semaine + mois)
   */
  determinerPeriodeAttendue(dernierLotTermine, programmesTheoriques) {
    if (!dernierLotTermine) {
      // Aucun lot terminé, retourner le premier programme
      const premier = programmesTheoriques[0];
      return {
        semaine_dates: premier?.semaine_dates || '',
        mois: premier?.mois || 'SEPT',
        date_debut: premier?.date_debut,
        date_fin: premier?.date_fin
      };
    }

    return {
      semaine_dates: dernierLotTermine.semaine_dates,
      mois: dernierLotTermine.mois,
      date_debut: dernierLotTermine.date_debut,
      date_fin: dernierLotTermine.date_fin
    };
  }

  /**
   * Calculer l'écart en jours (positif = avance, négatif = retard)
   */
  calculerEcartJours(dateRealisationStr, periodeAttendue, anneeScolaire) {
    if (!dateRealisationStr || !periodeAttendue.date_debut || !periodeAttendue.date_fin) {
      return 0;
    }

    const dateRealisation = new Date(dateRealisationStr);
    const dateDebut = new Date(periodeAttendue.date_debut);
    const dateFin = new Date(periodeAttendue.date_fin);

    // Si dans la période : écart = 0 (à jour)
    if (dateRealisation >= dateDebut && dateRealisation <= dateFin) {
      return 0;
    }

    // Si avant la période : avance
    if (dateRealisation < dateDebut) {
      const diff = Math.floor((dateDebut - dateRealisation) / (1000 * 60 * 60 * 24));
      return diff; // Positif
    }

    // Si après la période : retard
    if (dateRealisation > dateFin) {
      const diff = Math.floor((dateRealisation - dateFin) / (1000 * 60 * 60 * 24));
      return -diff; // Négatif
    }

    return 0;
  }

  /**
   * Générer l'analyse complète avec catégorie et message
   */
  genererAnalyse(ecartJours, tauxRealise, periodeAttendue, chronologieResult) {
    let categorie, titre, message;

    // Cas particulier : problème de chronologie
    if (!chronologieResult.respecteChronologie) {
      return {
        categorie: 'avertissement',
        titre: '⚠️ Attention à la chronologie',
        message: chronologieResult.message
      };
    }

    // Cas 1 : À jour (écart = 0)
    if (ecartJours === 0) {
      categorie = 'felicitations';
      titre = '🎯 Bravo ! Vous êtes à jour';
      message = `Excellente gestion de votre progression ! Vous êtes parfaitement aligné avec le programme théorique pour la période ${periodeAttendue.semaine_dates} (${periodeAttendue.mois}). Continuez ainsi ! 💪`;
    }

    // Cas 2 : Retard
    else if (ecartJours < 0) {
      const joursRetard = Math.abs(ecartJours);

      if (joursRetard < 7) {
        categorie = 'encouragement';
        titre = '⏰ Léger retard détecté';
        message = `Vous avez un retard de ${joursRetard} jour(s) par rapport à la progression prévue. ` +
                 `Pas de panique ! Un petit effort supplémentaire vous permettra de vous remettre à jour rapidement. ` +
                 `Période attendue : ${periodeAttendue.semaine_dates} ${periodeAttendue.mois}.`;
      } 
      else if (joursRetard >= 7 && joursRetard < 14) {
        categorie = 'avertissement';
        titre = '⚠️ Retard modéré';
        message = `Attention : vous accusez un retard de ${joursRetard} jours. ` +
                 `Il est important de faire diligence pour vous rattraper. ` +
                 `Période attendue : ${periodeAttendue.semaine_dates} ${periodeAttendue.mois}. ` +
                 `N'hésitez pas à intensifier votre rythme ces prochains jours.`;
      }
      else if (joursRetard >= 14 && joursRetard <= 21) {
        categorie = 'alerte';
        titre = '🚨 Retard important';
        message = `Vous êtes en retard de ${joursRetard} jours, ce qui n'est pas idéal pour le niveau des apprenants. ` +
                 `Période attendue : ${periodeAttendue.semaine_dates} ${periodeAttendue.mois}. ` +
                 `💡 Suggestion : organisez une ou deux séances de rattrapage pour combler ce retard.`;
      }
      else {
        categorie = 'critique';
        titre = '🔴 RETARD CRITIQUE';
        message = `SITUATION CRITIQUE : vous avez un retard de ${joursRetard} jours par rapport à la progression normale. ` +
                 `Période attendue : ${periodeAttendue.semaine_dates} ${periodeAttendue.mois}. ` +
                 `⚠️ Action requise : Veuillez contacter l'administration au plus vite si une situation empêche l'évolution normale du cours dans votre classe.`;
      }
    }

    // Cas 3 : Avance
    else {
      const joursAvance = ecartJours;

      if (joursAvance < 7) {
        categorie = 'felicitations';
        titre = '⭐ Excellent ! Vous êtes en avance';
        message = `Félicitations ! Vous avez ${joursAvance} jour(s) d'avance sur le programme prévu. ` +
                 `Période de référence : ${periodeAttendue.semaine_dates} ${periodeAttendue.mois}. ` +
                 `Maintenez ce bon rythme ! 🚀`;
      }
      else if (joursAvance >= 7 && joursAvance < 14) {
        categorie = 'felicitations';
        titre = '🌟 Très bon travail !';
        message = `Bravo pour votre excellent travail ! Vous avez ${joursAvance} jours d'avance. ` +
                 `Période de référence : ${periodeAttendue.semaine_dates} ${periodeAttendue.mois}. ` +
                 `💡 Conseil : profitez de cette avance pour inclure quelques moments d'exercices dans vos prochains cours.`;
      }
      else if (joursAvance >= 14 && joursAvance <= 21) {
        categorie = 'avertissement';
        titre = '⚡ Avance importante';
        message = `Vous avez ${joursAvance} jours d'avance, ce qui est une avance un peu excessive. ` +
                 `Période de référence : ${periodeAttendue.semaine_dates} ${periodeAttendue.mois}. ` +
                 `Veillez à ce que les apprenants aient le temps d'assimiler les notions.`;
      }
      else {
        categorie = 'avance_excessive';
        titre = '⚠️ Avance trop importante';
        message = `ATTENTION : vous avez ${joursAvance} jours d'avance, ce qui est trop critique. ` +
                 `Période de référence : ${periodeAttendue.semaine_dates} ${periodeAttendue.mois}. ` +
                 `🛑 Ralentissez un peu et faites des séances d'exercices pour permettre aux apprenants d'assimiler ce qui est déjà fait.`;
      }
    }

    return { categorie, titre, message };
  }
}

module.exports = new ProgressionAnalyzer();