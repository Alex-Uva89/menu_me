// src/stores/lang.js
import { defineStore } from 'pinia'

export const useLangStore = defineStore('lang', {
  state: () => ({
    lang: localStorage.getItem('lang') || 'it'
  }),
  actions: {
    setLang(code) {
      this.lang = code
      localStorage.setItem('lang', code)
    }
  }
})
