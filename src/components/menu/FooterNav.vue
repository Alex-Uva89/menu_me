<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watchEffect } from 'vue'
import { useCategoriesStore } from 'stores/categories'
import { useBusinessStore } from 'stores/business'
import { useI18n } from 'vue-i18n'

const categories = useCategoriesStore()
const business = useBusinessStore()
const { t, locale } = useI18n()

const footerEl = ref(null)

const selectedRoot = computed(() => categories.selectedRoot) // dallo store

const visibleCategories = computed(() => {
  if (!categories.selectedRootId) return categories.roots
  return categories.getChildrenOf(categories.selectedRootId)
})

function selectRoot(cat) {
  categories.selectRoot(cat)      // 👈 aggiorna store
}
function selectSub(cat) {
  categories.selectCategory(cat)  // 👈 aggiorna store
}
function backToRoots() {
  categories.clearSelection()     // 👈 reset
}

function labelOf(cat) {
  const loc = locale.value
  return (cat?.translations && cat.translations[loc]) || cat?.title || ''
}

/* ======== COLORE DAL BUSINESS ======== */
const brandHex = computed(() => business.current?.brandColor || null)
const bgColor = computed(() => brandHex.value || 'var(--q-primary, var(--leccese, #f1eee6))')

// contrasto testo
function hexToRgb(hex){ const h=(hex||'').replace('#',''); if(![3,6].includes(h.length))return null;
  const n=h.length===3?h.split('').map(c=>parseInt(c+c,16)):[h.slice(0,2),h.slice(2,4),h.slice(4,6)].map(p=>parseInt(p,16));
  if(n.some(v=>Number.isNaN(v)))return null; return {r:n[0],g:n[1],b:n[2]} }
function relL({r,g,b}){const s=[r,g,b].map(v=>v/255),l=s.map(v=>v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4));return 0.2126*l[0]+0.7152*l[1]+0.0722*l[2]}
function contrastText(hex){ const rgb=hexToRgb(hex); if(!rgb) return 'black'; return relL(rgb)<0.5?'white':'black' }
const textColor = computed(() => (brandHex.value ? contrastText(brandHex.value) : 'black'))

/* ======== ALTEZZA FOOTER → padding pagina ======== */
let ro = null
function updateFooterHeight() {
  const h = footerEl.value?.offsetHeight || 0
  document.documentElement.style.setProperty('--footer-height', `${h}px`)
}
onMounted(() => {
  updateFooterHeight()
  ro = new ResizeObserver(updateFooterHeight)
  if (footerEl.value) ro.observe(footerEl.value)
  window.addEventListener('resize', updateFooterHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateFooterHeight)
  if (footerEl.value && ro) ro.unobserve(footerEl.value)
  ro && ro.disconnect()
})
watchEffect(updateFooterHeight)
</script>

<template>
  <footer ref="footerEl" class="menu-footer q-pa-sm" :style="{ background: bgColor, color: textColor }">
    <!-- ROOTS -->
    <div v-if="!selectedRoot">
      <h6 class="text-subtitle1 q-mb-sm">{{ t('footer.selectCategory') }}</h6>

      <div class="cats-wrap">
        <q-btn
          v-for="cat in visibleCategories"
          :key="cat._id"
          :label="labelOf(cat)"
          flat
          class="cat-btn"
          :color="textColor"
          @click="selectRoot(cat)"
        />
      </div>

      <div v-if="!visibleCategories.length" class="q-mt-xs" :style="{ opacity: .75 }">
        {{ t('footer.noCategories') }}
      </div>
    </div>

    <!-- SUBCATS -->
    <div v-else>
      <div class="row items-center justify-between q-mb-sm">
        <div class="row items-center no-wrap">
          <q-btn flat dense icon="arrow_back" class="q-mr-xs" :color="textColor" @click="backToRoots" aria-label="Back" />
          <h6 class="text-subtitle1 q-my-none">{{ labelOf(selectedRoot) }}</h6>
        </div>
      </div>

      <div class="cats-wrap">
        <q-btn
          v-for="cat in visibleCategories"
          :key="cat._id"
          :label="labelOf(cat)"
          flat
          class="cat-btn"
          :color="textColor"
          @click="selectSub(cat)"
        />
      </div>

      <div v-if="!visibleCategories.length" class="q-mt-xs" :style="{ opacity: .75 }">
        {{ t('footer.noSubcategories') }}
      </div>
    </div>
  </footer>
</template>

<style scoped>
.menu-footer{
  position: fixed;
  left: 0; right: 0; bottom: 0;
  width: 100%;
  z-index: 999;
  border-top: 1px solid rgba(0,0,0,0.06);
  backdrop-filter: blur(6px);
  padding-bottom: env(safe-area-inset-bottom);
}
.cats-wrap{ display:flex; flex-wrap:wrap; gap:.5rem; }
.cat-btn{ flex:1 1 100%; text-transform:none; justify-content:flex-start; padding-left:.5rem; padding-right:.5rem; }
@media (min-width:480px){ .cat-btn{ flex:1 1 calc(50% - .5rem); } }
@media (min-width:768px){ .cat-btn{ flex:1 1 calc(33.333% - .5rem); } }
</style>
