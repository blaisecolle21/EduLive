<script setup>
const name = 'TBook'
</script>

<template>
  <header class="bg-stone-500 text-white p-4">
    <h1 class="text-2xl">Bienvenue sur la plateforme de gestion du Cahier de Texte {{ name }}</h1>
  </header>
  
  <router-view></router-view>
</template>

<style scoped>
/* .logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
} */
</style>
