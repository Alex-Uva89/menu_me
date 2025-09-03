<!-- src/components/menu/ListProducts.vue -->
<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from 'stores/categories'
import { useProductsStore } from 'stores/products'

const props = defineProps({
  selectedAllergens: { type: Array, default: () => [] },
  glassIcon:  { type: String, default: 'wine_bar' }, // icona header colonna "calice"
  bottleIcon: { type: String, default: 'liquor' }    // icona header colonna "bottiglia"
})

const { locale, t } = useI18n()
const categories = useCategoriesStore()
const products = useProductsStore()

/* --- stato selezione sottocategoria --- */
const hasSubcategory = computed(() => {
  const sel = categories.categorySelected
  const parent = categories.currentParent
  if (!sel || !parent) return false
  return Array.isArray(sel.parents) && sel.parents.some(p => p?._id === parent._id)
})

watch(
  () => categories.categorySelected?._id,
  async (catId) => {
    if (hasSubcategory.value && catId) {
      await products.fetchByCategory(catId)
    }
  },
  { immediate: true }
)

/* --- helpers i18n & prezzi --- */
function productName(p) {
  const loc = locale.value
  return (p?.translations && p.translations[loc]) || p?.name || ''
}
function priceInt(n) {
  if (n == null || isNaN(n)) return null
  return String(n).split('.')[0]
}
/** Restituisce sempre 3 campi, così la griglia è stabile */
function priceShape(p) {
  const glass  = p?.priceGlass  > 0 ? priceInt(p.priceGlass)  : null
  const bottle = p?.priceBottle > 0 ? priceInt(p.priceBottle) : null
  const base   = p?.price       > 0 ? priceInt(p.price)       : null
  return { glass, bottle, base }
}

/* --- filtro FE per allergeni --- */
const filtered = computed(() => {
  const sel = new Set(props.selectedAllergens || [])
  if (!sel.size) return products.items
  return products.items.filter(p => {
    const ids = (p.attributes || []).map(a => a?._id).filter(Boolean)
    return !ids.some(id => sel.has(id))
  })
})

/** se almeno un prodotto ha glass/bottle, mostro l'header con icone */
const showPriceHeader = computed(() =>
  filtered.value.some(p => (p?.priceGlass > 0) || (p?.priceBottle > 0))
)
</script>

<template>
  <div class="menu-list q-px-md q-pt-md q-pb-xl">
    <!-- stato senza sottocategoria -->
    <div v-if="!hasSubcategory && products.items.length === 0" class="placeholder">
      {{ t('selectCategory') }}
    </div>

    <template v-else>
      <!-- Skeleton -->
      <div v-if="products.loading" class="skeleton-list">
        <div class="sk-header" v-if="true">
          <div></div>
          <q-skeleton type="QAvatar" class="sk-ico"/>
          <q-skeleton type="QAvatar" class="sk-ico"/>
        </div>
        <div v-for="i in 7" :key="i" class="sk-row">
          <q-skeleton type="text" class="sk-name" />
          <q-skeleton type="text" class="sk-price" />
          <q-skeleton type="text" class="sk-price" />
        </div>
      </div>

      <!-- Nessun prodotto -->
      <div v-else-if="filtered.length === 0" class="placeholder">
        {{ t('noProducts') }}
      </div>

      <!-- Lista -->
      <div v-else class="product-wrap">
        <!-- Header prezzi a icone (sopra le due colonne) -->
        <div v-if="showPriceHeader" class="price-header">
          <div class="header-name"></div>
          <div class="header-col ico">
            <q-icon :name="glassIcon" size="18px" />
          </div>
          <div class="header-col ico">
            <q-icon :name="bottleIcon" size="18px" />
          </div>
        </div>

        <ul class="product-list" role="list">
          <li
            v-for="p in filtered"
            :key="p._id"
            class="product-row"
            role="listitem"
          >
            <div class="name">{{ productName(p) }}</div>

            <!-- Colonna calice -->
            <div class="price-col">
              <span
                v-if="priceShape(p).glass !== null"
                class="price-num"
              >{{ priceShape(p).glass }}</span>
            </div>

            <!-- Colonna bottiglia (o base se non ci sono glass/bottle) -->
            <div class="price-col">
              <span
                v-if="priceShape(p).bottle !== null"
                class="price-num"
              >{{ priceShape(p).bottle }}</span>
              <span
                v-else-if="priceShape(p).glass === null && priceShape(p).base !== null"
                class="price-num"
              >{{ priceShape(p).base }}</span>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.menu-list{ padding-bottom: 120px; }

/* testi di stato */
.placeholder{
  color: rgba(0,0,0,0.56);
  font-size: 1rem;
  padding: 18px 0 10px;
}

/* Skeleton coerente con griglia a 3 colonne */
.skeleton-list{ display: grid; gap: 12px; }
.sk-header{
  display: grid;
  grid-template-columns: 1fr 72px 72px;
  align-items: center;
  column-gap: 28px;
  padding: 4px 0 0;
}
.sk-ico{ width: 24px; height: 24px; border-radius: 6px; }
.sk-row{
  display: grid;
  grid-template-columns: 1fr 72px 72px;
  align-items: center;
  column-gap: 28px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0,0,0,0.10);
}
.sk-name{ width: 70%; height: 20px; }
.sk-price{ width: 42px; height: 20px; }

/* wrapper lista + header */
.product-wrap{ display: block; }

/* header colonne prezzo (icone) */
.price-header{
  display: grid;
  grid-template-columns: 1fr 72px 72px;  /* nome | calice | bottiglia */
  align-items: center;
  column-gap: 28px;
  padding: 4px 0 8px;
  color: rgba(0,0,0,0.55);
}
.header-name{ /* vuoto, tiene la colonna del nome */ }
.header-col.ico{
  display: flex;
  justify-content: flex-end;
}

/* lista prodotti */
.product-list{
  list-style: none;
  margin: 0;
  padding: 0;
}
.product-row{
  display: grid;
  grid-template-columns: 1fr 72px 72px; /* stabile e leggibile */
  align-items: start;
  column-gap: 28px;
  row-gap: 4px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(0,0,0,0.12);
}

/* nome multilinea, aria generosa */
.name{
  font-size: 1.08rem;
  line-height: 1.5rem;
  font-weight: 560;
  letter-spacing: .1px;
  white-space: normal;
  overflow: visible;
  word-break: break-word;
}

/* colonne prezzo destra */
.price-col{
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* solo numeri, tabulari, senza sfondi */
.price-num{
  font-weight: 740;
  font-size: 1.08rem;
  line-height: 1.2rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: .2px;
  min-width: 36px;
  text-align: right;
}

/* tablet/desktop: più aria */
@media (min-width: 768px){
  .product-row{ column-gap: 36px; padding: 20px 0; }
  .price-header{ column-gap: 36px; }
}
</style>
