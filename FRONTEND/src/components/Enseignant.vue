<template>
  <div class="min-h-screen flex bg-blue-100">
    <!-- Sidebar gauche -->
    <div class="w-64 bg-white shadow-md">
      <div class="p-4">
        <h2 class="text-xl font-bold mb-4">Menu</h2>
        <ul class="space-y-2">
          <li>
            <button @click="activeSection = 'accueil'" :class="{ 'bg-blue-500 text-white': activeSection === 'accueil' }" class="w-full p-2 rounded hover:bg-blue-600">
              Accueil
            </button>
          </li>
          <li>
            <button @click="activeSection = 'mes-classes'" :class="{ 'bg-blue-500 text-white': activeSection === 'mes-classes' }" class="w-full p-2 rounded hover:bg-blue-600">
              Mes Classes
            </button>
          </li>
          <li>
            <button @click="activeSection = 'progression'" :class="{ 'bg-blue-500 text-white': activeSection === 'progression' }" class="w-full p-2 rounded hover:bg-blue-600">
              Progression par classes
            </button>
          </li>
          <li>
            <button @click="activeSection = 'notification'" :class="{ 'bg-blue-500 text-white': activeSection === 'notification' }" class="w-full p-2 rounded hover:bg-blue-600">
              Notification
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="flex-1 p-4">
      <h1 class="text-3xl font-bold mb-4">Tableau de bord Enseignant</h1>
      <p v-if="user">Bienvenue, {{ user.prenoms }} {{ user.nom }} ({{ user.role }})</p>
      <p v-else>Chargement...</p>

      <!-- Section Accueil -->
      <div v-if="activeSection === 'accueil'">
        <h2 class="text-2xl font-bold mb-4">Accueil</h2>
        <p>Sélectionnez une option dans le menu pour accéder aux fonctionnalités.</p>
      </div>

      <!-- Section Mes Classes -->
      <div v-if="activeSection === 'mes-classes'">
        <!-- Liste des classes de l'enseignant -->
        <h2 class="text-xl font-semibold mb-4">Mes Classes</h2>
        <div v-if="loadingClasses" class="text-center">Chargement des classes...</div>
        <div v-else-if="uniqueClasses.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="classe in uniqueClasses"
            :key="classe.id"
            @click="selectClass(classe.id)"
            :class="{ 'ring-2 ring-blue-500': selectedClassId === classe.id }"
            class="bg-white p-4 rounded-lg shadow cursor-pointer hover:bg-gray-100 transition"
          >
            <h3 class="text-lg font-medium">{{ classe.nom }} ({{ classe.promotion }})</h3>
            <p class="text-sm text-gray-600">Niveau: {{ classe.niveau }}</p>
          </div>
        </div>
        <p v-else class="mt-4">Aucune classe trouvée. Vérifiez vos associations avec les disciplines.</p>

        <!-- Cahier de texte pour la classe sélectionnée -->
        <div v-if="selectedClassId" class="mt-6">
          <h2 class="text-xl font-semibold mb-4">Cahier de texte - {{ getClassName(selectedClassId) }}</h2>
          
          <!-- Affichage des disciplines disponibles -->
          <div class="bg-blue-50 p-4 rounded-lg mb-4">
            <p class="text-sm font-medium text-gray-700">
              Disciplines enseignées dans cette classe : 
              <span class="font-bold text-blue-600">{{ userDisciplines.map(d => d.nom).join(', ') || 'Aucune' }}</span>
            </p>
          </div>

          <button @click="openAddEntryForm" class="bg-green-500 text-white p-2 rounded hover:bg-green-600 mb-4">
            Ajouter une entrée
          </button>
          
          <table v-if="filteredCahierEntries.length" class="mt-4 w-full border-collapse border">
            <thead>
              <tr>
                <th class="border p-2">Discipline</th>
                <th class="border p-2">SA Numéro</th>
                <th class="border p-2">SA Nom</th>
                <th class="border p-2">Date</th>
                <th class="border p-2">Trimestre</th>
                <th class="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filteredCahierEntries" :key="entry.id">
                <td class="border p-2">{{ getDisciplineName(entry.discipline_id) }}</td>
                <td class="border p-2">{{ entry.sa_number }}</td>
                <td class="border p-2">{{ entry.sa_name }}</td>
                <td class="border p-2">{{ formatDate(entry.date_cours) }}</td>
                <td class="border p-2">{{ entry.trimestre }}</td>
                <td class="border p-2">
                  <button @click="editEntry(entry)" class="bg-yellow-500 text-white p-1 rounded mr-2">Modifier</button>
                  <button @click="showHistory(entry.id)" class="bg-blue-500 text-white p-1 rounded mr-2">Historique</button>
                  <button @click="deleteEntry(entry.id)" class="bg-red-500 text-white p-1 rounded">Supprimer</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="mt-4">Aucune entrée trouvée pour cette classe.</p>

          <!-- Modal pour l'historique -->
          <div v-if="showHistoryModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <h3 class="text-lg font-semibold mb-4">Historique de l'entrée {{ historyEntryId }}</h3>
              <table class="w-full border-collapse border">
                <thead>
                  <tr>
                    <th class="border p-2">Version</th>
                    <th class="border p-2">Date de modification</th>
                    <th class="border p-2">Contenu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="version in history" :key="version.id">
                    <td class="border p-2">{{ version.version }}</td>
                    <td class="border p-2">{{ formatDate(version.modified_at) }}</td>
                    <td class="border p-2">{{ version.contenu.substring(0, 100) }}...</td>
                  </tr>
                </tbody>
              </table>
              <button @click="closeHistory" class="mt-4 bg-gray-500 text-white p-2 rounded hover:bg-gray-600">Fermer</button>
            </div>
          </div>

          <!-- Formulaire intégré pour ajouter/modifier une entrée -->
          <div v-if="showForm" class="p-4 bg-gray-50 rounded-lg mt-4 border-2 border-blue-200">
            <h3 class="text-lg font-semibold mb-4">{{ editingEntry ? 'Modifier une entrée' : 'Ajouter une entrée' }}</h3>
            
            <!-- Message d'avertissement si aucune discipline -->
            <div v-if="!userDisciplines.length" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p class="font-bold">Aucune discipline disponible</p>
              <p>Vous n'enseignez aucune discipline dans cette classe. Veuillez contacter l'administrateur.</p>
            </div>

            <form v-else @submit.prevent="editingEntry ? updateEntry() : addEntry()" class="space-y-4">
              <div>
                <label for="entryDiscipline" class="block text-sm font-medium text-gray-700">
                  Discipline <span class="text-red-500">*</span>
                </label>
                <select 
                  v-model="newEntry.disciplineId" 
                  id="entryDiscipline" 
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  required
                >
                  <option value="" disabled>-- Sélectionnez une discipline --</option>
                  <option v-for="discipline in userDisciplines" :key="discipline.id" :value="discipline.id">
                    {{ discipline.nom }}
                  </option>
                </select>
                <p class="mt-1 text-sm text-gray-500">Choisissez la discipline pour laquelle vous souhaitez créer cette entrée</p>
              </div>
              
              <div>
                <label for="entrySaNumber" class="block text-sm font-medium text-gray-700">Numéro de SA :</label>
                <input v-model="newEntry.saNumber" id="entrySaNumber" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              
              <div>
                <label for="entrySaName" class="block text-sm font-medium text-gray-700">Nom de SA :</label>
                <input v-model="newEntry.saName" id="entrySaName" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              
              <div>
                <label for="entryActivites" class="block text-sm font-medium text-gray-700">Activités :</label>
                <textarea v-model="newEntry.activites" id="entryActivites" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" rows="3" required></textarea>
              </div>
              
              <div>
                <label for="entryContenu" class="block text-sm font-medium text-gray-700">Contenu :</label>
                <editor-content :editor="editor" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                <menu-bar :editor="editor" class="mt-2" />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="entryHeureDebut" class="block text-sm font-medium text-gray-700">Heure de début :</label>
                  <input v-model="newEntry.heureDebut" id="entryHeureDebut" type="time" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                  <label for="entryHeureFin" class="block text-sm font-medium text-gray-700">Heure de fin :</label>
                  <input v-model="newEntry.heureFin" id="entryHeureFin" type="time" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="entryDateCours" class="block text-sm font-medium text-gray-700">Date :</label>
                  <input v-model="newEntry.dateCours" id="entryDateCours" type="date" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required @change="calculatePeriod" />
                </div>
                <div>
                  <label for="entryTrimestre" class="block text-sm font-medium text-gray-700">Trimestre :</label>
                  <select v-model="newEntry.trimestre" id="entryTrimestre" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                    <option value="1er">1er</option>
                    <option value="2e">2e</option>
                    <option value="3e">3e</option>
                  </select>
                </div>
              </div>
              
              <div class="flex justify-end space-x-2">
                <button type="submit" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                  {{ editingEntry ? 'Mettre à jour' : 'Ajouter' }}
                </button>
                <button type="button" @click="cancelEntryEdit" class="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Section Progression par classes -->
      <div v-if="activeSection === 'progression'">
        <h2 class="text-2xl font-bold mb-4">Progression par classes</h2>
        <p>Cette section affichera la progression par classe. À implémenter.</p>
      </div>

      <!-- Section Notification -->
      <div v-if="activeSection === 'notification'">
        <h2 class="text-2xl font-bold mb-4">Notification</h2>
        <p>Cette section affichera les notifications. À implémenter.</p>
      </div>

      <button @click="logout" class="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600">Déconnexion</button>
    </div>
  </div>
</template>

<script>
import api from '../api';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import MenuBar from './MenuBar.vue';

export default {
  components: {
    EditorContent,
    MenuBar
  },
  data() {
    return {
      user: null,
      classes: [],
      disciplines: [],
      cahierEntries: [],
      newEntry: {
        id: null,
        disciplineId: '',
        saNumber: '',
        saName: '',
        activites: '',
        contenu: '',
        heureDebut: '',
        heureFin: '',
        dateCours: '',
        trimestre: '1er',
        mois: '',
        semaineNumero: null
      },
      editingEntry: false,
      showForm: false,
      selectedClassId: null,
      history: [],
      showHistoryModal: false,
      historyEntryId: null,
      loadingClasses: false,
      activeSection: 'accueil',
      editor: null
    };
  },
  computed: {
    uniqueClasses() {
      return this.classes;
    },
    userDisciplines() {
      if (!this.selectedClassId || !this.user) return [];
      
      // Récupère les disciplines de l'enseignant pour la classe sélectionnée
      const selectedClass = this.classes.find(c => c.id === this.selectedClassId);
      
      if (!selectedClass || !selectedClass.Disciplines) return [];
      
        // Puisque le backend filtre déjà par teacher_id,
      // toutes les disciplines retournées appartiennent à cet enseignant
      return selectedClass.Disciplines;
    },
    filteredCahierEntries() {
      if (!this.selectedClassId) return [];
      
      return this.cahierEntries.filter(entry => {
        const discipline = this.disciplines.find(d => d.id === entry.discipline_id);
        return discipline && 
              discipline.classe_id === this.selectedClassId && 
              discipline.teacher_id === this.user?.id;
      });
    }
  },
  async created() {
    this.editor = useEditor({
      content: this.newEntry.contenu,
      extensions: [StarterKit],
      onUpdate: ({ editor }) => {
        this.newEntry.contenu = editor.getHTML();
      }
    });

    try {
      this.loadingClasses = true;
      const response = await api.get('/users/me');
      this.user = response.data;
      await this.fetchClasses();
      await this.fetchDisciplines();
      await this.fetchCahierEntries();
      
      if (this.uniqueClasses.length > 0) {
        this.selectedClassId = this.uniqueClasses[0].id;
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error.response?.data);
      this.$router.push('/login');
    } finally {
      this.loadingClasses = false;
    }
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy();
    }
  },
  methods: {
    selectClass(classId) {
      this.selectedClassId = classId;
      this.showForm = false;
      this.editingEntry = false;
      this.fetchCahierEntries();
    },
    getClassName(classId) {
      const classe = this.classes.find(c => c.id === classId);
      return classe ? `${classe.nom} (${classe.promotion})` : 'Inconnue';
    },
    getDisciplineName(disciplineId) {
      const discipline = this.disciplines.find(d => d.id === disciplineId);
      return discipline ? discipline.nom : 'Inconnue';
    },
    async fetchClasses() {
      try {
        this.loadingClasses = true;
        const response = await api.get('/cahier/classes/teacher');
        this.classes = response.data;
        console.log('Classes reçues:', this.classes);
      } catch (error) {
        console.error('Erreur récupération classes:', error);
      } finally {
        this.loadingClasses = false;
      }
    },
    async fetchDisciplines() {
      try {
        const response = await api.get('/cahier/disciplines');
        this.disciplines = response.data;
      } catch (error) {
        console.error('Erreur récupération disciplines:', error);
      }
    },
    async fetchCahierEntries() {
      try {
        const response = await api.get('/cahier/cahier-entries', { 
          params: { classe_id: this.selectedClassId } 
        });
        this.cahierEntries = response.data;
      } catch (error) {
        console.error('Erreur récupération entrées cahier:', error);
      }
    },
    openAddEntryForm() {
      this.resetEntryForm();
      this.showForm = true;
      this.editingEntry = false;
    },
    resetEntryForm() {
      this.newEntry = {
        id: null,
        disciplineId: '',
        saNumber: '',
        saName: '',
        activites: '',
        contenu: '',
        heureDebut: '',
        heureFin: '',
        dateCours: '',
        trimestre: '1er',
        mois: '',
        semaineNumero: null
      };
      if (this.editor) {
        this.editor.commands.setContent('');
      }
    },
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/login');
    },
    formatDate(date) {
      if (!date) return 'Jamais';
      return new Date(date).toLocaleDateString('fr-FR');
    },
    calculatePeriod() {
      if (this.newEntry.dateCours) {
        const date = new Date(this.newEntry.dateCours);
        const months = ['SEPT', 'OCT', 'NOV', 'DEC', 'JANV', 'FEV', 'MARS', 'AVRIL', 'MAI', 'JUIN'];
        this.newEntry.mois = months[date.getMonth()];
        this.newEntry.semaineNumero = date.getWeek();
      }
    },
    async addEntry() {
      try {
        if (!this.newEntry.disciplineId) {
          alert('Veuillez sélectionner une discipline');
          return;
        }

        const entryData = {
          discipline_id: this.newEntry.disciplineId,
          teacher_id: this.user.id,
          sa_number: this.newEntry.saNumber,
          sa_name: this.newEntry.saName,
          activites: this.newEntry.activites,
          contenu: this.newEntry.contenu,
          date_cours: this.newEntry.dateCours,
          heure_debut: this.newEntry.heureDebut,
          heure_fin: this.newEntry.heureFin,
          trimestre: this.newEntry.trimestre,
          mois: this.newEntry.mois,
          semaine_numero: this.newEntry.semaineNumero,
          annee_scolaire: '2025-2026'
        };
        
        await api.post('/cahier/cahier-entries', entryData);
        await this.fetchCahierEntries();
        this.resetEntryForm();
        this.showForm = false;
        alert('Entrée ajoutée avec succès !');
      } catch (error) {
        console.error('Erreur ajout entrée:', error);
        alert('Erreur lors de l\'ajout de l\'entrée');
      }
    },
    editEntry(entry) {
      this.newEntry = {
        id: entry.id,
        disciplineId: entry.discipline_id,
        saNumber: entry.sa_number,
        saName: entry.sa_name,
        activites: entry.activites,
        contenu: entry.contenu,
        heureDebut: entry.heure_debut,
        heureFin: entry.heure_fin,
        dateCours: entry.date_cours,
        trimestre: entry.trimestre,
        mois: entry.mois,
        semaineNumero: entry.semaine_numero
      };
      if (this.editor) {
        this.editor.commands.setContent(this.newEntry.contenu);
      }
      this.editingEntry = true;
      this.showForm = true;
    },
    async updateEntry() {
      try {
        if (!this.newEntry.disciplineId) {
          alert('Veuillez sélectionner une discipline');
          return;
        }

        const entryData = {
          discipline_id: this.newEntry.disciplineId,
          sa_number: this.newEntry.saNumber,
          sa_name: this.newEntry.saName,
          activites: this.newEntry.activites,
          contenu: this.newEntry.contenu,
          date_cours: this.newEntry.dateCours,
          heure_debut: this.newEntry.heureDebut,
          heure_fin: this.newEntry.heureFin,
          trimestre: this.newEntry.trimestre,
          mois: this.newEntry.mois,
          semaine_numero: this.newEntry.semaineNumero
        };
        
        await api.put(`/cahier/cahier-entries/${this.newEntry.id}`, entryData);
        await this.fetchCahierEntries();
        this.resetEntryForm();
        this.editingEntry = false;
        this.showForm = false;
        alert('Entrée mise à jour avec succès !');
      } catch (error) {
        console.error('Erreur mise à jour entrée:', error);
        alert('Erreur lors de la mise à jour de l\'entrée');
      }
    },
    async deleteEntry(id) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
        try {
          await api.delete(`/cahier/cahier-entries/${id}`);
          await this.fetchCahierEntries();
          alert('Entrée supprimée avec succès !');
        } catch (error) {
          console.error('Erreur suppression entrée:', error);
          alert('Erreur lors de la suppression de l\'entrée');
        }
      }
    },
    cancelEntryEdit() {
      this.resetEntryForm();
      this.editingEntry = false;
      this.showForm = false;
    },
    async showHistory(entryId) {
      try {
        const response = await api.get(`/cahier/cahier-entries/${entryId}/history`);
        this.history = response.data;
        this.historyEntryId = entryId;
        this.showHistoryModal = true;
      } catch (error) {
        console.error('Erreur chargement historique:', error);
      }
    },
    closeHistory() {
      this.showHistoryModal = false;
      this.history = [];
      this.historyEntryId = null;
    }
  }
};

Date.prototype.getWeek = function() {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};
</script>

<style scoped>
/* Styles existants */
</style>