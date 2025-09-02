import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { setCssVar } from 'quasar'

function normName(str = '') {
  return String(str).replace(/\s+/g, ' ').trim()
}
function nameToUrlSegment(name) {
  return encodeURIComponent(normName(name))
}
function isHex(s) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(String(s))
}

export const useBusinessStore = defineStore('business', {
  state: () => ({
    list: [],
    current: null,
    others: [],
    loading: false,
    error: null,
    _listLoaded: false,
  }),
  getters: {
    hasAny: (s) => s.list && s.list.length > 0,
  },
  actions: {
    async fetchAll() {
      if (this._listLoaded) return
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/public/business')
        this.list = Array.isArray(data) ? data : (data?.items || [])
        this._listLoaded = true
        console.log('locale in all', data)
      } catch (e) {
        this.error = e?.message || 'Errore nel caricamento dei locali'
      } finally {
        this.loading = false
      }
    },

    async fetchByName(name) {
      this.loading = true
      this.error = null
      this.current = null
      this.others = []
      try {
        const nameParam = nameToUrlSegment(name)
        const { data } = await api.get(`/public/business/by-name/${nameParam}`)
        console.log('Locale', data)
        this.current = data.current || null
        this.others = Array.isArray(data.others)
          ? data.others
          : (await this.fetchAll(), this.list.filter(b => normName(b.name) !== normName(this.current?.name)))
        const bc = this.current?.brandColor
        if (bc && isHex(bc)) setCssVar('primary', bc)
      } catch (e) {
        if (e?.response?.status === 404) {
          this.current = null
          this.others = e.response.data?.others || []
          if (!this.others.length) {
            await this.fetchAll()
            this.others = this.list
          }
        } else {
          this.error = e?.message || 'Errore sconosciuto'
        }
      } finally {
        this.loading = false
      }
    }
  }
})
