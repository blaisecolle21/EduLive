<template>
  <div class="min-h-screen relative flex bg-blue-100 overflow-hidden">
    <!-- Bouton pour ouvrir/fermer la sidebar -->
    <!-- Bouton pour ouvrir/fermer la sidebar (mobile uniquement) -->
    <button
      @click="showSidebar = !showSidebar"
      class="md:hidden px-3 py-1 bg-blue-600 text-white rounded mb-4"
    >
      {{ showSidebar ? "Fermer Menu" : "Ouvrir Menu" }}
    </button>

    <!-- Overlay semi-transparent (mobile) -->
    <div
      v-if="showSidebar"
      @click="showSidebar = false"
      class="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40 md:hidden"
    ></div>

    <!-- Sidebar -->

    <aside
      class="fixed top-25 left-0 bg-white shadow-xl flex flex-col border-r border-gray-100 transition-all duration-300 z-50"
      style="height: calc(100vh - 100px)"
      :class="[
        isCollapsed ? 'w-20' : 'w-64',
        showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <!-- Bouton collapse (desktop uniquement) -->
      <button
        @click="isCollapsed = !isCollapsed"
        class="absolute -right-3.5 top-6 bg-teal-600 text-white rounded-full p-1 shadow-lg hover:bg-teal-500 cursor-pointer transition-all duration-300 z-50 hidden md:flex items-center justify-center ring-2 ring-white"
        :class="{ 'rotate-180': !isCollapsed }"
        :title="isCollapsed ? 'Agrandir' : 'Réduire'"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2.5"
          stroke="currentColor"
          class="w-3.5 h-3.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      <!-- Header avatar -->
      <div
        class="flex items-center gap-3 px-4 py-5 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-teal-500 flex-shrink-0"
      >
        <div
          class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0"
        >
          {{ user.prenoms?.charAt(0) }}{{ user.nom?.charAt(0) }}
        </div>
        <transition name="fade">
          <div v-show="!isCollapsed" class="overflow-hidden">
            <p class="font-medium text-white text-sm truncate max-w-[150px]">
              {{ user.prenoms }} {{ user.nom }}
            </p>
            <span
              class="text-xs text-teal-100 bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block capitalize"
            >
              {{ user.Role?.name }}
            </span>
          </div>
        </transition>
      </div>

      <!-- Menu -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <nav class="px-3 py-4 space-y-1">
          <transition name="fade">
            <p
              v-show="!isCollapsed"
              class="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3"
            >
              Menu
            </p>
          </transition>

          <!-- Un seul menu  -->
          <SidebarItem
            v-for="item in menuItems"
            :key="item.section"
            :icon="item.icon"
            :label="item.label"
            :active="activeSection === item.section"
            :collapsed="isCollapsed"
            :badge="item.badge"
            @click="activeSection = item.section"
          />
        </nav>
      </div>
      <!-- Footer déconnexion -->
      <div class="px-3 py-4 border-t border-gray-100 flex-shrink-0 mt-auto">
        <button
          @click="logout"
          class="w-full flex items-center gap-3 p-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 group cursor-pointer"
          :class="isCollapsed ? 'justify-center' : 'px-3'"
          title="Déconnexion"
        >
          <ArrowLeftStartOnRectangleIcon
            class="h-6 w-6 shrink-0 text-white hover:bg-gray-800 cursor-pointer transition-colors"
          />
          <transition name="fade">
            <span
              v-show="!isCollapsed"
              class="ml-3 text-sm font-medium whitespace-nowrap animate-fadeIn"
            >
              Déconnexion
            </span>
          </transition>
        </button>
      </div>
    </aside>

    <!-- Contenu principal -->
    <div class="flex-1 pt-16 md:ml-80 mt-20 p-4">
      <!-- <h1 class="text-3xl font-bold mb-4">Espace Enseignant</h1>
      <p v-if="user">Bienvenue, {{ user.prenoms }} {{ user.nom }} ({{ user.Role?.name }})</p> -->
      <!-- <p v-else>Chargement...</p> -->

      <!-- Section Accueil -->
      <div
        v-if="activeSection === 'accueil'"
        class="max-w-5xl mx-auto space-y-6"
      >
        <h2 class="text-2xl font-bold mb-4 typewriter">
          {{ user.prenoms }} {{ user.nom }}
        </h2>

        <div class="relative w-full h-96 rounded-lg overflow-hidden shadow-lg">
          <!-- Image d'accueil -->
          <img
            src="/src/assets/enseignant-accueil.png"
            alt="Accueil enseignant"
            class="w-full h-full object-cover"
          />

          <!-- Message d'accueil - Overlay transparent-->

          <div
            class="absolute inset-0 bg-gradient-to-t from-teal-700 via-transparent to-transparent flex flex-col items-center justify-center text-center p-8"
          >
            <h1
              class="text-4xl font-bold text-white mb-4 typewriter animate-fadeIn"
            >
              <span class="text-teal-100">Bienvenue</span> dans votre espace
              enseignant!
            </h1>

            <p class="text-lg text-gray-100 max-w-xl animate-slideUp delay-500">
              Un lieu pensé pour vous accompagner, organiser vos cours et
              inspirer vos élèves chaque jour.
            </p>
          </div>
        </div>
      </div>

      <!-- Section Mes Classes -->
      <div
        v-if="activeSection === 'mes-classes'"
        class="max-w-5xl mx-auto space-y-6"
      >
        <!-- Liste des classes de l'enseignant -->
        <h2 class="text-xl font-semibold mb-4">Mes Classes</h2>
        <div v-if="loadingClasses" class="text-center">
          Chargement des classes...
        </div>
        <div
          v-else-if="uniqueClasses.length"
          class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          <div
            v-for="classe in uniqueClasses"
            :key="classe.id"
            @click="selectClass(classe.id)"
            :class="{
              'ring-2 ring-teal-500 ring-offset-2 transition animate-zoom':
                selectedClassId === classe.id,
            }"
            class="bg-white p-4 rounded-lg shadow cursor-pointer hover:bg-gray-100 hover:scale-105 transition-transform duration-200 animate-fadeIn"
          >
            <h3 class="text-xl font-semibold flex items-center gap-2">
              📘 {{ classe.nom }} ({{ classe.promotion }})
            </h3>
            <span
              class="inline-block mt-2 bg-teal-100 text-blue-700 px-2 py-1 rounded-full text-xs"
              >Niveau: {{ classe.niveau }}</span
            >
          </div>
        </div>
        <p v-else class="mt-4">
          Aucune classe trouvée. Vérifiez vos associations avec les disciplines.
        </p>

        <!-- Cahier de texte pour la classe sélectionnée -->
        <div v-if="selectedClassId" class="mt-6">
          <h2 class="text-xl font-semibold mb-4">
            Cahier de texte - {{ getClassName(selectedClassId) }}
          </h2>

          <!-- Affichage des disciplines disponibles -->
          <div class="bg-teal-50 p-4 rounded-lg mb-4">
            <p class="text-sm font-medium text-gray-700">
              Discipline(s) enseignée(s) dans cette classe :
              <span class="font-bold text-teal-600">{{
                userDisciplines.map((d) => d.nom).join(", ") || "Aucune"
              }}</span>
            </p>
          </div>

          <button
            @click="openAddEntryForm"
            class="w-full md:w-auto bg-green-500 text-white p-2 rounded hover:bg-green-600 mb-4 cursor-pointer"
          >
            ➕ Ajouter une entrée
          </button>

          <!-- Debug info (à supprimer après résolution) -->
          <div class="bg-gray-100 p-3 rounded mb-4 text-sm">
            <p><strong>Debug Info:</strong></p>
            <p>Classe sélectionnée: {{ selectedClassId }}</p>
            <p>Total entrées chargées: {{ cahierEntries.length }}</p>
            <p>Entrées filtrées: {{ filteredCahierEntries.length }}</p>
            <p>User ID: {{ user?.id }}</p>
          </div>

          <!-- Message si aucune entrée -->
          <div
            v-if="filteredCahierEntries.length === 0"
            class="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4"
          >
            <p class="text-yellow-800">
              📝 Aucune entrée pour cette classe. Cliquez sur "Ajouter une
              entrée" pour créer votre première entrée.
            </p>
          </div>

          <!-- Table des entrées -->
          <div v-else class="overflow-x-auto">
            <table
              class="w-full border-collapse border border-gray-300 bg-white shadow-sm"
            >
              <thead class="bg-gray-100">
                <tr>
                  <th class="border border-gray-300 p-3 text-left">ID</th>
                  <th class="border border-gray-300 p-3 text-left">
                    Discipline
                  </th>
                  <th class="border border-gray-300 p-3 text-left">
                    SA Numéro
                  </th>
                  <th class="border border-gray-300 p-3 text-left">SA Nom</th>
                  <th class="border border-gray-300 p-3 text-left">Date</th>
                  <th class="border border-gray-300 p-3 text-left">Horaire</th>
                  <th class="border border-gray-300 p-3 text-left">
                    Trimestre
                  </th>
                  <th class="border border-gray-300 p-3 text-left">
                    Progression
                  </th>
                  <th class="border border-gray-300 p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="entry in filteredCahierEntries"
                  :key="entry.id"
                  class="hover:bg-gray-50"
                >
                  <td class="border border-gray-300 p-3">{{ entry.id }}</td>
                  <td class="border border-gray-300 p-3">
                    {{
                      entry.discipline?.nom ||
                      getDisciplineName(entry.discipline_id)
                    }}
                  </td>
                  <td class="border border-gray-300 p-3">
                    <span
                      class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {{ entry.sa_number }}
                    </span>
                  </td>
                  <td class="border border-gray-300 p-3">
                    {{ entry.sa_name }}
                  </td>
                  <td class="border border-gray-300 p-3">
                    {{ formatDate(entry.date_cours) }}
                  </td>
                  <td class="border border-gray-300 p-3 text-sm">
                    {{ entry.heure_debut }} - {{ entry.heure_fin }}
                  </td>
                  <td class="border border-gray-300 p-3">
                    {{ entry.trimestre }}
                  </td>

                  <!-- NOUVELLE COLONNE: Progression -->
                  <td class="border p-2">
                    <div class="flex items-center space-x-2">
                      <div class="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-green-500 h-2 rounded-full transition-all"
                          :style="{
                            width: (entry.pourcentage_realise || 0) + '%',
                          }"
                        ></div>
                      </div>
                      <span class="text-sm font-medium">
                        {{ entry.pourcentage_realise || 0 }}%
                      </span>
                    </div>
                  </td>

                  <td class="border border-gray-300 p-3">
                    <div class="flex space-x-1">
                      <button
                        @click="editEntry(entry)"
                        class="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                        title="Modifier"
                      >
                        ✏️ Modifier
                      </button>
                      <!-- <button 
                    @click="showHistory(entry.id)" 
                    class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                    title="Historique"
                    >
                      📜 Historique
                      </button>
                    <button 
                    @click="deleteEntry(entry.id)" 
                    class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    title="Supprimer"
                    >
                    🗑️ Supprimer
                    </button> -->
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- ===== AFFICHAGE DE LA PROGRESSION GLOBALE ===== -->

            <div
              class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow"
            >
              <h3 class="text-lg font-semibold mb-3">📊 Progression Globale</h3>

              <div v-if="selectedClassId && newEntry.disciplineId">
                <div class="flex items-center space-x-3">
                  <div class="flex-1">
                    <div class="bg-gray-200 rounded-full h-4">
                      <div
                        class="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                        :style="{ width: progressionGlobale + '%' }"
                      ></div>
                    </div>
                  </div>
                  <span class="text-2xl font-bold text-blue-600">
                    {{ progressionGlobale }}%
                  </span>
                </div>

                <p class="text-sm text-gray-600 mt-2">
                  Basé sur toutes les entrées de cahier et le programme
                  théorique
                </p>
              </div>

              <p v-else class="text-sm text-gray-500 italic">
                Sélectionnez une classe et une discipline pour voir la
                progression
              </p>
            </div>
          </div>

          <!-- Modal pour l'historique -->
          <div
            v-if="showHistoryModal"
            class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
          >
            <div
              class="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto"
            >
              <h3 class="text-lg font-semibold mb-4">
                Historique de l'entrée {{ historyEntryId }}
              </h3>
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
                    <td class="border p-2">
                      {{ formatDate(version.modified_at) }}
                    </td>
                    <td class="border p-2">
                      {{ previewText(version.contenu) }}...
                    </td>
                  </tr>
                </tbody>
              </table>
              <button
                @click="closeHistory"
                class="mt-4 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
              >
                Fermer
              </button>
            </div>
          </div>

          <!-- Formulaire intégré pour ajouter/modifier une entrée -->
          <div
            v-if="showForm"
            class="p-4 bg-gray-50 rounded-lg mt-4 border-2 border-blue-200"
          >
            <h3 class="text-lg font-semibold mb-4">
              {{ editingEntry ? "Modifier une entrée" : "Ajouter une entrée" }}
            </h3>

            <!-- Message d'avertissement si aucune discipline -->
            <div
              v-if="!userDisciplines.length"
              class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            >
              <p class="font-bold">Aucune discipline disponible</p>
              <p>
                Vous n'enseignez aucune discipline dans cette classe. Veuillez
                contacter l'administrateur.
              </p>
            </div>

            <form
              v-else
              @submit.prevent="editingEntry ? updateEntry() : addEntry()"
              class="space-y-4"
            >
              <!-- Discipline -->
              <div>
                <label
                  for="entryDiscipline"
                  class="block text-sm font-medium text-gray-700"
                >
                  Discipline <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="newEntry.disciplineId"
                  id="entryDiscipline"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  @change="onDisciplineChange"
                >
                  <option value="" disabled>
                    -- Sélectionnez une discipline --
                  </option>
                  <option
                    v-for="discipline in userDisciplines"
                    :key="discipline.id"
                    :value="discipline.id"
                  >
                    {{ discipline.nom }}
                  </option>
                </select>
                <p class="mt-1 text-sm text-gray-500">
                  Choisissez la discipline pour laquelle vous souhaitez créer
                  cette entrée
                </p>
              </div>
              <!-- Numéro de SA ... Liste déroulante -->
              <div>
                <label
                  for="entrySaNumber"
                  class="block text-sm font-medium text-gray-700"
                >
                  Numéro de SA <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="newEntry.saNumber"
                  id="entrySaNumber"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                  @change="onSaNumberChange"
                >
                  <option value="" disabled>-- Sélectionnez une SA --</option>
                  <option value="SA1">SA 1</option>
                  <option value="SA2">SA 2</option>
                  <option value="SA3">SA 3</option>
                  <option value="SA4">SA 4</option>
                  <option value="SA5">SA 5</option>
                  <option value="SA6">SA 6</option>
                </select>
              </div>

              <div>
                <label
                  for="entrySaName"
                  class="block text-sm font-medium text-gray-700"
                  >Nom de SA :</label
                >
                <input
                  v-model="newEntry.saName"
                  id="entrySaName"
                  type="text"
                  class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                  required
                />
              </div>

              <!-- Activités - Liste déroulante multiple depuis programme théorique -->

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Activités <span class="text-red-500">*</span>
                </label>

                <!-- Chargement -->
                <div v-if="loadingActivites" class="mt-2 text-sm text-gray-600">
                  🔄 Chargement des activités depuis le programme théorique...
                </div>

                <!-- Aucune activité trouvée -->
                <div
                  v-else-if="
                    !availableActivites.length &&
                    newEntry.disciplineId &&
                    newEntry.saNumber
                  "
                  class="mt-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded"
                >
                  <p class="text-sm">
                    ⚠️ Aucune activité trouvée dans le programme théorique pour
                    cette SA et cette classe.
                  </p>
                </div>

                <div
                  v-else-if="availableActivites.length > 0"
                  class="mt-2 space-y-2"
                >
                  <div class="flex justify-between items-center mb-2">
                    <p class="text-sm text-gray-600">
                      📚 {{ availableActivites.length }} activité(s)
                      disponible(s)
                    </p>
                    <p class="text-sm font-medium text-blue-600">
                      Progression: {{ pourcentageRealise }}%
                    </p>
                  </div>

                  <div
                    class="max-h-96 overflow-y-auto border border-gray-300 rounded-md p-3 bg-white space-y-3"
                  >
                    <div
                      v-for="(activite, index) in availableActivites"
                      :key="index"
                      class="border-b border-gray-200 pb-3 last:border-0"
                    >
                      <!-- Checkbox de sélection -->
                      <label
                        class="flex items-start space-x-2 cursor-pointer hover:bg-blue-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          :value="activite"
                          v-model="selectedActivites"
                          class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span class="text-sm text-gray-700 flex-1">{{
                          activite
                        }}</span>
                      </label>

                      <!-- Boutons de statut (affichés uniquement si l'activité est sélectionnée) -->
                      <div
                        v-if="selectedActivites.includes(activite)"
                        class="mt-2 ml-6 flex space-x-2"
                      >
                        <button
                          type="button"
                          @click="activitesStatus[activite] = 'en_cours'"
                          :class="{
                            'bg-orange-500 text-white':
                              activitesStatus[activite] === 'en_cours',
                            'bg-gray-200 text-gray-700':
                              activitesStatus[activite] !== 'en_cours',
                          }"
                          class="px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition"
                        >
                          🔄 En cours
                        </button>

                        <button
                          type="button"
                          @click="activitesStatus[activite] = 'fait'"
                          :class="{
                            'bg-green-500 text-white':
                              activitesStatus[activite] === 'fait',
                            'bg-gray-200 text-gray-700':
                              activitesStatus[activite] !== 'fait',
                          }"
                          class="px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition"
                        >
                          ✅ Fait
                        </button>

                        <!-- Indicateur visuel du statut -->
                        <span
                          v-if="activitesStatus[activite]"
                          class="text-xs italic"
                          :class="{
                            'text-orange-600':
                              activitesStatus[activite] === 'en_cours',
                            'text-green-600':
                              activitesStatus[activite] === 'fait',
                          }"
                        >
                          {{
                            activitesStatus[activite] === "fait"
                              ? "✓ Terminée"
                              : "⋯ En cours"
                          }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Résumé de la sélection -->
                  <div class="mt-2 p-2 bg-blue-50 rounded text-sm">
                    <p>
                      <strong>{{ selectedActivites.length }}</strong>
                      activité(s) sélectionnée(s) •
                      <strong>{{
                        Object.values(activitesStatus).filter(
                          (s) => s === "fait",
                        ).length
                      }}</strong>
                      terminée(s) •
                      <strong>{{
                        Object.values(activitesStatus).filter(
                          (s) => s === "en_cours",
                        ).length
                      }}</strong>
                      en cours
                    </p>
                  </div>
                </div>

                <!-- Zone de texte pour saisie manuelle ou complément -->
                <div class="mt-3">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Activités manuelles (optionnel)
                  </label>
                  <textarea
                    v-model="manualActivites"
                    class="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Une activité par ligne..."
                  ></textarea>
                  <p class="text-xs text-gray-500 mt-1">
                    Ce champ vous permet d'ajouter des activités qui ne sont pas
                    dans le programme théorique
                  </p>
                </div>
              </div>

              <!-- Contenu (éditeur riche) -->
              <div>
                <label
                  for="entryContenu"
                  class="block text-sm font-medium text-gray-700"
                >
                  Contenu du cours <span class="text-red-500">*</span>
                </label>
                <div class="mt-1 border border-gray-300 rounded-md">
                  <menu-bar
                    :editor="editor"
                    class="border-b border-gray-300 p-2 bg-gray-50"
                  ></menu-bar>
                  <editor-content
                    :editor="editor"
                    class="p-3 min-h-[200px]"
                  ></editor-content>
                </div>
                <p class="mt-1 text-sm text-gray-500">
                  Décrivez le contenu détaillé du cours
                </p>
              </div>

              <!-- Horaires -->

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    for="entryHeureDebut"
                    class="block text-sm font-medium text-gray-700"
                    >Heure de début <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="newEntry.heureDebut"
                    id="entryHeureDebut"
                    type="time"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label
                    for="entryHeureFin"
                    class="block text-sm font-medium text-gray-700"
                    >Heure de fin <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="newEntry.heureFin"
                    id="entryHeureFin"
                    type="time"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <!-- Date et Trimestre -->

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    for="entryDateCours"
                    class="block text-sm font-medium text-gray-700"
                    >Date <span class="text-red-500">*</span></label
                  >
                  <input
                    v-model="newEntry.dateCours"
                    id="entryDateCours"
                    type="date"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                    @change="calculatePeriod"
                  />
                </div>
                <div>
                  <label
                    for="entryTrimestre"
                    class="block text-sm font-medium text-gray-700"
                    >Trimestre <span class="text-red-500">*</span></label
                  >
                  <select
                    v-model="newEntry.trimestre"
                    id="entryTrimestre"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="1er">1er</option>
                    <option value="2e">2e</option>
                    <option value="3e">3e</option>
                  </select>
                </div>
              </div>

              <!-- Bouton d'action -->

              <div
                class="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t"
              >
                <button
                  type="submit"
                  class="w-full sm:w-auto bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :disabled="!isFormValid"
                >
                  {{ editingEntry ? "✅Mettre à jour" : "➕ Ajouter" }}
                </button>
                <button
                  type="button"
                  @click="cancelEntryEdit"
                  class="w-full sm:w-auto bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Section Entrées à valider -->
      <div
        v-if="activeSection === 'a-valider'"
        class="max-w-5xl mx-auto space-y-6"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold">📋 Entrées à valider</h2>
          <span
            v-if="entreesEnAttente.length > 0"
            class="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold"
          >
            {{ entreesEnAttente.length }} en attente
          </span>
        </div>

        <div v-if="loadingEnAttente" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
          ></div>
        </div>

        <div
          v-else-if="entreesEnAttente.length === 0"
          class="bg-gray-50 rounded-lg p-8 text-center text-gray-500"
        >
          ✅ Aucune entrée en attente de validation.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="entry in entreesEnAttente"
            :key="entry.id"
            class="bg-white rounded-lg shadow border-l-4 border-orange-400 p-6"
          >
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="font-semibold text-lg">
                  {{ entry.sa_number }} — {{ entry.sa_name }}
                </h3>
                <p class="text-sm text-gray-600">
                  {{ entry.discipline?.nom }} •
                  {{ entry.discipline?.Classe?.nom }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  Soumis par {{ entry.soumetteur?.prenoms }}
                  {{ entry.soumetteur?.nom }} le
                  {{ formatDate(entry.created_at) }}
                </p>
              </div>
              <span
                class="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium"
              >
                ⏳ En attente
              </span>
            </div>

            <div class="bg-gray-50 rounded p-4 mb-3 text-sm space-y-2">
              <p>
                <strong>Date du cours :</strong>
                {{ formatDate(entry.date_cours) }} ({{ entry.heure_debut }} -
                {{ entry.heure_fin }})
              </p>
              <p><strong>Activités :</strong> {{ entry.activites }}</p>
              <div>
                <strong>Contenu :</strong>
                <div
                  class="mt-1 prose prose-sm max-w-none"
                  v-html="entry.contenu"
                ></div>
              </div>
            </div>

            <div v-if="rejetEnCours === entry.id" class="mb-3">
              <textarea
                v-model="commentaireRejet"
                rows="2"
                placeholder="Motif du rejet (obligatoire)..."
                class="w-full border border-red-300 rounded-lg p-2 text-sm"
              ></textarea>
            </div>

            <div class="flex gap-2">
              <button
                v-if="rejetEnCours !== entry.id"
                @click="validerEntree(entry.id)"
                :disabled="processingId === entry.id"
                class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                ✅ Valider
              </button>
              <button
                v-if="rejetEnCours !== entry.id"
                @click="rejetEnCours = entry.id"
                class="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                ❌ Rejeter
              </button>
              <template v-else>
                <button
                  @click="confirmerRejet(entry.id)"
                  :disabled="
                    processingId === entry.id || !commentaireRejet.trim()
                  "
                  class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmer le rejet
                </button>
                <button
                  @click="
                    rejetEnCours = null;
                    commentaireRejet = '';
                  "
                  class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Annuler
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Progression par classes -->
      <div
        v-if="activeSection === 'progression'"
        class="max-w-5xl mx-auto space-y-6"
      >
        <h2 class="text-2xl font-bold mb-4">Progression par classes</h2>

        <!-- Sélection de la classe -->

        <div>
          <h3 class="text-lg font-semibold mb-3">Sélectionnez une classe :</h3>
          <div v-if="loadingClasses" class="text-center">
            Chargement des classes...
          </div>
          <div
            v-else-if="uniqueClasses.length"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          >
            <div
              v-for="classe in uniqueClasses"
              :key="'prog-' + classe.id"
              @click="selectProgressionClass(classe.id)"
              :class="{
                'ring-4 ring-teal-500 ing-offset-2 animate-zoom':
                  selectedProgressionClassId === classe.id,
              }"
              class="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg hover:scale-105 transition-transform duration-200 animate-fadeIn"
            >
              <h4 class="text-xl font-semibold flex items-center gap-2">
                {{ classe.nom }}
              </h4>
              <p class="text-sm text-gray-600">{{ classe.promotion }}</p>
              <p
                class="inline-block mt-2 bg-teal-100 text-blue-700 px-2 py-1 rounded-full text-xs"
              >
                Niveau: {{ classe.niveau }}
              </p>
            </div>
          </div>
          <p v-else class="text-gray-500 italic">Aucune classe trouvée</p>
        </div>

        <!-- Sélection de la discipline -->
        <div
          v-if="selectedProgressionClassId"
          class="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <h3 class="text-lg font-semibold mb-3">
            Sélectionnez une discipline pour la classe de
            {{ getClassName(selectedProgressionClassId) }} :
          </h3>
          <div
            v-if="progressionDisciplines.length"
            class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            <button
              v-for="discipline in progressionDisciplines"
              :key="'prog-disc-' + discipline.id"
              @click="selectProgressionDiscipline(discipline.id)"
              :class="{
                'bg-teal-600 text-white border-teal-700':
                  selectedProgressionDisciplineId === discipline.id,
                'bg-white text-gray-700 border-gray-300 hover:bg-gray-100':
                  selectedProgressionDisciplineId !== discipline.id,
              }"
              class="p-3 rounded-lg border-2 font-medium transition"
            >
              📐 {{ discipline.nom }}
            </button>
          </div>
          <p v-else class="text-gray-500 italic">
            Aucune discipline enseignée dans cette classe
          </p>
        </div>

        <!-- Affichage de la progression -->
        <div
          v-if="selectedProgressionClassId && selectedProgressionDisciplineId"
          class="mt-6"
        >
          <!-- Loader -->
          <div v-if="loadingProgression" class="text-center py-8">
            <div
              class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            ></div>
            <p class="mt-2 text-gray-600">Calcul de la progression...</p>
          </div>

          <!-- Données de progression -->
          <div v-else-if="progressionData" class="space-y-6">
            <!-- Carte principale de progression -->
            <div
              class="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-xl p-8 text-white"
            >
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-2xl font-bold">Progression Globale</h3>
                  <p class="text-blue-100 mt-1">
                    {{ getDisciplineName(selectedProgressionDisciplineId) }} -
                    {{ getClassName(selectedProgressionClassId) }}
                  </p>
                </div>
                <div class="text-5xl font-bold">
                  {{ progressionData.progression }}%
                </div>
              </div>

              <!-- Barre de progression -->
              <div class="bg-white/20 rounded-full h-6 overflow-hidden">
                <div
                  class="bg-white h-6 rounded-full transition-all duration-1000 ease-out flex items-center justify-center text-xs font-bold text-blue-600"
                  :style="{ width: progressionData.progression + '%' }"
                >
                  <span v-if="progressionData.progression > 10"
                    >{{ progressionData.progression }}%</span
                  >
                </div>
              </div>

              <!-- Message motivant -->
              <p class="mt-4 text-center text-lg">
                <template v-if="progressionData.progression === 0">
                  🚀 Prêt à démarrer ? Créez votre première entrée de cahier !
                </template>
                <template v-else-if="progressionData.progression < 25">
                  💪 Bon début ! Continuez sur cette lancée !
                </template>
                <template v-else-if="progressionData.progression < 50">
                  ⭐ Super ! Vous avancez bien !
                </template>
                <template v-else-if="progressionData.progression < 75">
                  🎯 Excellent travail ! Plus de la moitié est faite !
                </template>
                <template v-else-if="progressionData.progression < 100">
                  🏆 Presque au but ! Encore un petit effort !
                </template>
                <template v-else> 🎉 Bravo ! Programme terminé ! </template>
              </p>
            </div>

            <!-- Statistiques détaillées -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-600 text-sm font-medium">
                      Taux Réalisé
                    </p>
                    <p class="text-3xl font-bold text-blue-600 mt-1">
                      {{ progressionData.taux_realise }}%
                    </p>
                  </div>
                  <div class="bg-blue-100 rounded-full p-3">
                    <svg
                      class="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div
                class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-600 text-sm font-medium">Taux Total</p>
                    <p class="text-3xl font-bold text-green-600 mt-1">
                      {{ progressionData.taux_total }}%
                    </p>
                  </div>
                  <div class="bg-green-100 rounded-full p-3">
                    <svg
                      class="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div
                class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-600 text-sm font-medium">
                      Entrées Créées
                    </p>
                    <p class="text-3xl font-bold text-purple-600 mt-1">
                      {{ progressionData.entries_count }}
                    </p>
                  </div>
                  <div class="bg-purple-100 rounded-full p-3">
                    <svg
                      class="w-8 h-8 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions rapides -->
            <div class="bg-white rounded-lg shadow p-6">
              <h4 class="text-lg font-semibold mb-4">Actions Rapides</h4>
              <div class="flex flex-col sm:flex-row gap-3">
                <button
                  @click="
                    activeSection = 'mes-classes';
                    selectClass(selectedProgressionClassId);
                  "
                  class="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  📝 Ajouter une entrée
                </button>
                <button
                  @click="loadProgressionData"
                  class="w-full sm:w-auto bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                >
                  🔄 Actualiser
                </button>
              </div>
            </div>

            <!-- Informations complémentaires -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="font-semibold text-blue-900 mb-2">
                ℹ️ Comment est calculée la progression ?
              </h4>
              <ul class="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>
                  La progression est basée sur les lots d'activités marqués
                  comme "Fait" dans vos entrées de cahier
                </li>
                <li>
                  Chaque lot d'activités terminé contribue proportionnellement
                  au taux prévu du programme
                </li>
                <li>
                  Le total reflète votre avancement par rapport au programme
                  officiel
                </li>
              </ul>
            </div>
          </div>

          <!-- Message si pas de données -->
          <div
            v-else
            class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
          >
            <p class="text-yellow-800 text-lg">
              ⚠️ Aucune donnée de progression disponible pour cette combinaison
              classe/discipline
            </p>
            <p class="text-yellow-600 text-sm mt-2">
              Créez votre première entrée de cahier pour commencer à suivre
              votre progression
            </p>
          </div>
        </div>

        <!-- Message initial -->
        <div v-else class="text-center py-12 text-gray-500">
          <svg
            class="w-24 h-24 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
          <p class="text-lg">
            Sélectionnez une classe et une discipline pour voir la progression
          </p>
        </div>
      </div>

      <!-- Section Notification -->
      <div v-if="activeSection === 'notification'">
        <div class="notifications-container p-6 max-w-5xl mx-auto">
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4"
          >
            <h2 class="text-2xl font-bold text-gray-800">🔔 Notifications</h2>
            <div class="flex items-center space-x-3">
              <span
                v-if="stats.non_lues > 0"
                class="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold"
              >
                {{ stats.non_lues }} non lue(s)
              </span>
              <button
                @click="chargerNotifications(true)"
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                Actualiser
              </button>
            </div>
          </div>

          <!-- Filtres -->
          <div class="bg-white rounded-lg shadow p-4 mb-6">
            <div class="flex flex-wrap gap-3">
              <button
                v-for="categorie in categories"
                :key="categorie.value"
                @click="
                  categorieFiltre =
                    categorieFiltre === categorie.value ? null : categorie.value
                "
                :class="{
                  'bg-gray-200 text-gray-700':
                    categorieFiltre !== categorie.value,
                  [categorie.colorClass]: categorieFiltre === categorie.value,
                }"
                class="w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition"
              >
                {{ categorie.emoji }} {{ categorie.label }}
              </button>

              <button
                @click="afficherSeulementNonLues = !afficherSeulementNonLues"
                :class="{
                  'bg-gray-200 text-gray-700': !afficherSeulementNonLues,
                  'bg-purple-500 text-white': afficherSeulementNonLues,
                }"
                class="px-4 py-2 rounded-lg font-medium transition"
              >
                {{ afficherSeulementNonLues ? "✅" : "📬" }} Non lues uniquement
              </button>
            </div>
          </div>

          <!-- Liste des notifications -->
          <div v-if="chargement" class="text-center py-12">
            <div
              class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
            ></div>
            <p class="mt-4 text-gray-600">Chargement des notifications...</p>
          </div>

          <div
            v-else-if="notificationsFiltrees.length === 0"
            class="text-center py-12"
          >
            <svg
              class="w-24 h-24 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              ></path>
            </svg>
            <p class="text-gray-600 text-lg">Aucune notification</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="notification in notificationsFiltrees"
              :key="notification.id"
              @click="marquerCommeLue(notification)"
              :class="{
                'border-l-4': true,
                'bg-white': notification.est_lue,
                'bg-blue-50': !notification.est_lue,
                'border-green-500': notification.categorie === 'felicitations',
                'border-blue-500': notification.categorie === 'encouragement',
                'border-yellow-500': notification.categorie === 'avertissement',
                'border-orange-500': notification.categorie === 'alerte',
                'border-red-500': notification.categorie === 'critique',
                'border-purple-500':
                  notification.categorie === 'avance_excessive',
                'border-gray-500': notification.categorie === 'info',
              }"
              class="rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6"
            >
              <!-- En-tête -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-800 mb-1">
                    {{ notification.titre }}
                  </h3>
                  <div
                    class="flex items-center space-x-3 text-sm text-gray-600"
                  >
                    <span>{{ formatDate(notification.created_at) }}</span>
                    <span v-if="notification.classe"
                      >• {{ notification.classe.nom }}</span
                    >
                    <span v-if="notification.discipline"
                      >• {{ notification.discipline.nom }}</span
                    >
                    <span
                      v-if="!notification.est_lue"
                      class="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold"
                    >
                      NOUVEAU
                    </span>
                  </div>
                </div>

                <!-- Badge catégorie -->
                <span
                  :class="getCategorieClasses(notification.categorie)"
                  class="px-3 py-1 rounded-full text-xs font-bold"
                >
                  {{ getCategorieLabel(notification.categorie) }}
                </span>
              </div>

              <!-- Message -->
              <p class="text-gray-700 leading-relaxed mb-4">
                {{ notification.message }}
              </p>

              <!-- Métadonnées progression -->
              <div
                v-if="notification.progression_actuelle !== null"
                class="bg-gray-50 rounded-lg p-4 space-y-2"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-600"
                    >Progression actuelle:</span
                  >
                  <span class="text-lg font-bold text-blue-600">
                    {{ notification.progression_actuelle }}%
                  </span>
                </div>

                <div
                  v-if="notification.ecart_jours !== null"
                  class="flex items-center justify-between"
                >
                  <span class="text-sm font-medium text-gray-600"
                    >Écart détecté:</span
                  >
                  <span
                    :class="{
                      'text-green-600': notification.ecart_jours > 0,
                      'text-red-600': notification.ecart_jours < 0,
                      'text-gray-600': notification.ecart_jours === 0,
                    }"
                    class="text-sm font-bold"
                  >
                    {{ notification.ecart_jours > 0 ? "+" : ""
                    }}{{ notification.ecart_jours }} jour(s)
                  </span>
                </div>

                <div
                  v-if="notification.semaine_attendue"
                  class="flex items-center justify-between"
                >
                  <span class="text-sm font-medium text-gray-600"
                    >Période de référence:</span
                  >
                  <span class="text-sm text-gray-700">
                    {{ notification.semaine_attendue }} ({{
                      notification.mois_attendu
                    }})
                  </span>
                </div>
              </div>

              <!-- Alerte chronologie -->
              <div
                v-if="notification.probleme_chronologie"
                class="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded"
              >
                <p class="text-sm text-yellow-800">
                  ⚠️ <strong>Attention:</strong>
                  {{ notification.details_chronologie }}
                </p>
              </div>

              <!-- Badge type -->
              <div
                class="mt-4 flex items-center justify-between text-xs text-gray-500"
              >
                <span>{{ getTypeLabel(notification.type) }}</span>
                <span v-if="notification.est_lue" class="flex items-center">
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  Lu le {{ formatDate(notification.date_lecture) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="stats.total > limit"
            class="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              @click="pagePrecedente"
              :disabled="offset === 0"
              class="bg-gray-200 text-gray-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-300 transition"
            >
              ← Précédent
            </button>
            <span class="text-gray-600">
              Page {{ Math.floor(offset / limit) + 1 }} sur
              {{ Math.ceil(stats.total / limit) }}
            </span>
            <button
              @click="pageSuivante"
              :disabled="offset + limit >= stats.total"
              class="bg-gray-200 text-gray-700 px-4 py-2 rounded disabled:opacity-50 hover:bg-gray-300 transition"
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>

      <!-- Section Profil -->

      <div v-if="activeSection === 'infos-personnelles'" class="mt-4 p-6">
        <!-- Cartes de navigation -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div
            @click="activeProfilTab = 'voir'"
            class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
            :class="
              activeProfilTab === 'voir'
                ? 'border-teal-600 bg-teal-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
            "
          >
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="
                activeProfilTab === 'voir' ? 'bg-teal-600' : 'bg-gray-100'
              "
            >
              <UserCircleIcon
                class="h-6 w-6"
                :class="
                  activeProfilTab === 'voir' ? 'text-white' : 'text-gray-500'
                "
              />
            </div>
            <div class="text-center">
              <p
                class="text-sm font-semibold"
                :class="
                  activeProfilTab === 'voir' ? 'text-teal-700' : 'text-gray-700'
                "
              >
                Mes informations
              </p>
              <p class="text-xs text-gray-400 mt-0.5">Voir mon profil</p>
            </div>
            <span
              v-if="activeProfilTab === 'voir'"
              class="w-2 h-2 rounded-full bg-teal-600"
            />
          </div>

          <div
            @click="activeProfilTab = 'modifier'"
            class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
            :class="
              activeProfilTab === 'modifier'
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
            "
          >
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="
                activeProfilTab === 'modifier' ? 'bg-blue-500' : 'bg-gray-100'
              "
            >
              <PencilSquareIcon
                class="h-6 w-6"
                :class="
                  activeProfilTab === 'modifier'
                    ? 'text-white'
                    : 'text-gray-500'
                "
              />
            </div>
            <div class="text-center">
              <p
                class="text-sm font-semibold"
                :class="
                  activeProfilTab === 'modifier'
                    ? 'text-blue-700'
                    : 'text-gray-700'
                "
              >
                Modifier mon profil
              </p>
              <p class="text-xs text-gray-400 mt-0.5">
                Proposer une modification
              </p>
            </div>
            <span
              v-if="activeProfilTab === 'modifier'"
              class="w-2 h-2 rounded-full bg-blue-500"
            />
          </div>
        </div>

        <!-- Voir mes informations -->
        <transition name="fade-slide">
          <div
            v-if="activeProfilTab === 'voir'"
            class="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div
              class="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100"
            >
              <div
                class="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-xl font-bold shrink-0"
              >
                {{ user.prenoms?.charAt(0) }}{{ user.nom?.charAt(0) }}
              </div>
              <div>
                <p class="text-lg font-semibold text-gray-800">
                  {{ user.prenoms }} {{ user.nom }}
                </p>
                <span
                  class="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium capitalize"
                >
                  {{ user.Role?.name }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div
                  class="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0"
                >
                  <UserIcon class="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-400 font-medium">Nom</p>
                  <p class="text-sm font-semibold text-gray-800">
                    {{ user.nom || "—" }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div
                  class="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0"
                >
                  <UserIcon class="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-400 font-medium">Prénoms</p>
                  <p class="text-sm font-semibold text-gray-800">
                    {{ user.prenoms || "—" }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div
                  class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"
                >
                  <EnvelopeIcon class="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-400 font-medium">Email</p>
                  <p class="text-sm font-semibold text-gray-800">
                    {{ user.email || "—" }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div
                  class="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"
                >
                  <PhoneIcon class="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-400 font-medium">Téléphone</p>
                  <p class="text-sm font-semibold text-gray-800">
                    {{ user.telephone || "—" }}
                  </p>
                </div>
              </div>

              <div
                class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2"
              >
                <div
                  class="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0"
                >
                  <BuildingOfficeIcon class="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p class="text-xs text-gray-400 font-medium">Établissement</p>
                  <p class="text-sm font-semibold text-gray-800">
                    {{ user.etablissement_id || "—" }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Modifier mon profil -->
        <transition name="fade-slide">
          <div
            v-if="activeProfilTab === 'modifier'"
            class="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 class="text-lg font-semibold text-gray-800 mb-1">
              Proposer une modification
            </h2>
            <p class="text-sm text-gray-400 mb-6">
              Vos modifications seront soumises à validation par
              l'administrateur avant d'être appliquées.
            </p>

            <form
              @submit.prevent="proposerModification"
              class="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Nom</label
                >
                <input
                  v-model="nouveauNom"
                  type="text"
                  :placeholder="user.nom"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Prénoms</label
                >
                <input
                  v-model="nouveauxPrenoms"
                  type="text"
                  :placeholder="user.prenoms"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Email</label
                >
                <input
                  v-model="nouvelEmail"
                  type="email"
                  :placeholder="user.email"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Téléphone</label
                >
                <input
                  v-model="nouveauTel"
                  type="text"
                  :placeholder="user.telephone || 'Votre numéro'"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div class="md:col-span-2 flex gap-3 pt-2">
                <button
                  type="submit"
                  class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Envoyer la demande
                </button>
                <button
                  type="button"
                  @click="activeProfilTab = null"
                  class="px-5 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../api";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import MenuBar from "./MenuBar.vue";
// import '../assets/animations.css';
import { startSessionTimer, stopSessionTimer } from "../utils/session";

import SidebarItem from "./SidebarItem.vue";

import {
  UserCircleIcon,
  BookOpenIcon,
  ChartBarIcon,
  BellIcon,
  ArrowLeftStartOnRectangleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
} from "@heroicons/vue/24/outline";

export default {
  name: "NotificationsEnseignant",
  components: {
    EditorContent,
    MenuBar,
    SidebarItem,
    ArrowLeftStartOnRectangleIcon,
    UserCircleIcon,
    BookOpenIcon,
    ChartBarIcon,
    BellIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    BuildingOfficeIcon,
    PencilSquareIcon,
  },
  data() {
    return {
      user: JSON.parse(localStorage.getItem("user")) || {
        nom: "",
        prenoms: "",
        role: "",
      },
      modifications: [],
      nouveauNom: "",
      nouveauxPrenoms: "",
      nouvelEmail: "",
      nouveauTel: "",
      classes: [],
      disciplines: [],
      cahierEntries: [],
      availableActivites: [],
      selectedActivites: [],
      manualActivites: "",
      loadingActivites: false,
      availableSaNames: [],
      loadingSaName: false,
      newEntry: {
        id: null,
        disciplineId: "",
        saNumber: "",
        saName: "",
        activites: "",
        contenu: "",
        heureDebut: "",
        heureFin: "",
        dateCours: "",
        trimestre: "1er",
        mois: "",
        semaineNumero: null,
        tauxPrevuProgramme: 0,
      },
      editingEntry: false,
      showForm: false,
      selectedClassId: null,
      history: [],
      showHistoryModal: false,
      historyEntryId: null,
      loadingClasses: false,

      activeProfilTab: null,

      isCollapsed: false,
      showSidebar: window.innerWidth >= 768,
      activeSection: "accueil",

      entreesEnAttente: [],
      loadingEnAttente: false,
      rejetEnCours: null,
      commentaireRejet: "",
      processingId: null,

      menuItems: [
        {
          section: "mes-classes",
          label: "Mes Classes",
          icon: BookOpenIcon,
          badge: null,
        },
        {
          section: "a-valider",
          label: "À valider",
          icon: ClipboardDocumentCheckIcon,
          badge: null,
        },
        {
          section: "progression",
          label: "Progression",
          icon: ChartBarIcon,
          badge: null,
        },
        {
          section: "notification",
          label: "Notifications",
          icon: BellIcon,
          badge: null,
        },

        {
          section: "infos-personnelles",
          label: "Profil",
          icon: UserCircleIcon,
          badge: null,
        },
      ],

      editor: null,
      activitesStatus: {}, // Format: { "activite_text": "en_cours" | "fait" }
      progressionGlobale: 0,
      loadingProgression: false,
      lotsActivites: [], // AJOUTÉ
      // Pour la section progression
      selectedProgressionClassId: null,
      selectedProgressionDisciplineId: null,
      progressionData: null,
      notifications: [],
      chargement: false,
      stats: {
        total: 0,
        non_lues: 0,
      },
      categorieFiltre: null,
      afficherSeulementNonLues: false,
      limit: 20,
      offset: 0,
      categories: [
        {
          value: "felicitations",
          label: "Félicitations",
          emoji: "🎉",
          colorClass: "bg-green-500 text-white",
        },
        {
          value: "encouragement",
          label: "Encouragement",
          emoji: "💪",
          colorClass: "bg-blue-500 text-white",
        },
        {
          value: "avertissement",
          label: "Avertissement",
          emoji: "⚠️",
          colorClass: "bg-yellow-500 text-white",
        },
        {
          value: "alerte",
          label: "Alerte",
          emoji: "🚨",
          colorClass: "bg-orange-500 text-white",
        },
        {
          value: "critique",
          label: "Critique",
          emoji: "🔴",
          colorClass: "bg-red-500 text-white",
        },
        {
          value: "avance_excessive",
          label: "Avance excessive",
          emoji: "⚡",
          colorClass: "bg-purple-500 text-white",
        },
        {
          value: "info",
          label: "Info",
          emoji: "ℹ️",
          colorClass: "bg-gray-500 text-white",
        },
      ],
    };
  },
  computed: {
    demandesNom() {
      return this.modifications.filter((m) => m.champ === "nom");
    },
    demandesPrenoms() {
      return this.modifications.filter((m) => m.champ === "prenoms");
    },
    demandesEmail() {
      return this.modifications.filter((m) => m.champ === "email");
    },
    demandesTelephone() {
      return this.modifications.filter((m) => m.champ === "telephone");
    },

    uniqueClasses() {
      return this.classes;
    },

    userDisciplines() {
      if (!this.selectedClassId || !this.user) return [];

      const selectedClass = this.classes.find(
        (c) => c.id === this.selectedClassId,
      );

      if (!selectedClass || !selectedClass.Disciplines) return [];

      return selectedClass.Disciplines;
    },

    // ✅ Disciplines pour la classe sélectionnée dans Progression
    progressionDisciplines() {
      if (!this.selectedProgressionClassId) return [];
      const selectedClass = this.classes.find(
        (c) => c.id === this.selectedProgressionClassId,
      );
      if (!selectedClass || !selectedClass.Disciplines) return [];
      return selectedClass.Disciplines;
    },

    // ✅ VERSION CORRIGÉE
    filteredCahierEntries() {
      if (!this.selectedClassId) {
        console.log("❌ Aucune classe sélectionnée");
        return [];
      }

      console.log("🔍 Filtrage des entrées pour classe:", this.selectedClassId);
      console.log("📊 Nombre total d'entrées:", this.cahierEntries.length);
      console.log("👤 User ID:", this.user?.id);

      // Les entrées sont déjà filtrées par le backend (teacher_id et classe_id)
      // Donc on peut directement retourner toutes les entrées
      const filtered = this.cahierEntries.filter((entry) => {
        console.log("Entrée:", {
          id: entry.id,
          discipline_id: entry.discipline_id,
          teacher_id: entry.teacher_id,
          sa_number: entry.sa_number,
        });
        return true; // Garder toutes les entrées car backend a déjà filtré
      });

      console.log("✅ Entrées filtrées:", filtered.length);
      return filtered;
    },

    isFormValid() {
      return (
        this.newEntry.disciplineId &&
        this.newEntry.saNumber &&
        this.newEntry.saName &&
        this.newEntry.dateCours &&
        this.newEntry.heureDebut &&
        this.newEntry.heureFin &&
        this.newEntry.trimestre &&
        (this.selectedActivites.length > 0 ||
          this.manualActivites.trim().length > 0) &&
        this.newEntry.contenu &&
        this.newEntry.contenu.trim().length > 0
      );
    },
    // Combiner les activités sélectionnées et manuelles
    finalActivites() {
      const combined = [...this.selectedActivites];

      // Ajouter les activités manuelles (une par ligne)
      if (this.manualActivites.trim()) {
        const manual = this.manualActivites
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        combined.push(...manual);
      }

      return combined.join("\n");
    },

    // ✅ Calculer le pourcentage de réalisation local
    pourcentageRealise() {
      if (!this.activitesStatus) return 0;

      const total = Object.keys(this.activitesStatus).length;
      if (total === 0) return 0;

      const faites = Object.values(this.activitesStatus).filter(
        (s) => s === "fait",
      ).length;
      return Math.round((faites / total) * 100);
    },

    notificationsFiltrees() {
      let filtered = this.notifications;

      if (this.categorieFiltre) {
        filtered = filtered.filter((n) => n.categorie === this.categorieFiltre);
      }

      if (this.afficherSeulementNonLues) {
        filtered = filtered.filter((n) => !n.est_lue);
      }

      return filtered;
    },
  },

  async created() {
    this.editor = useEditor({
      content: this.newEntry.contenu,
      extensions: [StarterKit],
      onUpdate: ({ editor }) => {
        this.newEntry.contenu = editor.getHTML();
      },
    });

    try {
      this.loadingClasses = true;
      const response = await api.get("/users/me");
      this.user = response.data;
      await this.fetchClasses();
      await this.fetchDisciplines();
      await this.fetchCahierEntries();

      if (this.uniqueClasses.length > 0) {
        this.selectedClassId = this.uniqueClasses[0].id;
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error.response?.data);
      this.$router.push("/login");
    } finally {
      this.loadingClasses = false;
    }
  },
  beforeUnmount() {
    stopSessionTimer(); // Nettoyage quand on quitte le composant

    if (this.editor) {
      this.editor.destroy();
    }
  },

  async mounted() {
    startSessionTimer(); // Pour démarrer le compte a rebours de la session dès l'ouverture

    await Promise.all([
      this.chargerNotifications(),
      this.fetchEntreesEnAttente(),
      this.chargerProfil(),
    ]);
  },

  methods: {
    async chargerProfil() {
      try {
        const response = await api.get("/users/me");
        this.user = response.data;
      } catch (error) {
        console.error("Erreur chargement profil:", error);
      }
    },

    async proposerModification() {
      const demandes = [];

      if (this.nouveauNom && this.nouveauNom !== this.user.nom) {
        demandes.push({
          champ: "nom",
          ancienne_valeur: this.user.nom,
          nouvelle_valeur: this.nouveauNom,
        });
      }
      if (this.nouveauxPrenoms && this.nouveauxPrenoms !== this.user.prenoms) {
        demandes.push({
          champ: "prenoms",
          ancienne_valeur: this.user.prenoms,
          nouvelle_valeur: this.nouveauxPrenoms,
        });
      }
      if (this.nouvelEmail && this.nouvelEmail !== this.user.email) {
        demandes.push({
          champ: "email",
          ancienne_valeur: this.user.email,
          nouvelle_valeur: this.nouvelEmail,
        });
      }
      if (this.nouveauTel && this.nouveauTel !== this.user.telephone) {
        demandes.push({
          champ: "telephone",
          ancienne_valeur: this.user.telephone,
          nouvelle_valeur: this.nouveauTel,
        });
      }

      try {
        for (const demande of demandes) {
          // ✅ utilise Axios configuré avec baseURL et intercepteur JWT
          await api.post("/user-modifications", demande);
        }

        alert("Vos demandes ont été envoyées et attendent validation.");
      } catch (error) {
        console.error("Erreur envoi demande:", error);
        alert("Une erreur est survenue lors de l’envoi des demandes.");
      }
    },

    selectClass(classId) {
      this.selectedClassId = classId;
      this.showForm = false;
      this.editingEntry = false;
      this.fetchCahierEntries();
    },
    getClassName(classId) {
      const classe = this.classes.find((c) => c.id === classId);
      return classe ? `${classe.nom} (${classe.promotion})` : "Inconnue";
    },
    // ✅ CORrection decd getDisciplineName pour gérer les relations
    getDisciplineName(disciplineId) {
      // Chercher d'abord dans les disciplines de la classe
      if (this.selectedClassId) {
        const selectedClass = this.classes.find(
          (c) => c.id === this.selectedClassId,
        );
        if (selectedClass && selectedClass.Disciplines) {
          const disc = selectedClass.Disciplines.find(
            (d) => d.id === disciplineId,
          );
          if (disc) return disc.nom;
        }
      }

      // Sinon, chercher dans toutes les disciplines
      const discipline = this.disciplines.find((d) => d.id === disciplineId);
      return discipline ? discipline.nom : "Inconnue";
    },
    async fetchClasses() {
      try {
        this.loadingClasses = true;
        const response = await api.get("/cahier/classes/teacher");
        this.classes = response.data;
        console.log("Classes reçues:", this.classes);
      } catch (error) {
        console.error("Erreur récupération classes:", error);
      } finally {
        this.loadingClasses = false;
      }
    },
    async fetchDisciplines() {
      try {
        const response = await api.get("/cahier/disciplines");
        this.disciplines = response.data;
      } catch (error) {
        console.error("Erreur récupération disciplines:", error);
      }
    },
    // ✅Méthode fetchCahierEntries
    async fetchCahierEntries() {
      try {
        console.log(
          "📥 Récupération des entrées pour classe:",
          this.selectedClassId,
        );

        if (!this.selectedClassId) {
          console.log("⚠️ Aucune classe sélectionnée, pas de chargement");
          this.cahierEntries = [];
          return;
        }

        const response = await api.get("/cahier/cahier-entries", {
          params: { classe_id: this.selectedClassId },
        });

        console.log("✅ Entrées reçues du backend:", response.data);
        console.log("📊 Nombre d'entrées:", response.data.length);

        this.cahierEntries = response.data;

        // Log détaillé de chaque entrée
        this.cahierEntries.forEach((entry, index) => {
          console.log(`Entrée ${index + 1}:`, {
            id: entry.id,
            sa_number: entry.sa_number,
            sa_name: entry.sa_name,
            discipline: entry.discipline?.nom,
            classe: entry.discipline?.Classe?.nom,
          });
        });
      } catch (error) {
        console.error("❌ Erreur récupération entrées cahier:", error);
        console.error("Détails:", error.response?.data);
        this.cahierEntries = [];
      }
    },
    openAddEntryForm() {
      this.resetEntryForm();
      this.showForm = true;
      this.editingEntry = false;
    },

    stripHtml(html) {
      if (!html) return "";
      return html.replace(/<[^>]*>/g, "");
    },
    previewText(html, length = 100) {
      const text = this.stripHtml(html);
      return text.length > length ? text.substring(0, length) + "..." : text;
    },

    /**
     * Handler quand la discipline change
     */
    async onDisciplineChange() {
      console.log("Discipline changée:", this.newEntry.disciplineId);
      this.availableActivites = [];
      this.selectedActivites = [];
      this.availableSaNames = [];

      // Si une SA est déjà sélectionnée, recharger les activités
      if (this.newEntry.saNumber) {
        await this.loadActivitesFromProgramme();
      }
    },

    /**
     * Handler quand le numéro de SA change
     */
    async onSaNumberChange() {
      console.log("SA changée:", this.newEntry.saNumber);
      this.availableActivites = [];
      this.selectedActivites = [];

      if (this.newEntry.disciplineId && this.newEntry.saNumber) {
        await this.loadActivitesFromProgramme();
      }
    },

    /**
     * ✅ Récupérer le programme théorique et le taux prévu
     */
    async loadActivitesFromProgramme() {
      if (
        !this.selectedClassId ||
        !this.newEntry.disciplineId ||
        !this.newEntry.saNumber
      ) {
        return;
      }

      try {
        this.loadingActivites = true;
        this.loadingSaName = true;

        const discipline = this.userDisciplines.find(
          (d) => d.id === this.newEntry.disciplineId,
        );
        if (!discipline) return;

        // ✅ Utiliser la nouvelle route des lots
        const response = await api.get("/cahier/programme-lots", {
          params: {
            classe_id: this.selectedClassId,
            discipline_id: this.newEntry.disciplineId,
            discipline_nom: discipline.nom,
            sa_number: this.newEntry.saNumber,
          },
        });

        console.log("✅ Lots reçus:", response.data);

        // Extraire toutes les activités disponibles
        const activitesDisponibles = [];
        response.data.lots.forEach((lot) => {
          if (!lot.estComplet) {
            activitesDisponibles.push(...lot.activitesDisponibles);
          }
        });

        this.availableActivites = activitesDisponibles;

        // Stocker les lots pour référence
        this.lotsActivites = response.data.lots;

        // Pré-remplir le nom de SA
        if (response.data.saName && !this.newEntry.saName) {
          this.newEntry.saName = response.data.saName;
        }

        // Afficher les stats
        if (response.data.stats) {
          console.log("📊 Stats lots:", response.data.stats);
        }
      } catch (error) {
        console.error("❌ Erreur chargement lots:", error);
      } finally {
        this.loadingActivites = false;
        this.loadingSaName = false;
      }
    },

    async fetchEntreesEnAttente() {
      this.loadingEnAttente = true;
      try {
        const response = await api.get("/cahier/cahier-entries/en-attente");
        this.entreesEnAttente = response.data;
      } catch (error) {
        console.error("Erreur récupération entrées en attente:", error);
      } finally {
        this.loadingEnAttente = false;
      }
    },
    async validerEntree(id) {
      this.processingId = id;
      try {
        await api.patch(`/cahier/cahier-entries/${id}/valider`);
        this.entreesEnAttente = this.entreesEnAttente.filter(
          (e) => e.id !== id,
        );
        alert("✅ Entrée validée avec succès !");
      } catch (error) {
        console.error("Erreur validation:", error);
        alert("Erreur : " + (error.response?.data?.error || error.message));
      } finally {
        this.processingId = null;
      }
    },
    async confirmerRejet(id) {
      if (!this.commentaireRejet.trim()) return;
      this.processingId = id;
      try {
        await api.patch(`/cahier/cahier-entries/${id}/rejeter`, {
          commentaire: this.commentaireRejet,
        });
        this.entreesEnAttente = this.entreesEnAttente.filter(
          (e) => e.id !== id,
        );
        this.rejetEnCours = null;
        this.commentaireRejet = "";
        alert("Entrée rejetée. Le responsable pourra la corriger.");
      } catch (error) {
        console.error("Erreur rejet:", error);
        alert("Erreur : " + (error.response?.data?.error || error.message));
      } finally {
        this.processingId = null;
      }
    },
    /**
     * Réinitialiser le formulaire
     */

    resetEntryForm() {
      this.newEntry = {
        id: null,
        disciplineId: "",
        saNumber: "",
        saName: "",
        activites: "",
        contenu: "",
        heureDebut: "",
        heureFin: "",
        dateCours: "",
        trimestre: "1er",
        mois: "",
        semaineNumero: null,
        tauxPrevuProgramme: 0,
      };
      // Réinitialiser les activités
      this.availableActivites = [];
      this.selectedActivites = [];
      this.manualActivites = "";
      this.activitesStatus = {};

      if (this.editor) {
        this.editor.commands.setContent("");
      }
    },
    logout() {
      stopSessionTimer();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      this.$router.push("/login");
    },
    formatDate(date) {
      if (!date) return "Jamais";
      return new Date(date).toLocaleDateString("fr-FR");
    },
    calculatePeriod() {
      if (this.newEntry.dateCours) {
        const date = new Date(this.newEntry.dateCours);
        const months = [
          "SEPT",
          "OCT",
          "NOV",
          "DEC",
          "JANV",
          "FEV",
          "MARS",
          "AVRIL",
          "MAI",
          "JUIN",
        ];
        this.newEntry.mois = months[date.getMonth()];
        this.newEntry.semaineNumero = date.getWeek();
      }
    },

    async addEntry() {
      try {
        if (!this.newEntry.disciplineId) {
          alert("Veuillez sélectionner une discipline");
          return;
        }

        if (!this.isFormValid) {
          alert("Veuillez remplir tous les champs obligatoires");
          return;
        }

        const entryData = {
          discipline_id: this.newEntry.disciplineId,
          teacher_id: this.user.id,
          sa_number: this.newEntry.saNumber,
          sa_name: this.newEntry.saName,
          activites: this.finalActivites, // Utilisation des activités combinées
          activites_status: this.activitesStatus,
          contenu: this.newEntry.contenu,
          date_cours: this.newEntry.dateCours,
          heure_debut: this.newEntry.heureDebut,
          heure_fin: this.newEntry.heureFin,
          trimestre: this.newEntry.trimestre,
          mois: this.newEntry.mois,
          semaine_numero: this.newEntry.semaineNumero,
          annee_scolaire: "2025-2026",
          taux_prevu_programme: this.newEntry.tauxPrevuProgramme,
        };

        console.log("📤 Envoi entrée cahier:", entryData);

        await api.post("/cahier/cahier-entries", entryData);
        await this.fetchCahierEntries();
        this.resetEntryForm();
        this.showForm = false;
        alert("Entrée ajoutée avec succès !");
      } catch (error) {
        console.error("Erreur ajout entrée:", error);
        alert("Erreur: " + (error.response?.data?.error || error.message));
      }
    },

    /**
     * ✅ Éditer une entrée (avec statuts)
     */
    async editEntry(entry) {
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
        semaineNumero: entry.semaine_numero,
      };

      // Charger les statuts des activités
      this.activitesStatus = entry.activites_status || {};

      // Charger les activités disponibles
      await this.loadActivitesFromProgramme();

      // Pré-sélectionner les activités existantes
      if (entry.activites) {
        const existingActivites = entry.activites
          .split("\n")
          .map((a) => a.trim());
        this.selectedActivites = this.availableActivites.filter((a) =>
          existingActivites.includes(a),
        );

        const notFound = existingActivites.filter(
          (a) => !this.availableActivites.includes(a),
        );
        if (notFound.length > 0) {
          this.manualActivites = notFound.join("\n");
        }
      }

      if (this.editor) {
        this.editor.commands.setContent(this.newEntry.contenu);
      }

      this.editingEntry = true;
      this.showForm = true;
    },

    /**
     * ✅ Mettre à jour une entrée
     */
    async updateEntry() {
      try {
        if (!this.isFormValid) {
          alert("Veuillez remplir tous les champs obligatoires");
          return;
        }

        const entryData = {
          discipline_id: this.newEntry.disciplineId,
          sa_number: this.newEntry.saNumber,
          sa_name: this.newEntry.saName,
          activites: this.finalActivites,
          activites_status: this.activitesStatus,
          contenu: this.newEntry.contenu,
          date_cours: this.newEntry.dateCours,
          heure_debut: this.newEntry.heureDebut,
          heure_fin: this.newEntry.heureFin,
          trimestre: this.newEntry.trimestre,
          mois: this.newEntry.mois,
          semaine_numero: this.newEntry.semaineNumero,
        };

        console.log("📤 Mise à jour entrée:", entryData);

        await api.put(`/cahier/cahier-entries/${this.newEntry.id}`, entryData);
        await this.fetchCahierEntries();
        //Recharger la progression si besoin
        if (
          this.selectedProgressionClassId &&
          this.selectedProgressionDisciplineId
        ) {
          await this.loadProgressionData();
        }
        //await this.loadProgressionGlobale();

        this.resetEntryForm();
        this.editingEntry = false;
        this.showForm = false;

        alert("✅ Entrée mise à jour avec succès !");
      } catch (error) {
        console.error("❌ Erreur mise à jour entrée:", error);
        alert("Erreur: " + (error.response?.data?.error || error.message));
      }
    },
    async deleteEntry(id) {
      if (confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
        try {
          await api.delete(`/cahier/cahier-entries/${id}`);
          await this.fetchCahierEntries();
          alert("Entrée supprimée avec succès !");
        } catch (error) {
          console.error("Erreur suppression entrée:", error);
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
        const response = await api.get(
          `/cahier/cahier-entries/${entryId}/history`,
        );
        this.history = response.data;
        this.historyEntryId = entryId;
        this.showHistoryModal = true;
      } catch (error) {
        console.error("Erreur chargement historique:", error);
      }
    },
    closeHistory() {
      this.showHistoryModal = false;
      this.history = [];
      this.historyEntryId = null;
    },

    // ✅ NOUVELLES MÉTHODES POUR LA PROGRESSION
    selectProgressionClass(classId) {
      this.selectedProgressionClassId = classId;
      this.selectedProgressionDisciplineId = null;
      this.progressionData = null;
    },

    async selectProgressionDiscipline(disciplineId) {
      this.selectedProgressionDisciplineId = disciplineId;
      await this.loadProgressionData();
    },

    async loadProgressionData() {
      if (
        !this.selectedProgressionClassId ||
        !this.selectedProgressionDisciplineId
      )
        return;

      try {
        this.loadingProgression = true;
        const response = await api.get(
          `/progression/${this.selectedProgressionClassId}/${this.selectedProgressionDisciplineId}`,
        );
        this.progressionData = response.data;
      } catch (error) {
        console.error("Erreur chargement progression:", error);
        alert("Erreur lors du chargement de la progression");
      } finally {
        this.loadingProgression = false;
      }
    },

    async chargerNotifications(forceReload = false) {
      try {
        this.chargement = true;

        const params = {
          limit: this.limit,
          offset: this.offset,
        };

        const response = await api.get("/notifications/enseignant", { params });

        this.notifications = response.data.notifications;
        this.stats.total = response.data.total;
        this.stats.non_lues = response.data.non_lues;

        if (forceReload) {
          this.$emit("notifications-updated", this.stats);
        }
      } catch (error) {
        console.error("❌ Erreur chargement notifications:", error);
        alert("Erreur lors du chargement des notifications");
      } finally {
        this.chargement = false;
      }
    },

    async marquerCommeLue(notification) {
      if (notification.est_lue) return;

      try {
        await api.put(`/notifications/${notification.id}/marquer-lue`);
        notification.est_lue = true;
        notification.date_lecture = new Date().toISOString();
        this.stats.non_lues = Math.max(0, this.stats.non_lues - 1);
        this.$emit("notifications-updated", this.stats);
      } catch (error) {
        console.error("❌ Erreur marquage notification:", error);
      }
    },

    getCategorieClasses(categorie) {
      const classes = {
        felicitations: "bg-green-100 text-green-800",
        encouragement: "bg-blue-100 text-blue-800",
        avertissement: "bg-yellow-100 text-yellow-800",
        alerte: "bg-orange-100 text-orange-800",
        critique: "bg-red-100 text-red-800",
        avance_excessive: "bg-purple-100 text-purple-800",
        info: "bg-gray-100 text-gray-800",
      };
      return classes[categorie] || "bg-gray-100 text-gray-800";
    },

    getCategorieLabel(categorie) {
      const cat = this.categories.find((c) => c.value === categorie);
      return cat ? `${cat.emoji} ${cat.label}` : categorie;
    },

    getTypeLabel(type) {
      const labels = {
        auto_progression: "🤖 Notification automatique",
        admin_global: "👨‍💼 Administration (tous)",
        admin_ciblée: "🎯 Administration (ciblée)",
        admin_personnalisée: "✉️ Message personnalisé",
      };
      return labels[type] || type;
    },

    formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      if (diffDays < 7) return `Il y a ${diffDays} jour(s)`;

      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    pageSuivante() {
      this.offset += this.limit;
      this.chargerNotifications();
    },

    pagePrecedente() {
      this.offset = Math.max(0, this.offset - this.limit);
      this.chargerNotifications();
    },
  },
};

Date.prototype.getWeek = function () {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
};
</script>

<style scoped>
/* Styles existants */

.notifications-container {
  max-width: 1200px;
  margin: 0 auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes zoom {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Classes utilitaires */
.animate-fadeIn {
  animation: fadeIn 0.5s ease-in-out;
}
.animate-slideUp {
  animation: slideUp 0.4s ease-out;
}
.delay-100 {
  animation-delay: 0.1s;
}
.delay-200 {
  animation-delay: 0.2s;
}
.delay-300 {
  animation-delay: 0.3s;
}
.delay-400 {
  animation-delay: 0.4s;
}
.delay-500 {
  animation-delay: 0.5s;
}

.animate-zoom {
  animation: zoom 0.2s ease-in-out;
}

@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

@keyframes blink {
  50% {
    border-color: transparent;
  }
}

@keyframes hideCursor {
  to {
    border-right-color: transparent;
  }
}

.typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: 0.15em solid teal;

  /* 3 animations enchaînées */
  animation:
    typing 4s steps(40, end),
    blink 0.75s step-end infinite,
    hideCursor 0s linear 4s forwards;
}

@keyframes wave {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-wave {
  animation: wave 6s linear infinite;
}

.animate-wave-slow {
  animation: wave 10s linear infinite;
}
</style>
