import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

  const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    //component: Home
    redirect: 'position'
  },
  {
    path: '/home',
    name: 'home',
    component: Home
  },
  {
    path: '/position',
    name: 'Position',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/PositionGizmo.vue')
  },
  {
    path: '/scale',
    name: 'Scale',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/ScaleGizmo.vue')
  },
  {
    path: '/rotation',
    name: 'Rotation',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/RotationGizmo.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
