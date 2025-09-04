<!-- src/pages/MenuPage.vue -->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAppStore } from 'stores/app'
import { useAttributesStore } from 'stores/attributes'
import { useLangStore } from 'stores/lang'
import { useCategoriesStore } from 'stores/categories'
import { useBusinessStore } from 'stores/business'
import { useProductsStore } from 'stores/products'

import LanguageButton from 'components/menu/LanguageButton.vue'
import AllergenButton from 'components/menu/AllergenButton.vue'
import CategoryTitle from 'components/menu/CategoryTitle.vue'
import FooterNav from 'components/menu/FooterNav.vue'
import ListProducts from 'components/menu/ListProducts.vue'
import BrandSplash from 'components/menu/BrandSplash.vue'

import { useSplashOnce } from 'src/utils/useSplashOnce'

/* ===== Stores & basics ===== */
const route = useRoute()
const app = useAppStore()
const attrs = useAttributesStore()
const langStore = useLangStore()
const categories = useCategoriesStore()
const business = useBusinessStore()
const products = useProductsStore()

const { locale, t } = useI18n()
const allergenSelected = ref([])

const decodedName = computed(() =>
  String(route.params.businessName || '').replace(/\s+/g, ' ').trim()
)

const lang = computed(() => langStore.lang)
locale.value = lang.value
watch(lang, (val) => { locale.value = val })

const allergenOptions = computed(() => attrs.allergensFor(lang.value))

/* ===== Colore brand + contrasto testo header ===== */
const brandHex = computed(() => business.current?.brandColor || '#F1EEE6')

function hexToRgb (hex) {
  const h = String(hex || '').replace('#','')
  if (![3,6].includes(h.length)) return null
  const n = h.length === 3
    ? h.split('').map(c => parseInt(c + c, 16))
    : [h.slice(0,2), h.slice(2,4), h.slice(4,6)].map(p => parseInt(p, 16))
  if (n.some(v => Number.isNaN(v))) return null
  return { r: n[0], g: n[1], b: n[2] }
}
function luminance ({ r, g, b }) {
  const s = [r, g, b].map(v => v / 255)
  const L = s.map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * L[0] + 0.7152 * L[1] + 0.0722 * L[2]
}
const headerTextColor = computed(() => {
  const rgb = hexToRgb(brandHex.value)
  if (!rgb) return '#000'
  return luminance(rgb) < 0.5 ? '#fff' : '#000'
})

/* ===== Splash: solo prima volta della sessione ===== */
const { showSplash, hide } = useSplashOnce({ mode: 'session' }) // 'local' se vuoi persistente
let hideTimer = null

// pronto quando:
// - business caricato
// - sottocategoria selezionata
// - prodotti non stanno caricando (anche se 0)
const bootReady = computed(() => {
  const hasBiz = !!business.current?._id
  const hasSub = !!categories.categorySelected?._id
  const prodsDone = !products.loading
  return hasBiz && hasSub && prodsDone
})

watch(bootReady, (ready) => {
  // programma l'hide SOLO se lo splash è visibile (prima sessione)
  if (ready && showSplash.value) {
    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => { hide() }, 1000) // 1s di fade out
  }
})

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
})

/* ===== Boot sequence ===== */
onMounted(async () => {
  await Promise.all([ app.ensureCompanyLoaded(), attrs.fetchAllergens() ])
  await business.fetchByName(decodedName.value)

  if (business.current?._id) {
    await categories.fetchCategoriesForBusiness(business.current._id)
    categories.autoSelectFirstSubcategory() // trigger fetch prodotti
  }

  // Se per qualsiasi motivo tutto è già pronto e lo splash è visibile, chiudi dopo 1s
  if (bootReady.value && showSplash.value) {
    hideTimer = setTimeout(() => { hide() }, 1000)
  }
})

/* ===== Cambio businessName ===== */
watch(() => route.params.businessName, async () => {
  // NON riattiviamo lo splash: showSplash resta false dopo la prima volta
  clearTimeout(hideTimer)

  await Promise.all([ app.ensureCompanyLoaded(), attrs.fetchAllergens() ])
  await business.fetchByName(decodedName.value)

  if (business.current?._id) {
    await categories.fetchCategoriesForBusiness(business.current._id)
    categories.autoSelectFirstSubcategory()
  }

  // Se, per caso, è la primissima visita della sessione e lo splash è ancora visibile:
  if (bootReady.value && showSplash.value) {
    hideTimer = setTimeout(() => { hide() }, 1000)
  }
})
</script>

<template>
  <q-page class="q-pa-none with-sticky-footer">
    <!-- Splash: mostrato solo alla prima apertura della sessione -->
    <BrandSplash :show="showSplash" :color="brandHex" />

    <!-- Contenuto: mostrato quando lo splash non è visibile -->
    <div v-show="!showSplash">
      <div
        class="menu-header row items-center justify-between q-px-md q-pt-lg"
        :style="{ backgroundColor: brandHex, color: headerTextColor }"
      >
        <div class="col-auto q-mb-md">
          <LanguageButton
            :options="[
              { code: 'it', label: t('availableLanguages.it'), flag: '/flags/it.png' },
              { code: 'en', label: t('availableLanguages.en'), flag: '/flags/gb.png' }
            ]"
          />
        </div>

        <div class="col text-center">
          <CategoryTitle />
        </div>

        <div class="col-auto q-mb-md">
          <AllergenButton
            :selected="allergenSelected"
            :options="allergenOptions"
            @update:selected="val => allergenSelected = val"
          />
        </div>
      </div>

      <!-- Lista prodotti -->
      <ListProducts :selected-allergens="allergenSelected" />

      <!-- Footer nav -->
      <FooterNav />
    </div>
  </q-page>
</template>

<style scoped>
.menu-header {
  position: sticky;
  top: 50px;
  z-index: 10;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  backdrop-filter: blur(6px);
}

.with-sticky-footer {
  padding-bottom: 120px; /* evita che il footer copra la lista */
}
</style>
