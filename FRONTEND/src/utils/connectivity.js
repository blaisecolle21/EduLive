// src/utils/connectivity.js
import { ref } from "vue";
import api from "../api";

export const isOnline = ref(navigator.onLine);
export const isServerReachable = ref(true);

async function checkServerReachable() {
  try {
    await api.get("/health", { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

let watcherStarted = false;

export function initConnectivityWatcher(onReconnect) {
  if (watcherStarted) return; // évite les doublons si appelé plusieurs fois
  watcherStarted = true;

  window.addEventListener("online", async () => {
    isOnline.value = true;
    const reachable = await checkServerReachable();
    isServerReachable.value = reachable;
    if (reachable && onReconnect) onReconnect();
  });

  window.addEventListener("offline", () => {
    isOnline.value = false;
    isServerReachable.value = false;
  });

  // vérification périodique — navigator.onLine peut mentir (ex: connecté au wifi mais pas d'internet réel)
  setInterval(async () => {
    const reachable = await checkServerReachable();
    const wasUnreachable = !isServerReachable.value;
    isServerReachable.value = reachable;
    if (reachable && wasUnreachable && onReconnect) onReconnect();
  }, 30000);

  // vérification immédiate au démarrage
  checkServerReachable().then((reachable) => {
    isServerReachable.value = reachable;
  });
}
