<!-- src/components/menu/FooterNav.vue -->
<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useQuasar } from 'quasar'
import { useCategoriesStore } from 'stores/categories'
import { useBusinessStore } from 'stores/business'
import { useI18n } from 'vue-i18n'

const $q = useQuasar()
const categories = useCategoriesStore()
const business = useBusinessStore()
const { t, locale } = useI18n()

const isRootView = computed(() => !categories.currentParent)
/** 👇 NESSUN ORDINAMENTO: usiamo l'ordine come arriva dallo store/BE */
const visible = computed(() => categories.visibleCategories)

function labelOf(cat) {
  const loc = locale.value
  return (cat?.translations && cat.translations[loc]) || cat?.title || ''
}

/* ---- Navigazione (nessun sort: prendo il primo figlio così com'è) ---- */
function onRootClick(cat) {
  categories.openRoot(cat)
  const kids = categories.getChildrenOf(cat._id) || []
  if (kids.length) categories.selectCategory(kids[0])
}

const bgColor = computed(() => business.current?.brandColor || 'var(--q-primary, var(--leccese, #f1eee6))')

/* --- Collapsible (mobile-first) --- */
const isMobile = computed(() => $q.screen.lt.md)
const open = ref(true) // desktop default: open

watchEffect(() => {
  open.value = isMobile.value ? false : true
})

function toggleOpen() { open.value = !open.value }
</script>

<template>
  <footer
    class="menu-footer q-pa-sm"
    :style="{ background: bgColor }"
    :class="{ 'is-collapsed': isMobile && !open, 'is-open': isMobile && open }"
  >
    <!-- Barra controllo apertura -->
    <div class="footer-bar">
      <q-btn
        class="toggle-btn"
        :label="open ? t('footer.hideCategories') || 'Nascondi categorie' : t('footer.browseCategories') || 'Categorie'"
        :aria-expanded="String(open)"
        aria-controls="footer-cats"
        :icon-right="open ? 'expand_more' : 'expand_less'"
        dense
        rounded
        unelevated
        color="white"
        text-color="primary"
        @click="toggleOpen"
      />
    </div>

    <!-- Contenuto -->
    <q-slide-transition>
      <div v-show="open || !isMobile" id="footer-cats" class="content-wrap">
        <!-- ROOTS -->
        <div v-if="isRootView">
          <h6 class="text-subtitle1 q-mb-sm text-white">{{ t('footer.selectCategory') }}</h6>

          <div class="cats-wrap">
            <q-btn
              v-for="cat in visible"
              :key="cat._id"
              :label="labelOf(cat)"
              flat
              class="cat-btn"
              @click="onRootClick(cat)"
            />
          </div>

          <div v-if="!visible.length" class="q-mt-xs text-grey-3">
            {{ t('footer.noCategories') }}
          </div>
        </div>

        <!-- SUBCATS -->
        <div v-else>
          <div class="row items-center justify-between q-mb-sm">
            <div class="row items-center no-wrap">
              <q-btn
                flat dense icon="arrow_back"
                class="q-mr-xs text-white"
                @click="categories.backToRoots"
                aria-label="Back"
              />
              <h6 class="text-subtitle1 q-my-none text-white">
                {{ labelOf(categories.currentParent) }}
              </h6>
            </div>
          </div>

          <div class="cats-wrap">
            <q-btn
              v-for="cat in visible"
              :key="cat._id"
              :label="labelOf(cat)"
              flat
              class="cat-btn"
              @click="categories.selectCategory(cat)"
            />
          </div>

          <div v-if="!visible.length" class="q-mt-xs text-grey-3">
            {{ t('footer.noSubcategories') }}
          </div>
        </div>
      </div>
    </q-slide-transition>
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
  padding-bottom: max(env(safe-area-inset-bottom), 8px);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  box-shadow: 0 -8px 24px rgba(0,0,0,.08);
}

/* Barra con il pulsante toggle */
.footer-bar{
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Pulsante toggle più leggibile su mobile */
.toggle-btn{
  min-height: 40px;
  padding: 0 16px;
  font-weight: 600;
}

/* Contenuto interno */
.content-wrap{
  margin-top: .5rem;
}

/* Mobile-first: 2 per riga, touch target grandi */
.cats-wrap{
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
}
.cat-btn{
  flex: 1 1 calc(50% - .5rem);
  text-transform: none;
  justify-content: flex-start;
  padding-left: .75rem;
  padding-right: .75rem;
  min-height: 44px;              /* touch-friendly */
  background-color: rgba(255, 255, 255, 0.28);
  color: #fff;
  border-radius: 10px;
  line-height: 1.1;
}

/* Stato collassato (mobile): riduci a sola barra */
.is-collapsed{
  padding-top: 8px;
  padding-bottom: max(env(safe-area-inset-bottom), 8px);
}
.is-collapsed .content-wrap{ display: none; }

/* Stato aperto (mobile): un filo più di padding */
.is-open{
  padding-top: 10px;
}

/* Tablet: 3 per riga */
@media (min-width: 768px){
  .cat-btn{ flex: 1 1 calc(33.333% - .5rem); }
}

/* Desktop grande: 4 per riga e sempre aperta */
@media (min-width: 1200px){
  .cat-btn{ flex: 1 1 calc(25% - .5rem); }
}
</style>
