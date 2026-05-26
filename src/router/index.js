import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Publish from '../views/Publish.vue'
import GoodsDetail from '../views/GoodsDetail.vue'
import ChatList from '../views/ChatList.vue'
import UserLayout from '../views/user/UserLayout.vue'
import UserProfile from '../views/user/UserProfile.vue'
import UserPublish from '../views/user/UserPublish.vue'
import UserSold from '../views/user/UserSold.vue'
import UserBought from '../views/user/UserBought.vue'
import UserFavorite from '../views/user/UserFavorite.vue'
import UserHistory from '../views/user/UserHistory.vue'
import UserEditGoods from '../views/user/UserEditGoods.vue'
import UserAddress from '../views/user/UserAddress.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/publish', component: Publish, meta: { needLogin: true } },
  { path: '/goods/:id', component: GoodsDetail },
  { path: '/chat', component: ChatList, meta: { needLogin: true } },
  {
    path: '/user',
    component: UserLayout,
    meta: { needLogin: true },
    children: [
      { path: '', redirect: '/user/profile' },
      { path: 'profile', component: UserProfile },
      { path: 'publish', component: UserPublish },
      { path: 'sold', component: UserSold },
      { path: 'bought', component: UserBought },
      { path: 'favorite', component: UserFavorite },
      { path: 'history', component: UserHistory },
      { path: 'edit', component: UserEditGoods },
      { path: 'address', component: UserAddress }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { needLogin: true, isAdmin: true },
    children: [
      { path: '', redirect: '/admin/audit' },
      { path: 'audit', component: () => import('../views/admin/AdminAudit.vue') },
      { path: 'goods', component: () => import('../views/admin/AdminGoods.vue') },
      { path: 'users', component: () => import('../views/admin/AdminUsers.vue') },
      { path: 'today', component: () => import('../views/admin/AdminToday.vue') },
      { path: 'roles', component: () => import('../views/admin/AdminRoles.vue') },
      { path: 'permissions', component: () => import('../views/admin/AdminPermissions.vue') },
      { path: 'logs', component: () => import('../views/admin/AdminLogs.vue') },
      { path: 'orders', component: () => import('../views/admin/AdminOrders.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('userRole')    // 当前角色: 'admin' 或 'user'
  if (to.meta.needLogin && !token) {
    next('/login')
  } else if (to.meta.isAdmin && role !== 'admin') {
    next('/')
  } else {
    next()
  }
})

export default router