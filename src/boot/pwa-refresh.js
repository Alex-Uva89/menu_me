import { boot } from 'quasar/wrappers'

export default boot(({ app }) => {
  if (!('serviceWorker' in navigator)) return

  // quando il nuovo SW prende il controllo → ricarica
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    app.config.globalProperties.$q.notify({
      message: 'Aggiornamento installato',
      caption: 'Ricarico l’app…',
      timeout: 1200
    })
    // piccolo delay per far vedere la notify
    setTimeout(() => window.location.reload(), 300)
  })

  const checkUpdate = () => navigator.serviceWorker.getRegistration().then(r => r?.update())

  // controlla update quando torni in foreground o torni online
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkUpdate()
  })
  window.addEventListener('online', checkUpdate)
})
