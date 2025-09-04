import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'boot/axios'

export const useProductsStore = defineStore('products', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchByCategory(categoryId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get('/public/products', { params: { categoryId } })
      items.value = Array.isArray(data?.items) ? data.items : []
    } catch (e) {
      error.value = e?.message || 'Errore nel caricamento prodotti'
      items.value = []
    } finally {
      loading.value = false
    }
  }

  // NEW: recupera un singolo prodotto (per la pagina di dettaglio)
  async function fetchById(id) {
    if (!id) return null
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/public/products/${encodeURIComponent(id)}`)
      // accetta formati { item }, { data }, o l'oggetto diretto
      const p = data?.item || data?.data || data
      if (!p || !p._id) throw new Error('Prodotto non trovato')
      const i = items.value.findIndex(x => x._id === p._id)
      if (i >= 0) items.value[i] = p
      else items.value.push(p)
      return p
    } catch (e) {
      error.value = e?.message || 'Errore nel caricamento prodotto'
      throw e
    } finally {
      loading.value = false
    }
  }

  function clear() {
    items.value = []
    error.value = null
  }

  return { items, loading, error, fetchByCategory, fetchById, clear }
})
