// src/stores/categories.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'boot/axios'

export const useCategoriesStore = defineStore('categories', () => {
  const roots = ref([])
  const all = ref([])
  const loading = ref(false)
  const error = ref(null)

  // root aperta nel footer
  const currentParent = ref(null)
  // selezione globale (sottocategoria)
  const categorySelected = ref(null)

  async function fetchCategoriesForBusiness(businessId) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get(`/public/categories/${businessId}`)
      roots.value = Array.isArray(data?.roots) ? data.roots : []
      all.value   = Array.isArray(data?.all)   ? data.all   : []
      currentParent.value  = null
      categorySelected.value = null
    } catch (e) {
      error.value = e?.message || 'Errore nel caricamento categorie'
      roots.value = []
      all.value = []
    } finally {
      loading.value = false
    }
  }

  function getChildrenOf(parentId) {
    return all.value.filter(c =>
      Array.isArray(c.parents) && c.parents.some(p => p?._id === parentId)
    )
  }

  const visibleCategories = computed(() => {
    if (!currentParent.value) return roots.value
    return getChildrenOf(currentParent.value._id)
  })

  function openRoot(cat) {
    currentParent.value = cat
    // se la selezione attuale non è figlia di questa root, resetta
    const isChild =
      categorySelected.value &&
      Array.isArray(categorySelected.value.parents) &&
      categorySelected.value.parents.some(p => p?._id === cat?._id)
    if (!isChild) categorySelected.value = null
  }

  function selectCategory(cat) {
    categorySelected.value = cat
  }

  function backToRoots() {
    currentParent.value = null
    categorySelected.value = null
  }

  // auto-seleziona la prima sottocategoria disponibile
  function autoSelectFirstSubcategory() {
    if (categorySelected.value) return false
    for (const r of roots.value) {
      const kids = getChildrenOf(r._id)
      if (kids.length) {
        currentParent.value = r
        categorySelected.value = kids[0]
        return true
      }
    }
    return false
  }

  return {
    // state
    roots, all, loading, error,
    currentParent, categorySelected,
    // computed
    visibleCategories,
    // actions
    fetchCategoriesForBusiness, getChildrenOf,
    openRoot, selectCategory, backToRoots,
    autoSelectFirstSubcategory
  }
})
