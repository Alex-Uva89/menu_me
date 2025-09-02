<template>
  <div class="column items-center">
    <div class="text-subtitle1 text-weight-bold ellipsis">{{ title || 'Categorie' }}</div>
    <div v-if="subtitle" class="text-caption text-grey-7 ellipsis">{{ subtitle }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
})
</script>
