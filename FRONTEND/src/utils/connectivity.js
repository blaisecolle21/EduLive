// src/utils/connectivity.js
import { ref } from "vue";
import api from "../api";
import { syncPendingEntries, countPending } from "../db/syncService";

export const isOnline = ref(navigator.onLine);
export const isServerReachable = ref(true);
export const pendingCount = ref(0);
export const syncing = ref(false);

async function checkServerReachable() {
  try {
    await api.get("/health", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function refreshPendingCount() {
  pendingCount.value = await countPending();
}

async function runSync() {
  if (syncing.value) return; // évite les syncs concurrentes
  const count = await countPending();
  if (count === 0) return;

  syncing.value = true;
  try {
    await syncPendingEntries();
  } finally {
    syncing.value = false;
    await refreshPendingCount();
  }
}

let watcherStarted = false;

export function initConnectivityWatcher() {
  if (watcherStarted) return;
  watcherStarted = true;

  refreshPendingCount();

  window.addEventListener("online", async () => {
    isOnline.value = true;
    const reachable = await checkServerReachable();
    isServerReachable.value = reachable;
    if (reachable) await runSync();
  });

  window.addEventListener("offline", () => {
    isOnline.value = false;
    isServerReachable.value = false;
  });

  setInterval(async () => {
    const reachable = await checkServerReachable();
    const wasUnreachable = !isServerReachable.value;
    isServerReachable.value = reachable;
    if (reachable && wasUnreachable) await runSync();
  }, 30000);

  checkServerReachable().then(async (reachable) => {
    isServerReachable.value = reachable;
    if (reachable) await runSync();
  });
}
