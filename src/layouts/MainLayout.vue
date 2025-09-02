<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :style="headerStyle" class="text-white">
      <q-toolbar>
        <q-btn
          v-if="canGoBack"
          flat round dense
          icon="arrow_back"
          aria-label="Indietro"
          @click="goBackSafe"
        />

        <!-- Titolo → link a mammaelvira.com -->
        <a
          class="absolute-center text-subtitle1 text-weight-medium ellipsis header-title-link"
          href="https://mammaelvira.com"
          target="_blank"
          rel="noopener"
          aria-label="Vai al sito mammaelvira.com (apre in nuova scheda)"
        >
          {{ headerTitle }}
        </a>

        <div style="width:40px;"></div>
      </q-toolbar>
    </q-header>

    <!-- Sfondo pietra leccese -->
    <q-page-container class="bg-pietra-leccese">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from 'stores/app'
import { useNavStore } from 'stores/nav'
import { useBusinessStore } from 'stores/business'

const route = useRoute()
const router = useRouter()
const app = useAppStore()
const nav = useNavStore()
const business = useBusinessStore()

onMounted(() => {
  app.ensureCompanyLoaded()
})

const canGoBack = computed(() => !!nav.prevRoute)

function goBackSafe () {
  if (!nav.prevRoute) return
  router.push(nav.prevRoute.fullPath)
}

// colore header: brandColor del locale su /:businessName e /:businessName/Menu
const brandColor = computed(() => {
  const c = business.current?.brandColor
  return c && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i.test(c) ? c : null
})

const headerStyle = computed(() => {
  if (route.name === 'business' || route.name === 'businessMenu') {
    return { background: brandColor.value || 'var(--q-primary)' }
  }
  return { background: 'var(--q-primary)' }
})

// Titolo header
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

<style scoped>
.header-title-link {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}
.header-title-link:hover {
  text-decoration: underline;
}

.bg-pietra-leccese {
  background: #E8E2D6;
}
</style>
