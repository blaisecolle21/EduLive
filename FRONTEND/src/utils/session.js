// src/utils/session.js
import router from '../router'; // adapte le chemin

let sessionTimer = null;

export function startSessionTimer() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresIn = payload.exp * 1000 - Date.now();

        if (expiresIn <= 0) {
            expireSession();
            return;
        }

        clearTimeout(sessionTimer); // évite les doublons si appelé plusieurs fois
        sessionTimer = setTimeout(() => {
            alert('Votre session a expiré. Veuillez vous reconnecter.');
            expireSession();
        }, expiresIn);

    } catch (e) {
        expireSession(); // token malformé → déconnexion
    }
}

export function stopSessionTimer() {
    clearTimeout(sessionTimer);
}

function expireSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
}