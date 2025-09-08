<!-- src/layouts/MainLayout.vue -->
<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :style="headerStyle" class="text-white flex align-center" style="height: 80px;">
      <q-toolbar class="row justify-between">
        <q-btn
          v-if="canGoBack"
          flat round dense
          icon="arrow_back"
          aria-label="Indietro"
          @click="goBackSafe"
        />

        <!-- Centro: logo del locale se presente, altrimenti nome -->
        <a
          class="absolute-center header-title-link header-center"
          href="https://mammaelvira.com"
          target="_blank"
          rel="noopener"
          :aria-label="`Vai al sito mammaelvira.com (apre in nuova scheda)`"
        >
          <img
            v-if="logoUrl"
            :src="logoUrl"
            :alt="(businessName || 'Locale') + ' logo'"
            class="header-logo"
          />
          <span v-else class="text-subtitle1 text-weight-medium ellipsis">
            {{ businessName || headerFallback }}
          </span>
        </a>

        <!-- Spacer destro per bilanciare il back -->
        <LanguageButton />
      </q-toolbar>
    </q-header>

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

import LanguageButton from 'src/components/menu/LanguageButton.vue'

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

/* -- Route che mostrano il branding del locale -- */
const isBusinessContext = computed(() =>
  route.name === 'business' || route.name === 'businessMenu'
)

/* -- Colore header: brand del locale nelle pagine del locale -- */
const brandColor = computed(() => {
  const c = business.current?.brandColor
  return c && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i.test(c) ? c : null
})
const headerStyle = computed(() => {
  if (isBusinessContext.value) {
    return { background: brandColor.value || 'var(--q-primary)' }
  }
  return { background: 'var(--q-primary)' }
})

/* -- Dati visuali: logo > nome locale > fallback company -- */
const businessName = computed(() => {
  if (isBusinessContext.value) {
    return business.current?.name
      || app.currentBusinessName
      || String(route.params.businessName || '').trim()
  }
  return app.companyTitle || ''
})
const logoUrl = computed(() => {
  const b = business.current
  // Adatta ai tuoi campi reali (logoUrl / logo.url / logo)
  return (b?.logoUrl || b?.logo?.url || b?.logo) || ''
})
const headerFallback = computed(() => app.companyTitle || ' ')

</script>

<style scoped>
.header-title-link {
  color: inherit;
  text-decoration: none;
}
.header-title-link:hover { text-decoration: underline; }

/* Centro: mantiene il contenuto centrato senza “saltare” */
.header-center {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 70vw;     /* evita overflow su nomi lunghi */
  gap: .5rem;
}

/* Logo header: dimensione comoda in toolbar */
.header-logo{
  height: 90px;        /* alza/abbassa a gusto: 24–32 */
  max-width: 200px;
  object-fit: contain;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,.06));
}

.bg-pietra-leccese { background: #E8E2D6; }
</style>
