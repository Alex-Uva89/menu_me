import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'

// In prod/staging su Netlify usiamo il proxy → baseURL = '/' (stessa origin)
// In locale (quasar dev) useremo un dev proxy (vedi punto 4)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/', // default '/'
  withCredentials: false // rotte /public non usano cookie
})

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
