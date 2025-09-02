// src/stores/attributes.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

function safeHex(v) {
  if (!v) return null
  const s = String(v).trim()
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(s) ? s : null
}

export const useAttributesStore = defineStore('attributes', {
  state: () => ({
    allergens: [],    // [{_id,name,slug,color,icon,iconUrl,translations}]
    loading: false,
    error: null,
    _loaded: false
  }),
  getters: {
    // Mappa id → allergene
    allergenMap: (s) => Object.fromEntries(s.allergens.map(a => [a._id, a])),
    // Restituisce gli allergeni con etichetta nella lingua richiesta
    allergensFor: (s) => {
      return (lang = 'it') => s.allergens.map(a => ({
        id: a._id,
        label: a.translations?.name?.[lang] || a.name,
        color: safeHex(a.color),
        icon: a.icon || '',
        iconUrl: a.iconUrl || null,
        slug: a.slug
      }))
    }
  },
  actions: {
    async fetchAllergens(force = false) {
      if (this._loaded && !force) return
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/public/attributes/allergens')
        if (data?.ok) {
          this.allergens = data.data || []
          this._loaded = true
        } else {
          throw new Error(data?.error || 'fetch failed')
        }
      } catch (e) {
        this.error = e?.message || 'Errore caricamento allergeni'
      } finally {
        this.loading = false
      }
    }
  }
})
