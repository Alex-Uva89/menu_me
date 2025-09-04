<!-- src/pages/ProductDetail.vue -->
<template>
  <q-page class="product-page">
    <!-- HERO: immagine metà pagina + overlay -->
    <div class="hero">
      <q-img
        v-if="heroSrc"
        class="hero-img"
        :src="heroSrc"
        :placeholder-src="heroBlur"
        :alt="productName(product)"
        fit="cover"
        no-native-menu
        :style="parallaxStyle"
        decoding="async"
      />
      <div v-else class="hero-fallback" :style="parallaxStyle"></div>

      <!-- Overlay: back + prezzo principale + prezzi secondari (+ share opzionale) -->
      <div class="hero-overlay">
        <div class="overlay-left">
          <!-- <q-btn flat round dense icon="arrow_back" class="btn-ghost" @click="goBack" /> -->
        </div>

        <div class="overlay-right row items-center q-gutter-xs">
          <!-- Prezzo principale: grande + colore brand -->
          <div
            v-if="mainPrice(product)"
            class="price-badge"
            :style="{ backgroundColor: brandHex, color: brandTextColor }"
          >
            <q-icon v-if="mainKind === 'glass'" name="wine_bar" size="18px" class="q-mr-xs" />
            <q-icon v-else-if="mainKind === 'bottle'" name="liquor" size="18px" class="q-mr-xs" />
            {{ mainPrice(product) }}
          </div>

          <!-- Prezzi secondari (se esistono oltre al principale) -->
          <q-chip
            v-if="secondaryGlass"
            dense outline square
            class="chip-ghost chip-small"
          >
            <q-icon name="wine_bar" size="14px" class="q-mr-xs" />
            {{ priceShape(product).glass }}
          </q-chip>

          <q-chip
            v-if="secondaryBottle"
            dense outline square
            class="chip-ghost chip-small"
          >
            <q-icon name="liquor" size="14px" class="q-mr-xs" />
            {{ priceShape(product).bottle }}
          </q-chip>

          <!-- Se vuoi il bottone share in overlay, togli il commento -->
          <!-- <q-btn flat round dense icon="ios_share" class="btn-ghost" @click="share" /> -->
        </div>
      </div>

      <div class="hero-gradient" />
    </div>

    <!-- SCHEDA INFO flottante sotto l'hero -->
    <div class="info-card q-pa-md">
      <div v-if="loadingView" class="q-gutter-sm">
        <q-skeleton type="rect" height="26px" width="70%" />
        <q-skeleton type="text" width="120px" />
        <q-skeleton type="rect" height="18px" width="90%" />
        <q-skeleton type="rect" height="18px" width="80%" />
        <q-skeleton type="rect" height="18px" width="60%" />
      </div>

      <template v-else>
        <div class="row items-start justify-between q-gutter-sm">
          <div class="col">
            <h1 class="title">{{ productName(product) }}</h1>
            <q-badge v-if="product?.sku" color="grey-4" text-color="grey-9" class="q-mt-xs">
              SKU: {{ product.sku }}
            </q-badge>
          </div>
          <div class="col-auto">
            <q-btn flat round dense icon="ios_share" @click="share" />
          </div>
        </div>

        <div v-if="productSubtitle(product)" class="desc q-mt-sm">
          {{ productSubtitle(product) }}
        </div>

        <!-- ATTRIBUTI -->
        <div
          class="attrs q-mt-md"
          v-if="(groupedAttrs.allergen.length + groupedAttrs.vitigno.length + groupedAttrs.produttore.length + groupedAttrs.other.length) > 0"
        >
          <div v-if="groupedAttrs.vitigno.length" class="attr-block">
            <div class="block-title">{{ L('grapes', 'Vitigno') }}</div>
            <div class="chips">
              <q-chip v-for="a in groupedAttrs.vitigno" :key="a._id" dense outline>
                <q-avatar v-if="a.iconUrl" square size="18px" class="q-mr-xs">
                  <img :src="a.iconUrl" :alt="pickAttrName(a)" />
                </q-avatar>
                <q-icon v-else-if="a.icon" :name="a.icon" class="q-mr-xs" />
                {{ pickAttrName(a) }}
              </q-chip>
            </div>
          </div>

          <div v-if="groupedAttrs.produttore.length" class="attr-block">
            <div class="block-title">{{ L('producer', 'Produttore') }}</div>
            <div class="chips">
              <q-chip v-for="a in groupedAttrs.produttore" :key="a._id" dense outline>
                <q-avatar v-if="a.iconUrl" square size="18px" class="q-mr-xs">
                  <img :src="a.iconUrl" :alt="pickAttrName(a)" />
                </q-avatar>
                <q-icon v-else-if="a.icon" :name="a.icon" class="q-mr-xs" />
                {{ pickAttrName(a) }}
              </q-chip>
            </div>
          </div>

          <div v-if="groupedAttrs.allergen.length" class="attr-block">
            <div class="block-title">{{ L('allergens', 'Allergeni') }}</div>
            <div class="chips">
              <q-chip v-for="a in groupedAttrs.allergen" :key="a._id" dense color="amber-4" text-color="black">
                <q-avatar v-if="a.iconUrl" square size="18px" class="q-mr-xs">
                  <img :src="a.iconUrl" :alt="pickAttrName(a)" />
                </q-avatar>
                <q-icon v-else-if="a.icon" :name="a.icon" class="q-mr-xs" />
                {{ pickAttrName(a) }}
              </q-chip>
            </div>
          </div>

          <div v-if="groupedAttrs.other.length" class="attr-block">
            <div class="block-title">{{ L('otherAttributes', 'Altri attributi') }}</div>
            <div class="chips">
              <q-chip v-for="a in groupedAttrs.other" :key="a._id" dense outline>
                <q-avatar v-if="a.iconUrl" square size="18px" class="q-mr-xs">
                  <img :src="a.iconUrl" :alt="pickAttrName(a)" />
                </q-avatar>
                <q-icon v-else-if="a.icon" :name="a.icon" class="q-mr-xs" />
                {{ pickAttrName(a) }}
              </q-chip>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Sezione extra contenuti (pairing, note, ecc…) -->
    <div class="content-bottom q-pa-md q-pt-none">
      <slot />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useProductsStore } from 'stores/products'
import { useBusinessStore } from 'stores/business'

const route = useRoute()
const $q = useQuasar()
const { locale, t } = useI18n()

const products = useProductsStore()
const business = useBusinessStore()

/* ===== ID & (eventuale) fetch prodotto ===== */
const id = computed(() => route.params.id)
const fetched = ref(null)

onMounted(async () => {
  // prova da store
  const inStore = products.items.find(p => p._id === id.value)
  if (inStore) {
    fetched.value = inStore
  } else if (typeof products.fetchById === 'function') {
    try {
      fetched.value = await products.fetchById(id.value)
    } catch (e) {
      $q.notify({ type: 'negative', message: e?.message || 'Prodotto non trovato' })
    }
  }

  // se arrivi via deep link e non abbiamo il brand, prova a caricarlo dal businessName
  if (!business.current?._id && route.params?.businessName && typeof business.fetchByName === 'function') {
    try {
      const name = String(route.params.businessName || '').replace(/\s+/g, ' ').trim()
      if (name) await business.fetchByName(name)
    } catch (e) {
      console.log(e)}
  }
})

const product = computed(() =>
  products.items.find(p => p._id === id.value) || fetched.value || {}
)
const loadingView = computed(() => !product.value?._id && products.loading)

/* ===== i18n ===== */
function productName(p) {
  const loc = locale.value
  return (
    p?.translations?.name?.[loc] ||
    p?.translations?.[loc] || // eventuale struttura piatta
    p?.name ||
    ''
  ).toString()
}
function productSubtitle(p) {
  const loc = locale.value
  const raw =
    p?.translations?.description?.[loc] ??
    p?.translationsDesc?.[loc] ??
    p?.descriptions?.[loc] ??
    p?.description ??
    ''
  return String(raw || '').trim()
}
function L (key, fallback) {
  try {
    const s = t(key)
    return s === key ? (fallback || key) : s
  } catch(e) {
    console.log(e)
    return fallback || key }
}

/* ===== immagini & parallax (soft) ===== */
const baseImg = computed(() => product.value?.cover?.url || '')
const heroSrc = computed(() => (baseImg.value ? `${baseImg.value}?w=2000&h=1200&fit=crop&auto=format` : ''))
const heroBlur = computed(() => (baseImg.value ? `${baseImg.value}?w=20&h=12&blur=40&fit=crop&auto=format` : ''))

const scrollY = ref(0)
function onScroll() { scrollY.value = window.scrollY || 0 }
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

const parallaxStyle = computed(() => {
  const t = Math.min(scrollY.value * 0.25, 80)   // translateY max 80px
  const s = 1 + Math.min(scrollY.value / 5000, 0.03) // scale max +3%
  return { transform: `translateY(${t * -1}px) scale(${s})` }
})

/* ===== prezzi ===== */
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
function mainPrice(p) {
  const s = priceShape(p)
  return s.bottle ?? s.base ?? s.glass
}
const mainKind = computed(() => {
  const s = priceShape(product.value)
  if (s.bottle) return 'bottle'
  if (s.base)   return 'base'
  if (s.glass)  return 'glass'
  return null
})
const secondaryGlass  = computed(() => {
  const s = priceShape(product.value)
  return !!(s.glass && mainKind.value !== 'glass')
})
const secondaryBottle = computed(() => {
  const s = priceShape(product.value)
  return !!(s.bottle && mainKind.value !== 'bottle')
})

/* ===== brand color & contrast ===== */
const brandHex = computed(() => business.current?.brandColor || '#111111')
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
const brandTextColor = computed(() => {
  const rgb = hexToRgb(brandHex.value)
  if (!rgb) return '#fff'
  return luminance(rgb) < 0.55 ? '#fff' : '#111'
})

/* ===== attributi ===== */
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

/* ===== azioni ===== */

async function share () {
  const url = window.location.href
  const title = productName(product.value)
  try {
    if (navigator.share) {
      await navigator.share({ title, text: title, url })
    } else {
      await navigator.clipboard.writeText(url)
      $q.notify({ type: 'positive', message: 'Link copiato negli appunti' })
    }
  } catch (e) {
    console.log('utente ha annullato / share non disponibile', e)
  }
}
</script>

<style scoped>
.product-page{ padding:0; }

/* ===== HERO metà pagina ===== */
.hero{
  position: relative;
  height: min(60vh, 520px);
  overflow: hidden;
  background-color: #f0f0f0;
}
.hero-img{
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  will-change: transform;
}
.hero-fallback{
  position: absolute; inset: 0;
  background: repeating-linear-gradient(45deg,#ececec,#ececec 10px,#e2e2e2 10px,#e2e2e2 20px);
  transform-origin: center;
  will-change: transform;
}
.hero-gradient{
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 90%);
  pointer-events: none;
}

/* Overlay azioni e prezzi */
.hero-overlay{
  position:absolute; inset:0; z-index:1;
  display:flex; align-items:flex-start; justify-content:space-between;
  padding: 10px;
}
.overlay-left, .overlay-right{ display:flex; align-items:center; gap:6px; }
.btn-ghost{
  color: #fff;
  background: rgba(0,0,0,.22);
  backdrop-filter: blur(3px);
}
.btn-ghost:hover{ background: rgba(0,0,0,.30); }

/* Prezzo principale: grande, su bg brand */
.price-badge{
  display:inline-flex; align-items:center; gap:8px;
  padding: 6px 12px;
  border-radius: 14px;
  font-weight: 900;
  font-size: 1.15rem;
  line-height: 1;
  box-shadow: 0 2px 6px rgba(0,0,0,.25);
}

/* Chip secondari */
.chip-ghost{
  color:#fff; background: rgba(0,0,0,.28);
  border: 1px solid rgba(255,255,255,.25);
  backdrop-filter: blur(3px);
}
.chip-small{ font-size: .85rem; }

/* ===== Scheda info flottante ===== */
.info-card{
  max-width: 980px; margin: -26px auto 0; /* fluttua sotto l'hero */
  position: relative;
  background: #fff; border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,.08);
}
.title{
  font-size: clamp(22px, 4vw, 34px);
  font-weight: 800; letter-spacing: .2px; line-height: 1.1;
}
.desc{
  font-size: 1rem; line-height: 1.6; color:#2f343c;
}

/* Attributi */
.attr-block{ margin-top: 10px; }
.block-title{
  font-size: .92rem; font-weight: 700; text-transform: uppercase; letter-spacing: .4px;
  color:#374151; margin-bottom: 6px;
}
.chips{ display:flex; flex-wrap: wrap; gap:6px; }

/* Sezione extra contenuti in fondo */
.content-bottom{
  max-width: 980px; margin: 6px auto 40px;
}
</style>
