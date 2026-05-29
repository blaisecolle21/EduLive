<template>
  <div class="menu-bar">
    <button
      v-for="command in commands"
      :key="command.name"
      @click="command.action"
      :class="{ 'is-active': command.isActive }"
      class="p-2 bg-gray-200 rounded hover:bg-gray-300 mr-1"
    >
      {{ command.icon }}
    </button>
  </div>
</template>

<script>
import { defineComponent, inject } from 'vue';

export default defineComponent({
  name: 'MenuBar',
  props: {
    editor: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const editor = inject('editor', props.editor);

    const commands = [
      {
        name: 'bold',
        icon: 'B',
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: () => editor.isActive('bold')
      },
      {
        name: 'italic',
        icon: 'I',
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: () => editor.isActive('italic')
      },
      {
        name: 'bulletList',
        icon: '•',
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: () => editor.isActive('bulletList')
      },
      {
        name: 'orderedList',
        icon: '1.',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: () => editor.isActive('orderedList')
      },
      // {
      //   name: 'heading1',
      //   icon: 'H1',
      //   action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      //   isActive: () => editor.isActive('heading', { level: 1 })
      // },
      // {
      //   name: 'paragraph',
      //   icon: 'P',
      //   action: () => editor.chain().focus().setParagraph().run(),
      //   isActive: () => editor.isActive('paragraph')
      // }
    ];

    return { commands };
  }
});
</script>

<style scoped>
.menu-bar {
  display: flex;
  gap: 5px;
  padding: 5px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.is-active {
  background-color: #4a90e2;
  color: white;
}
</style>