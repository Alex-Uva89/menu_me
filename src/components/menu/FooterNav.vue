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

const bgColor = computed(
  () => business.current?.brandColor || 'var(--q-primary, var(--leccese, #f1eee6))'
)

/* --- Mobile-first: il toggle controlla SOLO le subcats --- */
const isMobile = computed(() => $q.screen.lt.md)
const open = ref(true)
watchEffect(() => { open.value = isMobile.value ? false : true })
function toggleOpen(){ open.value = !open.value }

/* --- Label localizzata --- */
function labelOf(cat){
  const loc = locale.value
  return (cat?.translations && cat.translations[loc]) || cat?.title || ''
}

/* --- Radici: SEMPRE dalle store.roots --- */
const rootCats = computed(() => categories.roots || [])

/* --- Sottocategorie: solo se c'è una root selezionata --- */
const subcats = computed(() => categories.currentParent ? categories.visibleCategories : [])

/* --- Interazioni --- */
function onRootClick(cat){
  categories.openRoot(cat)   // NON seleziono automaticamente il primo figlio
  open.value = true          // apro la sezione sub quando cambio root
}
function onSubcatClick(cat){
  categories.selectCategory(cat)
}
</script>

<template>
  <footer class="menu-footer q-pa-sm" :style="{ background: bgColor }">
    <!-- Toggle lungo -->
    <div class="footer-bar">
      <q-btn
        class="toggle-btn"
        :icon-right="open ? 'expand_less' : 'expand_more'"
        :aria-expanded="String(open)"
        aria-controls="footer-subcats"
        dense rounded unelevated
         text-color="white"
        @click="toggleOpen"
      />
    </div>

    <!-- Area SOTTOCATEGORIE (collassabile). Niente radici qui -->
    <q-slide-transition>
      <div v-show="open || !isMobile" id="footer-subcats" class="content-wrap">

        <div v-if="subcats.length" class="cats-wrap">
          <q-btn
            v-for="cat in subcats"
            :key="cat._id"
            :label="labelOf(cat)"
            flat class="cat-btn"
            @click="onSubcatClick(cat)"
          />
        </div>

        <div v-else class="q-mt-xs text-grey-3">
          {{ categories.currentParent ? (t('footer.noSubcategories') || 'Nessuna sottocategoria') : (t('footer.selectCategory') || 'Seleziona una categoria principale qui sotto') }}
        </div>
      </div>
    </q-slide-transition>

    <!-- RADICI: SEMPRE VISIBILI IN BASSO -->
    <div class="roots-wrap" role="tablist" aria-label="Categorie principali">
      <template v-if="rootCats.length">
        <q-btn
          v-for="root in rootCats"
          :key="root._id"
          :label="labelOf(root)"
          class="root-btn"
          :class="categories.currentParent?._id !== root._id? 'bg-primary' : 'bg-white'"
          flat
          :outline="categories.currentParent?._id !== root._id"
          :unelevated="true"
          :text-color="categories.currentParent?._id !== root._id? 'white' : 'primary'"
          @click="onRootClick(root)"
        />
      </template>
      <div v-else class="text-grey-3 q-pt-xs">
        {{ t('footer.noCategories') || 'Nessuna categoria' }}
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
  padding-bottom: max(env(safe-area-inset-bottom), 8px);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  box-shadow: 0 -8px 24px rgba(0,0,0,.08);
  padding-left: max(env(safe-area-inset-left), 8px);
  padding-right: max(env(safe-area-inset-right), 8px);
}

/* Toggle lungo */
.footer-bar{ display:flex; justify-content:center; align-items:center; }
.toggle-btn{
  width: 100%;
  min-height: 44px;
  padding: 0 16px;
  font-weight: 700;
}

/* Area subcategorie */
.content-wrap{ margin-top: .5rem; }
.cats-wrap{
  display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center;
}
.cat-btn{
  flex: 1 1 calc(50% - .5rem);
  text-transform: none;
  justify-content: flex-start;
  padding-left: .75rem; padding-right: .75rem;
  min-height: 44px;
  background-color: rgba(255,255,255,0.28);
  color: #fff;
  border-radius: 10px;
  line-height: 1.1;
}
@media (min-width: 768px){ .cat-btn{ flex: 1 1 calc(33.333% - .5rem); } }
@media (min-width: 1200px){ .cat-btn{ flex: 1 1 calc(25% - .5rem); } }

/* Barra radici SEMPRE visibile in basso */
.roots-wrap{
  width: 100%;
  margin-top: .5rem;
  display: flex; align-items: center; gap: .5rem;
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  padding-top: .5rem;
  border-top: 1px solid rgba(255,255,255,0.25);
  display: flex;
  justify-content: center;
}
.root-btn{
  flex: 0 0 auto;
  text-transform: none;
  min-height: 40px;
  padding: 0 .9rem;
  border-radius: 10px;
  background-color: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.35);
  white-space: nowrap;
}
/* Attiva: pill bianca con testo primario */
.root-btn:not(.q-btn--outline){ background-color: #fff; }
</style>
