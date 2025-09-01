<!-- src/pages/MenuPage.vue -->
<template>
  <q-page class="q-pa-lg">
    <div class="q-mb-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Home" to="/" />
        <q-breadcrumbs-el :label="decodedName" :to="{ name: 'business', params: { businessName: decodedName } }" />
        <q-breadcrumbs-el label="Menu" />
      </q-breadcrumbs>
    </div>

    <q-skeleton v-if="loading" type="rect" height="120px" class="q-mb-lg" />

    <div v-else>
      <div v-if="current">
        <div class="text-h4 q-mb-sm">Menù — {{ current.name }}</div>
        <div class="text-subtitle2 text-grey-7 q-mb-lg">{{ current.type || 'Locale' }}</div>

        <div v-if="current.categoryRoots?.length">
          <div class="text-subtitle1 q-mb-sm">Categorie</div>
          <div class="row q-col-gutter-sm">
            <div v-for="cat in current.categoryRoots" :key="cat._id" class="col-auto">
              <q-chip outline>{{ cat.title }}</q-chip>
            </div>
          </div>
        </div>

        <q-banner v-else class="bg-grey-2 q-mt-md" rounded>
          Nessuna categoria di catalogo configurata per questo locale.
        </q-banner>
      </div>

      <q-banner v-else class="bg-orange-1 text-orange-10" rounded>
        <template #avatar><q-icon name="warning"/></template>
        Locale “{{ decodedName }}” non trovato.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'boot/axios'
import { useAppStore } from 'stores/app'

const route = useRoute()
const app = useAppStore()

const loading = ref(false)
const current = ref(null)

const decodedName = computed(() =>
  String(route.params.businessName || '').replace(/\s+/g, ' ').trim()
)

async function fetchBusiness() {
  loading.value = true
  current.value = null
  try {
    const nameParam = encodeURIComponent(decodedName.value)
    const { data } = await api.get(`/public/business/by-name/${nameParam}`)
    current.value = data.current || null
    app.setCurrentBusinessName(current.value?.name || null) // <-- per header
  } catch {
    current.value = null
    app.setCurrentBusinessName(null)
  } finally {
    loading.value = false
  }
}

onMounted(fetchBusiness)
watch(() => route.params.businessName, fetchBusiness)
</script>
