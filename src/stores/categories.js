// stores/categories.js  (o .ts se usi TS, ma qui è JS)
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    roots: [],
    all: [],
    loading: false,
    error: null,
    // 👇 stato di selezione globale
    selectedRootId: null,
    selectedCategoryId: null,
  }),
  actions: {
    async fetchCategoriesForBusiness(businessId) {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get(`/public/categories/${businessId}`)
        this.roots = Array.isArray(data?.roots) ? data.roots : []
        this.all = Array.isArray(data?.all) ? data.all : []
        // opzionale: reset selezione quando cambio business
        this.clearSelection()
      } catch (e) {
        this.error = e?.message || 'Errore nel caricamento categorie'
        this.roots = []
        this.all = []
      } finally {
        this.loading = false
      }
    },
    getChildrenOf(parentId) {
      return this.all.filter(cat => Array.isArray(cat.parents) && cat.parents.some(p => p?._id === parentId))
    },

    // 👇 helper interni
    _byId(id) {
      if (!id) return null
      return this.all.find(c => c._id === id) || this.roots.find(c => c._id === id) || null
    },

    // 👇 azioni di selezione
    selectRoot(catOrId) {
      const id = typeof catOrId === 'string' ? catOrId : (catOrId && catOrId._id)
      this.selectedRootId = id || null
      this.selectedCategoryId = null // reset subcat quando cambio root
    },
    selectCategory(catOrId) {
      const id = typeof catOrId === 'string' ? catOrId : (catOrId && catOrId._id)
      this.selectedCategoryId = id || null
    },
    clearSelection() {
      this.selectedRootId = null
      this.selectedCategoryId = null
    },
  },
  getters: {
    selectedRoot(state) {
      return state.selectedRootId ? this._byId(state.selectedRootId) : null
    },
    selectedCategory(state) {
      return state.selectedCategoryId ? this._byId(state.selectedCategoryId) : null
    },
  }
})
