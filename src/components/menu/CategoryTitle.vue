<!-- src/components/menu/CategoryTitle.vue -->
<template>
  <div class="column items-center" style="width: 200px; margin: auto;">
    <div class="text-subtitle1 text-weight-bold">
      {{ resolvedTitle }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCategoriesStore } from 'stores/categories'


const { t, locale } = useI18n()
const categories = useCategoriesStore()


const selected = computed(() => categories.categorySelected || categories.currentParent)
function localize(cat) {
  const loc = locale.value
  return (cat?.translations && cat.translations[loc]) || cat?.title || ''
}

const resolvedTitle = computed(() => localize(selected.value) || t('selectCategory'))
</script>
