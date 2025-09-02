// src/boot/route-history.js
import { boot } from 'quasar/wrappers'
import { useNavStore } from 'stores/nav'

export default boot(({ router }) => {
  const nav = useNavStore()

  router.afterEach((to, from) => {
    // salva la rotta precedente *rispetto a quella in cui siamo arrivati ora*
    nav.setPrev(from)
  })
})
