<template>
  <q-page class="product-page">
    <!-- HERO immagine metà pagina -->
    <div class="hero" :style="heroStyle">
      <div class="hero-overlay">
        <q-btn flat round dense icon="arrow_back" class="back-btn" @click="goBack" />
      </div>
    </div>

    <!-- CONTENUTO -->
    <div class="content q-pa-md q-gutter-md">
      <div class="row items-end justify-between">
        <div class="col">
          <h1 class="title">{{ productName(product) }}</h1>
          <div class="sku" v-if="product?.sku">SKU: {{ product.sku }}</div>
        </div>
        <div class="prices text-right">
          <div class="price-line" v-if="priceShape(product).glass">
            <q-icon name="wine_bar" size="18px" class="q-mr-xs" /> {{ priceShape(product).glass }}
          </div>
          <div class="price-line" v-if="priceShape(product).bottle">
            <q-icon name="liquor" size="18px" class="q-mr-xs" /> {{ priceShape(product).bottle }}
          </div>
          <div class="price-line" v-if="!priceShape(product).bottle && !priceShape(product).glass && priceShape(product).base">
            {{ priceShape(product).base }}
          </div>
        </div>
      </div>

      <div v-if="productSubtitle(product)" class="desc">
        {{ productSubtitle(product) }}
      </div>

      <!-- ATTRIBUTI -->
      <div class="attrs q-mt-md" v-if="(groupedAttrs.allergen.length + groupedAttrs.vitigno.length + groupedAttrs.produttore.length + groupedAttrs.other.length) > 0">
        <div v-if="groupedAttrs.vitigno.length" class="attr-block">
          <div class="block-title">{{ t('grapes', 'Vitigno') }}</div>
          <div class="chips">
            <q-chip v-for="a in groupedAttrs.vitigno" :key="a._id" dense outline>
              <q-avatar v-if="a.iconUrl" square size="18px" class="q-mr-xs"><img :src="a.iconUrl" :alt="pickAttrName(a)" /></q-avatar>
              <q-icon v-else-if="a.icon" :name="a.icon" class="q-mr-xs" />
              {{ pickAttrName(a) }}
            </q-chip>
          </div>
        </div>

        <div v-if="groupedAttrs.produttore.length" class="attr-block">
          <div class="block-title">{{ t('producer', 'Produttore') }}</div>
          <div class="chips">
            <q-chip v-for="a in groupedAttrs.produttore" :key="a._id" dense outline>
              <q-avatar v-if="a.iconUrl" square size="18px" class="q-mr-xs"><img :src="a.iconUrl" :alt="pickAttrName(a)" /></q-avatar>
              <q-icon v-else-if="a.icon" :name="a.icon" class="q-mr-xs" />
              {{ pickAttrName(a) }}
            </q-chip>
          </div>
        </div>

        <div v-if="groupedAttrs.allergen.length" class="attr-block">
          <div class="block-title">{{ t('allergens', 'Allergeni') }}</div>
          <div class="chips">
            <q-chip v-for="a in groupedAttrs.allergen" :key="a._id" dense color="amber-4" text-color="black">
              <q-avatar v-if="a.iconUrl" square size="18px" class="q-mr-xs"><img :src="a.iconUrl" :alt="pickAttrName(a)" /></q-avatar>
              <q-icon v-else-if="a.icon" :name="a.icon" class="q-mr-xs" />
              {{ pickAttrName(a) }}
            </q-chip>
          </div>
        </div>

        <div v-if="groupedAttrs.other.length" class="attr-block">
          <div class="block-title">{{ t('otherAttributes', 'Altri attributi') }}</div>
          <div class="chips">
            <q-chip v-for="a in groupedAttrs.other" :key="a._id" dense outline>
              <q-avatar v-if="a.iconUrl" square size="18px" class="q-mr-xs"><img :src="a.iconUrl" :alt="pickAttrName(a)" /></q-avatar>
              <q-icon v-else-if="a.icon" :name="a.icon" class="q-mr-xs" />
              {{ pickAttrName(a) }}
            </q-chip>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useProductsStore } from 'stores/products'

const route = useRoute()
const router = useRouter()
const { locale, t } = useI18n()
const products = useProductsStore()

const id = computed(() => route.params.id)
const fetched = ref(null)

onMounted(async () => {
  // prova a reperire dallo store, altrimenti fetch
  const inStore = products.items.find(p => p._id === id.value)
  if (inStore) {
    fetched.value = inStore
  } else if (typeof products.fetchById === 'function') {
    try { fetched.value = await products.fetchById(id.value) } catch (e) { console.log('prodotti non caricati', e) }
  }
})

const product = computed(() =>
  products.items.find(p => p._id === id.value) || fetched.value || {}
)

/* === helpers i18n === */
function productName(p) {
  const loc = locale.value
  return (p?.translations?.[loc] || p?.name || '').toString()
}
function productSubtitle(p) {
  const loc = locale.value
  const d = (p?.translations?.description?.[loc] || p?.description || '').toString().trim()
  return d
}

/* === immagini === */
const heroUrl = computed(() => product.value?.cover?.url || '')
const heroStyle = computed(() => {
  const url = heroUrl.value
  return url
    ? { backgroundImage: `url('${url}?w=1600&h=900&fit=crop&auto=format')` }
    : {}
})

/* === prezzi === */
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

/* === attributi === */
function pickAttrName(a) {
  const loc = locale.value
  return (a?.translations?.name?.[loc] || a?.name || '').toString()
}
function kindToken(a) {
  const k = a?.kind
  let raw = ''
  if (!k) raw = ''
  else if (typeof k === 'string') raw = k
  else if (typeof k === 'object') raw = k.value || k.title || k.name || ''
  const s = String(raw).toLowerCase().trim()
  if (!s) return ''
  if (s.includes('allerg')) return 'allergen'
  if (['vitigno', 'grape', 'uva'].includes(s)) return 'vitigno'
  if (['produttore', 'producer', 'cantina', 'winery'].includes(s)) return 'produttore'
  return s
}
const groupedAttrs = computed(() => {
  const out = { allergen: [], vitigno: [], produttore: [], other: [] }
  const list = (product.value?.attributes || []).filter(Boolean)
  for (const a of list) {
    const k = kindToken(a)
    if (k === 'allergen') out.allergen.push(a)
    else if (k === 'vitigno') out.vitigno.push(a)
    else if (k === 'produttore') out.produttore.push(a)
    else out.other.push(a)
  }
  return out
})

function goBack () { router.back() }
</script>

<style scoped>
.product-page{ padding:0; }

/* HERO metà pagina */
.hero{
  position: relative;
  height: min(60vh, 520px);   /* ~mezza pagina */
  background-size: cover;
  background-position: center;
  background-color: #f0f0f0;
}
.hero::after{
  content:''; position:absolute; inset:0;
  background: linear-gradient(180deg, rgba(0,0,0,.0) 0%, rgba(0,0,0,.45) 90%);
}
.hero-overlay{
  position:absolute; inset:0; display:flex; align-items:flex-start; justify-content:flex-start;
  padding: 10px;
  z-index: 1;
}
.back-btn{ color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.35); }

/* CONTENUTO */
.content{
  max-width: 980px; margin: 0 auto;
}
.title{
  font-size: clamp(22px, 4vw, 34px);
  font-weight: 800; letter-spacing: .2px; line-height: 1.1;
}
.sku{
  color: #6b7280; margin-top: 2px;
}
.prices .price-line{
  font-weight: 800; font-size: 1.1rem; line-height: 1.2;
}
.desc{
  font-size: 1rem; line-height: 1.5; color:#333;
}

/* ATTRIBUTI */
.attr-block{ margin-top: 8px; }
.block-title{
  font-size: .92rem; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
  color:#374151; margin-bottom: 6px;
}
.chips{ display:flex; flex-wrap: wrap; gap:6px; }
</style>
