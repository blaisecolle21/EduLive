<template>
  <transition name="fade">
    <div
      v-if="!isServerReachable || pendingCount > 0"
      class="fixed top-0 left-0 right-0 text-white text-center py-2 text-sm font-medium z-[100]"
      :class="!isServerReachable ? 'bg-orange-500' : 'bg-blue-500'"
    >
      <template v-if="!isServerReachable">
        ⚠️ Hors ligne — vos modifications seront synchronisées à la reconnexion
        <span v-if="pendingCount > 0"> ({{ pendingCount }} en attente)</span>
      </template>
      <template v-else-if="syncing"> 🔄 Synchronisation en cours... </template>
      <template v-else-if="pendingCount > 0">
        ⏳ {{ pendingCount }} entrée(s) en attente de synchronisation
      </template>
    </div>
  </transition>
</template>

<script setup>
import {
  isServerReachable,
  pendingCount,
  syncing,
} from "../utils/connectivity";
</script>
