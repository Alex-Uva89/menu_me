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
        <q-card-section class="text-h6">Seleziona lingua</q-card-section>

        <q-list bordered separator>
          <q-item
            v-for="opt in options"
            :key="opt.code"
            clickable
            @click="select(opt.code)"
          >
            <q-item-section avatar v-if="opt.flag">
              <q-avatar>
                <div style="font-size: 18px; line-height: 1; text-align: center; width: 100%; height: 100%;">
                  {{ opt.flag }}
                </div>
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ opt.label || opt.code.toUpperCase() }}</q-item-label>
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

const langStore = useLangStore()
const dialog = ref(false)

const props = defineProps({
  options: {
    type: Array,
    default: () => ([
      { code: 'it', label: 'Italiano', flag: '🇮🇹' },
      { code: 'en', label: 'English',  flag: '🇬🇧' }
    ])
  }
})

const currentLang = computed(() => langStore.lang)

const currentLabel = computed(() => {
  const found = props.options.find(o => o.code === currentLang.value)
  return `${found.code}`.toUpperCase()
})

function select(code) {
  langStore.setLang(code)
  dialog.value = false
}
</script>
