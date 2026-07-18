import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { initConnectivityWatcher } from "./utils/connectivity";

const app = createApp(App);
app.use(router);
app.mount("#app");

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.remove("text-yellow-300", "font-bold");
            if (link.getAttribute("href").substring(1) === entry.target.id) {
              link.classList.add("text-yellow-300", "font-bold");
            }
          });
        }
      });
    },
    { threshold: 0.6 }, // section visible à 60% pour être considérée active
  );

  sections.forEach((section) => observer.observe(section));
});

initConnectivityWatcher(() => {
  console.log("🔄 Connexion rétablie — synchronisation à lancer ici");
  //  La synchronisation de la file d'attente offline sera branché ici
});
