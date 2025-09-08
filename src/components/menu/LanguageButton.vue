<template>
  <div>
    <q-btn
      dense
      outline
      round
      :label="currentLabel"
      aria-label="Cambia lingua"
      @click="dialog = true"
    />

    <q-dialog v-model="dialog" persistent>
      <q-card class="q-pa-md" style="min-width: 300px; max-width: 400px;">
        <q-card-section class="text-h6">
          {{ $t('selectLanguage') }}
        </q-card-section>

        <q-list bordered separator>
          <q-item
            v-for="opt in safeOptions"
            :key="opt.code"
            clickable
            @click="select(opt.code)"
            :aria-selected="opt.code === currentLang"
            :active="opt.code === currentLang"
          >
            <q-item-section>
              <q-item-label>
                {{ opt.label || opt.code.toUpperCase() }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-icon v-if="opt.code === currentLang" name="check" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-actions align="right">
          <q-btn flat label="Chiudi" @click="dialog = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLangStore } from 'stores/lang'

const props = defineProps({
  options: {
    type: Array,
    default: () => ([
      { code: 'it', label: 'Italiano' },
      { code: 'en', label: 'English' }
    ]),
    validator: (arr) =>
      Array.isArray(arr) &&
      arr.every(o => o && typeof o.code === 'string' && o.code.trim() !== '')
  }
})

const langStore = useLangStore()
const dialog = ref(false)

// Opzioni sicure: filtra entry invalide e rimuove duplicati per "code"
const safeOptions = computed(() => {
  const cleaned = (props.options || []).filter(
    o => o && typeof o.code === 'string' && o.code.trim() !== ''
  )
  const seen = new Set()
  return cleaned.filter(o => (seen.has(o.code) ? false : (seen.add(o.code), true)))
})

// Lingua corrente con fallback alla prima disponibile o 'it'
const currentLang = computed(() => {
  const storeLang = langStore.lang
  const codes = safeOptions.value.map(o => o.code)
  if (storeLang && codes.includes(storeLang)) return storeLang
  return codes[0] || 'it'
})

// *** SOLO IT / EN sul bottone ***
const currentLabel = computed(() => {
  return String(currentLang.value || '').toUpperCase()
})

// Seleziona lingua solo se presente
function select(code) {
  if (!safeOptions.value.some(o => o.code === code)) return
  langStore.setLang(code)
  dialog.value = false
}
</script>
