<!-- src/pages/BusinessPage.vue -->
<template>
  <q-page class="q-pa-none">
    <!-- HERO -->
    <transition name="fade" mode="out-in">
      <!-- LOADING HERO -->
      <div v-if="!tried || loading" key="hero-loading" class="q-px-lg">
        <q-skeleton type="rect" class="rounded-borders" :style="{ minHeight: '50vh' }" />
      </div>

      <!-- HERO REALE -->
      <div v-else key="hero" class="hero q-px-lg" :style="heroStyle">
        <!-- Desktop / tablet: vista completa -->
        <div class="row items-center no-wrap h-full gt-sm">
          <div class="col">
            <div class="text-h4 text-weight-bold text-white ellipsis">
              {{ current?.name || decodedName || 'Locale' }}
            </div>

            <div class="text-subtitle1 text-white text-weight-medium opacity-90">
              {{ current?.type || 'Locale' }}
              <q-badge class="q-ml-sm" :color="isOpenComputed(current) ? 'positive' : 'negative'" outline>
                {{ statusLabel(current) }}
              </q-badge>
            </div>

            <!-- Orari di OGGI -->
            <div class="text-body2 text-white q-mt-xs opacity-85">
              <q-icon name="schedule" size="16px" class="q-mr-xs" />
              {{ todayText }}
            </div>
          </div>

          <div class="col-auto">
            <q-btn
              dense rounded unelevated icon="restaurant_menu"
              color="white" text-color="primary" label="Apri Menù"
              :disable="!current" @click="goToMenu"
            />
          </div>
        </div>

        <!-- Mobile: sfondo + pannello orari + CTA -->
        <div class="h-full lt-md mobile-hero">
          <div
            v-if="current"
            class="mobile-hours"
            role="status"
            aria-live="polite"
          >
            <div class="row items-center no-wrap">
              <q-badge :color="isOpenComputed(current) ? 'positive' : 'negative'" outline>
                {{ statusLabel(current) }}
              </q-badge>
              <div class="hours-text ellipsis">
                <q-icon name="schedule" size="16px" class="q-mr-xs" />
                {{ todayText }}
              </div>
            </div>
          </div>

          <q-btn
            rounded unelevated icon="restaurant_menu"
            color="white" text-color="primary" label="Apri Menù"
            class="mobile-cta"
            :disable="!current"
            @click="goToMenu"
          />
        </div>
      </div>
    </transition>

    <!-- CONTENUTO SOTTO L'HERO -->
    <div class="q-pa-lg">
      <transition name="fade" mode="out-in">
        <div v-if="!tried || loading" key="content-loading">
          <q-skeleton type="rect" height="180px" class="q-mb-lg rounded-borders" />
        </div>

        <div v-else key="content">
          <div v-if="others?.length">
            <div class="text-h6 text-weight-bold q-mb-md">Scopri anche gli altri nostri locali</div>

            <div class="row q-col-gutter-md">
              <div
                v-for="b in others"
                :key="b._id || b.name"
                class="col-6 col-sm-4 col-md-3 col-lg-2"
              >
                <q-card
                  flat
                  bordered
                  class="cursor-pointer rounded-borders card-hover card-elevated overflow-hidden"
                  @click="goToBusiness(b.name)"
                  role="button"
                  :aria-label="`Vai a ${b.name}`"
                >
                  <!-- Tile con background = logo -->
                  <div class="bg-tile" :style="bgStyleFor(b)">
                    <!-- Fallback: iniziali se manca il logo -->
                    <div v-if="!logoFrom(b)" class="tile-initials">
                      {{ initials(b.name) }}
                    </div>

                    <!-- Overlay gradiente basso per leggibilità -->
                    <div class="tile-gradient"></div>

                    <!-- Stato in basso a destra -->
                    <q-badge
                      class="status-badge"
                      :color="isOpenComputed(b) ? 'positive' : 'negative'"
                      outline
                    >
                      {{ statusLabel(b) }}
                    </q-badge>
                  </div>
                </q-card>
              </div>
            </div>
          </div>

          <!-- errori / not found -->
          <q-banner v-if="error" class="bg-red-1 text-red-10 q-mt-xl rounded-borders" rounded>
            <template #avatar><q-icon name="error" /></template>
            Errore: {{ error }}
          </q-banner>

          <q-banner v-if="!current" class="bg-orange-1 text-orange-10 q-mt-md rounded-borders" rounded>
            <template #avatar><q-icon name="warning" /></template>
            Nessun locale trovato per <strong>“{{ decodedName }}”</strong>.
          </q-banner>
        </div>
      </transition>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBusinessStore } from 'stores/business'
import { useAppStore } from 'stores/app'
import { isOpenComputed, statusLabel, todayLabel, logOpeningDiagnostics } from 'src/utils/opening'

const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const app = useAppStore()

const decodedName = computed(() => String(route.params.businessName || '').replace(/\s+/g, ' ').trim())
const loading = computed(() => business.loading)
const error   = computed(() => business.error)
const current = computed(() => business.current)
const others  = computed(() => business.others)
const tried = ref(false)

function goToBusiness(name) {
  app.setCurrentBusinessName(name || null)
  router.push({ name: 'business', params: { businessName: name } })
}

function goToMenu() {
  if (!current.value) return
  router.push({ name: 'businessMenu', params: { businessName: current.value.name } })
}

const currentLogo = computed(() => current.value?.logoUrl || null)
const todayText = computed(() => todayLabel(current.value))

const heroStyle = computed(() => {
  const base = `var(--q-primary)`
  const logo = currentLogo.value
  const backgroundLayers = logo
    ? `url('${logo}') center/contain no-repeat, linear-gradient(135deg, ${base} 0%, ${base} 60%)`
    : `linear-gradient(135deg, ${base} 0%, ${base} 60%)`
  return {
    minHeight: '50vh',
    paddingTop: '48px',
    paddingBottom: '48px',
    background: backgroundLayers,
    backgroundColor: 'var(--leccese, #f1eee6)',
  }
})

function logoFrom(b) { return b?.logoUrl || null }
function bgStyleFor(b) {
  const url = logoFrom(b)
  if (url) {
    return {
      backgroundImage: `url('${url}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      height: '140px',
      borderRadius: '16px'
    }
  }
  return {
    background: 'linear-gradient(135deg, #f6f7fb 0%, #eaeef8 100%)',
    height: '140px',
    borderRadius: '16px'
  }
}

function initials(str = '') {
  const parts = String(str).trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0].toUpperCase()).join('') || 'ME'
}

async function load() {
  tried.value = false
  await app.ensureCompanyLoaded()
  await business.fetchByName(decodedName.value)
  tried.value = true

  if (import.meta.env.DEV && current.value) {
    logOpeningDiagnostics(current.value)
    others.value.forEach(o => logOpeningDiagnostics(o))
  }
}

onMounted(load)
watch(() => route.params.businessName, load)
</script>

<style scoped>
.h-full { min-height: 50vh; display: flex; align-items: center; }
.hero {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

/* ===== Mobile hero ===== */
.mobile-hero {
  width: 100%;
  display: flex;
  flex-direction: column;       /* orari sopra, CTA sotto */
  align-items: center;
  justify-content: flex-end;
  padding: 16px 0 12px;
  gap: 10px;
}

.mobile-hours{
  width: calc(100% - 32px);
  max-width: 420px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.10);
  color: #111;
  font-weight: 600;
}
.mobile-hours .hours-text{
  margin-left: 10px;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-cta {
  width: calc(100% - 32px);
  max-width: 360px;
}

/* Desktop cards & tiles */
.rounded-borders { border-radius: 16px; }
.card-elevated { box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
.card-hover { transition: transform .16s ease, box-shadow .16s ease; }
.card-hover:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.10); }

/* Tile con immagine di sfondo */
.bg-tile { position: relative; }

/* Iniziali al centro (fallback quando manca logo) */
.tile-initials {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 28px;
  color: var(--q-primary);
  opacity: .9;
}

/* leggero gradiente in basso per staccare il badge dallo sfondo */
.tile-gradient {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 48px;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.18) 100%);
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  pointer-events: none;
}

/* Badge stato in basso a destra */
.status-badge {
  position: absolute;
  right: 10px;
  bottom: 10px;
  backdrop-filter: blur(4px);
}

/* fade */
.fade-enter-active, .fade-leave-active { transition: opacity .12s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Tweak padding hero su schermi piccoli */
@media (max-width: 599.98px) {
  .hero { padding-top: 24px !important; padding-bottom: 24px !important; }
}
</style>
