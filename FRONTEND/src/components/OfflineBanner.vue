<template>
  <transition name="fade">
    <div
      v-if="!isServerReachable"
      class="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 text-sm font-medium z-[100]"
    >
      ⚠️ Hors ligne — vos modifications seront synchronisées à la reconnexion
    </div>
  </transition>
</template>

<script setup>
import { isServerReachable } from "../utils/connectivity";
</script>
