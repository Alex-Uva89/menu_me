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

  function clear() {
    items.value = []
    error.value = null
  }

  return { items, loading, error, fetchByCategory, clear }
})
