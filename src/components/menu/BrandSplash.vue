<template>
  <transition name="fade-splash">
    <div
      v-if="show"
      class="splash"
      style="background-color: #F1EEE6;"
      role="status"
      aria-live="polite"
    >
      <div class="center">
        <q-img
          :src="logoUrl"
          alt="brand logo"
          fit="contain"
          class="brand-logo"
          ratio="1"
          no-transition
          decoding="async"
        />
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
import defaultLogo from 'assets/home_.svg'

const props = defineProps({
  show: { type: Boolean, default: false },
  color: { type: String, default: '' },
  logoSrc: { type: String, default: '' }
})

const logoUrl = computed(() => props.logoSrc || defaultLogo)
</script>

<style scoped>
.splash{ position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; }
.center{ width: 100%; max-width: 560px; padding: 24px; }
.brand-logo{ width: 100%; max-height: 60vh; }

/* IN veloce, OUT 1s */
.fade-splash-enter-active { transition: opacity .2s ease; }
.fade-splash-leave-active { transition: opacity 1s ease; }
.fade-splash-enter-from, .fade-splash-leave-to { opacity: 0; }
</style>
