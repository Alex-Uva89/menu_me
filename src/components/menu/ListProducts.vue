<!-- src/components/menu/ListProducts.vue -->
<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from 'stores/categories'
import { useProductsStore } from 'stores/products'

const props = defineProps({
  selectedAllergens: { type: Array, default: () => [] }
})

const { locale, t } = useI18n()
const categories = useCategoriesStore()
const products = useProductsStore()

const hasSubcategory = computed(() => {
  const sel = categories.categorySelected
  const parent = categories.currentParent
  if (!sel || !parent) return false
  const isChild = Array.isArray(sel.parents) && sel.parents.some(p => p?._id === parent._id)
  return isChild
})

watch(
  () => categories.categorySelected?._id,
  async (catId) => {
    if (hasSubcategory.value && catId) {
      await products.fetchByCategory(catId)
    } else {
      products.clear()
    }
  },
  { immediate: true }
)

function productName(p) {
  const loc = locale.value
  return (p?.translations && p.translations[loc]) || p?.name || ''
}
function priceInt(n) {
  if (!n || isNaN(n)) return null
  return String(n).split('.')[0]
}
function productPrices(p) {
  const glass = p?.priceGlass > 0 ? priceInt(p.priceGlass) : null
  const bottle = p?.priceBottle > 0 ? priceInt(p.priceBottle) : null
  const base = p?.price > 0 ? priceInt(p.price) : null
  if (glass || bottle) return [glass, bottle].filter(Boolean)
  return base ? [base] : []
}

const filtered = computed(() => {
  const sel = new Set(props.selectedAllergens || [])
  if (!sel.size) return products.items
  return products.items.filter(p => {
    const ids = (p.attributes || []).map(a => a?._id).filter(Boolean)
    return !ids.some(id => sel.has(id))
  })
})
</script>

<template>
  <div class="list-products q-px-md q-pt-sm q-pb-lg">
    <div v-if="!hasSubcategory" class="placeholder">
      {{ t('selectCategory') }}
    </div>

    <template v-else>
      <!-- Skeleton -->
      <div v-if="products.loading" class="skeleton-wrap">
        <q-skeleton type="text" v-for="i in 6" :key="i" class="sk-row" />
      </div>

      <!-- Vuoto -->
      <div v-else-if="filtered.length === 0" class="placeholder">
        {{ t('noProducts') }}
      </div>

      <!-- Lista -->
      <div v-else class="list">
        <div v-for="p in filtered" :key="p._id" class="row items-center justify-between product-row">
          <div class="col name">
            {{ productName(p) }}
          </div>
          <div class="col-auto row items-center no-wrap prices">
            <span v-for="(pr, i) in productPrices(p)" :key="i" class="price-chip">{{ pr }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.list-products{ padding-bottom: 96px; }
.placeholder{ color: rgba(0,0,0,0.45); font-size: .95rem; padding: 12px 0 8px; }
.skeleton-wrap{ display: grid; gap: 10px; }
.sk-row{ height: 22px; }
.list{ display: block; }
.product-row{ padding: 12px 0; border-bottom: 1px dashed rgba(0,0,0,0.06); }
.name{ font-size: 1.02rem; line-height: 1.25rem; font-weight: 500; letter-spacing: .1px; }
.prices{ gap: 8px; }
.price-chip{ display:inline-block; min-width:36px; text-align:center; padding:2px 8px; border-radius:10px; font-weight:700; font-variant-numeric: tabular-nums; background: rgba(0,0,0,0.04); }
</style>
