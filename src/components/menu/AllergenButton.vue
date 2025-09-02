<template>
  <div>
    <!-- Trigger -->
    <q-btn
      dense
      outline
      :color="selectedCount ? 'primary' : 'grey-8'"
      :aria-label="t('filterForAllergens')"
      @click="dialog = true"
    >
      <div class="row items-center no-wrap">
        <div class="row items-center no-wrap q-mr-sm" v-if="selectedCount">
          <q-avatar
            v-for="(icon, i) in shownIcons"
            :key="icon.value + i"
            size="30px"
            class="sel-ico"
            square
          >
            <img v-if="icon.type === 'img'" :src="icon.value" />
            <q-icon v-else :name="icon.value" />
          </q-avatar>
          <q-badge v-if="hiddenCount > 0" color="primary" class="q-ml-xs">+{{ hiddenCount }}</q-badge>
        </div>
        <q-icon v-else name="science" class="q-mr-xs" />
        <span>{{ $t('allergens') }}</span>
      </div>
    </q-btn>

    <!-- Dialog: bottom sheet su mobile -->
    <q-dialog v-model="dialog" persistent :position="isBottomSheet ? 'bottom' : void 0">
      <q-card class="filter-card">
        <q-card-section class="text-h6 q-pt-sm q-pb-sm">
          {{ $t('allergens') }}
        </q-card-section>

        <q-separator />

        <!-- Griglia allergeni mobile-first -->
        <q-card-section class="q-pt-md q-pb-none">
          <div class="allergen-grid">
            <q-btn
              v-for="a in options"
              :key="a.id"
              @click="() => toggle(a.id)"
              :flat="!localSelected.has(a.id)"
              :color="localSelected.has(a.id) ? chipColor(a) : 'grey-5'"
              :text-color="localSelected.has(a.id) ? 'white' : 'black'"
              class="allergen-btn"
              round
            >
              <q-avatar size="100%" class="chip-icon">
                <img v-if="a.iconUrl" :src="a.iconUrl" :alt="a.label" />
                <q-icon v-else-if="a.icon" :name="a.icon" />
              </q-avatar>
            </q-btn>
          </div>
        </q-card-section>

        <!-- Azioni -->
        <q-card-actions class="actions-wrap">
          <q-btn flat color="negative" icon="clear" :label="$t('clear')" @click="clear" />
          <q-space />
          <q-btn flat :label="$t('cancel')" @click="dialog = false" />
          <q-btn unelevated color="primary" icon="check" :label="$t('apply')" @click="applyAndClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'

const { t } = useI18n()
const $q = useQuasar()

const props = defineProps({
  selected: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:selected', 'apply', 'clear'])

const dialog = ref(false)
const isBottomSheet = computed(() => $q.screen.lt.md) // 👈 mobile-first

const localSelected = ref(new Set(props.selected))
watch(() => props.selected, val => {
  localSelected.value = new Set(val)
})

const selectedCount = computed(() => localSelected.value.size)

const selectedList = computed(() =>
  props.options.filter(o => localSelected.value.has(o.id))
)

const shownIcons = computed(() =>
  selectedList.value.slice(0, 4).map(o => {
    if (o.iconUrl) return { type: 'img', value: o.iconUrl }
    if (o.icon) return { type: 'icon', value: o.icon }
    return null
  }).filter(Boolean)
)

const hiddenCount = computed(() =>
  Math.max(0, selectedCount.value - shownIcons.value.length)
)

function toggle(id) {
  const newSet = new Set(localSelected.value)
  newSet.has(id) ? newSet.delete(id) : newSet.add(id)
  localSelected.value = newSet
}

function clear() {
  localSelected.value = new Set()
  emit('update:selected', [])
  emit('clear')
}

function applyAndClose() {
  const arr = Array.from(localSelected.value)
  emit('update:selected', arr)
  emit('apply', arr)
  dialog.value = false
}

function chipColor(a) {
  return a.color || 'primary'
}
</script>

<style scoped>
/* ====== Trigger ====== */
.sel-ico {
  margin-right: -4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: transparent;
}

/* ====== Dialog/Card ====== */
.filter-card{
  width: 100%;
  max-width: 100vw;
  border-radius: 16px 16px 0 0;       /* bottom sheet look su mobile */
}

/* Desktop: card centrata, più stretta e con radius pieni */
@media (min-width: 1024px){
  .filter-card{
    max-width: 640px;
    border-radius: 12px;
  }
}

/* ====== Griglia mobile-first ====== */
.allergen-grid{
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 colonne su mobile */
  gap: 12px;
  justify-items: center;
}

/* Tablet: 5 colonne */
@media (min-width: 600px){
  .allergen-grid{ grid-template-columns: repeat(5, 1fr); }
}

/* Desktop: 6 colonne */
@media (min-width: 1024px){
  .allergen-grid{ grid-template-columns: repeat(6, 1fr); }
}

/* ====== Bottoni allargati per touch ====== */
.allergen-btn{
  width: 56px;
  height: 56px;
  padding: 0;
}
@media (min-width: 600px){
  .allergen-btn{ width: 64px; height: 64px; }
}
@media (min-width: 1024px){
  .allergen-btn{ width: 72px; height: 72px; }
}

.chip-icon img {
  object-fit: contain;
  width: 100%;
  height: 100%;
}

/* Actions: aderenti al bordo su mobile */
.actions-wrap{
  padding: 12px 16px 16px;
}
@media (min-width: 1024px){
  .actions-wrap{ padding: 12px 16px 16px; }
}

/* L’avatar occupa TUTTO il bottone e taglia l’immagine per riempire */
.chip-icon {
  width: 100%;
  height: 100%;
  overflow: hidden;      /* sicurezza anti-sbordi */
  border-radius: 50%;    /* match con q-btn round */
}

.chip-icon img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;     /* ⬅️ riempi completamente il cerchio */
}

/* (opzionale) se vuoi anche l’icona vettoriale “grande” */
.chip-icon .q-icon {
  font-size: 150%;
}

/* (opzionale) anche le icone nel trigger */
.sel-ico img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

</style>
