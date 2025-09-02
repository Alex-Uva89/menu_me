<template>
  <div>
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
            size="16px"
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

    <q-dialog v-model="dialog" persistent>
      <q-card class="q-pa-md" style="max-width: 600px; width: 100%;">
        <q-card-section class="text-h6">{{ $t('allergens') }}</q-card-section>

        <div class="row q-col-gutter-md q-row-gutter-md justify-center">
          <q-btn
            v-for="a in options"
            :key="a.id"
            @click="() => toggle(a.id)"
            :flat="!localSelected.has(a.id)"
            :color="localSelected.has(a.id) ? chipColor(a) : 'grey-5'"
            :text-color="localSelected.has(a.id) ? 'white' : 'black'"
            class="q-pa-none allergen-btn"
            round
            size="56px"
          >
            <q-avatar size="100%" square class="chip-icon">
              <img v-if="a.iconUrl" :src="a.iconUrl" :alt="a.label" />
              <q-icon v-else-if="a.icon" :name="a.icon" />
            </q-avatar>
          </q-btn>
        </div>

        <q-card-actions class="q-mt-md justify-between">
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

const { t } = useI18n()

const props = defineProps({
  selected: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:selected', 'apply', 'clear'])

const dialog = ref(false)
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
.sel-ico {
  margin-right: -4px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: transparent;
}
.chip-icon img {
  object-fit: contain;
  width: 100%;
  height: 100%;
}
.allergen-btn {
  width: 64px;
  height: 64px;
  padding: 0;
}
</style>
