<!-- src/components/menu/ViewToggleFab.vue -->
<script setup>
import { ref } from 'vue'

defineProps({
  view: { type: String, default: 'list' }, // 'list' | 'cards'
  listLabel: { type: String, default: 'Lista' },
  cardsLabel: { type: String, default: 'Cards' },
  color: { type: String, default: 'primary' },
  textColor: { type: String, default: 'white' },

  // nuovo: apre verso sinistra (left) per default
  direction: { type: String, default: 'left' }, // 'up' | 'right' | 'down' | 'left'
  // nuovo: allineamento per direzioni orizzontali (left/right)
  horizontalAlign: { type: String, default: 'bottom' } // 'top' | 'center' | 'bottom'
})

const emit = defineEmits(['update:view', 'toggle'])
const open = ref(false)

function setView(v) {
  emit('update:view', v)
  open.value = false
}
</script>

<template>
  <q-fab
    v-model="open"
    :color="color"
    :text-color="textColor"
    icon="view_module"
    active-icon="close"
    glossy
    padding="xs"
    size="md"
    :direction="direction"
    :horizontal-actions-align="horizontalAlign"
    aria-label="Cambia vista"
    @click="emit('toggle', open)"
  >
    <q-fab-action
      :color="view === 'list' ? color : 'grey-6'"
      :text-color="textColor"
      icon="list"
      :label="listLabel"
      @click="setView('list')"
    />
    <q-fab-action
      :color="view === 'cards' ? color : 'grey-6'"
      :text-color="textColor"
      icon="grid_view"
      :label="cardsLabel"
      @click="setView('cards')"
    />
  </q-fab>
</template>
