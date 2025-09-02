<script setup>
import { computed } from 'vue'
import { useCategoriesStore } from 'stores/categories'
import { useBusinessStore } from 'stores/business'
import { useI18n } from 'vue-i18n'

const categories = useCategoriesStore()
const business = useBusinessStore()
const { t, locale } = useI18n()

const isRootView = computed(() => !categories.currentParent)
const visible = computed(() => categories.visibleCategories)

function labelOf(cat) {
  const loc = locale.value
  return (cat?.translations && cat.translations[loc]) || cat?.title || ''
}

// Colore sfondo dal business (semplice)
const bgColor = computed(() => business.current?.brandColor || 'var(--q-primary, var(--leccese, #f1eee6))')
</script>

<template>
  <footer class="menu-footer q-pa-sm" :style="{ background: bgColor }">
    <!-- ROOTS -->
    <div v-if="isRootView">
      <h6 class="text-subtitle1 q-mb-sm">{{ t('footer.selectCategory') }}</h6>

      <div class="cats-wrap">
        <q-btn
          v-for="cat in visible"
          :key="cat._id"
          :label="labelOf(cat)"
          flat
          class="cat-btn"
          @click="categories.openRoot(cat)"
        />
      </div>

      <div v-if="!visible.length" class="q-mt-xs text-grey-7">
        {{ t('footer.noCategories') }}
      </div>
    </div>

    <!-- SUBCATS -->
    <div v-else>
      <div class="row items-center justify-between q-mb-sm">
        <div class="row items-center no-wrap">
          <q-btn flat dense icon="arrow_back" class="q-mr-xs" @click="categories.backToRoots" aria-label="Back" />
          <h6 class="text-subtitle1 q-my-none">{{ labelOf(categories.currentParent) }}</h6>
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

      <div v-if="!visible.length" class="q-mt-xs text-grey-7">
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
  min-height: 150px;
  z-index: 999;
  border-top: 1px solid rgba(0,0,0,0.06);
  backdrop-filter: blur(6px);
  padding-bottom: env(safe-area-inset-bottom);
}

/* mobile-first: bottoni in colonna */
.cats-wrap{ display:flex; flex-wrap:wrap; gap:.5rem; }
.cat-btn{ flex:1 1 100%; text-transform:none; justify-content:flex-start; padding-left:.5rem; padding-right:.5rem; background-color: rgba(255, 255, 255, 0.356); border-radius: 10px;}
@media (min-width:480px){ .cat-btn{ flex:1 1 calc(50% - .5rem); } }
@media (min-width:768px){ .cat-btn{ flex:1 1 calc(33.333% - .5rem); } }
</style>
