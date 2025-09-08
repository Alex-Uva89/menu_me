<!-- src/components/menu/ViewToggleFab.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  view: { type: String, default: 'list' }, // 'list' | 'cards'
  // etichette usate solo per aria-label e tooltip
  listLabel:  { type: String, default: 'Lista' },
  cardsLabel: { type: String, default: 'Cards' },
  color: { type: String, default: 'primary' },   // colore attivo
  textColor: { type: String, default: 'white' }, // testo icona attiva
  size: { type: String, default: 'md' },         // 'xs'|'sm'|'md'|'lg'|'xl'
  dense: { type: Boolean, default: true },
  showTooltips: { type: Boolean, default: true } // tooltip su hover
})

const emit = defineEmits(['update:view'])

function setView(v) {
  if (v !== props.view) emit('update:view', v)
}

const isList  = computed(() => props.view === 'list')
const isCards = computed(() => props.view === 'cards')
</script>

<template>
  <div class="floating-toggle">
    <q-btn-group rounded unelevated>
      <q-btn
        :dense="dense"
        :size="size"
        round
        icon="list"
        :color="isList ? color : 'white-9'"
        :text-color="isList ? textColor : 'grey-8'"
        :flat="!isList"
        :outline="!isList"
        @click="setView('list')"
        :aria-pressed="isList"
        :aria-label="listLabel"
      >
        <q-tooltip v-if="showTooltips" anchor="bottom middle" self="top middle">
          {{ listLabel }}
        </q-tooltip>
      </q-btn>

      <q-btn
        :dense="dense"
        :size="size"
        round
        icon="grid_view"
        :color="isCards ? color : 'grey-4'"
        :text-color="isCards ? textColor : 'grey-8'"
        :flat="!isCards"
        :outline="!isCards"
        @click="setView('cards')"
        :aria-pressed="isCards"
        :aria-label="cardsLabel"
      >
        <q-tooltip v-if="showTooltips" anchor="bottom middle" self="top middle">
          {{ cardsLabel }}
        </q-tooltip>
      </q-btn>
    </q-btn-group>
  </div>
</template>

<style scoped>
.floating-toggle{
  border-radius: 9999px;
  box-shadow: 0 0px 10px rgba(255, 255, 255, 0.562);
  background-color: rgb(255, 255, 255);
}
</style>
