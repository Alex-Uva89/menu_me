<template>
  <q-page class="q-pa-lg">
    <!-- Breadcrumbs -->
    <div class="q-mb-md">
      <q-breadcrumbs>
        <q-breadcrumbs-el label="Home" />
        <q-breadcrumbs-el label="Locali" />
      </q-breadcrumbs>
    </div>

    <!-- Top controls -->
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="search"
          dense
          clearable
          standout
          placeholder="Cerca un locale…"
          debounce="200"
          :input-style="{ fontSize: '14px' }"
        >
          <template #append><q-icon name="search" /></template>
        </q-input>
      </div>

      <div class="col-12 col-md-6 flex justify-end">
        <q-btn-toggle
          v-model="statusFilter"
          dense
          rounded
          toggle-color="primary"
          unelevated
          size="sm"
          :options="[
            {label: 'Tutti', value: 'all'},
            {label: 'Aperti', value: 'open'},
            {label: 'Chiusi', value: 'closed'}
          ]"
        />
      </div>
    </div>

    <!-- Error -->
    <q-banner v-if="error" class="bg-red-1 text-red-10 q-mb-lg rounded-borders" rounded>
      <template #avatar><q-icon name="error" /></template>
      Errore: {{ error }}
    </q-banner>

    <!-- Skeleton grid -->
    <div v-if="loading" class="row q-col-gutter-md">
      <div v-for="n in 8" :key="n" class="col-6 col-sm-4 col-md-3 col-lg-2">
        <q-skeleton type="rect" class="rounded-borders" style="height: 160px;" />
      </div>
    </div>

    <!-- Lista -->
    <div v-else>
      <div v-if="filteredList.length" class="row q-col-gutter-md">
        <div
          v-for="b in filteredList"
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
            <div class="bg-tile" :style="bgStyleFor(b)">
              <!-- chip tipo (top-left) -->
              <q-badge class="type-badge" color="white" text-color="primary" outline>
                {{ b.type || 'Locale' }}
              </q-badge>

              <!-- Fallback se manca logo -->
              <div v-if="!logoFrom(b)" class="tile-initials">
                {{ initials(b.name) }}
              </div>

              <!-- Gradiente basso -->
              <div class="tile-gradient"></div>

              <!-- Stato (bottom-right) -->
              <q-badge
                class="status-badge"
                :color="isOpenComputed(b) ? 'positive' : 'negative'"
                outline
              >
                {{ statusLabel(b) }}
              </q-badge>
            </div>

            <q-separator />

            <q-card-section class="q-py-sm">
              <div class="text-subtitle2 text-weight-bold ellipsis">{{ b.name }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Empty -->
      <q-banner v-else class="bg-orange-1 text-orange-10 rounded-borders" rounded>
        <template #avatar><q-icon name="warning" /></template>
        Nessun locale disponibile al momento.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBusinessStore } from 'stores/business'
import { useAppStore } from 'stores/app'
import { isOpenComputed, statusLabel } from 'src/utils/opening'

const router = useRouter()
const business = useBusinessStore()
const app = useAppStore()

const loading = computed(() => business.loading)
const error   = computed(() => business.error)
const list    = computed(() => business.list)

const search = ref('')
const statusFilter = ref('all') // all | open | closed

const filteredList = computed(() => {
  const q = search.value.trim().toLowerCase()
  return list.value
    .filter(b => {
      if (statusFilter.value === 'open'   && !isOpenComputed(b)) return false
      if (statusFilter.value === 'closed' &&  isOpenComputed(b)) return false
      return true
    })
    .filter(b => {
      if (!q) return true
      const hay = `${b.name} ${b.type || ''}`.toLowerCase()
      return hay.includes(q)
    })
})

function goToBusiness(name) {
  app.setCurrentBusinessName(name || null)
  router.push({ name: 'business', params: { businessName: name } })
}

// helpers style
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
  const s = String(str).trim()
  if (!s) return 'ME'
  const parts = s.split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('') || 'ME'
}

onMounted(async () => {
  await app.ensureCompanyLoaded()
  await business.fetchAll()
})
</script>

<style scoped>
.rounded-borders { border-radius: 16px; }
.card-elevated { box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
.card-hover { transition: transform .16s ease, box-shadow .16s ease; }
.card-hover:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.10); }

/* Tile background */
.bg-tile { position: relative; }

/* Chip tipo in alto a sinistra */
.type-badge {
  position: absolute;
  left: 10px;
  top: 10px;
  backdrop-filter: blur(4px);
}

/* Iniziali al centro (fallback) */
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

/* Gradient in basso */
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
</style>
