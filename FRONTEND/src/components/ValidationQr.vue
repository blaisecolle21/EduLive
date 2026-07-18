<template>
    <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div class="max-w-lg w-full bg-white rounded-xl shadow p-6">
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p class="mt-3 text-gray-600">Chargement de l'entrée...</p>
        </div>
  
        <div v-else-if="error" class="text-center py-8">
          <p class="text-red-600 font-medium">{{ error }}</p>
          <router-link to="/enseignant" class="mt-4 inline-block text-teal-600 hover:underline text-sm">
            Retour à mon espace
          </router-link>
        </div>
  
        <div v-else-if="entry">
          <h2 class="text-lg font-semibold mb-1">{{ entry.sa_number }} — {{ entry.sa_name }}</h2>
          <p class="text-sm text-gray-600 mb-4">
            {{ entry.discipline?.nom }} • {{ entry.discipline?.Classe?.nom }}
          </p>
  
          <div class="bg-gray-50 rounded p-4 mb-4 text-sm space-y-2">
            <p><strong>Soumis par :</strong> {{ entry.soumetteur?.prenoms }} {{ entry.soumetteur?.nom }}</p>
            <p><strong>Date du cours :</strong> {{ formatDate(entry.date_cours) }} ({{ entry.heure_debut }} - {{ entry.heure_fin }})</p>
            <p><strong>Activités :</strong> {{ entry.activites }}</p>
            <div>
              <strong>Contenu :</strong>
              <div class="mt-1 prose prose-sm max-w-none" v-html="entry.contenu"></div>
            </div>
          </div>
  
          <div v-if="!rejetMode" class="flex gap-2">
            <button
              @click="valider"
              :disabled="processing"
              class="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              ✅ Valider
            </button>
            <button
              @click="rejetMode = true"
              class="flex-1 bg-red-100 text-red-700 py-2.5 rounded-lg font-medium hover:bg-red-200"
            >
              ❌ Rejeter
            </button>
          </div>
  
          <div v-else class="space-y-2">
            <textarea
              v-model="commentaire"
              rows="3"
              placeholder="Motif du rejet..."
              class="w-full border border-red-300 rounded-lg p-2 text-sm"
            ></textarea>
            <div class="flex gap-2">
              <button
                @click="rejeter"
                :disabled="processing || !commentaire.trim()"
                class="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
              <button @click="rejetMode = false" class="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium">
                Annuler
              </button>
            </div>
          </div>
        </div>
  
        <div v-if="success" class="text-center py-8">
          <p class="text-green-700 font-medium text-lg">{{ success }}</p>
          <router-link to="/enseignant" class="mt-4 inline-block text-teal-600 hover:underline text-sm">
            Retour à mon espace
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import api from '../api';
  
  export default {
    name: 'ValidationQr',
    data() {
      return {
        loading: true,
        error: null,
        entry: null,
        rejetMode: false,
        commentaire: '',
        processing: false,
        success: null,
      };
    },
    async created() {
      await this.fetchEntry();
    },
    methods: {
      async fetchEntry() {
        this.loading = true;
        try {
          const token = this.$route.params.token;
          const response = await api.get(`/cahier/cahier-entries/qr/${token}`);
          this.entry = response.data;
        } catch (error) {
          this.error = error.response?.data?.error || "Impossible de charger cette entrée.";
        } finally {
          this.loading = false;
        }
      },
      async valider() {
        this.processing = true;
        try {
          await api.patch(`/cahier/cahier-entries/${this.entry.id}/valider`);
          this.success = '✅ Entrée validée avec succès !';
          this.entry = null;
        } catch (error) {
          alert('Erreur : ' + (error.response?.data?.error || error.message));
        } finally {
          this.processing = false;
        }
      },
      async rejeter() {
        if (!this.commentaire.trim()) return;
        this.processing = true;
        try {
          await api.patch(`/cahier/cahier-entries/${this.entry.id}/rejeter`, {
            commentaire: this.commentaire,
          });
          this.success = 'Entrée rejetée. Le responsable a été informé.';
          this.entry = null;
        } catch (error) {
          alert('Erreur : ' + (error.response?.data?.error || error.message));
        } finally {
          this.processing = false;
        }
      },
      formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fr-FR');
      },
    },
  };
  </script>