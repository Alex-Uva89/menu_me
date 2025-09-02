// src/router/routes.js
import MainLayout from 'layouts/MainLayout.vue'
import BusinessPage from 'pages/BusinessPage.vue'
import MenuPage from 'pages/MenuPage.vue'
import IndexPage from 'src/pages/IndexPage.vue'
// import { useBusinessStore } from 'stores/business'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: IndexPage,
        // Se vuoi reindirizzare al primo locale quando disponibile:
        // beforeEnter: async () => {
        //   const store = useBusinessStore()
        //   await store.fetchAll()
        //   if (store.list.length) {
        //     return { name: 'business', params: { businessName: store.list[0].name } }
        //   }
        // }
      },
      { path: ':businessName', name: 'business', component: BusinessPage },
      { path: ':businessName/Menu', name: 'businessMenu', component: MenuPage }
    ]
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') }
]

export default routes
