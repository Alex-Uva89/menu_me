<template>
  <div class="column items-center">
    <div class="text-subtitle1 text-weight-bold ellipsis">
      {{ resolvedTitle }}
    </div>
    <div v-if="resolvedSubtitle" class="text-caption text-grey-7 ellipsis">
      {{ resolvedSubtitle }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from 'stores/categories'
import { useBusinessStore } from 'stores/business'

const { t, locale } = useI18n()
const categories = useCategoriesStore()
const business = useBusinessStore()

const selected = computed(() => categories.categorySelected || categories.currentParent)

function localize(cat) {
  const loc = locale.value
  return (cat?.translations && cat.translations[loc]) || cat?.title || ''
}

const resolvedTitle = computed(() => localize(selected.value) || t('selectCategory'))
const resolvedSubtitle = computed(() => business.current?.name || '')
</script>

<style scoped></style>
