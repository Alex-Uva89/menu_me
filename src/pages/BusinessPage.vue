<!-- src/pages/BusinessPage.vue -->
<template>
  <q-page class="q-pa-lg">
    <div class="q-mb-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Home" to="/" />
        <q-breadcrumbs-el :label="decodedName || 'Locali'" />
      </q-breadcrumbs>
    </div>

    <q-skeleton v-if="loading" type="rect" class="q-mb-lg" height="180px" />

    <div v-else>
      <!-- Se trovato -->
      <div v-if="current">
        <q-card
          flat
          bordered
          class="q-pa-md q-mb-xl cursor-pointer"
          @click="goToMenu"
          role="button"
          :aria-label="`Apri il menù di ${current.name}`"
        >
          <q-card-section>
            <div class="text-h4 q-mb-xs">{{ current.name }}</div>
            <div class="text-subtitle2 text-grey-7">
              {{ current.type || 'Locale' }} ·
              <span v-if="current.isOpen">Aperto</span><span v-else>Chiuso</span>
            </div>
          </q-card-section>

          <q-separator spaced />

          <q-card-section class="q-gutter-y-sm">
            <div v-if="current.owner">
              <q-icon name="person" class="q-mr-sm" /> {{ current.owner }}
            </div>
            <div v-if="current.email">
              <q-icon name="email" class="q-mr-sm" /> {{ current.email }}
            </div>

            <div v-if="current.categoryRoots?.length" class="q-mt-md">
              <div class="text-subtitle1 q-mb-sm">Categorie del catalogo</div>
              <div class="row q-col-gutter-sm">
                <div v-for="cat in current.categoryRoots" :key="cat._id" class="col-auto">
                  <q-chip outline>{{ cat.title }}</q-chip>
                </div>
              </div>
            </div>

            <div class="q-mt-md">
              <q-btn
                label="Vai al Menù"
                color="primary"
                icon="restaurant_menu"
                @click.stop="goToMenu"
              />
            </div>
          </q-card-section>
        </q-card>

        <div>
          <div class="text-h6 q-mb-md">Scopri anche gli altri nostri locali</div>
          <div class="row q-col-gutter-md">
            <div
              v-for="b in others"
              :key="b._id"
              class="col-12 col-sm-6 col-md-4 col-lg-3"
            >
              <q-card
                flat
                bordered
                class="cursor-pointer"
                @click="goToBusiness(b.name)"
                role="button"
                :aria-label="`Vai a ${b.name}`"
              >
                <q-card-section>
                  <div class="text-subtitle1">{{ b.name }}</div>
                  <div class="text-caption text-grey-7">{{ b.type || 'Locale' }}</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="text-caption">
                  <q-badge :color="b.isOpen ? 'positive' : 'negative'" outline>
                    {{ b.isOpen ? 'Aperto' : 'Chiuso' }}
                  </q-badge>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- Se NON trovato -->
      <div v-else>
        <q-banner class="bg-orange-1 text-orange-10 q-mb-lg" rounded>
          <template #avatar><q-icon name="warning" /></template>
          Nessun locale trovato per <strong>“{{ decodedName }}”</strong>.
        </q-banner>

        <div>
          <div class="text-h6 q-mb-md">Ecco tutti i nostri locali</div>
          <div class="row q-col-gutter-md">
            <div
              v-for="b in others"
              :key="b._id"
              class="col-12 col-sm-6 col-md-4 col-lg-3"
            >
              <q-card
                flat
                bordered
                class="cursor-pointer"
                @click="goToBusiness(b.name)"
                role="button"
                :aria-label="`Vai a ${b.name}`"
              >
                <q-card-section>
                  <div class="text-subtitle1">{{ b.name }}</div>
                  <div class="text-caption text-grey-7">{{ b.type || 'Locale' }}</div>
                </q-card-section>
                <q-separator />
                <q-card-section class="text-caption">
                  <q-badge :color="b.isOpen ? 'positive' : 'negative'" outline>
                    {{ b.isOpen ? 'Aperto' : 'Chiuso' }}
                  </q-badge>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-1 text-red-10 q-mt-xl" rounded>
        <template #avatar><q-icon name="error" /></template>
        Errore: {{ error }}
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'boot/axios'
import { useAppStore } from 'stores/app'

const route = useRoute()
const router = useRouter()
const app = useAppStore()

const loading = ref(false)
const error = ref(null)
const current = ref(null)
const others = ref([])

const decodedName = computed(() =>
  String(route.params.businessName || '').replace(/\s+/g, ' ').trim()
)

function nameToUrlSegment(name) {
  return encodeURIComponent(name.replace(/\s+/g, ' ').trim())
}

async function fetchBusiness() {
  loading.value = true
  error.value = null
  current.value = null
  others.value = []
  try {
    const nameParam = nameToUrlSegment(decodedName.value)
    const { data } = await api.get(`/public/business/by-name/${nameParam}`)
    current.value = data.current || null
    others.value = data.others || []
    app.setCurrentBusinessName(current.value?.name || null) // <-- per header su Menu
  } catch (err) {
    if (err?.response?.status === 404) {
      current.value = null
      others.value = err.response.data?.others || []
      app.setCurrentBusinessName(null)
    } else {
      error.value = err?.message || 'Errore sconosciuto'
    }
  } finally {
    loading.value = false
  }
}

function goToBusiness(name) {
  router.push({ name: 'business', params: { businessName: name } })
}

function goToMenu() {
  if (!current.value) return
  router.push({ name: 'businessMenu', params: { businessName: current.value.name } })
}

onMounted(fetchBusiness)
watch(() => route.params.businessName, fetchBusiness)
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
