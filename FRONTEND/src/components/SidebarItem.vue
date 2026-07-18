<template>
  <button
    @click="$emit('click')"
    class="w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer group relative mb-1"
    :class="[
      active
        ? 'bg-teal-600 text-white shadow-sm'
        : 'text-gray-500 hover:bg-teal-50 hover:text-teal-700',
      collapsed ? 'justify-center px-2' : 'px-3',
    ]"
    :title="collapsed ? label : ''"
  >
    <span
      v-if="active && !collapsed"
      class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/40 rounded-r-full"
    />
    <component
      :is="icon"
      class="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110"
      :class="active ? 'bg-teal-600 text-white' : 'hover:bg-teal-50'"
    />
    <span
      v-if="!collapsed"
      class="text-sm font-medium whitespace-nowrap flex-1 text-left"
    >
      {{ label }}
    </span>
    <span
      v-if="badge && !collapsed"
      class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      :class="active ? 'bg-white/30 text-white' : 'bg-red-100 text-red-700'"
    >
      {{ badge }}
    </span>
    <span
      v-if="badge && collapsed"
      class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
    />
  </button>
</template>

<script>
export default {
  name: "SidebarItem",
  props: {
    icon: { type: [Object, Function], required: true },
    label: { type: String, required: true },
    active: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: false },
    badge: { type: [String, Number], default: null },
  },
  emits: ["click"],
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
