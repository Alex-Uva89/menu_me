// src/router/routes.js
import MainLayout from 'layouts/MainLayout.vue'
import BusinessPage from 'pages/BusinessPage.vue'
import MenuPage from 'pages/MenuPage.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: ':businessName', name: 'business', component: BusinessPage },
      { path: ':businessName/Menu', name: 'businessMenu', component: MenuPage }
    ]
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') }
]

export default routes
