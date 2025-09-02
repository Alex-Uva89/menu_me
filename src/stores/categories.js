// stores/categories.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'boot/axios'

export const useCategoriesStore = defineStore('categories', () => {
  const roots = ref([])
  const all = ref([])
  const loading = ref(false)
  const error = ref(null)

  // root aperta nel footer per mostrare i figli
  const currentParent = ref(null)
  // 🔥 selezione globale usabile ovunque
  const categorySelected = ref(null)

  async function fetchCategoriesForBusiness(businessId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/public/categories/${businessId}`)
      roots.value = Array.isArray(data?.roots) ? data.roots : []
      all.value = Array.isArray(data?.all) ? data.all : []
      // reset vista/footer + selezione globale
      currentParent.value = null
      categorySelected.value = null
    } catch (e) {
      error.value = e?.message || 'Errore nel caricamento categorie'
      roots.value = []
      all.value = []
    } finally {
      loading.value = false
    }
  }

  // categorie visibili nel footer (root o figli della root aperta)
  const visibleCategories = computed(() => {
    if (!currentParent.value) return roots.value
    const pid = currentParent.value._id
    return all.value.filter(c => Array.isArray(c.parents) && c.parents.some(p => p?._id === pid))
  })

  // azioni semplici
  function openRoot(cat) {
    currentParent.value = cat
    categorySelected.value = cat // se vuoi mostrare subito la root in CategoryTitle
  }
  function selectCategory(cat) {
    categorySelected.value = cat
  }
  function backToRoots() {
    currentParent.value = null
    categorySelected.value = null
  }

  return {
    // state
    roots, all, loading, error,
    currentParent, categorySelected,
    // computed
    visibleCategories,
    // actions
    fetchCategoriesForBusiness, openRoot, selectCategory, backToRoots
  }
})
