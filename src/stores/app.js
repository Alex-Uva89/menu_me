// src/stores/app.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useAppStore = defineStore('app', {
  state: () => ({
    companyTitle: 'Mamma Elvira', // fallback
    currentBusinessName: null,
    _companyLoaded: false
  }),
  actions: {
    async ensureCompanyLoaded () {
      if (this._companyLoaded) return
      try {
        const { data } = await api.get('/public/company')
        this.companyTitle = data?.brandName || data?.name || this.companyTitle
      } catch (e) {
        console.error('errore caricamento company', e)
      } finally {
        this._companyLoaded = true
      }
    },
    setCurrentBusinessName (name) {
      this.currentBusinessName = name || null
    }
  }
})
