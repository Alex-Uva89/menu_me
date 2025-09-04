import MainLayout from 'layouts/MainLayout.vue'
import BusinessPage from 'pages/BusinessPage.vue'
import MenuPage from 'pages/MenuPage.vue'
import IndexPage from 'src/pages/IndexPage.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: IndexPage,
      },
      { path: ':businessName', name: 'business', component: BusinessPage },
      { path: ':businessName/Menu', name: 'businessMenu', component: MenuPage },

      // Dettaglio prodotto (immagine grande + info)
      {
        path: ':businessName/prodotto/:id',
        name: 'product-detail',
        component: () => import('pages/ProductDetail.vue'),
        props: true
      }
    ]
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') }
]

export default routes
