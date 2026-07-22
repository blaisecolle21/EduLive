import Dexie from "dexie";

export const db = new Dexie("CahierTexteOfflineDB");

db.version(1).stores({
  // File d'attente des entrées créées/modifiées hors ligne, à synchroniser
  pendingEntries: "++localId, status, createdAt",

  // Cache des activités du programme théorique par SA (clé composite)
  activitesCache: "[classeId+disciplineId+saNumber], cachedAt",

  // Cache des classes/disciplines déjà chargées (lecture hors ligne)
  classesCache: "id",
  disciplinesCache: "id, classe_id",

  // Cache des entrées déjà consultées (lecture hors ligne)
  entriesCache: "id, discipline_id, teacher_id, classe_id",

  adminEntriesCache: "id, discipline_id, teacher_id", // vue globale admin
  metaCache: "key", // pour stocker la date de dernière synchro
});

export default db;
