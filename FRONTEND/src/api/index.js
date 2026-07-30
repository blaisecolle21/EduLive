import axios from "axios";
import router from "../router";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:6300/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur réponse : déconnecter si token expiré
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthError = error.response?.status === 401;
    const isOffline = !navigator.onLine;

    if (isAuthError && !isOffline) {
      // Vraie expiration détectée EN LIGNE → déconnexion légitime
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
    // Si 401 pendant qu'on est offline : on ne déconnecte pas.
    // L'utilisateur garde accès à son cache local ; la réauth se fera
    // naturellement au retour en ligne (via le connectivity watcher).

    return Promise.reject(error);
  },
);

export default api;
