const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const { models } = require('../config/database');
const { getActiveAnneeAcademiqueId } = require('../services/anneeAcademiqueService');
const authMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const upload = multer({ dest: 'uploads/' });

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

const parseDates = (semaineDates, mois, startingYear) => {
  if (!semaineDates) return { date_debut: null, date_fin: null };
  
  const match = semaineDates.match(/(\d+)\s*(?:au|\/)\s*(\d+)/);
  if (!match) return { date_debut: null, date_fin: null };
  
  const startDay = parseInt(match[1]);
  const endDay = parseInt(match[2]);
  
  if (!startDay || !endDay || startDay < 1 || endDay < 1) {
    return { date_debut: null, date_fin: null };
  }
  
  const moisMap = {
    'SEPT': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
    'JANV': 0, 'FEV': 1, 'MARS': 2, 'AVRIL': 3, 'MAI': 4, 'JUIN': 5
  };
  
  const moisNum = moisMap[mois] || 8;
  const year = moisNum >= 8 ? startingYear : startingYear + 1;
  
  return {
    date_debut: new Date(year, moisNum, startDay).toISOString().split('T')[0],
    date_fin: new Date(year, moisNum, endDay).toISOString().split('T')[0]
  };
};

router.post('/import', authMiddleware, isAdmin, upload.single('pdf'), async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);
    
    let text = data.text;
    
    console.log('=== DÉBUT DU PARSING ===');
    
    const anneeAcademiqueId = await getActiveAnneeAcademiqueId();
    if (!anneeAcademiqueId) throw new Error('Aucune année académique active trouvée');

    const importBatchId = uuidv4();
    
    // === EXTRACTION DES MÉTADONNÉES ===
    // Amélioration pour capturer "3e", "Tle C", etc.
    const promotionMatch = text.match(/Promotion\s*:\s*([0-9]+\s*e|[A-Z][a-z]*\s*[A-Z]|[\w\s]+?)(?:\s|$)/i);
    let currentPromotion = '';
    if (promotionMatch) {
      currentPromotion = promotionMatch[1].trim();
      // Nettoyer les espaces excessifs
      currentPromotion = currentPromotion.replace(/\s+/g, ' ');
    }
    console.log('✓ Promotion:', currentPromotion);
    
    const disciplineMatch = text.match(/Discipline\s*:\s*(\w+)/i);
    const currentDiscipline = disciplineMatch ? disciplineMatch[1].trim() : '';
    console.log('✓ Discipline:', currentDiscipline);
    
    const yearMatch = text.match(/Année\s+scolaire\s*:\s*(\d{4})/i);
    const startingYear = yearMatch ? parseInt(yearMatch[1]) : 2025;
    console.log('✓ Année scolaire:', startingYear);
    
    if (!currentPromotion || !currentDiscipline) {
      throw new Error('Métadonnées incomplètes');
    }
    
    // === TROUVER LE DÉBUT DU TABLEAU ===
    const tableStartMatch = text.match(/Prévu\s+Réalisé\s+Prévu\s+Réalisé/i);
    if (!tableStartMatch) {
      throw new Error('Début du tableau non trouvé');
    }
    
    const tableText = text.substring(tableStartMatch.index + tableStartMatch[0].length);
    console.log('✓ Tableau trouvé');
    
    // === PATTERN BASÉ SUR LES NUMÉROS DE SEMAINE (0-22) ===
    // Format: MOIS numero- dates SA ...
    // Le numéro (0-22) est la clé pour identifier les vraies lignes
    const lignePattern = /(SEPT|OCT|NOV|DEC|JANV|FEV|MARS|AVRIL|MAI|JUIN)\s+(\d+)[- ]\s+(\d+(?:\/\d+)?\s+au\s+(?:\d+(?:\/\d+)?|[\d\/]+))\s+(SA\s*\d+(?:\s*\([^)]*\))?|CONGES|Période|PRE-RENTREE)/gi;
    
    const matches = [...tableText.matchAll(lignePattern)];
    
    console.log(`\n=== ${matches.length} lignes avec numéros de semaine détectées ===`);
    
    const entries = [];
    let currentTrimestre = '1';
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      
      const mois = match[1];
      const numeroSemaine = parseInt(match[2]);
      const dates = match[3].trim().replace(/\n/g, ' ');
      let sa = match[4].trim();
      
      // Ignorer semaine 0 (PRE-RENTREE) et les lignes spéciales
      if (numeroSemaine === 0) {
        console.log(`\n--- Semaine ${numeroSemaine} ignorée (PRE-RENTREE) ---`);
        continue;
      }
      
      // Ignorer les lignes sans vraies activités pédagogiques
      if (sa.match(/Période\s+d'intégration|CONGES|production\s+scolaire|Evaluation|Révision|Remédiation|Compte\s+rendu|Autres\s+activités/i)) {
        console.log(`\n--- Semaine ${numeroSemaine} ignorée (${sa}) ---`);
        continue;
      }
      
      console.log(`\n--- Semaine ${numeroSemaine} ---`);
      console.log('Mois:', mois);
      console.log('Dates:', dates);
      console.log('SA:', sa);
      
      // === EXTRAIRE LE CONTENU ENTRE CETTE LIGNE ET LA SUIVANTE ===
      const startIndex = match.index + match[0].length;
      const endIndex = nextMatch ? nextMatch.index : tableText.length;
      let fullContent = tableText.substring(startIndex, endIndex);
      
      // === EXTRACTION DES TAUX (avant nettoyage) ===
      let tauxPrevu = null;
      let tauxCumule = null;
      
      const tauxMatches = [...fullContent.matchAll(/\b(\d+\.?\d*)\s+(\d+\.?\d*)\b/g)];
      if (tauxMatches.length > 0) {
        // Prendre la première paire valide (généralement la bonne)
        for (const tm of tauxMatches) {
          const val1 = parseFloat(tm[1]);
          const val2 = parseFloat(tm[2]);
          
          // Valider: taux prévu entre 1-15, taux cumulé entre 1-100
          if (val1 >= 1 && val1 <= 15 && val2 >= 1 && val2 <= 100) {
            tauxPrevu = val1;
            tauxCumule = val2;
            break;
          }
        }
      }
      
      console.log('Taux extraits:', tauxPrevu, '/', tauxCumule);
      
      // === NETTOYAGE AGRESSIF POUR ISOLER LA COLONNE ACTIVITÉS ===
      let contentText = fullContent;
      
      // 1. Supprimer les taux
      contentText = contentText.replace(/\d+\.?\d*\s+\d+\.?\d*/g, '');
      contentText = contentText.replace(/\b\d+,\d+\b/g, '');
      
      // 2. Supprimer toutes les dates
      contentText = contentText.replace(/\d+\/\d+\/\d+/g, '');
      contentText = contentText.replace(/\d+\/\d+\s+au\s+\d+\/\d+/g, '');
      contentText = contentText.replace(/\d+\s+au\s+\d+/g, '');
      
      // 3. Supprimer les mois et numéros de semaine parasites
      contentText = contentText.replace(/(SEPT|OCT|NOV|DEC|JANV|FEV|MARS|AVRIL|MAI|JUIN)\s+\d+[- ]/gi, '');
      contentText = contentText.replace(/\b(SEPT|OCT|NOV|DEC|JANV|FEV|MARS|AVRIL|MAI|JUIN)\b/gi, '');
      
      // 4. Supprimer les mentions de trimestre, congés, périodes
      contentText = contentText.replace(/\d+\s*(?:er|e|re|d)\s*(?:trimestre|semestre)/gi, '');
      contentText = contentText.replace(/CONGES[^\n•]*/gi, '');
      contentText = contentText.replace(/Période\s+d'intégration/gi, '');
      contentText = contentText.replace(/production\s+scolaire[^\n•]*/gi, '');
      contentText = contentText.replace(/Compte\s+rendu[^\n•]*/gi, '');
      contentText = contentText.replace(/Du\s+\w+[^\n•]*/gi, '');
      
      // 5. Supprimer les pieds de page et en-têtes
      contentText = contentText.replace(/Route\s+de\s+l'aéroport[^\n•]*/gi, '');
      contentText = contentText.replace(/MINISTERE[^\n•]*/gi, '');
      contentText = contentText.replace(/REPUBLIQUE[^\n•]*/gi, '');
      contentText = contentText.replace(/FORMATION\s+PROFESSIONNELLE/gi, '');
      contentText = contentText.replace(/La\s+semaine\s+de\s+cours[^\n•]*/gi, '');
      contentText = contentText.replace(/mais\s+est\s+interrompue[^\n•]*/gi, '');
      contentText = contentText.replace(/débute\s+le[^\n•]*/gi, '');
      contentText = contentText.replace(/finit\s+le[^\n•]*/gi, '');
      contentText = contentText.replace(/Cotonou[^\n•]*/gi, '');
      contentText = contentText.replace(/Amour\s+SOTINKON/gi, '');
      contentText = contentText.replace(/Chef\s+du\s+Groupe[^\n•]*/gi, '');
      
      // 6. Supprimer les caractères parasites
      contentText = contentText.replace(/[-–—]{3,}/g, '');
      contentText = contentText.replace(/^\s*$/gm, '');
      contentText = contentText.replace(/\s+/g, ' ');
      contentText = contentText.trim();
      
      console.log('Contenu nettoyé:', contentText.substring(0, 100) + '...');
      
      // === EXTRACTION DES ACTIVITÉS ===
      const activites = [];
      
      // Normaliser les bullets
      contentText = contentText.replace(/[•●■◆▪]/g, '•');
      
      // Découper par "Activité", "Sous-activité" ou "•"
      const segments = contentText.split(/(?=(?:(?:Sous-)?[Aa]ctivité\s*n?°?\d+\s*:|•))/i);
      
      for (let segment of segments) {
        segment = segment.trim();
        if (segment.length < 3) continue;
        
        // Si commence par "Activité N:" ou "Sous-activité N:"
        if (segment.match(/^(?:Sous-)?[Aa]ctivité\s*n?°?\d+\s*:/i)) {
          const cleaned = segment.replace(/\s+/g, ' ').trim();
          // Nettoyer les résidus de dates/mois à la fin
          const finalCleaned = cleaned.replace(/\s+(au|er|e|d)\s*$/i, '');
          if (finalCleaned.length > 10) {
            activites.push(finalCleaned);
          }
        }
        // Si commence par "•"
        else if (segment.startsWith('•')) {
          const cleaned = segment.substring(1).replace(/\s+/g, ' ').trim();
          // Nettoyer les résidus
          const finalCleaned = cleaned
            .replace(/\s+(au|er|e|d|et|de|du)\s*$/i, '')
            .replace(/\s+\d+$/, ''); // Enlever les numéros isolés à la fin
          
          if (finalCleaned.length > 3 && !finalCleaned.match(/^(fin|suite|début)$/i)) {
            activites.push(finalCleaned);
          }
        }
      }
      
      console.log('Activités:', activites.length);
      if (activites.length > 0) {
        console.log('Exemples:', activites.slice(0, 2));
      }
      
      // Déterminer le trimestre basé sur le taux cumulé
      if (tauxCumule !== null) {
        if (tauxCumule <= 55) currentTrimestre = '1';
        else if (tauxCumule <= 82) currentTrimestre = '2';
        else currentTrimestre = '3';
      }
      
      const { date_debut, date_fin } = parseDates(dates, mois, startingYear);
      
      entries.push({
        promotion: currentPromotion,
        discipline: currentDiscipline,
        annee_academique_id: anneeAcademiqueId,
        trimestre: currentTrimestre,
        mois: mois,
        semaine_numero: numeroSemaine,
        semaine_dates: dates,
        sa: sa,
        situation_apprentissage: sa,
        activites: JSON.stringify(activites),
        taux_prevu: tauxPrevu,
        taux_cumule_prevu: tauxCumule,
        observations: '',
        date_debut,
        date_fin,
        import_batch_id: importBatchId
      });
    }
    
    console.log(`\n=== RÉSUMÉ ===`);
    console.log(`Entrées créées: ${entries.length}`);
    
    if (entries.length === 0) {
      return res.status(400).json({ 
        error: 'Aucune donnée extraite',
        metadata: { promotion: currentPromotion, discipline: currentDiscipline }
      });
    }
    
    const insertedRecords = await models.ProgramTheorique.bulkCreate(entries, { 
      ignoreDuplicates: true 
    });
    
    console.log(`Entrées insérées: ${insertedRecords.length}`);
    
    res.json({ 
      message: 'Import réussi', 
      entries: entries.length,
      inserted: insertedRecords.length,
      sample: entries.slice(0, 3).map(e => ({
        semaine: e.semaine_numero,
        sa: e.sa,
        activites: JSON.parse(e.activites),
        taux: `${e.taux_prevu}/${e.taux_cumule_prevu}`
      }))
    });
    
  } catch (error) {
    console.error('=== ERREUR ===', error);
    res.status(500).json({ 
      error: 'Erreur import', 
      details: error.message 
    });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

module.exports = router;