import { createI18n } from 'vue-i18n'
import { boot } from 'quasar/wrappers'
import messages from 'src/i18n'
import { useLangStore } from 'stores/lang'

export default boot(({ app }) => {
  const langStore = useLangStore()

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: langStore.lang,
    fallbackLocale: 'it',
    messages
  })

  app.use(i18n)
})
