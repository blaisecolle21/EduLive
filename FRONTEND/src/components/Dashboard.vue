<template>
  <div class="min-h-screen bg-blue-100 p-4">
    <h1 class="text-3xl font-bold">Tableau de bord</h1>
    <p v-if="user">Bienvenue, {{ user.prenoms }} {{ user.nom }} ({{ user.role }})</p>
    <p v-else>Chargement...</p>

    <!-- Navbar pour l'admin -->
    <div v-if="user && user.role === 'admin'" class="mt-4">
      <nav class="bg-gray-800 text-white p-2 rounded-md flex space-x-4 overflow-x-auto">
        <button @click="activeSection = 'accueil'" :class="{ 'bg-gray-900 px-4 py-2 rounded': activeSection === 'accueil' }" class="px-4 py-2 rounded hover:bg-gray-700 whitespace-nowrap">Accueil</button>
        <button @click="activeSection = 'users'" :class="{ 'bg-gray-900': activeSection === 'users' }" class="px-4 py-2 rounded hover:bg-gray-700">Gestion des utilisateurs</button>
        <button @click="activeSection = 'classes'" :class="{ 'bg-gray-900': activeSection === 'classes' }" class="px-4 py-2 rounded hover:bg-gray-700">Gestion des classes</button>
        <button @click="activeSection = 'disciplines'" :class="{ 'bg-gray-900': activeSection === 'disciplines' }" class="px-4 py-2 rounded hover:bg-gray-700">Gestion des disciplines</button>
        <button @click="activeSection = 'import'" :class="{ 'bg-gray-900': activeSection === 'import' }" class="px-4 py-2 rounded hover:bg-gray-700">Importation de PDF</button>
      </nav>

      <!-- Section Accueil -->
      <div v-if="activeSection === 'accueil'" class="mt-4 bg-white shadow p-6 rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Accueil</h2>
        <div class="flex justify-center items-center h-64 bg-gray-200 rounded-md">
          <p class="text-gray-500">Photo de bienvenue à venir</p>
        </div>
      </div>

      <!-- Section Gestion des utilisateurs -->
      <div v-if="activeSection === 'users'" class="mt-4">
        <div class="mt-4">
          <button @click="$router.push('/register')" class="bg-green-500 text-white p-2 rounded hover:bg-green-600">
            Gérer les Inscriptions
          </button>
        </div>
        <button @click="fetchUsers" class="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Lister les utilisateurs</button>
        <div v-if="usersLoaded">
          <table v-if="users.length" class="mt-4 w-full border-collapse border">
            <thead>
              <tr>
                <th class="border p-2">Id</th>
                <th class="border p-2">Nom</th>
                <th class="border p-2">Prénoms</th>
                <th class="border p-2">Email</th>
                <th class="border p-2">Rôle</th>
                <th class="border p-2">Établissement</th>
                <th class="border p-2">Actif</th>
                <th class="border p-2">Dernière connexion</th>
                <th class="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td class="border p-2">{{ u.id }}</td>
                <td class="border p-2">{{ u.nom }}</td>
                <td class="border p-2">{{ u.prenoms }}</td>
                <td class="border p-2">{{ u.email }}</td>
                <td class="border p-2">{{ u.role }}</td>
                <td class="border p-2">{{ u.etablissement?.nom || 'N/A' }}</td>
                <td class="border p-2">{{ u.est_actif ? 'Oui' : 'Non' }}</td>
                <td class="border p-2">{{ formatDate(u.derniere_connexion) }}</td>
                <td class="border p-2">
                  <button @click="startEditing(u)" class="bg-yellow-500 text-white p-1 rounded mr-2">Modifier</button>
                  <button @click="deleteUser(u.id)" class="bg-red-500 text-white p-1 rounded">Supprimer</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="mt-4">Aucun utilisateur trouvé.</p>
        </div>
        <p v-if="!usersLoaded" class="mt-4">Cliquez sur 'Lister les utilisateurs' pour voir la liste.</p>
      </div>

      <!-- Section Gestion des classes -->
      <div v-if="activeSection === 'classes'" class="mt-4">
        <button @click="showAddClass = true" class="mt-2 bg-green-500 text-white p-2 rounded hover:bg-green-600">Ajouter une classe</button>
        <table v-if="classes.length" class="mt-4 w-full border-collapse border">
          <thead>
            <tr>
              <th class="border p-2">Nom</th>
              <th class="border p-2">Promotion</th>
              <th class="border p-2">Niveau</th>
              <th class="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="classe in classes" :key="classe.id">
              <td class="border p-2">{{ classe.nom }}</td>
              <td class="border p-2">{{ classe.promotion }}</td>
              <td class="border p-2">{{ classe.niveau }}</td>
              <td class="border p-2">
                <button @click="editClass(classe)" class="bg-yellow-500 text-white p-1 rounded mr-2">Modifier</button>
                <button @click="deleteClass(classe.id)" class="bg-red-500 text-white p-1 rounded">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="mt-4">Aucune classe trouvée.</p>

        <!-- Modal pour ajouter/modifier une classe -->
        <div v-if="showAddClass || showEditClass" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-lg font-semibold">{{ showAddClass ? 'Ajouter une classe' : 'Modifier une classe' }}</h3>
            <form @submit.prevent="showAddClass ? addClass() : updateClass()" class="space-y-4 mt-4">
              <div>
                <label for="classNom" class="block text-sm font-medium text-gray-700">Nom :</label>
                <input v-model="newClass.nom" id="classNom" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              <div>
                <label for="classPromotion" class="block text-sm font-medium text-gray-700">Promotion :</label>
                <select v-model="newClass.promotion" id="classPromotion" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                  <option v-for="promo in ['6e', '5e', '4e', '3e', '2nde AB', '2nde C', '2nde D', '1ere AB', '1ere C', '1ere D', 'Tle A1', 'Tle A2-B', 'Tle C', 'Tle D']" :key="promo" :value="promo">{{ promo }}</option>
                </select>
              </div>
              <div>
                <label for="classNiveau" class="block text-sm font-medium text-gray-700">Niveau :</label>
                <input v-model="newClass.niveau" id="classNiveau" type="text" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              <div class="flex justify-end space-x-2">
                <button type="submit" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">{{ showAddClass ? 'Ajouter' : 'Mettre à jour' }}</button>
                <button @click="cancelClassEdit" class="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Section Gestion des disciplines -->
      <div v-if="activeSection === 'disciplines'" class="mt-4">
        <button @click="showAddDiscipline = true" class="mt-2 bg-green-500 text-white p-2 rounded hover:bg-green-600">Ajouter une discipline</button>
        <table v-if="disciplines.length" class="mt-4 w-full border-collapse border">
          <thead>
            <tr>
              <th class="border p-2">Nom</th>
              <th class="border p-2">Classe</th>
              <th class="border p-2">Coefficient</th>
              <th class="border p-2">Heures/semaine</th>
              <th class="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="discipline in disciplines" :key="discipline.id">
              <td class="border p-2">{{ discipline.nom }}</td>
              <td class="border p-2">{{ getClassName(discipline.classe_id) }}</td>
              <td class="border p-2">{{ discipline.coefficient }}</td>
              <td class="border p-2">{{ discipline.heures_par_semaine }}</td>
              <td class="border p-2">
                <button @click="editDiscipline(discipline)" class="bg-yellow-500 text-white p-1 rounded mr-2">Modifier</button>
                <button @click="deleteDiscipline(discipline.id)" class="bg-red-500 text-white p-1 rounded">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="mt-4">Aucune discipline trouvée.</p>

        <!-- Modal pour ajouter/modifier une discipline -->
        <div v-if="showAddDiscipline || showEditDiscipline" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h3 class="text-lg font-semibold">{{ showAddDiscipline ? 'Ajouter une discipline' : 'Modifier une discipline' }}</h3>
            <form @submit.prevent="showAddDiscipline ? addDiscipline() : updateDiscipline()" class="space-y-4 mt-4">
              <div>
                <label for="disciplineNom" class="block text-sm font-medium text-gray-700">Nom :</label>
                <select v-model="newDiscipline.nom" id="disciplineNom" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                  <option v-for="disc in ['PCT', 'Mathématiques', 'SVT', 'Histoire-Géographie', 'Français', 'Anglais', 'Lecture', 'Communication écrite', 'Philosophie']" :key="disc" :value="disc">{{ disc }}</option>
                </select>
              </div>
              <div>
                <label for="disciplineClass" class="block text-sm font-medium text-gray-700">Classe :</label>
                <select v-model="newDiscipline.classe_id" id="disciplineClass" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                  <option v-for="classe in classes" :key="classe.id" :value="classe.id">{{ classe.nom }}</option>
                </select>
              </div>
              <div>
                <label for="disciplineCoefficient" class="block text-sm font-medium text-gray-700">Coefficient :</label>
                <input v-model.number="newDiscipline.coefficient" id="disciplineCoefficient" type="number" step="0.1" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              <div>
                <label for="disciplineHeures" class="block text-sm font-medium text-gray-700">Heures/semaine :</label>
                <input v-model.number="newDiscipline.heures_par_semaine" id="disciplineHeures" type="number" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              <div class="flex justify-end space-x-2">
                <button type="submit" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">{{ showAddDiscipline ? 'Ajouter' : 'Mettre à jour' }}</button>
                <button @click="cancelDisciplineEdit" class="bg-gray-500 text-white p-2 rounded hover:bg-gray-600">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Section Importation de PDF -->
      <div v-if="activeSection === 'import'" class="mt-4">
        <form @submit.prevent="handleImport" class="mt-4 bg-white shadow p-6 rounded-lg space-y-4">
          <div>
            <label for="pdfFile" class="block text-sm font-medium text-gray-700">Sélectionner un fichier PDF :</label>
            <input type="file" id="pdfFile" accept="application/pdf" @change="onFileChange" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
          </div>
          <button type="submit" :disabled="!selectedFile" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
            Importer
          </button>
        </form>
        <div v-if="importResult" class="mt-4 p-4 bg-gray-50 rounded-md">
          <p v-if="importSuccess" class="text-green-600">{{ importResult }}</p>
          <p v-else class="text-red-600">{{ importResult }}</p>
          <pre v-if="importDetails" class="mt-2 text-sm text-gray-600">{{ importDetails }}</pre>
        </div>
      </div>
    </div>

    <div v-else-if="user" class="mt-4">
      <p>Accès réservé aux administrateurs.</p>
    </div>

    <div v-if="editingUser" class="mt-4">
      <h3 class="text-lg font-semibold">Modifier l'utilisateur</h3>
      <form @submit.prevent="editUser">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Nom</label>
          <input v-model="editingUser.nom" type="text" class="w-full p-2 border rounded" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Prénoms</label>
          <input v-model="editingUser.prenoms" type="text" class="w-full p-2 border rounded" required />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Rôle</label>
          <select v-model="editingUser.role" class="w-full p-2 border rounded" required>
            <option value="enseignant">Enseignant</option>
            <option value="coordinateur">Coordinateur</option>
            <option value="directeur">Directeur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">Actif</label>
          <select v-model="editingUser.est_actif" class="w-full p-2 border rounded" required>
            <option :value="true">Oui</option>
            <option :value="false">Non</option>
          </select>
        </div>
        <button type="submit" class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">Enregistrer</button>
        <button @click="editingUser = null" class="ml-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600">Annuler</button>
      </form>
    </div>
    <button @click="logout" class="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600">Déconnexion</button>
  </div>
</template>

<script>
import api from '../api';

export default {
  data() {
    return {
      user: null,
      users: [],
      editingUser: null,
      usersLoaded: false, // Nouvel état pour contrôler l'affichage
      usersFetched: false, // Pour différencier si la requête a été tentée
      selectedFile: null,
      importResult: '',
      importDetails: '',
      importSuccess: false,
      classes: [],
      disciplines: [],
      showAddClass: false,
      showEditClass: false,
      newClass: { nom: '', promotion: '6e', niveau: '' },
      showAddDiscipline: false,
      showEditDiscipline: false,
      newDiscipline: { nom: 'PCT', classe_id: null, coefficient: 1.0, heures_par_semaine: 4 },
      activeSection: 'users'
    };
  },
  async created() {
    try {
      const response = await api.get('/users/me');
      this.user = response.data;
      if (this.user.role === 'admin') {
        // Définir activeSection à partir du paramètre de requête
        this.activeSection = this.$route.query.section || 'accueil';
        await this.fetchUsers();
        await this.fetchClasses();
        await this.fetchDisciplines();
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error.response?.data);
      this.$router.push('/login');
    }
  },
  methods: {
    async fetchUsers() {
      try {
        const response = await api.get('/users');
        this.users = response.data;
        this.usersLoaded = true;
        this.usersFetched = true;
      } catch (error) {
        console.error('Erreur liste utilisateurs:', error.response?.data);
        this.usersFetched = true; // Marquer comme tenté même en cas d'erreur
      }
    },
    startEditing(user) {
      this.editingUser = { ...user };
    },
    async editUser() {
      try {
        await api.put(`/users/${this.editingUser.id}`, this.editingUser);
        alert('Utilisateur mis à jour');
        this.editingUser = null;
        this.fetchUsers(); // Rafraîchir la liste après mise à jour
      } catch (error) {
        console.error('Erreur mise à jour:', error.response?.data);
      }
    },
    async deleteUser(id) {
      if (confirm('Confirmer la suppression ?')) {
        try {
          await api.delete(`/users/${id}`);
          alert('Utilisateur supprimé');
          this.users = this.users.filter(user => user.id !== id); // Mettre à jour localement
        } catch (error) {
          console.error('Erreur suppression:', error.response?.data);
        }
      }
    },
    async fetchClasses() {
      try {
        const response = await api.get('/cahier/classes');
        this.classes = response.data;
      } catch (error) {
        console.error('Erreur récupération classes:', error);
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
    getClassName(classId) {
      const classe = this.classes.find(c => c.id === classId);
      return classe ? classe.nom : 'Inconnue';
    },
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/login');
    },
    formatDate(date) {
      if (!date) return 'Jamais';
      return new Date(date).toLocaleDateString('fr-FR');
    },
    onFileChange(event) {
      this.selectedFile = event.target.files[0];
    },
    async handleImport() {
      if (!this.selectedFile) {
        this.importResult = 'Veuillez sélectionner un fichier PDF.';
        this.importSuccess = false;
        return;
      }
      const formData = new FormData();
      formData.append('pdf', this.selectedFile);
      try {
        const response = await api.post('/programs/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.importResult = `Importation réussie ! ${response.data.insertedCount} entrées insérées.`;
        this.importSuccess = true;
        this.importDetails = JSON.stringify(response.data.entries, null, 2);
      } catch (error) {
        this.importResult = `Erreur : ${error.response?.data?.error || error.message}`;
        this.importSuccess = false;
        this.importDetails = JSON.stringify(error.response?.data?.debugInfo, null, 2);
      }
    },
    async addClass() {
      try {
        await api.post('/cahier/classes', this.newClass);
        this.fetchClasses();
        this.showAddClass = false;
        this.newClass = { nom: '', promotion: '6e', niveau: '' };
      } catch (error) {
        console.error('Erreur ajout classe:', error);
      }
    },
    editClass(classe) {
      this.newClass = { ...classe };
      this.showEditClass = true;
      this.showAddClass = false;
    },
    async updateClass() {
      try {
        await api.put(`/cahier/classes/${this.newClass.id}`, this.newClass);
        this.fetchClasses();
        this.showEditClass = false;
        this.newClass = { nom: '', promotion: '6e', niveau: '' };
      } catch (error) {
        console.error('Erreur mise à jour classe:', error);
      }
    },
    async deleteClass(id) {
      if (confirm('Confirmer la suppression ?')) {
        try {
          await api.delete(`/cahier/classes/${id}`);
          this.fetchClasses();
        } catch (error) {
          console.error('Erreur suppression classe:', error);
        }
      }
    },
    cancelClassEdit() {
      this.showAddClass = false;
      this.showEditClass = false;
      this.newClass = { nom: '', promotion: '6e', niveau: '' };
    },
    async addDiscipline() {
      try {
        await api.post('/cahier/disciplines', this.newDiscipline);
        this.fetchDisciplines();
        this.showAddDiscipline = false;
        this.newDiscipline = { nom: 'PCT', classe_id: null, coefficient: 1.0, heures_par_semaine: 4 };
      } catch (error) {
        console.error('Erreur ajout discipline:', error);
      }
    },
    editDiscipline(discipline) {
      this.newDiscipline = { ...discipline };
      this.showEditDiscipline = true;
      this.showAddDiscipline = false;
    },
    async updateDiscipline() {
      try {
        await api.put(`/cahier/disciplines/${this.newDiscipline.id}`, this.newDiscipline);
        this.fetchDisciplines();
        this.showEditDiscipline = false;
        this.newDiscipline = { nom: 'PCT', classe_id: null, coefficient: 1.0, heures_par_semaine: 4 };
      } catch (error) {
        console.error('Erreur mise à jour discipline:', error);
      }
    },
    async deleteDiscipline(id) {
      if (confirm('Confirmer la suppression ?')) {
        try {
          await api.delete(`/cahier/disciplines/${id}`);
          this.fetchDisciplines();
        } catch (error) {
          console.error('Erreur suppression discipline:', error);
        }
      }
    },
    cancelDisciplineEdit() {
      this.showAddDiscipline = false;
      this.showEditDiscipline = false;
      this.newDiscipline = { nom: 'PCT', classe_id: null, coefficient: 1.0, heures_par_semaine: 4 };
    }
  }
};
</script>

<style scoped>
/* Styles existants */
</style>