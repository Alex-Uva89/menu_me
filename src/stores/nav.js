// src/stores/nav.js
import { defineStore } from 'pinia'

export const useNavStore = defineStore('nav', {
  state: () => ({
    prevRoute: null // { name, fullPath, path, params, ... }
  }),
  actions: {
    setPrev(route) {
      // salva null se siamo su home, altrimenti salva la rotta
      if (!route || route.name === 'home' || route.path === '/') {
        this.prevRoute = null
      } else {
        this.prevRoute = {
          name: route.name,
          fullPath: route.fullPath || route.path,
          path: route.path,
          params: route.params
        }
      }
    },
    clear() {
      this.prevRoute = null
    }
  }
})
