<template>
  <div class="min-h-screen relative flex bg-blue-100 overflow-hidden">
    <button @click="showSidebar = !showSidebar" class="md:hidden px-3 py-1 bg-blue-600 text-white rounded mb-4">
      {{ showSidebar ? "Fermer Menu" : "Ouvrir Menu" }}
    </button>

    <div v-if="showSidebar" @click="showSidebar = false" class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"></div>

    <aside
      class="fixed top-25 left-0 bg-white shadow-xl flex flex-col border-r border-gray-100 transition-all duration-300 z-50"
      style="height: calc(100vh - 100px)"
      :class="[isCollapsed ? 'w-20' : 'w-64', showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0']"
    >
      <button
        @click="isCollapsed = !isCollapsed"
        class="absolute -right-3.5 top-6 bg-teal-600 text-white rounded-full p-1 shadow-lg hover:bg-teal-500 z-50 hidden md:flex items-center justify-center ring-2 ring-white"
        :class="{ 'rotate-180': !isCollapsed }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </button>

      <div class="flex items-center gap-3 px-4 py-5 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-teal-500 flex-shrink-0">
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {{ user.prenoms?.charAt(0) }}{{ user.nom?.charAt(0) }}
        </div>
        <transition name="fade">
          <div v-show="!isCollapsed" class="overflow-hidden">
            <p class="font-medium text-white text-sm truncate max-w-[150px]">{{ user.prenoms }} {{ user.nom }}</p>
            <span class="text-xs text-teal-100 bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
              {{ user.Role?.name }}
            </span>
          </div>
        </transition>
      </div>

      <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <nav class="px-3 py-4 space-y-1">
          <SidebarItem
            v-for="item in menuItems"
            :key="item.section"
            :icon="item.icon"
            :label="item.label"
            :active="activeSection === item.section"
            :collapsed="isCollapsed"
            @click="activeSection = item.section"
          />
        </nav>
      </div>

      <div class="px-3 py-4 border-t border-gray-100 flex-shrink-0 mt-auto">
        <button @click="logout" class="w-full flex items-center gap-3 p-2.5 bg-black text-white rounded-lg hover:bg-gray-800" :class="isCollapsed ? 'justify-center' : 'px-3'">
          <ArrowLeftStartOnRectangleIcon class="h-6 w-6 shrink-0 text-white" />
          <span v-show="!isCollapsed" class="ml-3 text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>

    <div class="flex-1 pt-16 md:ml-80 mt-20 p-4">
      <!-- Section disciplines -->
      <div v-if="activeSection === 'disciplines'" class="max-w-5xl mx-auto space-y-6">
        <h2 class="text-xl font-semibold mb-4">Disciplines de {{ classeNom }}</h2>

        <div v-if="!selectedDiscipline">
          <div v-if="loading" class="text-gray-500 text-sm">Chargement...</div>
          <div v-else-if="disciplines.length === 0" class="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">
            Aucune discipline assignée pour cette classe. Contactez l'administrateur.
          </div>
          <div v-else class="grid gap-3">
            <button
              v-for="d in disciplines"
              :key="d.id"
              @click="selectDiscipline(d)"
              class="text-left p-4 bg-white border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition-colors"
            >
              <p class="font-medium text-gray-800">{{ d.nom }}</p>
              <p class="text-xs text-gray-500 mt-1">Enseignant : {{ enseignantDe(d) }}</p>
            </button>
          </div>
        </div>

        <div v-else>
          <button @click="backToDisciplines" class="text-sm text-teal-600 mb-4 hover:underline">← Retour aux disciplines</button>

          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">{{ selectedDiscipline.nom }}</h3>
            <button
              v-if="!showForm && !qrCodeUrl"
              @click="openAddForm"
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              ➕ Ajouter une entrée
            </button>
          </div>

          <!-- Liste des soumissions existantes -->
          <div v-if="!showForm && !qrCodeUrl" class="space-y-3">
            <div v-if="loadingEntries" class="text-gray-500 text-sm">Chargement...</div>
            <div v-else-if="mesEntrees.length === 0" class="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
              Aucune fiche soumise pour cette discipline.
            </div>
            <div
              v-for="entry in mesEntrees"
              :key="entry.id"
              class="bg-white border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p class="font-medium text-gray-800">{{ entry.sa_number }} — {{ entry.sa_name }}</p>
                <p class="text-xs text-gray-500">{{ formatDate(entry.date_cours) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="text-xs px-2 py-1 rounded-full font-medium"
                  :class="{
                    'bg-yellow-100 text-yellow-700': entry.statut === 'en_attente',
                    'bg-green-100 text-green-700': entry.statut === 'validee',
                    'bg-red-100 text-red-700': entry.statut === 'rejetee',
                  }"
                >
                  {{ statutLabel(entry.statut) }}
                </span>
                <button
                  v-if="entry.statut === 'rejetee'"
                  @click="openResubmitForm(entry)"
                  class="text-xs bg-orange-500 text-white px-3 py-1.5 rounded hover:bg-orange-600"
                >
                  Corriger
                </button>
              </div>
            </div>
          </div>

          <!-- Formulaire -->
          <CahierEntryForm
            v-if="showForm"
            :classe-id="classeId"
            :fixed-discipline="selectedDiscipline"
            mode="submit"
            :current-user-id="user.id"
            :target-teacher-id="enseignantIdDe(selectedDiscipline)"
            :entry-to-edit="entryToResubmit"
            :is-resubmit="!!entryToResubmit"
            @success="onFormSuccess"
            @cancel="closeForm"
          />

          <!-- QR code après soumission -->
          <div v-if="qrCodeUrl" class="text-center py-6 bg-white rounded-lg border">
            <p class="text-green-700 font-medium mb-4">✅ Fiche soumise avec succès !</p>
            <p class="text-sm text-gray-600 mb-4">
              L'enseignant peut scanner ce QR pour valider, ou la retrouver dans sa liste "Entrées à valider".
            </p>
            <img :src="qrCodeUrl" alt="QR Code" class="mx-auto border rounded-lg p-4" />
            <button @click="closeForm" class="mt-4 text-sm text-teal-600 hover:underline">Retour à la liste</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api';
import QRCode from 'qrcode';
import CahierEntryForm from './CahierEntryForm.vue';
import SidebarItem from './SidebarItem.vue';
import { startSessionTimer, stopSessionTimer } from '../utils/session';
import { AcademicCapIcon, ArrowLeftStartOnRectangleIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'Responsable',
  components: { CahierEntryForm, SidebarItem, ArrowLeftStartOnRectangleIcon },
  data() {
    return {
      user: JSON.parse(localStorage.getItem('user')) || {},
      classeId: null,
      classeNom: '',
      disciplines: [],
      selectedDiscipline: null,
      mesEntrees: [],
      loading: true,
      loadingEntries: false,
      showForm: false,
      qrCodeUrl: null,
      entryToResubmit: null,
      isCollapsed: false,
      showSidebar: window.innerWidth >= 768,
      activeSection: 'disciplines',
      menuItems: [
        { section: 'disciplines', label: 'Mes Disciplines', icon: AcademicCapIcon },
      ],
    };
  },
  async created() {
    startSessionTimer();
    await this.fetchDisciplines();
  },
  beforeUnmount() {
    stopSessionTimer();
  },
  methods: {
    async fetchDisciplines() {
      this.loading = true;
      try {
        const response = await api.get('/cahier/responsable/disciplines');
        this.classeId = response.data.classe_id;
        this.disciplines = response.data.disciplines;
      } catch (error) {
        console.error('Erreur récupération disciplines:', error);
      } finally {
        this.loading = false;
      }
    },
    enseignantDe(discipline) {
      const ed = discipline.EnseignantDisciplines?.[0];
      return ed?.User ? `${ed.User.prenoms} ${ed.User.nom}` : 'Non assigné';
    },
    enseignantIdDe(discipline) {
      return discipline.EnseignantDisciplines?.[0]?.User?.id || null;
    },
    async selectDiscipline(d) {
      this.selectedDiscipline = d;
      await this.fetchMesEntrees();
    },
    backToDisciplines() {
      this.selectedDiscipline = null;
      this.mesEntrees = [];
      this.showForm = false;
      this.qrCodeUrl = null;
      this.entryToResubmit = null;
    },
    async fetchMesEntrees() {
      this.loadingEntries = true;
      try {
        const response = await api.get('/cahier/responsable/mes-entrees', {
          params: { discipline_id: this.selectedDiscipline.id },
        });
        this.mesEntrees = response.data;
      } catch (error) {
        console.error('Erreur récupération entrées:', error);
      } finally {
        this.loadingEntries = false;
      }
    },
    openAddForm() {
      this.entryToResubmit = null;
      this.showForm = true;
    },
    openResubmitForm(entry) {
      this.entryToResubmit = entry;
      this.showForm = true;
    },
    closeForm() {
      this.showForm = false;
      this.qrCodeUrl = null;
      this.entryToResubmit = null;
      this.fetchMesEntrees();
    },
    async onFormSuccess(data) {
      this.showForm = false;
      const qrToken = data.entry.qr_token;
      if (qrToken) {
        const validationUrl = `${window.location.origin}/validation-qr/${qrToken}`;
        this.qrCodeUrl = await QRCode.toDataURL(validationUrl, { width: 300 });
      } else {
        this.closeForm();
      }
    },
    statutLabel(statut) {
      return { en_attente: '⏳ En attente', validee: '✅ Validée', rejetee: '❌ Rejetée' }[statut] || statut;
    },
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString('fr-FR');
    },
    logout() {
      stopSessionTimer();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    },
  },
};
</script>