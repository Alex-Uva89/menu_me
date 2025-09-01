<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>

        <!-- Back se possibile tornare indietro -->
        <q-btn
          v-if="canGoBack"
          flat round dense
          icon="arrow_back"
          aria-label="Indietro"
          @click="router.back()"
        />

        <!-- Titolo centrato -->
        <div class="absolute-center text-subtitle1 text-weight-medium ellipsis">
          {{ headerTitle }}
        </div>

        <!-- Spazio a destra per bilanciare quando non c'è il back -->
        <div style="width:40px;"></div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from 'stores/app'

const route = useRoute()
const router = useRouter()
const app = useAppStore()

onMounted(() => {
  app.ensureCompanyLoaded()
})

const canGoBack = computed(() => window.history.length > 1)

// Regole:
// - su '/:businessName' -> titolo = nome Azienda
// - su '/:businessName/Menu' -> titolo = nome Locale
const headerTitle = computed(() => {
  if (route.name === 'businessMenu') {
    return app.currentBusinessName || String(route.params.businessName || '').trim()
  }
  if (route.name === 'business') {
    return app.companyTitle || ' '
  }
  return app.companyTitle || ' '
})
</script>
