<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-4 text-center">Inscription</h2>
      <form @submit.prevent="register">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Nom</label>
          <input v-model="form.nom" type="text" class="w-full p-2 border rounded" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Prénoms</label>
          <input v-model="form.prenoms" type="text" class="w-full p-2 border rounded" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input v-model="form.email" type="email" class="w-full p-2 border rounded" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Mot de passe</label>
          <input v-model="form.mot_de_passe" type="password" class="w-full p-2 border rounded" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Rôle</label>
          <select v-model="form.role" class="w-full p-2 border rounded" required>
            <option value="enseignant">Enseignant</option>
            <option value="coordinateur">Coordinateur</option>
            <option value="directeur">Directeur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Établissement ID</label>
          <input v-model="form.etablissement_id" type="number" class="w-full p-2 border rounded" required />
        </div>
        <button type="submit" class="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">S'inscrire</button>
      </form>
      <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      form: {
        nom: '',
        prenoms: '',
        email: '',
        mot_de_passe: '',
        role: 'enseignant',
        etablissement_id: ''
      },
      error: null
    };
  },
  methods: {
    async register() {
      try {
        await api.post('/auth/register', this.form);
        this.$router.push('/login'); // Rediriger vers la connexion après inscription
      } catch (error) {
        this.error = error.response?.data?.error || 'Erreur d\'inscription';
      }
    }
  }
};
</script>