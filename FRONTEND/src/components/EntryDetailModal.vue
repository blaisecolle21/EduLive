<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="$emit('close')"
  >
    <div
      class="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
    >
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">
            {{ entry.sa_number }} — {{ entry.sa_name }}
          </h3>
          <p class="text-sm text-gray-500">
            {{ entry.discipline?.nom }}
            <span v-if="entry.discipline?.Classe">
              • {{ entry.discipline.Classe.nom }}</span
            >
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <span
        class="inline-block text-xs px-2 py-1 rounded-full font-medium mb-4"
        :class="{
          'bg-yellow-100 text-yellow-700': entry.statut === 'en_attente',
          'bg-green-100 text-green-700': entry.statut === 'validee',
          'bg-red-100 text-red-700': entry.statut === 'rejetee',
        }"
      >
        {{ statutLabel(entry.statut) }}
      </span>

      <div class="space-y-3 text-sm">
        <div class="grid grid-cols-2 gap-3">
          <p>
            <strong>Date du cours :</strong> {{ formatDate(entry.date_cours) }}
          </p>
          <p>
            <strong>Horaire :</strong> {{ entry.heure_debut }} -
            {{ entry.heure_fin }}
          </p>
          <p><strong>Trimestre :</strong> {{ entry.trimestre }}</p>
          <p><strong>Mois :</strong> {{ entry.mois }}</p>
        </div>

        <div v-if="entry.teacher">
          <strong>Enseignant :</strong> {{ entry.teacher.prenoms }}
          {{ entry.teacher.nom }}
        </div>
        <div v-if="entry.soumetteur">
          <strong>Soumis par :</strong> {{ entry.soumetteur.prenoms }}
          {{ entry.soumetteur.nom }}
        </div>
        <div v-if="entry.validateur && entry.date_validation">
          <strong
            >{{
              entry.statut === "rejetee" ? "Traité par" : "Validé par"
            }}
            :</strong
          >
          {{ entry.validateur.prenoms }} {{ entry.validateur.nom }} le
          {{ formatDate(entry.date_validation) }}
        </div>

        <div>
          <strong>Activités :</strong>
          <ul class="list-disc list-inside mt-1 text-gray-700">
            <li v-for="(a, i) in activitesList" :key="i">
              {{ a }}
              <span
                v-if="entry.activites_status?.[a]"
                class="text-xs italic ml-1"
                :class="
                  entry.activites_status[a] === 'fait'
                    ? 'text-green-600'
                    : 'text-orange-600'
                "
              >
                ({{
                  entry.activites_status[a] === "fait" ? "Fait" : "En cours"
                }})
              </span>
            </li>
          </ul>
        </div>

        <div>
          <strong>Contenu du cours :</strong>
          <div
            class="mt-1 p-3 bg-gray-50 rounded-lg prose prose-sm max-w-none"
            v-html="entry.contenu"
          ></div>
        </div>

        <div
          v-if="entry.statut === 'rejetee' && entry.commentaire_rejet"
          class="bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <strong class="text-red-700">Commentaire de rejet :</strong>
          <p class="text-red-600 mt-1">{{ entry.commentaire_rejet }}</p>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          @click="$emit('close')"
          class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EntryDetailModal",
  props: {
    entry: { type: Object, required: true },
  },
  emits: ["close"],
  computed: {
    activitesList() {
      if (!this.entry.activites) return [];
      return this.entry.activites
        .split("\n")
        .map((a) => a.trim())
        .filter((a) => a);
    },
  },
  methods: {
    statutLabel(statut) {
      return (
        {
          en_attente: "⏳ En attente",
          validee: "✅ Validée",
          rejetee: "❌ Rejetée",
        }[statut] || statut
      );
    },
    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("fr-FR");
    },
  },
};
</script>
