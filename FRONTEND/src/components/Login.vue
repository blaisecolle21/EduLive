<template>
  <div class="min-h-screen flex items-center justify-center bg-[url('/src/images.jpg')] bg-no-repeat bg-cover bg-center">
    <div class="bg-sky-100 p-6 rounded shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-4 text-center">Connexion</h2>
      <form @submit.prevent="login">
        <!-- Champ email -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="form.email" type="email" class="w-full p-2 border rounded" required />
        </div>
        <!-- Champ Mot de passe -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input v-model="form.mot_de_passe" type="password" class="w-full p-2 border rounded" required />
        </div>
        <!-- Champ se souvenir de moi -->
        <div class="mb-4 flex items-center">
          <input v-model="form.rememberMe" type="checkbox" id="rememberMe" class="mr-2" />
          <label for="rememberMe" class="text-sm text-gray-700">Se souvenir de moi</label>
        </div>
        <!-- Champ se connecter -->
        <button type="submit" class="w-full bg-gray-500 text-white p-2 rounded hover:bg-blue-600">Se connecter</button>
      </form>
      <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
      <!-- Mot de passe oublié -->
      <a href="/forgot-password" class="text-blue-500 mt-4 block text-center">Mot de passe oublié ?</a>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      form: {
        email: '',
        mot_de_passe: '',
        rememberMe: false
      },
      error: null
    };
  },
  methods: {
    async login() {
      try {
        const response = await api.post('/auth/login', this.form);
        localStorage.setItem('token', response.data.token);
        const user = response.data.user; // Assure-toi que l'API renvoie l'utilisateur
       if (user.role === 'admin') {
          this.$router.push('/dashboard?section=accueil'); // Rediriger vers /dashboard avec section accueil
        } else if (user.role === 'enseignant') {
          this.$router.push('/enseignant'); // Rediriger vers Enseignant.vue
        } else {
          this.$router.push('/dashboard'); // Rediriger vers Dashboard.vue pour autres rôles
        }
      } catch (error) {
        this.error = error.response?.data?.error || 'Erreur de connexion';
      }
    }
  }
};
</script>