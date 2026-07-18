<template>
  <div class="min-h-screen relative flex bg-blue-100 overflow-hidden">
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

          <!-- ✅ Un seul menu — supprimer l'ancien <ul> -->
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
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- Section Accueil -->
        <div v-if="activeSection === 'accueil'">
          <h2 class="text-2xl font-bold mb-4 typewriter">
            {{ user.prenoms }} {{ user.nom }}
          </h2>

          <div
            class="relative w-full h-96 rounded-lg overflow-hidden shadow-lg"
          >
            <!-- Image d'accueil -->
            <img
              src="/src/assets/administratrice-accueil.png"
              alt="Accueil administrateur"
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
                administrateur!
              </h1>
              <p
                class="text-lg text-gray-100 max-w-xl animate-slideUp delay-500"
              >
                Pilotez votre établissement avec sérénité et inspirez votre
                communauté éducative.
              </p>
            </div>
          </div>
        </div>

        <!-- Section Gestion des utilisateurs -->

        <div v-if="activeSection === 'users'" class="mt-4">
          <!-- Cartes de navigation -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              @click="
                activeUserTab = 'liste';
                fetchUsers();
              "
              class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
              :class="
                activeUserTab === 'liste'
                  ? 'border-teal-600 bg-teal-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
              "
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="
                  activeUserTab === 'liste' ? 'bg-teal-600' : 'bg-gray-100'
                "
              >
                <UserGroupIcon
                  class="h-6 w-6"
                  :class="
                    activeUserTab === 'liste' ? 'text-white' : 'text-gray-500'
                  "
                />
              </div>
              <div class="text-center">
                <p
                  class="text-sm font-semibold"
                  :class="
                    activeUserTab === 'liste'
                      ? 'text-teal-700'
                      : 'text-gray-700'
                  "
                >
                  Liste des utilisateurs
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ users.length }} comptes
                </p>
              </div>
              <span
                v-if="activeUserTab === 'liste'"
                class="w-2 h-2 rounded-full bg-teal-600"
              ></span>
            </div>

            <div
              @click="activeUserTab = 'attente'"
              class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
              :class="
                activeUserTab === 'attente'
                  ? 'border-amber-500 bg-amber-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/50'
              "
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="
                  activeUserTab === 'attente' ? 'bg-amber-500' : 'bg-gray-100'
                "
              >
                <ClockIcon
                  class="h-6 w-6"
                  :class="
                    activeUserTab === 'attente' ? 'text-white' : 'text-gray-500'
                  "
                />
              </div>
              <div class="text-center">
                <p
                  class="text-sm font-semibold"
                  :class="
                    activeUserTab === 'attente'
                      ? 'text-amber-700'
                      : 'text-gray-700'
                  "
                >
                  Comptes en attente
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ pendingUsers.length }} en attente
                </p>
              </div>
              <span
                v-if="activeUserTab === 'attente'"
                class="w-2 h-2 rounded-full bg-amber-500"
              ></span>
            </div>

            <div
              @click="activeUserTab = 'modifications'"
              class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
              :class="
                activeUserTab === 'modifications'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
              "
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="
                  activeUserTab === 'modifications'
                    ? 'bg-blue-500'
                    : 'bg-gray-100'
                "
              >
                <PencilSquareIcon
                  class="h-6 w-6"
                  :class="
                    activeUserTab === 'modifications'
                      ? 'text-white'
                      : 'text-gray-500'
                  "
                />
              </div>
              <div class="text-center">
                <p
                  class="text-sm font-semibold"
                  :class="
                    activeUserTab === 'modifications'
                      ? 'text-blue-700'
                      : 'text-gray-700'
                  "
                >
                  Demandes de modification
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ modifications.length }} demande(s)
                </p>
              </div>
              <span
                v-if="activeUserTab === 'modifications'"
                class="w-2 h-2 rounded-full bg-blue-500"
              ></span>
            </div>

            <div
              @click="$router.push('/register')"
              class="cursor-pointer rounded-xl border-2 border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50 p-5 flex flex-col items-center gap-3 transition-all duration-200"
            >
              <div
                class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <UserIcon class="h-6 w-6 text-gray-500" />
              </div>
              <div class="text-center">
                <p class="text-sm font-semibold text-gray-700">
                  Gérer les inscriptions
                </p>
                <p class="text-xs text-gray-400 mt-0.5">Nouvelle inscription</p>
              </div>
            </div>
          </div>

          <!-- Contenu affiché selon la carte active -->

          <!-- Liste des utilisateurs -->
          <transition name="fade-slide">
            <div
              v-if="activeUserTab === 'liste' && usersLoaded"
              class="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 class="text-lg font-semibold text-gray-800 mb-4">
                Liste des utilisateurs
              </h2>
              <div class="overflow-x-auto">
                <table v-if="users.length" class="w-full border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        N°
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Nom
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Prénoms
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Rôle
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Établissement
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Statut
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Dernière connexion
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Téléphone
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="u in users"
                      :key="u.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="p-3 text-sm text-gray-600">{{ u.id }}</td>
                      <td class="p-3 text-sm font-medium text-gray-800">
                        {{ u.nom }}
                      </td>
                      <td class="p-3 text-sm text-gray-600">{{ u.prenoms }}</td>
                      <td class="p-3 text-sm text-gray-600">{{ u.email }}</td>
                      <td class="p-3">
                        <span
                          class="text-xs px-2 py-1 rounded-full font-medium"
                          :class="
                            parseInt(u.role_id) === 1
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          "
                        >
                          {{ u.Role?.name || "Inconnu" }}
                        </span>
                      </td>
                      <td class="p-3 text-sm text-gray-600">
                        {{ u.Etablissement?.nom || "N/A" }}
                      </td>
                      <td class="p-3">
                        <button
                          @click="toggleActivation(u)"
                          class="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors"
                          :class="
                            u.est_actif
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          "
                        >
                          {{ u.est_actif ? "Désactiver" : "Activer" }}
                        </button>
                      </td>
                      <td class="p-3 text-sm text-gray-600">
                        {{ formatDate(u.derniere_connexion) }}
                      </td>
                      <td class="p-3 text-sm text-gray-600">
                        {{ u.telephone || "N/A" }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-else class="text-gray-500 text-sm py-4">
                  Aucun utilisateur trouvé.
                </p>
              </div>
            </div>
          </transition>

          <!-- Comptes en attente -->
          <transition name="fade-slide">
            <div
              v-if="activeUserTab === 'attente'"
              class="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 class="text-lg font-semibold text-gray-800 mb-4">
                Comptes en attente de validation
                <span
                  class="ml-2 text-sm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
                >
                  {{ pendingUsers.length }}
                </span>
              </h2>
              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Nom
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Prénoms
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Rôle
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="user in pendingUsers"
                      :key="user.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="p-3 text-sm font-medium text-gray-800">
                        {{ user.nom }}
                      </td>
                      <td class="p-3 text-sm text-gray-600">
                        {{ user.prenoms }}
                      </td>
                      <td class="p-3 text-sm text-gray-600">
                        {{ user.email }}
                      </td>
                      <td class="p-3">
                        <span
                          class="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700"
                        >
                          {{ user.Role?.name }}
                        </span>
                      </td>
                      <td class="p-3">
                        <button
                          @click="activer(user.id)"
                          class="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer transition-colors"
                        >
                          Activer
                        </button>
                      </td>
                    </tr>
                    <tr v-if="pendingUsers.length === 0">
                      <td
                        colspan="5"
                        class="p-4 text-center text-sm text-gray-400"
                      >
                        Aucun compte en attente.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </transition>

          <!-- Demandes de modification -->
          <transition name="fade-slide">
            <div
              v-if="activeUserTab === 'modifications'"
              class="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 class="text-lg font-semibold text-gray-800 mb-4">
                Demandes de modification en attente
                <span
                  class="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                >
                  {{ modifications.length }}
                </span>
              </h2>
              <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Utilisateur
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Champ
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Ancienne valeur
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Nouvelle valeur
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="modif in modifications"
                      :key="modif.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="p-3">
                        <p class="text-sm font-medium text-gray-800">
                          {{ modif.user.nom }} {{ modif.user.prenoms }}
                        </p>
                        <p class="text-xs text-gray-400">
                          {{ modif.user.email }}
                        </p>
                      </td>
                      <td class="p-3 text-sm text-gray-600">
                        {{ modif.champ }}
                      </td>
                      <td class="p-3 text-sm text-gray-500 line-through">
                        {{ modif.ancienne_valeur }}
                      </td>
                      <td class="p-3 text-sm font-medium text-gray-800">
                        {{ modif.nouvelle_valeur }}
                      </td>
                      <td class="p-3 flex gap-2">
                        <button
                          @click="valider(modif.id)"
                          class="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer transition-colors"
                        >
                          Valider
                        </button>
                        <button
                          @click="refuser(modif.id)"
                          class="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-colors"
                        >
                          Refuser
                        </button>
                      </td>
                    </tr>
                    <tr v-if="modifications.length === 0">
                      <td
                        colspan="5"
                        class="p-4 text-center text-sm text-gray-400"
                      >
                        Aucune demande en attente.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </transition>
        </div>

        <!-- Section Gestion des classes -->
        <div v-if="activeSection === 'classes'" class="mt-4 p-6">
          <!-- Cartes de navigation -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div
              @click="activeClassTab = 'liste'"
              class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
              :class="
                activeClassTab === 'liste'
                  ? 'border-teal-600 bg-teal-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
              "
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="
                  activeClassTab === 'liste' ? 'bg-teal-600' : 'bg-gray-100'
                "
              >
                <RectangleGroupIcon
                  class="h-6 w-6"
                  :class="
                    activeClassTab === 'liste' ? 'text-white' : 'text-gray-500'
                  "
                />
              </div>
              <div class="text-center">
                <p
                  class="text-sm font-semibold"
                  :class="
                    activeClassTab === 'liste'
                      ? 'text-teal-700'
                      : 'text-gray-700'
                  "
                >
                  Liste des classes
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ classes.length }} classe(s)
                </p>
              </div>
              <span
                v-if="activeClassTab === 'liste'"
                class="w-2 h-2 rounded-full bg-teal-600"
              />
            </div>

            <div
              @click="
                activeClassTab = 'ajouter';
                showAddClass = true;
              "
              class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
              :class="
                activeClassTab === 'ajouter'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
              "
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="
                  activeClassTab === 'ajouter' ? 'bg-green-500' : 'bg-gray-100'
                "
              >
                <PlusCircleIcon
                  class="h-6 w-6"
                  :class="
                    activeClassTab === 'ajouter'
                      ? 'text-white'
                      : 'text-gray-500'
                  "
                />
              </div>
              <div class="text-center">
                <p
                  class="text-sm font-semibold"
                  :class="
                    activeClassTab === 'ajouter'
                      ? 'text-green-700'
                      : 'text-gray-700'
                  "
                >
                  Ajouter une classe
                </p>
                <p class="text-xs text-gray-400 mt-0.5">Nouvelle classe</p>
              </div>
              <span
                v-if="activeClassTab === 'ajouter'"
                class="w-2 h-2 rounded-full bg-green-500"
              />
            </div>
          </div>

          <!-- Liste des classes -->
          <transition name="fade-slide">
            <div
              v-if="activeClassTab === 'liste'"
              class="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 class="text-lg font-semibold text-gray-800 mb-4">
                Liste des classes
              </h2>
              <div class="overflow-x-auto">
                <table v-if="classes.length" class="w-full border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Nom
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Promotion
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Niveau
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="classe in classes"
                      :key="classe.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="p-3 text-sm font-medium text-gray-800">
                        {{ classe.nom }}
                      </td>
                      <td class="p-3">
                        <span
                          class="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-medium"
                        >
                          {{ classe.promotion }}
                        </span>
                      </td>
                      <td class="p-3 text-sm text-gray-600">
                        {{ classe.niveau }}
                      </td>
                      <td class="p-3 flex gap-2">
                        <button
                          @click="editClass(classe)"
                          class="text-xs px-3 py-1.5 rounded-lg font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          @click="deleteClass(classe.id)"
                          class="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-else class="text-sm text-gray-400 py-4 text-center">
                  Aucune classe enregistrée.
                </p>
              </div>
            </div>
          </transition>

          <!-- Formulaire ajouter / modifier -->
          <transition name="fade-slide">
            <div
              v-if="activeClassTab === 'ajouter' || showEditClass"
              class="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 class="text-lg font-semibold text-gray-800 mb-4">
                {{
                  showEditClass ? "Modifier la classe" : "Ajouter une classe"
                }}
              </h2>
              <form
                @submit.prevent="showEditClass ? updateClass() : addClass()"
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Nom</label
                  >
                  <input
                    v-model="newClass.nom"
                    type="text"
                    required
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Promotion</label
                  >
                  <select
                    v-model="newClass.promotion"
                    required
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Sélectionner</option>
                    <option
                      v-for="promo in [
                        '6e',
                        '5e',
                        '4e',
                        '3e',
                        '2nde AB',
                        '2nde C',
                        '2nde D',
                        '1ere AB',
                        '1ere C',
                        '1ere D',
                        'Tle A1',
                        'Tle A2-B',
                        'Tle C',
                        'Tle D',
                      ]"
                      :key="promo"
                      :value="promo"
                    >
                      {{ promo }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Niveau</label
                  >
                  <input
                    v-model="newClass.niveau"
                    type="text"
                    required
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div class="md:col-span-2 flex gap-3 pt-2">
                  <button
                    type="submit"
                    class="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 cursor-pointer transition-colors"
                  >
                    {{ showEditClass ? "Mettre à jour" : "Ajouter" }}
                  </button>
                  <button
                    type="button"
                    @click="
                      cancelClassEdit();
                      activeClassTab = null;
                    "
                    class="px-5 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </transition>
        </div>
        <!-- Section Gestion des disciplines -->
        <div v-if="activeSection === 'disciplines'" class="mt-4 p-6">
          <button
            @click="showAddDiscipline = true"
            class="w-full sm:w-auto mt-2 bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Ajouter une discipline
          </button>
          <div class="overflow-x-auto">
            <table
              v-if="disciplines.length"
              class="mt-4 w-full border-collapse border"
            >
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
                  <td class="border p-2">
                    {{ getClassName(discipline.classe_id) }}
                  </td>
                  <td class="border p-2">{{ discipline.coefficient }}</td>
                  <td class="border p-2">
                    {{ discipline.heures_par_semaine }}
                  </td>
                  <td class="border p-2">
                    <button
                      @click="editDiscipline(discipline)"
                      class="bg-yellow-500 text-white p-1 rounded mr-2"
                    >
                      Modifier
                    </button>
                    <button
                      @click="deleteDiscipline(discipline.id)"
                      class="bg-red-500 text-white p-1 rounded"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Modal pour ajouter/modifier une discipline -->
          <div
            v-if="showAddDiscipline || showEditDiscipline"
            class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center"
          >
            <div class="bg-white p-6 rounded-lg shadow-lg">
              <h3 class="text-lg font-semibold">
                {{
                  showAddDiscipline
                    ? "Ajouter une discipline"
                    : "Modifier une discipline"
                }}
              </h3>
              <form
                @submit.prevent="
                  showAddDiscipline ? addDiscipline() : updateDiscipline()
                "
                class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
              >
                <div>
                  <label
                    for="disciplineNom"
                    class="block text-sm font-medium text-gray-700"
                    >Nom :</label
                  >
                  <select
                    v-model="newDiscipline.nom"
                    id="disciplineNom"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  >
                    <option
                      v-for="disc in [
                        'PCT',
                        'Mathématiques',
                        'SVT',
                        'Histoire-Géographie',
                        'Français',
                        'Anglais',
                        'Lecture',
                        'Communication écrite',
                        'Philosophie',
                      ]"
                      :key="disc"
                      :value="disc"
                    >
                      {{ disc }}
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    for="disciplineClass"
                    class="block text-sm font-medium text-gray-700"
                    >Classe :</label
                  >
                  <select
                    v-model="newDiscipline.classe_id"
                    id="disciplineClass"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  >
                    <option
                      v-for="classe in classes"
                      :key="classe.id"
                      :value="classe.id"
                    >
                      {{ classe.nom }}
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    for="disciplineCoefficient"
                    class="block text-sm font-medium text-gray-700"
                    >Coefficient :</label
                  >
                  <input
                    v-model.number="newDiscipline.coefficient"
                    id="disciplineCoefficient"
                    type="number"
                    step="0.1"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    for="disciplineHeures"
                    class="block text-sm font-medium text-gray-700"
                    >Heures/semaine :</label
                  >
                  <input
                    v-model.number="newDiscipline.heures_par_semaine"
                    id="disciplineHeures"
                    type="number"
                    class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    required
                  />
                </div>
                <div
                  class="flex flex-col sm:flex-row justify-end gap-2 md:col-span-2"
                >
                  <button
                    type="submit"
                    class="w-full sm:w-auto bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                  >
                    {{ showAddDiscipline ? "Ajouter" : "Mettre à jour" }}
                  </button>
                  <button
                    @click="cancelDisciplineEdit"
                    class="w-full sm:w-auto bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Section Gestion des affectations -->
        <div v-if="activeSection === 'affectations'" class="mt-4 p-6">
          <!-- Cartes de navigation -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div
              @click="activeAffectationTab = 'liste'"
              class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
              :class="
                activeAffectationTab === 'liste'
                  ? 'border-teal-600 bg-teal-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/50'
              "
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="
                  activeAffectationTab === 'liste'
                    ? 'bg-teal-600'
                    : 'bg-gray-100'
                "
              >
                <LinkIcon
                  class="h-6 w-6"
                  :class="
                    activeAffectationTab === 'liste'
                      ? 'text-white'
                      : 'text-gray-500'
                  "
                />
              </div>
              <div class="text-center">
                <p
                  class="text-sm font-semibold"
                  :class="
                    activeAffectationTab === 'liste'
                      ? 'text-teal-700'
                      : 'text-gray-700'
                  "
                >
                  Affectations existantes
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ affectations.length }} affectation(s)
                </p>
              </div>
              <span
                v-if="activeAffectationTab === 'liste'"
                class="w-2 h-2 rounded-full bg-teal-600"
              />
            </div>

            <div
              @click="
                activeAffectationTab = 'ajouter';
                showNewAffectationForm = true;
              "
              class="cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center gap-3 transition-all duration-200"
              :class="
                activeAffectationTab === 'ajouter'
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
              "
            >
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center"
                :class="
                  activeAffectationTab === 'ajouter'
                    ? 'bg-green-500'
                    : 'bg-gray-100'
                "
              >
                <PlusIcon
                  class="h-6 w-6"
                  :class="
                    activeAffectationTab === 'ajouter'
                      ? 'text-white'
                      : 'text-gray-500'
                  "
                />
              </div>
              <div class="text-center">
                <p
                  class="text-sm font-semibold"
                  :class="
                    activeAffectationTab === 'ajouter'
                      ? 'text-green-700'
                      : 'text-gray-700'
                  "
                >
                  Nouvelle affectation
                </p>
                <p class="text-xs text-gray-400 mt-0.5">
                  Lier enseignant / classe
                </p>
              </div>
              <span
                v-if="activeAffectationTab === 'ajouter'"
                class="w-2 h-2 rounded-full bg-green-500"
              />
            </div>
          </div>

          <!-- Liste des affectations -->
          <transition name="fade-slide">
            <div
              v-if="activeAffectationTab === 'liste'"
              class="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 class="text-lg font-semibold text-gray-800 mb-4">
                Liste des affectations
              </h2>
              <div
                v-if="affectations.length === 0"
                class="text-center text-sm text-gray-400 py-4"
              >
                Aucune affectation pour le moment.
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="bg-gray-50 border-b border-gray-200">
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Enseignant
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Classe
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Matière
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Coefficient
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        H/semaine
                      </th>
                      <th
                        class="p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr
                      v-for="affectation in affectations"
                      :key="affectation.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="p-3 text-sm">
                        <template v-if="editingAffectation === affectation.id">
                          <select
                            v-model="editAffectationForm.enseignantId"
                            class="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full"
                          >
                            <option
                              v-for="e in enseignants"
                              :key="e.id"
                              :value="e.id"
                            >
                              {{ e.prenoms }} {{ e.nom }}
                            </option>
                          </select>
                        </template>
                        <template v-else>
                          <p class="font-medium text-gray-800">
                            {{ affectation.User?.prenoms }}
                            {{ affectation.User?.nom }}
                          </p>
                        </template>
                      </td>

                      <td class="p-3 text-sm">
                        <template v-if="editingAffectation === affectation.id">
                          <select
                            v-model="editAffectationForm.classeId"
                            class="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full"
                          >
                            <option
                              v-for="c in classes"
                              :key="c.id"
                              :value="c.id"
                            >
                              {{ c.nom }} ({{ c.promotion }})
                            </option>
                          </select>
                        </template>
                        <template v-else>
                          <span
                            class="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-medium"
                          >
                            {{ affectation.Discipline?.Classe?.nom }} ({{
                              affectation.Discipline?.Classe?.promotion
                            }})
                          </span>
                        </template>
                      </td>

                      <td class="p-3 text-sm">
                        <template v-if="editingAffectation === affectation.id">
                          <select
                            v-model="editAffectationForm.disciplineNom"
                            class="border border-gray-300 rounded-lg px-2 py-1 text-sm w-full"
                          >
                            <option
                              v-for="m in matieresDisponibles"
                              :key="m"
                              :value="m"
                            >
                              {{ m }}
                            </option>
                          </select>
                        </template>
                        <template v-else>
                          {{ affectation.Discipline?.nom }}
                        </template>
                      </td>

                      <td class="p-3 text-sm text-gray-600">
                        <template v-if="editingAffectation === affectation.id">
                          <input
                            v-model.number="editAffectationForm.coefficient"
                            type="number"
                            step="0.1"
                            class="border border-gray-300 rounded-lg px-2 py-1 text-sm w-20"
                          />
                        </template>
                        <template v-else>
                          {{ affectation.Discipline?.coefficient }}
                        </template>
                      </td>

                      <td class="p-3 text-sm text-gray-600">
                        <template v-if="editingAffectation === affectation.id">
                          <input
                            v-model.number="
                              editAffectationForm.heuresParSemaine
                            "
                            type="number"
                            class="border border-gray-300 rounded-lg px-2 py-1 text-sm w-20"
                          />
                        </template>
                        <template v-else>
                          {{ affectation.Discipline?.heures_par_semaine }}h
                        </template>
                      </td>

                      <td class="p-3">
                        <template v-if="editingAffectation === affectation.id">
                          <div class="flex gap-2">
                            <button
                              @click="updateAffectation(affectation)"
                              class="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer transition-colors font-medium"
                            >
                              Sauvegarder
                            </button>
                            <button
                              @click="cancelEdit"
                              class="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors font-medium"
                            >
                              Annuler
                            </button>
                          </div>
                        </template>
                        <template v-else>
                          <div class="flex gap-2">
                            <button
                              @click="startEditAffectation(affectation)"
                              class="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 cursor-pointer transition-colors font-medium"
                            >
                              Modifier
                            </button>
                            <button
                              @click="deleteAffectation(affectation.id)"
                              class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer transition-colors font-medium"
                            >
                              Supprimer
                            </button>
                          </div>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </transition>

          <!-- Formulaire nouvelle affectation -->
          <transition name="fade-slide">
            <div
              v-if="activeAffectationTab === 'ajouter'"
              class="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 class="text-lg font-semibold text-gray-800 mb-4">
                Nouvelle affectation
              </h2>
              <form
                @submit.prevent="createAffectation"
                class="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Enseignant</label
                  >
                  <select
                    v-model="newAffectation.enseignantId"
                    required
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Sélectionner un enseignant</option>
                    <option
                      v-for="enseignant in enseignants"
                      :key="enseignant.id"
                      :value="enseignant.id"
                    >
                      {{ enseignant.prenoms }} {{ enseignant.nom }} ({{
                        enseignant.email
                      }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Classe</label
                  >
                  <select
                    v-model="newAffectation.classeId"
                    required
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Sélectionner une classe</option>
                    <option
                      v-for="classe in classes"
                      :key="classe.id"
                      :value="classe.id"
                    >
                      {{ classe.nom }} ({{ classe.promotion }})
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Matière</label
                  >
                  <select
                    v-model="newAffectation.disciplineNom"
                    required
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Sélectionner une matière</option>
                    <option
                      v-for="m in [
                        'PCT',
                        'Mathématiques',
                        'SVT',
                        'Histoire-Géographie',
                        'Français',
                        'Anglais',
                        'Lecture',
                        'Communication écrite',
                        'Philosophie',
                      ]"
                      :key="m"
                      :value="m"
                    >
                      {{ m }}
                    </option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Coefficient</label
                  >
                  <input
                    v-model.number="newAffectation.coefficient"
                    type="number"
                    step="0.1"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Heures par semaine</label
                  >
                  <input
                    v-model.number="newAffectation.heuresParSemaine"
                    type="number"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div class="md:col-span-2 flex gap-3 pt-2">
                  <button
                    type="submit"
                    class="px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 cursor-pointer transition-colors"
                  >
                    Affecter
                  </button>
                  <button
                    type="button"
                    @click="
                      cancelNewAffectation();
                      activeAffectationTab = null;
                    "
                    class="px-5 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </transition>
        </div>

        <!-- Section Progression Globale -->
        <div v-if="activeSection === 'progression'" class="mt-4">
          <div
            v-if="progressionLoading"
            class="flex items-center justify-center h-64"
          >
            <p class="text-gray-500">Chargement de la progression globale...</p>
          </div>

          <div v-else class="p-6 space-y-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">
              📊 Progression Globale des Classes
            </h2>
            <div class="bg-white shadow rounded-lg p-6">
              <!-- Message si aucune classe -->
              <div
                v-if="!progressionClasses || progressionClasses.length === 0"
                class="text-center py-12"
              >
                <p class="text-gray-500">Aucune classe disponible</p>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- COLONNE 1: Liste des classes et disciplines -->
                <div
                  class="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto"
                >
                  <div
                    v-for="classe in progressionClasses"
                    :key="classe.id"
                    class="border rounded-lg overflow-hidden"
                  >
                    <button
                      @click="toggleProgressionClass(classe.id)"
                      class="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div class="flex items-center">
                        <span v-if="expandedClasses[classe.id]">▼</span>
                        <span v-else>►</span>
                        <span class="ml-2 font-semibold">{{ classe.nom }}</span>
                        <span class="ml-2 text-sm text-gray-500"
                          >({{ classe.promotion }})</span
                        >
                      </div>

                      <span
                        class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {{ classe.disciplines?.length || 0 }} discipline(s)
                      </span>
                    </button>

                    <!-- Affichage conditionnel avec message si aucune discipline -->
                    <div
                      v-if="expandedClasses[classe.id]"
                      class="p-2 space-y-2 bg-white"
                    >
                      <!-- Message si aucune discipline -->
                      <div
                        v-if="
                          !classe.disciplines || classe.disciplines.length === 0
                        "
                        class="p-4 text-center text-gray-500 text-sm"
                      >
                        📚 Aucune discipline dans cette classe
                      </div>

                      <!-- Liste des disciplines -->

                      <button
                        v-else
                        v-for="discipline in classe.disciplines"
                        :key="discipline.id"
                        @click="selectDiscipline(discipline)"
                        :class="[
                          'w-full text-left p-3 rounded border transition',
                          selectedDiscipline?.id === discipline.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'hover:bg-gray-50 border-gray-200',
                        ]"
                      >
                        <div class="flex justify-between items-center mb-2">
                          <span class="font-medium text-gray-800">{{
                            discipline.nom
                          }}</span>
                          <span
                            v-if="discipline.enseignant"
                            :class="[
                              'px-2 py-1 rounded text-xs font-semibold',
                              getProgressColor(discipline.progression),
                            ]"
                          >
                            {{ discipline.progression }}%
                          </span>
                          <span
                            v-else
                            class="text-red-500 text-xs bg-red-50 px-2 py-1 rounded"
                            >⚠️ Non affecté</span
                          >
                        </div>
                        <div class="text-xs text-gray-600">
                          <div
                            v-if="discipline.enseignant"
                            class="flex items-center"
                          >
                            <span class="mr-1">👤</span>
                            {{ discipline.enseignant.prenoms }}
                            {{ discipline.enseignant.nom }}
                          </div>
                          <div v-else class="text-red-600 font-medium">
                            Aucun enseignant affecté
                          </div>
                        </div>
                        <div
                          class="text-xs text-gray-500 mt-1 flex items-center gap-3"
                        >
                          <span
                            >📚 {{ discipline.entriesCount }} entrée(s)</span
                          >
                          <span
                            >⏱️ {{ discipline.heures_par_semaine }}h/sem</span
                          >
                          <span v-if="discipline.coefficient"
                            >📊 Coef. {{ discipline.coefficient }}</span
                          >
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- COLONNE 2-3: Détails de la discipline -->
                <div class="lg:col-span-2">
                  <div
                    v-if="selectedDiscipline && disciplineDetails"
                    class="space-y-4"
                  >
                    <!-- En-tête -->
                    <div
                      class="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6"
                    >
                      <h3 class="text-2xl font-bold mb-2">
                        {{ disciplineDetails.discipline.nom }}
                      </h3>
                      <p class="text-blue-100 mb-4">
                        {{ disciplineDetails.discipline.classe.nom }} •
                        {{ disciplineDetails.discipline.classe.promotion }}
                      </p>
                      <div
                        v-if="disciplineDetails.discipline.enseignant"
                        class="text-blue-100"
                      >
                        👤 Enseignant:
                        {{ disciplineDetails.discipline.enseignant.prenoms }}
                        {{ disciplineDetails.discipline.enseignant.nom }}
                      </div>
                    </div>

                    <!-- Statistiques -->
                    <div class="grid grid-cols-3 gap-4">
                      <div class="bg-white border rounded-lg p-4 text-center">
                        <div
                          :class="[
                            'text-3xl font-bold',
                            getProgressColor(
                              disciplineDetails.discipline.progression,
                            ).split(' ')[0],
                          ]"
                        >
                          {{ disciplineDetails.discipline.progression }}%
                        </div>
                        <div class="text-sm text-gray-600 mt-1">
                          Progression
                        </div>
                      </div>
                      <div class="bg-white border rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-gray-800">
                          {{ disciplineDetails.discipline.taux_realise }}
                        </div>
                        <div class="text-sm text-gray-600 mt-1">
                          Taux réalisé
                        </div>
                      </div>
                      <div class="bg-white border rounded-lg p-4 text-center">
                        <div class="text-3xl font-bold text-gray-800">
                          {{ disciplineDetails.entries.length }}
                        </div>
                        <div class="text-sm text-gray-600 mt-1">Entrées</div>
                      </div>
                    </div>

                    <!-- Entrées du cahier -->
                    <div class="bg-white border rounded-lg p-4">
                      <h4 class="font-semibold text-lg mb-3">
                        📚 Entrées du cahier de texte
                      </h4>
                      <div class="space-y-3 max-h-[400px] overflow-y-auto">
                        <div
                          v-for="entry in disciplineDetails.entries"
                          :key="entry.id"
                          class="border rounded p-3 hover:shadow-md transition"
                        >
                          <div class="flex justify-between items-start mb-2">
                            <div>
                              <span class="font-medium text-gray-800">{{
                                entry.date_cours
                              }}</span>
                              <span class="ml-3 text-sm text-gray-500"
                                >⏱️ {{ entry.duree }}h</span
                              >
                            </div>
                            <button
                              @click="toggleEntryHistory(entry.id)"
                              class="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Historique ({{ entry.history?.length || 0 }})
                            </button>
                          </div>

                          <p class="text-gray-700 mb-2">{{ entry.contenu }}</p>

                          <div v-if="entry.activites" class="text-sm">
                            <span class="font-medium text-gray-600"
                              >Activités:</span
                            >
                            <ul class="ml-4 mt-1 space-y-1">
                              <li
                                v-for="(activite, idx) in entry.activites.split(
                                  '\n',
                                )"
                                :key="idx"
                                class="flex items-center"
                              >
                                <span
                                  :class="[
                                    'w-2 h-2 rounded-full mr-2',
                                    entry.activites_status?.[idx] === 'fait'
                                      ? 'bg-green-500'
                                      : 'bg-gray-300',
                                  ]"
                                ></span>
                                {{ activite }}
                              </li>
                            </ul>
                          </div>

                          <!-- Historique -->
                          <div
                            v-if="
                              showHistory[entry.id] && entry.history?.length
                            "
                            class="mt-3 pt-3 border-t bg-gray-50 rounded p-2"
                          >
                            <h5
                              class="text-sm font-semibold text-gray-700 mb-2"
                            >
                              Historique des modifications
                            </h5>
                            <div class="space-y-2">
                              <div
                                v-for="(h, idx) in entry.history"
                                :key="idx"
                                class="text-xs text-gray-600 bg-white p-2 rounded"
                              >
                                <div class="font-medium">
                                  Version {{ h.version }} -
                                  {{
                                    new Date(h.modified_at).toLocaleString(
                                      "fr-FR",
                                    )
                                  }}
                                </div>
                                <div class="mt-1 text-gray-500">
                                  {{ JSON.stringify(h.changes) }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Entrées supprimées -->
                    <div
                      v-if="disciplineDetails.deletedEntries?.length"
                      class="bg-red-50 border border-red-200 rounded-lg p-4"
                    >
                      <button
                        @click="showDeleted = !showDeleted"
                        class="w-full flex items-center justify-between font-semibold text-red-800 mb-2"
                      >
                        <span>
                          Entrées supprimées ({{
                            disciplineDetails.deletedEntries.length
                          }})</span
                        >
                        <span>{{ showDeleted ? "▼" : "►" }}</span>
                      </button>

                      <div v-if="showDeleted" class="space-y-2 mt-3">
                        <div
                          v-for="deleted in disciplineDetails.deletedEntries"
                          :key="deleted.id"
                          class="bg-white border border-red-300 rounded p-3"
                        >
                          <div class="flex justify-between items-start mb-1">
                            <span class="font-medium text-gray-800">{{
                              deleted.date_cours
                            }}</span>
                            <span class="text-xs text-red-600">
                              Supprimé le
                              {{
                                new Date(deleted.deleted_at).toLocaleString(
                                  "fr-FR",
                                )
                              }}
                            </span>
                          </div>
                          <p class="text-gray-700 text-sm">
                            {{ deleted.contenu }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    v-else
                    class="flex items-center justify-center h-full text-gray-500"
                  >
                    <div class="text-center">
                      <div class="text-6xl mb-4">📖</div>
                      <p>Sélectionnez une discipline pour voir les détails</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Consulter les entrées -->
        <div v-if="activeSection === 'consulter-entrees'" class="mt-4 p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            📝 Consulter les entrées des enseignants
          </h2>
          <div class="bg-white shadow rounded-lg p-6">
            <!-- Filtres -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <!-- Filtre par classe -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Classe</label
                >
                <select
                  v-model="filtreEntreesClasse"
                  @change="filtrerEntrees"
                  class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Toutes les classes</option>
                  <option
                    v-for="classe in classes"
                    :key="classe.id"
                    :value="classe.id"
                  >
                    {{ classe.nom }} ({{ classe.promotion }})
                  </option>
                </select>
              </div>

              <!-- Filtre par discipline -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Discipline</label
                >
                <select
                  v-model="filtreEntreesDiscipline"
                  @change="filtrerEntrees"
                  class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Toutes les disciplines</option>
                  <option
                    v-for="disc in disciplinesUniques"
                    :key="disc"
                    :value="disc"
                  >
                    {{ disc }}
                  </option>
                </select>
              </div>

              <!-- Filtre par enseignant -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Enseignant</label
                >
                <select
                  v-model="filtreEntreesEnseignant"
                  @change="filtrerEntrees"
                  class="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les enseignants</option>
                  <option
                    v-for="ens in enseignants"
                    :key="ens.id"
                    :value="ens.id"
                  >
                    {{ ens.prenoms }} {{ ens.nom }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Bouton charger -->
            <div class="mb-6">
              <button
                @click="chargerToutesLesEntrees"
                class="w-full sm:w-auto bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
                :disabled="chargementEntrees"
              >
                <span v-if="chargementEntrees">🔄 Chargement...</span>
                <span v-else>🔍 Charger les entrées</span>
              </button>
              <span
                v-if="toutesLesEntrees.length > 0"
                class="ml-4 text-sm text-gray-600"
              >
                {{ entreesFiltrees.length }} entrée(s) trouvée(s)
              </span>
            </div>

            <!-- Message si aucune entrée -->
            <div
              v-if="
                !chargementEntrees &&
                entreesFiltrees.length === 0 &&
                toutesLesEntrees.length === 0
              "
              class="text-center py-12 text-gray-500"
            >
              <svg
                class="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <p class="text-lg">
                Cliquez sur "Charger les entrées" pour afficher les données
              </p>
            </div>

            <!-- Liste des entrées -->
            <div v-else-if="entreesFiltrees.length > 0" class="space-y-4">
              <div
                v-for="entry in entreesFiltrees"
                :key="entry.id"
                class="border rounded-lg p-4 hover:shadow-md transition bg-white"
              >
                <!-- En-tête de l'entrée -->
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-800">
                      {{ entry.sa_number }} - {{ entry.sa_name }}
                    </h3>
                    <p class="text-sm text-gray-600 mt-1">
                      <span class="font-medium">{{
                        entry.discipline?.nom
                      }}</span>
                      • {{ entry.discipline?.Classe?.nom }} ({{
                        entry.discipline?.Classe?.promotion
                      }})
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-gray-600">
                      📅 {{ formatDate(entry.date_cours) }}
                    </p>
                    <p class="text-xs text-gray-500">
                      ⏱️ {{ entry.heure_debut }} - {{ entry.heure_fin }}
                    </p>
                  </div>
                </div>

                <!-- Enseignant -->
                <div class="mb-3 p-3 bg-blue-50 rounded">
                  <p class="text-sm">
                    <span class="font-medium text-gray-700"
                      >👤 Enseignant:</span
                    >
                    <span class="text-blue-700 ml-2"
                      >{{ entry.teacher?.prenoms }}
                      {{ entry.teacher?.nom }}</span
                    >
                  </p>
                </div>

                <!-- Contenu -->
                <div class="mb-3">
                  <p class="text-sm font-medium text-gray-700 mb-1">
                    📖 Contenu du cours:
                  </p>
                  <div
                    class="text-sm text-gray-600 bg-gray-50 p-3 rounded"
                    v-html="entry.contenu"
                  ></div>
                </div>

                <!-- Activités -->
                <div v-if="entry.activites" class="mb-3">
                  <p class="text-sm font-medium text-gray-700 mb-2">
                    ✅ Activités:
                  </p>
                  <div class="space-y-1">
                    <div
                      v-for="(activite, idx) in entry.activites.split('\n')"
                      :key="idx"
                      class="flex items-center text-sm"
                    >
                      <span
                        :class="[
                          'w-2 h-2 rounded-full mr-2',
                          entry.activites_status?.[activite] === 'fait'
                            ? 'bg-green-500'
                            : entry.activites_status?.[activite] === 'en_cours'
                              ? 'bg-orange-500'
                              : 'bg-gray-300',
                        ]"
                      ></span>
                      <span
                        :class="{
                          'text-green-700':
                            entry.activites_status?.[activite] === 'fait',
                          'text-orange-700':
                            entry.activites_status?.[activite] === 'en_cours',
                          'text-gray-600': !entry.activites_status?.[activite],
                        }"
                      >
                        {{ activite }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Progression -->
                <div class="flex items-center justify-between mb-3">
                  <span class="text-sm font-medium text-gray-700"
                    >📊 Progression:</span
                  >
                  <div class="flex items-center space-x-2 flex-1 max-w-xs ml-4">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-green-500 h-2 rounded-full transition-all"
                        :style="{
                          width: (entry.taux_realise_entry || 0) + '%',
                        }"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-gray-700">
                      {{ entry.taux_realise_entry || 0 }}%
                    </span>
                  </div>
                </div>

                <!-- Actions admin -->
                <div class="flex justify-between items-center pt-3 border-t">
                  <div class="flex gap-2">
                    <button
                      @click="voirHistoriqueEntree(entry.id)"
                      class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                    >
                      Historique
                    </button>
                    <button
                      @click="supprimerEntreeAdmin(entry.id)"
                      class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                    >
                      Supprimer
                    </button>
                  </div>
                  <span class="text-xs text-gray-500">
                    Trimestre {{ entry.trimestre }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Historique -->
          <div
            v-if="showHistoriqueModal"
            class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
          >
            <div
              class="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">
                  📜 Historique des modifications
                </h3>
                <button
                  @click="showHistoriqueModal = false"
                  class="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div
                v-if="historiqueEntree.length === 0"
                class="text-center py-8 text-gray-500"
              >
                Aucune modification enregistrée
              </div>

              <div v-else class="space-y-4">
                <div
                  v-for="(version, idx) in historiqueEntree"
                  :key="idx"
                  class="border rounded p-4 bg-gray-50"
                >
                  <div class="flex justify-between items-start mb-2">
                    <span class="font-semibold text-blue-600"
                      >Version {{ version.version }}</span
                    >
                    <span class="text-sm text-gray-600">
                      {{
                        new Date(version.modified_at).toLocaleString("fr-FR")
                      }}
                    </span>
                  </div>
                  <div
                    v-if="version.ModifiedBy"
                    class="text-sm text-gray-600 mb-2"
                  >
                    Modifié par: {{ version.ModifiedBy.prenoms }}
                    {{ version.ModifiedBy.nom }}
                  </div>
                  <div class="text-sm">
                    <p class="font-medium text-gray-700">Contenu:</p>
                    <div
                      class="bg-white p-2 rounded mt-1"
                      v-html="version.contenu"
                    ></div>
                  </div>
                </div>
              </div>

              <button
                @click="showHistoriqueModal = false"
                class="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>

        <!-- Section Importation de PDF -->
        <div v-if="activeSection === 'import'" class="mt-4">
          <form
            @submit.prevent="handleImport"
            class="mt-4 bg-white shadow p-6 rounded-lg space-y-4"
          >
            <div>
              <label
                for="pdfFile"
                class="block text-sm font-medium text-gray-700"
                >Sélectionner un fichier PDF :</label
              >
              <input
                type="file"
                id="pdfFile"
                accept="application/pdf"
                @change="onFileChange"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <button
              type="submit"
              :disabled="!selectedFile"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              Importer
            </button>
          </form>
          <div v-if="importResult" class="mt-4 p-4 bg-gray-50 rounded-md">
            <p v-if="importSuccess" class="text-green-600">
              {{ importResult }}
            </p>
            <p v-else class="text-red-600">{{ importResult }}</p>
            <pre v-if="importDetails" class="mt-2 text-sm text-gray-600">{{
              importDetails
            }}</pre>
          </div>
        </div>
        <!-- Section des notifications -->
        <div v-if="activeSection === 'notifications'" class="mt-4">
          <div class="admin-notifications p-6">
            <h2 class="text-3xl font-bold mb-6 text-gray-800">
              📢 Gestion des Notifications
            </h2>

            <!-- Statistiques -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div
                class="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500"
              >
                <p class="text-blue-600 text-sm font-medium">Total envoyées</p>
                <p class="text-3xl font-bold text-blue-700">
                  {{ stats.total || 0 }}
                </p>
              </div>
              <div class="bg-red-100 rounded-lg p-4 border-l-4 border-red-500">
                <p class="text-red-600 text-sm font-medium">Non lues</p>
                <p class="text-3xl font-bold text-red-700">
                  {{ stats.non_lues || 0 }}
                </p>
              </div>
              <div
                class="bg-green-100 rounded-lg p-4 border-l-4 border-green-500"
              >
                <p class="text-green-600 text-sm font-medium">Emails envoyés</p>
                <p class="text-3xl font-bold text-green-700">
                  {{ stats.emails_envoyes || 0 }}
                </p>
              </div>
              <div
                class="bg-purple-100 rounded-lg p-4 border-l-4 border-purple-500"
              >
                <p class="text-purple-600 text-sm font-medium">Automatiques</p>
                <p class="text-3xl font-bold text-purple-700">
                  {{ stats.par_type?.auto_progression || 0 }}
                </p>
              </div>
            </div>

            <!-- Bouton Envoyer des notifications -->
            <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 class="text-xl font-bold mb-4">
                ✉️ Envoyer des Notifications
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  @click="ouvrirModalEnvoi('tous')"
                  class="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition flex flex-col items-center space-y-2"
                >
                  <svg
                    class="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                  <span class="font-bold">Tous les enseignants</span>
                  <span class="text-sm opacity-90"
                    >Notification basée sur progression</span
                  >
                </button>

                <button
                  @click="ouvrirModalEnvoi('retard_excessif')"
                  class="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 transition flex flex-col items-center space-y-2"
                >
                  <svg
                    class="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    ></path>
                  </svg>
                  <span class="font-bold">Retard/Avance excessive</span>
                  <span class="text-sm opacity-90"
                    >Enseignants ciblés uniquement</span
                  >
                </button>

                <button
                  @click="ouvrirModalEnvoi('personnalisé')"
                  class="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 transition flex flex-col items-center space-y-2"
                >
                  <svg
                    class="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    ></path>
                  </svg>
                  <span class="font-bold">Message personnalisé</span>
                  <span class="text-sm opacity-90"
                    >Rédiger votre propre message</span
                  >
                </button>
              </div>
            </div>

            <!-- Filtres et recherche -->
            <div class="bg-white rounded-lg shadow p-4 mb-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  v-model="filtreCategorie"
                  class="border rounded px-3 py-2"
                >
                  <option value="">Toutes les catégories</option>
                  <option value="felicitations">🎉 Félicitations</option>
                  <option value="encouragement">💪 Encouragement</option>
                  <option value="avertissement">⚠️ Avertissement</option>
                  <option value="alerte">🚨 Alerte</option>
                  <option value="critique">🔴 Critique</option>
                  <option value="avance_excessive">⚡ Avance excessive</option>
                  <option value="info">ℹ️ Info</option>
                </select>

                <select v-model="filtreType" class="border rounded px-3 py-2">
                  <option value="">Tous les types</option>
                  <option value="auto_progression">🤖 Automatique</option>
                  <option value="admin_global">👨‍💼 Admin (tous)</option>
                  <option value="admin_ciblée">🎯 Admin (ciblée)</option>
                  <option value="admin_personnalisée">✉️ Personnalisée</option>
                </select>

                <button
                  @click="chargerNotifications"
                  class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  🔄 Actualiser
                </button>
              </div>
            </div>

            <!-- Liste des notifications -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
              <div v-if="chargement" class="p-12 text-center">
                <div
                  class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
                ></div>
                <p class="mt-4 text-gray-600">Chargement...</p>
              </div>

              <div
                v-else-if="notifications.length === 0"
                class="p-12 text-center text-gray-500"
              >
                Aucune notification trouvée
              </div>

              <table v-else class="w-full">
                <thead class="bg-gray-100">
                  <tr>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                    >
                      Enseignant
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                    >
                      Titre
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                    >
                      Catégorie
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                    >
                      Type
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                    >
                      Date
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                    >
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr
                    v-for="notif in notifications"
                    :key="notif.id"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-4 py-3">
                      <div>
                        <p class="font-medium text-gray-900">
                          {{ notif.enseignant?.prenoms }}
                          {{ notif.enseignant?.nom }}
                        </p>
                        <p class="text-sm text-gray-500">
                          {{ notif.enseignant?.email }}
                        </p>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <p class="font-medium text-gray-900">{{ notif.titre }}</p>
                      <p class="text-sm text-gray-600">
                        {{ notif.classe?.nom }} - {{ notif.discipline?.nom }}
                      </p>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        :class="getCategorieClasses(notif.categorie)"
                        class="px-2 py-1 rounded-full text-xs font-bold"
                      >
                        {{ getCategorieLabel(notif.categorie) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">
                      {{ getTypeLabel(notif.type) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600">
                      {{ formatDate(notif.created_at) }}
                    </td>
                    <td class="px-4 py-3">
                      <span v-if="notif.est_lue" class="text-green-600 text-sm"
                        >✓ Lue</span
                      >
                      <span v-else class="text-orange-600 text-sm font-bold"
                        >● Non lue</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Modal d'envoi -->
            <div
              v-if="showModal"
              class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <div
                class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div class="p-6">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-2xl font-bold">{{ modalTitre }}</h3>
                    <button
                      @click="fermerModal"
                      class="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Contenu du modal selon le type -->
                  <div v-if="typeEnvoi === 'personnalisé'" class="space-y-4">
                    <!-- Sélection des enseignants -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-2"
                        >Destinataires *</label
                      >
                      <div
                        class="border rounded p-3 max-h-60 overflow-y-auto space-y-2"
                      >
                        <label
                          v-for="ens in enseignants"
                          :key="ens.id"
                          class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            :value="ens.id"
                            v-model="enseignantsCibles"
                            class="rounded"
                          />
                          <span>{{ ens.prenoms }} {{ ens.nom }}</span>
                          <span class="text-sm text-gray-500"
                            >({{ ens.email }})</span
                          >
                        </label>
                      </div>
                      <p class="mt-1 text-sm text-gray-500">
                        {{ enseignantsCibles.length }} enseignant(s)
                        sélectionné(s)
                      </p>
                    </div>

                    <!-- Titre -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-2"
                        >Titre *</label
                      >
                      <input
                        v-model="titrePersonnalise"
                        type="text"
                        class="w-full border rounded px-3 py-2"
                        placeholder="Ex: Réunion pédagogique"
                      />
                    </div>

                    <!-- Message -->
                    <div>
                      <label
                        class="block text-sm font-medium text-gray-700 mb-2"
                        >Message *</label
                      >
                      <textarea
                        v-model="messagePersonnalise"
                        rows="6"
                        class="w-full border rounded px-3 py-2"
                        placeholder="Rédigez votre message..."
                      ></textarea>
                    </div>
                  </div>

                  <div v-else>
                    <div
                      class="bg-blue-50 border border-blue-200 rounded p-4 mb-4"
                    >
                      <p class="text-sm text-blue-800">
                        {{ getDescriptionTypeEnvoi() }}
                      </p>
                    </div>
                  </div>

                  <!-- Confirmation -->
                  <div
                    class="mt-6 bg-yellow-50 border border-yellow-200 rounded p-4"
                  >
                    <p class="text-sm text-yellow-800 font-medium">
                      ⚠️ Attention : Cette action enverra des notifications par
                      email et sur l'interface de chaque enseignant concerné.
                    </p>
                  </div>

                  <!-- Boutons -->
                  <div class="mt-6 flex justify-end space-x-3">
                    <button
                      @click="fermerModal"
                      class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                      :disabled="envoi"
                    >
                      Annuler
                    </button>
                    <button
                      @click="confirmerEnvoi"
                      class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      :disabled="envoi || !peutEnvoyer"
                    >
                      <span v-if="envoi">⏳ Envoi en cours...</span>
                      <span v-else>✉️ Confirmer et envoyer</span>
                    </button>
                  </div>
                </div>
              </div>
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
              <input
                v-model="editingUser.nom"
                type="text"
                class="w-full p-2 border rounded"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700"
                >Prénoms</label
              >
              <input
                v-model="editingUser.prenoms"
                type="text"
                class="w-full p-2 border rounded"
                required
              />
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700"
                >Rôle</label
              >
              <select
                v-model="editingUser.role"
                class="w-full p-2 border rounded"
                required
              >
                <option value="enseignant">Enseignant</option>
                <option value="superviseur">Superviseur</option>
                <!-- <option value="directeur">Directeur</option> -->
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700"
                >Actif</label
              >
              <select
                v-model="editingUser.est_actif"
                class="w-full p-2 border rounded"
                required
              >
                <option :value="true">Oui</option>
                <option :value="false">Non</option>
              </select>
            </div>
            <button
              type="submit"
              class="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Enregistrer
            </button>
            <button
              @click="editingUser = null"
              class="ml-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Annuler
            </button>
          </form>
        </div>
        <!-- </div>
    <button @click="logout" class="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600">Déconnexion</button>
  </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import api from "../api";

import SidebarItem from "./SidebarItem.vue";

import { startSessionTimer, stopSessionTimer } from "../utils/session";

import {
  UsersIcon,
  AcademicCapIcon,
  UserPlusIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  ArrowLeftStartOnRectangleIcon,
  ClockIcon, // ← pour "en attente"
  PencilSquareIcon,
  UserGroupIcon,
  UserIcon,
  PlusCircleIcon,
  RectangleGroupIcon,
  LinkIcon,
  PlusIcon,
} from "@heroicons/vue/24/outline";

export default {
  name: "AdminNotifications",

  components: {
    SidebarItem,
    ArrowLeftStartOnRectangleIcon,
    ClockIcon,
    PencilSquareIcon,
    UserGroupIcon,
    UserIcon,
    PlusCircleIcon,
    RectangleGroupIcon,
    LinkIcon,
    PlusIcon,
  },

  data() {
    return {
      user: JSON.parse(localStorage.getItem("user")) || {
        nom: "",
        prenoms: "",
        role: "",
      },
      users: [],
      pendingUsers: [],
      editingUser: null,
      usersLoaded: false,
      usersFetched: false,
      selectedFile: null,
      importResult: "",
      importDetails: "",
      importSuccess: false,
      classes: [],
      disciplines: [],

      activeClassTab: null,
      activeAffectationTab: null,
      activeUserTab: null, // null = aucun tableau affiché par défaut

      isCollapsed: false,
      showSidebar: window.innerWidth >= 768,
      activeSection: "accueil",

      // ✅ Définition centralisée du menu
      menuItems: [
        {
          section: "users",
          label: "Gestion des utilisateurs",
          icon: UsersIcon,
          badge: null,
        },
        {
          section: "classes",
          label: "Gestion des classes",
          icon: AcademicCapIcon,
          badge: null,
        },
        {
          section: "affectations",
          label: "Gestion des affectations",
          icon: UserPlusIcon,
          badge: null,
        },
        {
          section: "progression",
          label: "Progression globale",
          icon: ChartBarIcon,
          badge: null,
        },
        {
          section: "consulter-entrees",
          label: "Consulter les entrées",
          icon: ClipboardDocumentListIcon,
          badge: null,
        },
        {
          section: "notifications",
          label: "Notifications",
          icon: BellIcon,
          badge: null,
        },
      ],

      showAddClass: false,
      showEditClass: false,
      newClass: { nom: "", promotion: "6e", niveau: "" },
      showAddDiscipline: false,
      showEditDiscipline: false,
      newDiscipline: {
        nom: "PCT",
        classe_id: null,
        coefficient: 1.0,
        heures_par_semaine: 4,
      },
      newAffectation: {
        enseignantId: null,
        classeId: null,
        disciplineNom: "",
        coefficient: 1.0,
        heuresParSemaine: 4,
      },
      affectations: [],
      enseignants: [],
      showNewAffectationForm: false,
      showAffectationsList: false,
      editingAffectation: null,
      editAffectationForm: {
        enseignantId: null,
        classeId: null,
        disciplineNom: "",
        coefficient: 1.0,
        heuresParSemaine: 4,
        disciplineId: null,
      },
      matieresDisponibles: [
        "PCT",
        "Mathématiques",
        "SVT",
        "Histoire-Géographie",
        "Français",
        "Anglais",
        "Lecture",
        "Communication écrite",
        "Philosophie",
      ],
      progressionClasses: [],
      expandedClasses: {},
      selectedDiscipline: null,
      disciplineDetails: null,
      showHistory: {},
      showDeleted: false,
      progressionLoading: false,
      // activeSection: 'users',
      // DONNÉES pour consulter les entrées
      filtreEntreesClasse: "",
      filtreEntreesDiscipline: "",
      filtreEntreesEnseignant: "",
      toutesLesEntrees: [],
      chargementEntrees: false,
      showHistoriqueModal: false,
      historiqueEntree: [],
      historiqueEntreeId: null,
      // Données pour les notifications
      notifications: [],
      stats: {},
      enseignants: [],
      modifications: [],
      chargement: false,
      envoi: false,
      showModal: false,
      typeEnvoi: "",
      filtreCategorie: "",
      filtreType: "",

      // Pour envoi personnalisé
      enseignantsCibles: [],
      titrePersonnalise: "",
      messagePersonnalise: "",
    };
  },

  // SECTION COMPUTED
  computed: {
    // Exemple : filtrer les demandes par champ

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

    disciplinesUniques() {
      const disciplines = new Set();
      this.disciplines.forEach((d) => disciplines.add(d.nom));
      return Array.from(disciplines).sort();
    },

    entreesFiltrees() {
      let filtered = this.toutesLesEntrees;

      if (this.filtreEntreesClasse) {
        filtered = filtered.filter(
          (e) => e.discipline?.classe_id === parseInt(this.filtreEntreesClasse),
        );
      }

      if (this.filtreEntreesDiscipline) {
        filtered = filtered.filter(
          (e) => e.discipline?.nom === this.filtreEntreesDiscipline,
        );
      }

      if (this.filtreEntreesEnseignant) {
        filtered = filtered.filter(
          (e) => e.teacher_id === parseInt(this.filtreEntreesEnseignant),
        );
      }

      return filtered;
    },

    modalTitre() {
      const titres = {
        tous: "📧 Envoyer à tous les enseignants",
        retard_excessif: "⚠️ Envoyer aux enseignants en situation critique",
        personnalisé: "✉️ Message personnalisé",
      };
      return titres[this.typeEnvoi] || "";
    },

    peutEnvoyer() {
      if (this.typeEnvoi === "personnalisé") {
        return (
          this.enseignantsCibles.length > 0 &&
          this.titrePersonnalise.trim().length > 0 &&
          this.messagePersonnalise.trim().length > 0
        );
      }
      return true;
    },
  },

  async created() {
    try {
      const response = await api.get("/users/me");
      this.user = response.data;
      console.log(this.user.role_id, typeof this.user.role_id);
      if (this.user.role_id === 1) {
        this.activeSection = this.$route.query.section || "accueil";
        await this.fetchUsers();
        await this.fetchClasses();
        await this.fetchDisciplines();
        await this.fetchEnseignants();
        await this.fetchAffectations();
        await this.fetchProgressionOverview();
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error.response?.data);
      this.$router.push("/login");
    }
  },

  async mounted() {
    startSessionTimer(); // ✅ démarre le compte à rebours dès l'ouverture

    await Promise.all([
      this.chargerNotifications(),
      this.chargerStatistiques(),
      this.chargerEnseignants(),
      this.chargerModifications(),
      this.chargerPendingUsers(),
    ]);
  },

  beforeUnmount() {
    stopSessionTimer(); // ✅ nettoyage quand on quitte le composant
  },

  methods: {
    async fetchUsers() {
      try {
        const response = await api.get("/users");
        this.users = response.data;
        this.usersLoaded = true;
        this.usersFetched = true;
      } catch (error) {
        console.error("Erreur liste utilisateurs:", error.response?.data);
        this.usersFetched = true;
      }
    },

    async chargerPendingUsers() {
      try {
        // Comptes inactifs
        // const resInactifs = await api.get('/users?est_actif=false');

        // Comptes jamais validés
        const resNonValides = await api.get("/users?est_valide=false");

        this.pendingUsers = [
          // ...resInactifs.data,
          ...resNonValides.data,
        ];
      } catch (error) {
        console.error("Erreur chargement comptes en attente:", error);
      }
    },
    async activer(id) {
      await api.post(`/users/${id}/activate`);
      this.pendingUsers = this.pendingUsers.filter((u) => u.id !== id);
      if (this.usersLoaded) await this.fetchUsers(); // sync la liste principale
    },

    startEditing(user) {
      this.editingUser = { ...user };
    },

    async editUser() {
      try {
        await api.put(`/users/${this.editingUser.id}`, this.editingUser);
        alert("Utilisateur mis à jour");
        this.editingUser = null;
        this.fetchUsers();
      } catch (error) {
        console.error("Erreur mise à jour:", error.response?.data);
      }
    },

    async deleteUser(id) {
      if (confirm("Confirmer la suppression ?")) {
        try {
          await api.delete(`/users/${id}`);
          alert("Utilisateur supprimé");
          this.users = this.users.filter((user) => user.id !== id);
        } catch (error) {
          console.error("Erreur suppression:", error.response?.data);
        }
      }
    },

    async chargerModifications() {
      try {
        const res = await api.get("/user-modifications");
        this.modifications = res.data;
      } catch (error) {
        console.error("Erreur chargement demandes:", error);
      }
    },

    async valider(id) {
      try {
        await api.post(`/user-modifications/${id}/validate`);
        this.modifications = this.modifications.filter((m) => m.id !== id);
        alert("Modification validée");
      } catch (error) {
        console.error("Erreur validation:", error);
      }
    },
    async refuser(id) {
      try {
        await api.post(`/user-modifications/${id}/reject`, {
          commentaire: "Refusé par l’admin",
        });
        this.modifications = this.modifications.filter((m) => m.id !== id);
        alert("Modification refusée");
      } catch (error) {
        console.error("Erreur refus:", error);
      }
    },

    async toggleActivation(user) {
      try {
        if (user.est_actif) {
          // Désactiver
          await api.post(`/users/${user.id}/deactivate`);

          alert("Utilisateur désactivé avec succès");
        } else {
          // Activer
          await api.post(`/users/${user.id}/activate`);

          alert("Utilisateur activé avec succès");
        }
        // Rafraîchir la liste des utilisateurs
        await this.fetchUsers();
      } catch (error) {
        console.error("Erreur activation/désactivation:", error);
      }
    },

    async fetchClasses() {
      try {
        const response = await api.get("/cahier/classes");
        this.classes = response.data;
      } catch (error) {
        console.error("Erreur récupération classes:", error);
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

    async fetchEnseignants() {
      try {
        const response = await api.get("/cahier/enseignants");
        this.enseignants = response.data;
      } catch (error) {
        console.error("Erreur chargement enseignants:", error);
      }
    },

    async fetchAffectations() {
      try {
        const response = await api.get("/cahier/affectations");
        this.affectations = response.data;
      } catch (error) {
        console.error("Erreur chargement affectations:", error);
      }
    },

    async fetchProgressionOverview() {
      this.progressionLoading = true;
      try {
        const response = await api.get("/progressionAdmin/admin/overview");
        this.progressionClasses = response.data;
      } catch (error) {
        console.error("Erreur chargement progression:", error);
      } finally {
        this.progressionLoading = false;
      }
    },

    async fetchDisciplineDetails(disciplineId) {
      try {
        const response = await api.get(
          `/progressionAdmin/admin/discipline/${disciplineId}`,
        );
        this.disciplineDetails = response.data;
      } catch (error) {
        console.error("Erreur détails discipline:", error);
      }
    },

    toggleProgressionClass(classId) {
      this.expandedClasses = {
        ...this.expandedClasses,
        [classId]: !this.expandedClasses[classId],
      };
    },

    selectDiscipline(discipline) {
      this.selectedDiscipline = discipline;
      this.fetchDisciplineDetails(discipline.id);
    },

    getProgressColor(progress) {
      if (progress >= 75) return "text-green-600 bg-green-100";
      if (progress >= 50) return "text-yellow-600 bg-yellow-100";
      if (progress >= 25) return "text-orange-600 bg-orange-100";
      return "text-red-600 bg-red-100";
    },

    toggleEntryHistory(entryId) {
      this.showHistory = {
        ...this.showHistory,
        [entryId]: !this.showHistory[entryId],
      };
    },

    getClassName(classId) {
      const classe = this.classes.find((c) => c.id === classId);
      return classe ? classe.nom : "Inconnue";
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

    onFileChange(event) {
      this.selectedFile = event.target.files[0];
    },

    async handleImport() {
      if (!this.selectedFile) {
        this.importResult = "Veuillez sélectionner un fichier PDF.";
        this.importSuccess = false;
        return;
      }
      const formData = new FormData();
      formData.append("pdf", this.selectedFile);
      try {
        const response = await api.post("/programs/import", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.importResult = `Importation réussie ! ${response.data.insertedCount} entrées insérées.`;
        this.importSuccess = true;
        this.importDetails = JSON.stringify(response.data.entries, null, 2);
      } catch (error) {
        this.importResult = `Erreur : ${error.response?.data?.error || error.message}`;
        this.importSuccess = false;
        this.importDetails = JSON.stringify(
          error.response?.data?.debugInfo,
          null,
          2,
        );
      }
    },

    async addClass() {
      try {
        await api.post("/cahier/classes", this.newClass);
        this.fetchClasses();
        this.showAddClass = false;
        this.newClass = { nom: "", promotion: "6e", niveau: "" };
      } catch (error) {
        console.error("Erreur ajout classe:", error);
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
        this.newClass = { nom: "", promotion: "6e", niveau: "" };
      } catch (error) {
        console.error("Erreur mise à jour classe:", error);
      }
    },

    async deleteClass(id) {
      if (confirm("Confirmer la suppression ?")) {
        try {
          await api.delete(`/cahier/classes/${id}`);
          this.fetchClasses();
        } catch (error) {
          console.error("Erreur suppression classe:", error);
        }
      }
    },

    cancelClassEdit() {
      this.showAddClass = false;
      this.showEditClass = false;
      this.newClass = { nom: "", promotion: "6e", niveau: "" };
    },

    async addDiscipline() {
      try {
        await api.post("/cahier/disciplines", this.newDiscipline);
        this.fetchDisciplines();
        this.showAddDiscipline = false;
        this.newDiscipline = {
          nom: "PCT",
          classe_id: null,
          coefficient: 1.0,
          heures_par_semaine: 4,
        };
      } catch (error) {
        console.error("Erreur ajout discipline:", error);
      }
    },

    editDiscipline(discipline) {
      this.newDiscipline = { ...discipline };
      this.showEditDiscipline = true;
      this.showAddDiscipline = false;
    },

    async updateDiscipline() {
      try {
        await api.put(
          `/cahier/disciplines/${this.newDiscipline.id}`,
          this.newDiscipline,
        );
        this.fetchDisciplines();
        this.showEditDiscipline = false;
        this.newDiscipline = {
          nom: "PCT",
          classe_id: null,
          coefficient: 1.0,
          heures_par_semaine: 4,
        };
      } catch (error) {
        console.error("Erreur mise à jour discipline:", error);
      }
    },

    async deleteDiscipline(id) {
      if (confirm("Confirmer la suppression ?")) {
        try {
          await api.delete(`/cahier/disciplines/${id}`);
          this.fetchDisciplines();
        } catch (error) {
          console.error("Erreur suppression discipline:", error);
        }
      }
    },

    cancelDisciplineEdit() {
      this.showAddDiscipline = false;
      this.showEditDiscipline = false;
      this.newDiscipline = {
        nom: "PCT",
        classe_id: null,
        coefficient: 1.0,
        heures_par_semaine: 4,
      };
    },

    async createAffectation() {
      try {
        await api.post("/cahier/affectations", {
          enseignant_id: this.newAffectation.enseignantId,
          classe_id: this.newAffectation.classeId,
          discipline_nom: this.newAffectation.disciplineNom,
          coefficient: this.newAffectation.coefficient,
          heures_par_semaine: this.newAffectation.heuresParSemaine,
        });
        alert("Affectation créée avec succès !");
        this.resetAffectationForm();
        this.showNewAffectationForm = false;
        await this.fetchAffectations();
      } catch (error) {
        alert(
          "Erreur : " +
            (error.response?.data?.error || error.message || "Inconnu"),
        );
        console.error("Erreur création affectation:", error);
      }
    },

    cancelNewAffectation() {
      this.resetAffectationForm();
      this.showNewAffectationForm = false;
    },

    resetAffectationForm() {
      this.newAffectation = {
        enseignantId: null,
        classeId: null,
        disciplineNom: "",
        coefficient: 1.0,
        heuresParSemaine: 4,
      };
    },

    startEditAffectation(affectation) {
      if (!affectation) {
        alert("Affectation invalide");
        return;
      }

      if (!affectation.User) {
        alert("Enseignant non trouvé pour cette affectation");
        console.error("Affectation sans User:", affectation);
        return;
      }

      if (!affectation.Discipline) {
        alert("Discipline non trouvée pour cette affectation");
        console.error("Affectation sans Discipline:", affectation);
        return;
      }

      this.editingAffectation = affectation.id;
      this.editAffectationForm = {
        enseignantId: affectation.User.id,
        classeId: affectation.Discipline.classe_id,
        disciplineNom: affectation.Discipline.nom,
        coefficient: affectation.Discipline.coefficient || 1.0,
        heuresParSemaine: affectation.Discipline.heures_par_semaine || 4,
        disciplineId: affectation.Discipline.id,
      };
    },

    async updateAffectation(affectation) {
      if (!this.editingAffectation) {
        alert("Aucune affectation en cours de modification");
        return;
      }

      if (!affectation || !affectation.Discipline) {
        alert("Données d'affectation incomplètes");
        return;
      }

      try {
        const {
          classeId,
          disciplineNom,
          coefficient,
          heuresParSemaine,
          enseignantId,
          disciplineId,
        } = this.editAffectationForm;

        await api.put(`/cahier/disciplines/${disciplineId}`, {
          nom: disciplineNom,
          classe_id: classeId,
          coefficient,
          heures_par_semaine: heuresParSemaine,
        });

        await api.put(`/cahier/affectations/${this.editingAffectation}`, {
          enseignant_id: enseignantId,
          discipline_id: disciplineId,
        });

        alert("Affectation modifiée avec succès !");
        this.cancelEdit();
        await this.fetchAffectations();
      } catch (error) {
        console.error("Erreur mise à jour affectation:", error);
        console.error("Détails:", error.response?.data);
        alert(
          `Erreur : ${error.response?.data?.error || error.message || "Erreur inconnue"}`,
        );
      }
    },

    cancelEdit() {
      this.editingAffectation = null;
      this.editAffectationForm = {
        enseignantId: null,
        classeId: null,
        disciplineNom: "",
        coefficient: 1.0,
        heuresParSemaine: 4,
        disciplineId: null,
      };
    },

    async deleteAffectation(id) {
      if (!confirm("Êtes-vous sûr de vouloir supprimer cette affectation ?")) {
        return;
      }

      try {
        await api.delete(`/cahier/affectations/${id}`);
        alert("Affectation supprimée avec succès");
        this.affectations = this.affectations.filter((a) => a.id !== id);
      } catch (error) {
        console.error("Erreur suppression affectation:", error);
        alert(
          "Erreur lors de la suppression : " +
            (error.response?.data?.error || error.message),
        );
      }
    },

    //  MÉTHODES pour consulter les entrées
    async chargerToutesLesEntrees() {
      this.chargementEntrees = true;
      try {
        const response = await api.get("/cahier/toutes-les-entrees-admin");
        this.toutesLesEntrees = response.data;
        console.log(`✅ ${this.toutesLesEntrees.length} entrée(s) chargée(s)`);
      } catch (error) {
        console.error("Erreur chargement entrées:", error);
        alert("Erreur lors du chargement des entrées");
      } finally {
        this.chargementEntrees = false;
      }
    },

    filtrerEntrees() {
      // La filtration est automatique via le computed entreesFiltrees
      console.log(
        `Filtres appliqués: ${this.entreesFiltrees.length} résultat(s)`,
      );
    },

    async voirHistoriqueEntree(entryId) {
      try {
        const response = await api.get(
          `/cahier/cahier-entries/${entryId}/history`,
        );
        this.historiqueEntree = response.data;
        this.historiqueEntreeId = entryId;
        this.showHistoriqueModal = true;
      } catch (error) {
        console.error("Erreur chargement historique:", error);
        alert("Erreur lors du chargement de l'historique");
      }
    },

    async supprimerEntreeAdmin(entryId) {
      if (
        !confirm(
          "⚠️ Êtes-vous sûr de vouloir supprimer cette entrée ?\n\nCette action est irréversible.",
        )
      ) {
        return;
      }

      try {
        await api.delete(`/cahier/cahier-entries/${entryId}`);
        alert("✅ Entrée supprimée avec succès");
        await this.chargerToutesLesEntrees();
      } catch (error) {
        console.error("Erreur suppression:", error);
        alert("❌ Erreur lors de la suppression");
      }
    },

    async chargerNotifications() {
      try {
        this.chargement = true;
        const params = {
          limit: 100,
          offset: 0,
        };

        if (this.filtreCategorie) params.categorie = this.filtreCategorie;

        const response = await api.get("/notifications/admin/toutes", {
          params,
        });
        this.notifications = response.data.notifications;
      } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur lors du chargement");
      } finally {
        this.chargement = false;
      }
    },

    async chargerStatistiques() {
      try {
        const response = await api.get("/notifications/statistiques");
        this.stats = response.data;
      } catch (error) {
        console.error("Erreur stats:", error);
      }
    },

    async chargerEnseignants() {
      try {
        const response = await api.get("/users"); //
        this.enseignants = response.data.filter(
          (u) => parseInt(u.role_id) === 2,
        );
      } catch (error) {
        console.error("Erreur enseignants:", error);
      }
    },

    ouvrirModalEnvoi(type) {
      this.typeEnvoi = type;
      this.showModal = true;
      this.resetForm();
    },

    fermerModal() {
      this.showModal = false;
      this.resetForm();
    },

    resetForm() {
      this.enseignantsCibles = [];
      this.titrePersonnalise = "";
      this.messagePersonnalise = "";
    },

    getDescriptionTypeEnvoi() {
      const descriptions = {
        tous: "Une notification sera envoyée à TOUS les enseignants. Chacun recevra une analyse personnalisée de sa progression avec recommandations adaptées.",
        retard_excessif:
          "Seuls les enseignants détectés en retard important (>14 jours) ou en avance excessive (>21 jours) recevront une notification.",
      };
      return descriptions[this.typeEnvoi] || "";
    },

    async confirmerEnvoi() {
      if (!confirm("Êtes-vous sûr de vouloir envoyer ces notifications ?")) {
        return;
      }

      try {
        this.envoi = true;

        const payload = {
          type_envoi: this.typeEnvoi,
        };

        if (this.typeEnvoi === "personnalisé") {
          payload.enseignants_cibles = this.enseignantsCibles;
          payload.titre_personnalise = this.titrePersonnalise;
          payload.message_personnalise = this.messagePersonnalise;
        }

        const response = await api.post(
          "/notifications/admin/envoyer",
          payload,
        );

        alert(
          `✅ ${response.data.nombre_notifications} notification(s) envoyée(s) avec succès !`,
        );

        this.fermerModal();
        await this.chargerNotifications();
        await this.chargerStatistiques();
      } catch (error) {
        console.error("Erreur envoi:", error);
        alert("Erreur: " + (error.response?.data?.error || error.message));
      } finally {
        this.envoi = false;
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
      const labels = {
        felicitations: "🎉 Félicitations",
        encouragement: "💪 Encouragement",
        avertissement: "⚠️ Avertissement",
        alerte: "🚨 Alerte",
        critique: "🔴 Critique",
        avance_excessive: "⚡ Avance excessive",
        info: "ℹ️ Info",
      };
      return labels[categorie] || categorie;
    },

    getTypeLabel(type) {
      const labels = {
        auto_progression: "🤖 Auto",
        admin_global: "👨‍💼 Admin (tous)",
        admin_ciblée: "🎯 Admin (ciblée)",
        admin_personnalisée: "✉️ Personnalisée",
      };
      return labels[type] || type;
    },

    formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
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
.delay-600 {
  animation-delay: 0.6s;
}
.delay-700 {
  animation-delay: 0.7s;
}
.delay-800 {
  animation-delay: 0.8s;
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
