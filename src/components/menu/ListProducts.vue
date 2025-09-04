<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from 'stores/categories'
import { useProductsStore } from 'stores/products'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  selectedAllergens: { type: Array, default: () => [] },
  glassIcon:  { type: String, default: 'wine_bar' },
  bottleIcon: { type: String, default: 'liquor' },
  // Colore brand per la targhettina prezzo (puoi passare "var(--brand)" o un hex)
  brandColor: { type: String, default: 'var(--brand-color, #111111)' },
  // Vista iniziale: 'list' | 'cards'
  defaultView: { type: String, default: 'list' }
})

const { locale, t } = useI18n()
const categories = useCategoriesStore()
const products = useProductsStore()
const view = ref(props.defaultView) // 'list' | 'cards'
const router = useRouter()
const route = useRoute()

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
  // supporta sia translations.name[loc], sia translations[loc], con fallback a name
  return (
    p?.translations?.name?.[loc] ||
    p?.translations?.[loc] ||
    p?.name ||
    ''
  ).toString()
}
function productSubtitle(p) {
  const loc = locale.value
  // prova varie forme comuni per la descrizione (i18n e non)
  const raw =
    p?.translations?.description?.[loc] ??
    p?.translationsDesc?.[loc] ??
    p?.descriptions?.[loc] ??
    p?.description ??
    ''
  const s = String(raw || '').trim()
  // tronco per la lista
  return s.length > 160 ? s.slice(0, 157) + '…' : s
}
function priceInt(n) {
  if (n == null || isNaN(n)) return null
  return String(n).split('.')[0]
}
function priceShape(p) {
  const glass  = p?.priceGlass  > 0 ? priceInt(p.priceGlass)  : null
  const bottle = p?.priceBottle > 0 ? priceInt(p.priceBottle) : null
  const base   = p?.price       > 0 ? priceInt(p.price)       : null
  return { glass, bottle, base }
}
// prezzo “principale” per la card: priorità bottiglia > base > calice
function mainPrice(p) {
  const s = priceShape(p)
  return s.bottle ?? s.base ?? s.glass
}

/* --- immagini --- */
// Usa l'URL della cover dal backend; opzionalmente ridimensiona via query
function coverUrl(p, { w = 600, h = 800 } = {}) {
  const url = p?.cover?.url
  if (!url) return ''
  // es. Sanity CDN: ?w=&h=&fit=&auto=
  return `${url}?w=${w}&h=${h}&fit=crop&auto=format`
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

/** se almeno un prodotto ha glass/bottle, mostro l'header con icone (solo vista lista) */
const showPriceHeader = computed(() =>
  filtered.value.some(p => (p?.priceGlass > 0) || (p?.priceBottle > 0))
)

/* --- navigazione --- */
function goToProduct(p) {
  if (!p?._id) return
  router.push({
    name: 'product-detail',
    params: {
      businessName: route.params.businessName,
      id: p._id
    }
  })
}
</script>

<template>
  <div class="menu-list q-px-md q-pt-md q-pb-xl">
    <!-- switch vista -->
    <div class="view-toggle">
      <q-btn-toggle
        v-model="view"
        dense
        unelevated
        color="primary"
        toggle-color="primary"
        :options="[
          {label: '', icon: 'list', value: 'list'},
          {label: '', icon: 'grid_view', value: 'cards'}
        ]"
      />
    </div>

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

      <!-- ===== Vista LISTA ===== -->
      <div v-else-if="view === 'list'" class="product-wrap">
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
            class="product-row clickable"
            role="listitem"
            @click="goToProduct(p)"
            @keyup.enter="goToProduct(p)"
            tabindex="0"
            :aria-label="productName(p)"
          >
            <div class="name">
              <div class="title">{{ productName(p) }}</div>
              <div v-if="productSubtitle(p)" class="subtitle">{{ productSubtitle(p) }}</div>
            </div>

            <div class="price-col">
              <span v-if="priceShape(p).glass !== null" class="price-num">
                {{ priceShape(p).glass }}
              </span>
            </div>

            <div class="price-col">
              <span v-if="priceShape(p).bottle !== null" class="price-num">
                {{ priceShape(p).bottle }}
              </span>
              <span v-else-if="priceShape(p).glass === null && priceShape(p).base !== null" class="price-num">
                {{ priceShape(p).base }}
              </span>
            </div>
          </li>
        </ul>
      </div>

      <!-- ===== Vista CARDS ===== -->
      <div v-else class="cards-wrap">
        <ul class="cards-grid" role="list">
          <li
            v-for="p in filtered"
            :key="p._id"
            class="product-card clickable"
            :style="{ backgroundImage: coverUrl(p) ? `url('${coverUrl(p)}')` : undefined }"
            role="listitem"
            @click="goToProduct(p)"
            @keyup.enter="goToProduct(p)"
            tabindex="0"
            :aria-label="productName(p)"
          >
            <!-- fallback empty bg -->
            <div v-if="!coverUrl(p)" class="no-image"></div>

            <div class="card-footer">
              <div class="card-title">{{ productName(p) }}</div>
              <div class="price-badge" :style="{ backgroundColor: props.brandColor }">
                {{ mainPrice(p) }}
              </div>
            </div>
          </li>
        </ul>
      </div>
      <!-- ===== /Vista CARDS ===== -->

    </template>
  </div>
</template>

<style scoped>
.menu-list{ padding-bottom: 120px; }

/* toggle vista */
.view-toggle{
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
}

/* testi di stato */
.placeholder{
  color: rgba(0,0,0,0.56);
  font-size: 1rem;
  padding: 18px 0 10px;
}

/* ===== SKELETON (flex) ===== */
.skeleton-list{ display: flex; flex-direction: column; gap: 12px; }
.sk-header{
  display: flex; align-items: center; gap: 28px; padding: 4px 0 0;
}
.sk-header > div:first-child{ flex: 1; } /* colonna nome */
.sk-ico{ width: 24px; height: 24px; border-radius: 6px; }

.sk-row{
  display: flex; align-items: center; gap: 28px;
  padding: 16px 0; border-bottom: 1px solid rgba(0,0,0,0.10);
}
.sk-name{ flex: 1; height: 20px; }
.sk-price{ width: 42px; height: 20px; }

/* ===== LISTA (flex) ===== */
.product-wrap{ display: block; }

.price-header{
  display: flex; align-items: center; gap: 28px;
  padding: 4px 0 8px; color: rgba(0,0,0,0.55);
}
.price-header .header-name{ flex: 1; }
.price-header .header-col.ico{ display: flex; justify-content: flex-end; }
.price-header .header-col.ico:first-of-type{ width: 82px; }  /* calice */
.price-header .header-col.ico:last-of-type{  width: 30px; }  /* bottiglia */

.product-list{ list-style: none; margin: 0; padding: 0; }

.product-row{
  display: flex; align-items: flex-start; gap: 28px;
  padding: 18px 0; border-bottom: 1px solid rgba(0,0,0,0.12);
}
.clickable{ cursor: pointer; }

.name{
  flex: 1;
  white-space: normal; overflow: visible; word-break: break-word;
}
.name .title{
  font-size: 1.08rem; line-height: 1.5rem;
  font-weight: 560; letter-spacing: .1px;
  margin-bottom: 2px;
}
.name .subtitle{
  font-size: .92rem; line-height: 1.25rem;
  color: rgba(0,0,0,0.60);
  max-height: 2.5rem; overflow: hidden;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}

.price-col{ display: flex; justify-content: flex-end; align-items: center; }
.product-row .price-col:first-of-type{ width: 82px; } /* calice */
.product-row .price-col:last-of-type{  width: 30px; } /* bottiglia/base */

.price-num{
  font-weight: 740; font-size: 1.08rem; line-height: 1.2rem;
  font-variant-numeric: tabular-nums; letter-spacing: .2px;
  min-width: 36px; text-align: right;
}

/* ===== CARDS (flex) ===== */
.cards-wrap{ width: 90%; margin: 8px auto 0; }
.cards-grid{
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 0;
}
.product-card{
  position: relative;
  width: clamp(220px, 90vw, 400px);
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-color: #f1f1f1;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}
.product-card .no-image{
  position: absolute; inset: 0;
  background: repeating-linear-gradient(
    45deg, #ececec, #ececec 10px, #e2e2e2 10px, #e2e2e2 20px
  );
}
.card-footer{
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 8px 10px;
  display: flex; align-items: flex-end; gap: 10px;
  justify-content: space-between;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 90%);
}
.card-title{
  color: #fff; font-weight: 600; line-height: 1.2;
  text-shadow: 0 1px 2px rgba(0,0,0,.35);
  max-height: 2.4em; overflow: hidden;
}
.price-badge{
  color: #fff; font-weight: 800; padding: 4px 8px;
  border-radius: 10px; line-height: 1; white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0,0,0,.25);
}

/* tablet/desktop */
@media (min-width: 768px){
  .product-row{ padding: 20px 0; }
  .cards-grid{ gap: 16px; }
  .product-card{ width: clamp(260px, 24vw, 420px); }
}
</style>
