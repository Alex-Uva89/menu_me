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

  async function fetchCategoriesForBusiness(
    businessId,
    { preserveSelection = true, preferredCategoryId = null } = {}
  ) {
    loading.value = true
    error.value = null

    const prevSelectedId = preserveSelection ? (categorySelected.value?._id || null) : null

    try {
      const { data } = await api.get(`/public/categories/${businessId}`)
      roots.value = Array.isArray(data?.roots) ? data.roots : []
      all.value   = Array.isArray(data?.all)   ? data.all   : []

      if (!preserveSelection) {
        currentParent.value = null
        categorySelected.value = null
      }

      // Mantieni/forza selezione se valida, altrimenti fallback alla prima
      ensureSelectedForBusiness(preferredCategoryId || prevSelectedId)
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

  function openRootAndSelectFirst(cat) {
    openRoot(cat)
    const kids = getChildrenOf(cat._id)
    if (kids.length) {
      selectCategory(kids[0])
    }
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

  // ===== NEW: helpers di selezione =====
  function ensureSelectedForBusiness(preferredId = null) {
    const list = Array.isArray(all.value) ? all.value : []
    const rootsList = Array.isArray(roots.value) ? roots.value : []
    const exists = (id) => !!id && list.some(c => c?._id === id)

    const desiredId = preferredId || categorySelected.value?._id

    if (exists(desiredId)) {
      const sel = list.find(c => c._id === desiredId)
      categorySelected.value = sel

      // Trova la root “padre” della sottocategoria
      const parentId = (sel?.parents || [])
        .map(p => p?._id)
        .find(pid => rootsList.some(r => r?._id === pid))

      currentParent.value = rootsList.find(r => r._id === parentId) || null
      return true
    }

    // Se non esiste più, fallback alla prima sottocategoria disponibile
    return autoSelectFirstSubcategory()
  }

  function setCategoryById(id) {
    if (!id) return false
    const list = Array.isArray(all.value) ? all.value : []
    const cat = list.find(c => c?._id === id)
    if (!cat) return false

    categorySelected.value = cat
    const root = roots.value.find(r => (cat.parents || []).some(p => p?._id === r._id)) || null
    currentParent.value = root
    return true
  }
  // ===== /NEW =====

  return {
    // state
    roots, all, loading, error,
    currentParent, categorySelected,
    // computed
    visibleCategories,
    // actions
    fetchCategoriesForBusiness, getChildrenOf,
    openRoot, selectCategory, backToRoots,
    autoSelectFirstSubcategory, openRootAndSelectFirst,
    // NEW
    ensureSelectedForBusiness, setCategoryById
  }
})
