<!-- esempio: src/pages/MenuPage.vue (adatta al tuo path) -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { useAppStore } from 'stores/app'
import { useAttributesStore } from 'stores/attributes'
import { useLangStore } from 'stores/lang'
import { useCategoriesStore } from 'stores/categories'
import { useBusinessStore } from 'stores/business'

import LanguageButton from 'components/menu/LanguageButton.vue'
import AllergenButton from 'components/menu/AllergenButton.vue'
import CategoryTitle from 'components/menu/CategoryTitle.vue'
import FooterNav from 'components/menu/FooterNav.vue'
import ListProducts from 'components/menu/ListProducts.vue'

const route = useRoute()
const app = useAppStore()
const attrs = useAttributesStore()
const langStore = useLangStore()
const categories = useCategoriesStore()
const business = useBusinessStore()

const { locale, t } = useI18n()

const allergenSelected = ref([])

const decodedName = computed(() =>
  String(route.params.businessName || '').replace(/\s+/g, ' ').trim()
)

const lang = computed(() => langStore.lang)
locale.value = lang.value
watch(lang, (val) => { locale.value = val })

const allergenOptions = computed(() => attrs.allergensFor(lang.value))

onMounted(async () => {
  await Promise.all([ app.ensureCompanyLoaded(), attrs.fetchAllergens() ])
  await business.fetchByName(decodedName.value)
  if (business.current?._id) {
    await categories.fetchCategoriesForBusiness(business.current._id)
    categories.autoSelectFirstSubcategory() // 👈 default selezione
  }
})

watch(() => route.params.businessName, async () => {
  await business.fetchByName(decodedName.value)
  if (business.current?._id) {
    await categories.fetchCategoriesForBusiness(business.current._id)
    categories.autoSelectFirstSubcategory() // 👈 default selezione
  }
})
</script>

<template>
  <q-page class="q-pa-none with-sticky-footer">
    <div class="menu-header row items-center justify-between q-px-md q-py-sm">
      <div class="col-auto">
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

      <div class="col-auto">
        <AllergenButton
          :selected="allergenSelected"
          :options="allergenOptions"
          @update:selected="val => allergenSelected = val"
        />
      </div>
    </div>

    <!-- 👇 Lista prodotti -->
    <ListProducts :selected-allergens="allergenSelected" />

    <!-- 👇 Footer -->
    <FooterNav />
  </q-page>
</template>

<style scoped>
.menu-header {
  position: sticky;
  top: 56px;
  z-index: 10;
  background: var(--leccese, #f1eee6);
  border-bottom: 1px solid rgba(0,0,0,0.06);
  backdrop-filter: blur(6px);
}
.with-sticky-footer{
  padding-bottom: 120px; /* evita che il footer copra la lista */
}
</style>
