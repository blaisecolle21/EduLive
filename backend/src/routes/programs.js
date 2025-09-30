const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const { models } = require('../config/database');
const authMiddleware = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// Fonction pour convertir semaine_dates en date_debut et date_fin
const parseDates = (semaineDates, mois) => {
  if (!semaineDates) return { date_debut: null, date_fin: null };
  const [start, end] = semaineDates.split(' au ').map(d => parseInt(d));
  if (!start || !end) return { date_debut: null, date_fin: null };
  const moisMap = { 'SEPT': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12, 'JANV': 1, 'FEV': 2, 'MARS': 3, 'AVRIL': 4, 'MAI': 5, 'JUIN': 6 };
  const moisNum = moisMap[mois] || 9; // Par défaut SEPT
  const year = moisNum >= 9 ? 2025 : 2026; // Année scolaire 2025-2026
  return {
    date_debut: new Date(year, moisNum - 1, start).toISOString().split('T')[0],
    date_fin: new Date(year, moisNum - 1, end).toISOString().split('T')[0]
  };
};

// Récupérer l'ID de l'année académique active
const getActiveAnneeAcademiqueId = async () => {
  const annee = await models.AnneeAcademique.findOne({ where: { est_active: true } });
  return annee ? annee.id : null;
};

router.post('/import', authMiddleware, isAdmin, upload.single('pdf'), async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);
    const text = data.text.replace(/[’‘]/g, "'").replace(/[—–]/g, "-").replace(/[^a-zA-Z0-9 \n:./-]/g, " ").replace(/(\w)  +(\w)/g, '$1 $2'); // Nettoyage amélioré
    console.log('Texte brut extrait:', text);

    const anneeAcademiqueId = await getActiveAnneeAcademiqueId();
    if (!anneeAcademiqueId) throw new Error('Aucune année académique active trouvée');

    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let currentPromotion = '';
    let currentDiscipline = '';
    let currentEntry = { activites: '', situation_apprentissage: '' };
    let currentTrimestre = '';
    let currentMois = '';
    const entries = [];
    let isTable = false;
    const seenEntries = new Set();
    let weekCounter = 1; // Compteur pour numéroter les semaines de 1 à 30

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      console.log('Ligne analysée:', line); // Débogage
      if (line.includes('Promotion :')) {
        currentPromotion = line.split('Promotion :')[1].trim();
      } else if (line.includes('Discipline :')) {
        currentDiscipline = line.split('Discipline :')[1].trim();
      } else if (line.includes('Année scolaire :')) {
        const libelle = line.split('Année scolaire :')[1].trim();
        const annee = await models.AnneeAcademique.findOne({ where: { libelle } });
        currentEntry.annee_academique_id = annee ? annee.id : anneeAcademiqueId;
      } else if (line.match(/1er|2e|3e\s*trimestre/)) {
        currentTrimestre = line.match(/1er|2e|3e/)?.[0] || currentTrimestre;
        isTable = true;
      } else if (line.includes('Mois') || line.match(/SEPT|OCT|NOV|DEC|JANV|FEV|MARS|AVRIL|MAI|JUIN/)) {
        currentMois = line.match(/SEPT|OCT|NOV|DEC|JANV|FEV|MARS|AVRIL|MAI|JUIN/)?.[0] || currentMois;
        isTable = true;
      } else if (line.includes('Cotonou le') || line.includes('Amour SOTINKON') || line.includes('Route de l a roport') || line.includes('MINISTERE DES ENSEIGNEMENTS')) {
        isTable = false;
      } else if (isTable) {
        const semaineMatch = line.match(/(\d+[- ])\s*(\d+ au \d+)/) || line.match(/\d+ au \d+/);
        const saMatch = line.match(/SA\d+|CONGES|Période|production scolaire|Remédiation/);
        const tauxPrevMatch = line.match(/Pr vu[:\s]*(\d+\.\d)/) || line.match(/(\d+\.\d)(?!\s*R alis)/);
        const tauxCumMatch = line.match(/Pr vu Cumul[:\s]*(\d+\.\d)/) || line.match(/Taux Cumul[:\s]*(\d+\.\d)/);
        const observationMatch = line.match(/Du (?:vendredi|jeudi|dimanche) \d+.*?\d+$/);

        if (semaineMatch) {
          const semaineDates = semaineMatch[0]?.includes('au') ? semaineMatch[0] : semaineMatch[2];
          const [start] = semaineDates.split(' au ').map(d => parseInt(d));
          currentEntry.semaine_numero = weekCounter; // Utilise le compteur au lieu de start
          currentEntry.semaine_dates = semaineDates;
          const { date_debut, date_fin } = parseDates(semaineDates, currentMois);
          currentEntry.date_debut = date_debut;
          currentEntry.date_fin = date_fin;
          weekCounter++; // Incrémente le compteur pour la prochaine semaine
        }

        if (saMatch) {
          currentEntry.sa = saMatch[0].replace('P.riode', 'Période').replace('Rem.diation', 'Remédiation');
          currentEntry.situation_apprentissage = currentEntry.sa;
        }

        if (tauxPrevMatch) currentEntry.taux_prevu = parseFloat(tauxPrevMatch[1]);
        if (tauxCumMatch) currentEntry.taux_cumule_prevu = parseFloat(tauxCumMatch[1]);
        if (observationMatch) currentEntry.observations = line;

        if (line.match(/Activit[ée]\s*\d+[:\s]/) || line.match(/[-•]/) || (!semaineMatch && !saMatch && !tauxPrevMatch && !observationMatch && line && !line.includes('Cotonou') && !line.includes('MINISTERE'))) {
          currentEntry.activites += line.replace(/(\w)  +(\w)/g, '$1 $2').replace(/R alis/g, 'Réalisé') + ' ';
        }

        if ((semaineMatch || saMatch) && currentEntry.semaine_dates && currentPromotion && currentDiscipline) {
          const uniqueKey = `${currentPromotion}-${currentDiscipline}-${currentEntry.annee_academique_id}-${currentTrimestre}-${currentEntry.semaine_numero}-${currentEntry.sa}`;
          if (!seenEntries.has(uniqueKey)) {
            entries.push({
              promotion: currentPromotion,
              discipline: currentDiscipline,
              annee_academique_id: currentEntry.annee_academique_id || anneeAcademiqueId,
              trimestre: currentTrimestre,
              mois: currentMois,
              semaine_numero: currentEntry.semaine_numero,
              semaine_dates: currentEntry.semaine_dates,
              sa: currentEntry.sa || '',
              situation_apprentissage: currentEntry.situation_apprentissage || '',
              activites: currentEntry.activites.trim() || '',
              taux_prevu: currentEntry.taux_prevu || null,
              taux_cumule_prevu: currentEntry.taux_cumule_prevu || null,
              observations: currentEntry.observations || ''
            });
            seenEntries.add(uniqueKey);
          } else {
            console.warn(`Doublon détecté, clé : ${uniqueKey}`);
          }
          currentEntry = { activites: '', situation_apprentissage: '', annee_academique_id: anneeAcademiqueId, trimestre: currentTrimestre, mois: currentMois };
        }
      }
    }

    if (currentEntry.semaine_dates && currentPromotion && currentDiscipline) {
      const uniqueKey = `${currentPromotion}-${currentDiscipline}-${currentEntry.annee_academique_id}-${currentTrimestre}-${currentEntry.semaine_numero}-${currentEntry.sa}`;
      if (!seenEntries.has(uniqueKey)) {
        entries.push({
          promotion: currentPromotion,
          discipline: currentDiscipline,
          annee_academique_id: currentEntry.annee_academique_id || anneeAcademiqueId,
          trimestre: currentTrimestre,
          mois: currentMois,
          semaine_numero: currentEntry.semaine_numero,
          semaine_dates: currentEntry.semaine_dates,
          sa: currentEntry.sa || '',
          situation_apprentissage: currentEntry.situation_apprentissage || '',
          activites: currentEntry.activites.trim() || '',
          taux_prevu: currentEntry.taux_prevu || null,
          taux_cumule_prevu: currentEntry.taux_cumule_prevu || null,
          observations: currentEntry.observations || ''
        });
        seenEntries.add(uniqueKey);
      } else {
        console.warn(`Doublon détecté, clé : ${uniqueKey}`);
      }
    }

    console.log('Entrées à insérer:', JSON.stringify(entries, null, 2));

    const insertedCount = await models.ProgramTheorique.bulkCreate(entries, { ignoreDuplicates: true });
    console.log(`Nombre d'entrées insérées : ${insertedCount.length}`);

    res.json({ message: 'PDF importé et données insérées dans la base', entries, insertedCount: insertedCount.length });
  } catch (error) {
    console.error('Erreur import:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import du PDF', details: error.message });
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

module.exports = router;