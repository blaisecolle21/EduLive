<template>
  <div class="p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
    <h3 class="text-lg font-semibold mb-4">
      {{
        entryToEdit
          ? isResubmit
            ? "Corriger et resoumettre"
            : "Modifier l'entrée"
          : "Ajouter une entrée"
      }}
    </h3>

    <div
      v-if="entryToEdit?.commentaire_rejet"
      class="bg-red-50 border border-red-300 rounded p-3 mb-4"
    >
      <p class="text-sm font-semibold text-red-700">
        Commentaire de rejet de l'enseignant :
      </p>
      <p class="text-sm text-red-600 mt-1">
        {{ entryToEdit.commentaire_rejet }}
      </p>
    </div>

    <form @submit.prevent="submit" class="space-y-4">
      <!-- Discipline : fixe (responsable) ou sélectionnable (enseignant) -->
      <div v-if="!fixedDiscipline">
        <label class="block text-sm font-medium text-gray-700">
          Discipline <span class="text-red-500">*</span>
        </label>
        <select
          v-model="newEntry.disciplineId"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          required
          @change="onDisciplineChange"
        >
          <option value="" disabled>-- Sélectionnez une discipline --</option>
          <option v-for="d in disciplines" :key="d.id" :value="d.id">
            {{ d.nom }}
          </option>
        </select>
      </div>
      <div v-else class="bg-teal-50 p-3 rounded-lg">
        <p class="text-sm text-gray-700">
          Discipline :
          <span class="font-semibold text-teal-700">{{
            fixedDiscipline.nom
          }}</span>
        </p>
      </div>

      <!-- SA -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          Numéro de SA <span class="text-red-500">*</span>
        </label>
        <select
          v-model="newEntry.saNumber"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          required
          @change="onSaNumberChange"
        >
          <option value="" disabled>-- Sélectionnez une SA --</option>
          <option v-for="n in 6" :key="n" :value="'SA' + n">SA {{ n }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700"
          >Nom de SA :</label
        >
        <input
          v-model="newEntry.saName"
          type="text"
          class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          required
        />
      </div>

      <!-- Activités -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Activités <span class="text-red-500">*</span>
        </label>

        <div v-if="loadingActivites" class="mt-2 text-sm text-gray-600">
          🔄 Chargement des activités depuis le programme théorique...
        </div>

        <div
          v-else-if="
            !availableActivites.length &&
            newEntry.disciplineId &&
            newEntry.saNumber
          "
          class="mt-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded"
        >
          <p class="text-sm">
            ⚠️ Aucune activité trouvée dans le programme théorique pour cette
            SA.
          </p>
        </div>

        <div v-else-if="availableActivites.length > 0" class="mt-2 space-y-2">
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm text-gray-600">
              📚 {{ availableActivites.length }} activité(s) disponible(s)
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
              <label
                class="flex items-start space-x-2 cursor-pointer hover:bg-blue-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  :value="activite"
                  v-model="selectedActivites"
                  class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span class="text-sm text-gray-700 flex-1">{{ activite }}</span>
              </label>

              <div
                v-if="selectedActivites.includes(activite)"
                class="mt-2 ml-6 flex space-x-2"
              >
                <button
                  type="button"
                  @click="activitesStatus[activite] = 'en_cours'"
                  :class="
                    activitesStatus[activite] === 'en_cours'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  "
                  class="px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition"
                >
                  🔄 En cours
                </button>
                <button
                  type="button"
                  @click="activitesStatus[activite] = 'fait'"
                  :class="
                    activitesStatus[activite] === 'fait'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  "
                  class="px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition"
                >
                  ✅ Fait
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3">
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Activités manuelles (optionnel)</label
          >
          <textarea
            v-model="manualActivites"
            rows="3"
            class="block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="Une activité par ligne..."
          ></textarea>
        </div>
      </div>

      <!-- Contenu -->
      <div>
        <label class="block text-sm font-medium text-gray-700">
          Contenu du cours <span class="text-red-500">*</span>
        </label>
        <div class="mt-1 border border-gray-300 rounded-md">
          <menu-bar
            v-if="editor"
            :editor="editor"
            class="border-b border-gray-300 p-2 bg-gray-50"
          ></menu-bar>
          <editor-content
            v-if="editor"
            :editor="editor"
            class="p-3 min-h-[200px]"
          ></editor-content>
        </div>
      </div>

      <!-- Horaires -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Heure de début <span class="text-red-500">*</span></label
          >
          <input
            v-model="newEntry.heureDebut"
            type="time"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Heure de fin <span class="text-red-500">*</span></label
          >
          <input
            v-model="newEntry.heureFin"
            type="time"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Date <span class="text-red-500">*</span></label
          >
          <input
            v-model="newEntry.dateCours"
            type="date"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
            @change="calculatePeriod"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Trimestre <span class="text-red-500">*</span></label
          >
          <select
            v-model="newEntry.trimestre"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            required
          >
            <option value="1er">1er</option>
            <option value="2e">2e</option>
            <option value="3e">3e</option>
          </select>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
        <button
          type="submit"
          class="w-full sm:w-auto bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          :disabled="!isFormValid || submitting"
        >
          {{ submitting ? "Envoi..." : buttonLabel }}
        </button>
        <button
          type="button"
          @click="$emit('cancel')"
          class="w-full sm:w-auto bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Annuler
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import api from "../api";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import MenuBar from "./MenuBar.vue";

export default {
  name: "CahierEntryForm",
  components: { EditorContent, MenuBar },
  props: {
    classeId: { type: [Number, String], required: true },
    disciplines: { type: Array, default: () => [] }, // utilisé si pas de fixedDiscipline
    fixedDiscipline: { type: Object, default: null }, // { id, nom } - cas responsable
    mode: { type: String, default: "direct" }, // 'direct' (enseignant) | 'submit' (responsable)
    currentUserId: { type: [Number, String], required: true },
    targetTeacherId: { type: [Number, String], default: null }, // requis en mode 'submit'
    entryToEdit: { type: Object, default: null },
    isResubmit: { type: Boolean, default: false },
  },
  emits: ["success", "cancel"],
  data() {
    return {
      newEntry: {
        disciplineId: this.fixedDiscipline?.id || "",
        saNumber: "",
        saName: "",
        contenu: "",
        heureDebut: "",
        heureFin: "",
        dateCours: "",
        trimestre: "1er",
        mois: "",
        semaineNumero: null,
      },
      availableActivites: [],
      selectedActivites: [],
      manualActivites: "",
      activitesStatus: {},
      loadingActivites: false,
      submitting: false,
      editor: null,
    };
  },
  computed: {
    buttonLabel() {
      if (this.isResubmit) return "🔄 Resoumettre";
      return this.mode === "submit"
        ? "📨 Soumettre à l'enseignant"
        : "➕ Ajouter";
    },
    finalActivites() {
      const combined = [...this.selectedActivites];
      if (this.manualActivites.trim()) {
        combined.push(
          ...this.manualActivites
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l),
        );
      }
      return combined.join("\n");
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
    pourcentageRealise() {
      const total = Object.keys(this.activitesStatus).length;
      if (total === 0) return 0;
      const faites = Object.values(this.activitesStatus).filter(
        (s) => s === "fait",
      ).length;
      return Math.round((faites / total) * 100);
    },
    disciplineNom() {
      if (this.fixedDiscipline) return this.fixedDiscipline.nom;
      const d = this.disciplines.find(
        (d) => d.id === this.newEntry.disciplineId,
      );
      return d?.nom || "";
    },
  },
  created() {
    this.editor = useEditor({
      content: this.entryToEdit?.contenu || "",
      extensions: [StarterKit],
      onUpdate: ({ editor }) => {
        this.newEntry.contenu = editor.getHTML();
      },
    });
    this.newEntry.contenu = this.entryToEdit?.contenu || "";

    if (this.entryToEdit) {
      this.prefillFromEntry();
    }
  },
  beforeUnmount() {
    if (this.editor) this.editor.destroy();
  },
  methods: {
    async prefillFromEntry() {
      const e = this.entryToEdit;
      this.newEntry = {
        disciplineId: e.discipline_id,
        saNumber: e.sa_number,
        saName: e.sa_name,
        contenu: e.contenu,
        heureDebut: e.heure_debut,
        heureFin: e.heure_fin,
        dateCours: e.date_cours,
        trimestre: e.trimestre,
        mois: e.mois,
        semaineNumero: e.semaine_numero,
      };
      this.activitesStatus = e.activites_status || {};
      await this.loadActivitesFromProgramme();

      if (e.activites) {
        const existing = e.activites.split("\n").map((a) => a.trim());
        this.selectedActivites = this.availableActivites.filter((a) =>
          existing.includes(a),
        );
        const notFound = existing.filter(
          (a) => !this.availableActivites.includes(a),
        );
        if (notFound.length) this.manualActivites = notFound.join("\n");
      }
    },
    async onDisciplineChange() {
      this.availableActivites = [];
      this.selectedActivites = [];
      if (this.newEntry.saNumber) await this.loadActivitesFromProgramme();
    },
    async onSaNumberChange() {
      this.availableActivites = [];
      this.selectedActivites = [];
      if (this.newEntry.disciplineId && this.newEntry.saNumber)
        await this.loadActivitesFromProgramme();
    },
    async loadActivitesFromProgramme() {
      if (
        !this.classeId ||
        !this.newEntry.disciplineId ||
        !this.newEntry.saNumber
      )
        return;
      try {
        this.loadingActivites = true;
        const response = await api.get("/cahier/programme-lots", {
          params: {
            classe_id: this.classeId,
            discipline_id: this.newEntry.disciplineId,
            discipline_nom: this.disciplineNom,
            sa_number: this.newEntry.saNumber,
          },
        });
        const activitesDisponibles = [];
        response.data.lots.forEach((lot) => {
          if (!lot.estComplet)
            activitesDisponibles.push(...lot.activitesDisponibles);
        });
        this.availableActivites = activitesDisponibles;
        if (response.data.saName && !this.newEntry.saName) {
          this.newEntry.saName = response.data.saName;
        }
      } catch (error) {
        console.error("Erreur chargement activités:", error);
      } finally {
        this.loadingActivites = false;
      }
    },
    calculatePeriod() {
      if (!this.newEntry.dateCours) return;
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
    },
    async submit() {
      if (!this.isFormValid) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }
      this.submitting = true;
      try {
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
          annee_scolaire: "2025-2026",
        };

        let response;
        if (this.isResubmit && this.entryToEdit) {
          response = await api.put(
            `/cahier/cahier-entries/${this.entryToEdit.id}/resoumettre`,
            entryData,
          );
        } else if (this.mode === "submit") {
          entryData.teacher_id = this.targetTeacherId;
          response = await api.post("/cahier/cahier-entries", entryData);
        } else {
          entryData.teacher_id = this.currentUserId;
          if (this.entryToEdit) {
            response = await api.put(
              `/cahier/cahier-entries/${this.entryToEdit.id}`,
              entryData,
            );
          } else {
            response = await api.post("/cahier/cahier-entries", entryData);
          }
        }

        this.$emit("success", response.data);
      } catch (error) {
        console.error("Erreur soumission fiche:", error);
        alert("Erreur : " + (error.response?.data?.error || error.message));
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
