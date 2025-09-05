<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

/**
 * Config
 */
const SNOOZE_DAYS = 14
const LS_KEY_SNOOZE_UNTIL = 'pwaInstallSnoozeUntil'
const LS_KEY_INSTALLED = 'pwaInstalled' // solo statistica/UX


const showDialog = ref(false)      // dialog Android/Chrome
const showIosBanner = ref(false)   // banner iOS istruzioni
let deferredPrompt = null          // evento beforeinstallprompt catturato

const isStandalone = computed(() => {
  // Chrome/Android + Desktop
  const dm = window.matchMedia?.('(display-mode: standalone)')?.matches === true
  // iOS Safari
  const iosStandalone = typeof navigator !== 'undefined' && 'standalone' in navigator && navigator.standalone
  return dm || iosStandalone
})

const isIosSafari = computed(() => {
  const ua = (navigator.userAgent || '').toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(ua)
  const isSafari = /safari/.test(ua) && !/crios|fxios|chrome|android/.test(ua)
  return isIOS && isSafari
})

function snooze() {
  const until = new Date()
  until.setDate(until.getDate() + SNOOZE_DAYS)
  localStorage.setItem(LS_KEY_SNOOZE_UNTIL, until.toISOString())
  hideAll()
}

function canShowAgain() {
  const untilIso = localStorage.getItem(LS_KEY_SNOOZE_UNTIL)
  if (!untilIso) return true
  return new Date() > new Date(untilIso)
}

function hideAll() {
  showDialog.value = false
  showIosBanner.value = false
}

async function onInstallClick() {
  try {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    // accepted | dismissed
    if (choice?.outcome === 'accepted') {
      localStorage.setItem(LS_KEY_INSTALLED, '1')
      hideAll()
    } else {
      snooze()
    }
  } finally {
    deferredPrompt = null
  }
}

function setupBeforeInstallPrompt() {
  window.addEventListener('beforeinstallprompt', onBip)
}

function cleanupBeforeInstallPrompt() {
  window.removeEventListener('beforeinstallprompt', onBip)
}

function onBip(e) {
  // Impedisce il mini-infobar di Chrome e ci teniamo l’evento
  e.preventDefault()
  deferredPrompt = e
  // se non installata e non snoozed, mostra il dialog
  if (!isStandalone.value && canShowAgain()) {
    showDialog.value = true
  }
}

function onAppInstalled() {
  localStorage.setItem(LS_KEY_INSTALLED, '1')
  hideAll()
}

onMounted(() => {
  if (isStandalone.value) return // già installata → non mostrare nulla

  // iOS Safari: mostra banner istruzioni se non snoozed
  if (isIosSafari.value && canShowAgain()) {
    showIosBanner.value = true
  }

  // Android/Chrome: ascolta l'evento
  setupBeforeInstallPrompt()
  window.addEventListener('appinstalled', onAppInstalled)

  // Se la pagina torna visibile e avevamo snoozato, possiamo riprovare in futuro
})

onBeforeUnmount(() => {
  cleanupBeforeInstallPrompt()
  window.removeEventListener('appinstalled', onAppInstalled)
})
</script>

<template>
  <!-- Dialog per Android/Chrome -->
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 320px; max-width: 420px">
      <q-card-section class="text-h6">
        Installa l’app?
      </q-card-section>

      <q-card-section class="text-body2">
        Aggiungi questa app alla schermata Home per un’esperienza più veloce e offline.
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Più tardi" color="primary" @click="snooze" />
        <q-btn unelevated label="Installa" color="primary" @click="onInstallClick" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Banner istruzioni per iOS Safari -->
  <q-banner
    v-if="showIosBanner"
    class="bg-grey-1 text-dark q-pa-md shadow-2"
    style="position: fixed; left: 12px; right: 12px; bottom: 12px; z-index: 1000; border-radius: 12px;"
  >
    <div class="text-body1 q-mb-xs">
      Aggiungi l’app alla Home
    </div>
    <div class="text-body2">
      Apri il menu <q-icon name="ios_share" size="16px" /> e tocca
      <strong>“Aggiungi a Home”</strong>.
    </div>
    <template #action>
      <q-btn flat color="primary" label="Ok" @click="snooze" />
    </template>
  </q-banner>
</template>
