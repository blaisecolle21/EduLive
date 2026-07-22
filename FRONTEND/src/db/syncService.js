import { db } from "./offlineDb";
import api from "../api";

/**
 * Enregistre une entrée de cahier de texte en file d'attente locale.
 * Utilisée quand la requête réseau échoue ou qu'on est hors ligne.
 */
export async function queueEntry(entryData) {
  const localId = await db.pendingEntries.add({
    payload: entryData,
    status: "pending", // pending | syncing | error
    createdAt: new Date().toISOString(),
    errorMessage: null,
  });
  return localId;
}

/**
 * Récupère toutes les entrées en attente (pour affichage dans l'UI)
 */
export async function getPendingEntries() {
  return db.pendingEntries.orderBy("createdAt").reverse().toArray();
}

export async function countPending() {
  return db.pendingEntries.where("status").anyOf(["pending", "error"]).count();
}

/**
 * Tente d'envoyer une entrée en attente au serveur
 */
async function trySyncOne(item) {
  await db.pendingEntries.update(item.localId, { status: "syncing" });
  try {
    await api.post("/cahier/cahier-entries", item.payload);
    await db.pendingEntries.delete(item.localId);
    return { success: true };
  } catch (error) {
    await db.pendingEntries.update(item.localId, {
      status: "error",
      errorMessage: error.response?.data?.error || error.message,
    });
    return { success: false, error };
  }
}

/**
 * Vide la file d'attente — à appeler quand la connexion revient.
 * Traite les entrées une par une pour éviter de saturer le serveur.
 */
export async function syncPendingEntries(onProgress) {
  const items = await db.pendingEntries
    .where("status")
    .anyOf(["pending", "error"])
    .toArray();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    const result = await trySyncOne(item);
    if (result.success) synced++;
    else failed++;
    if (onProgress) onProgress({ synced, failed, total: items.length });
  }

  return { synced, failed, total: items.length };
}

/**
 * Cache les activités d'un programme théorique pour usage hors ligne.
 * À appeler dès qu'on est en ligne et qu'on charge les activités normalement.
 */
export async function cacheActivites(classeId, disciplineId, saNumber, data) {
  await db.activitesCache.put({
    classeId,
    disciplineId,
    saNumber,
    data,
    cachedAt: new Date().toISOString(),
  });
}

export async function getCachedActivites(classeId, disciplineId, saNumber) {
  return db.activitesCache.get([classeId, disciplineId, saNumber]);
}

/**
 * Cache générique pour classes/disciplines/entrées (lecture hors ligne)
 */
export async function cacheClasses(classes) {
  await db.classesCache.bulkPut(classes);
}
export async function getCachedClasses() {
  return db.classesCache.toArray();
}

export async function cacheDisciplines(disciplines) {
  await db.disciplinesCache.bulkPut(disciplines);
}
export async function getCachedDisciplines(classeId) {
  return db.disciplinesCache.where("classe_id").equals(classeId).toArray();
}

export async function cacheEntries(entries) {
  await db.entriesCache.bulkPut(entries);
}
export async function getCachedEntries(disciplineId) {
  return db.entriesCache.where("discipline_id").equals(disciplineId).toArray();
}

/**
 * Cache la vue globale de toutes les entrées (admin uniquement)
 */
export async function cacheAdminEntries(entries) {
  await db.adminEntriesCache.clear(); // on remplace entièrement à chaque rechargement en ligne
  await db.adminEntriesCache.bulkPut(entries);
  await db.metaCache.put({
    key: "adminEntriesLastSync",
    value: new Date().toISOString(),
  });
}

//clear() avant bulkPut évite d'accumuler des entrées supprimées côté serveur qui resteraient fantômes dans le cache local.

export async function getCachedAdminEntries() {
  return db.adminEntriesCache.toArray();
}

export async function getAdminEntriesLastSync() {
  const meta = await db.metaCache.get("adminEntriesLastSync");
  return meta?.value || null;
}

/**
 * Cache les entrées d'un enseignant pour une classe donnée.
 * On attache classeId manuellement pour pouvoir filtrer hors ligne.
 */
export async function cacheEntriesForClasse(classeId, entries) {
  const enriched = entries.map((e) => ({ ...e, classeId }));
  // on retire d'abord les anciennes entrées de cette classe pour éviter les doublons obsolètes
  await db.entriesCache.where("classeId").equals(classeId).delete();
  await db.entriesCache.bulkPut(enriched);
  await db.metaCache.put({
    key: `entriesLastSync_${classeId}`,
    value: new Date().toISOString(),
  });
}

export async function getCachedEntriesForClasse(classeId, maxAgeDays = 60) {
  const all = await db.entriesCache
    .where("classeId")
    .equals(classeId)
    .toArray();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  return all
    .filter((e) => new Date(e.date_cours) >= cutoff)
    .sort((a, b) => new Date(b.date_cours) - new Date(a.date_cours));
}

export async function getEntriesLastSync(classeId) {
  const meta = await db.metaCache.get(`entriesLastSync_${classeId}`);
  return meta?.value || null;
}
