<template>
  <div class="app">
    <header class="header">
      <div class="header-inner">
        <div class="logo" @click="$router.push('/')">
          <span class="logo-text">校园二手集市</span>
        </div>
        <nav class="nav">
          <el-button link :class="{ active: $route.path === '/' }" @click="$router.push('/')">首页</el-button>
          <el-button link :class="{ active: isPublishActive }" @click="$router.push('/publish')">发布闲置</el-button>
          <el-button link :class="{ active: isUserActive }" @click="$router.push('/user')">个人中心</el-button>
          <el-button v-if="isAdmin" link :class="{ active: isAdminActive }" @click="$router.push('/admin')">管理后台</el-button>
        </nav>
        <div class="header-right">
          <template v-if="!isLogin">
            <el-button class="btn-outline" @click="$router.push('/login')">登录</el-button>
            <el-button type="primary" class="btn-primary" @click="$router.push('/login')">注册</el-button>
          </template>
          <template v-else>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="msg-badge">
              <el-button link @click="$router.push('/chat')">
                <el-icon :size="20"><ChatDotRound /></el-icon>
              </el-button>
            </el-badge>
            <div class="user-info" @click="$router.push('/user')">
              <el-avatar :size="32" :src="avatarUrl" class="user-avatar">{{ avatarUrl ? '' : userName.charAt(0) }}</el-avatar>
              <span class="user-name">{{ userName }}</span>
            </div>
            <el-button class="btn-outline" @click="logout">退出</el-button>
          </template>
        </div>
      </div>
    </header>

    <main class="container">
      <router-view />
    </main>

    <footer class="footer">
      <div class="footer-inner">© 校园二手集市 </div>
    </footer>

    <AiFloatBall v-if="isLogin" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChatDotRound } from '@element-plus/icons-vue'
import request from '@/utils/request'
import AiFloatBall from '@/components/AiFloatBall.vue'

const route = useRoute()
const router = useRouter()
const isLogin = ref(false)
const isAdmin = ref(false)
const userName = ref('')
const avatarUrl = ref('')
const unreadCount = ref(0)

const isPublishActive = computed(() => route.path === '/publish')
const isUserActive = computed(() => route.path.startsWith('/user'))
const isAdminActive = computed(() => route.path.startsWith('/admin'))

const loadStatus = async () => {
  const token = localStorage.getItem('token')
  isLogin.value = !!token
  if (!token) {
    isAdmin.value = false
    userName.value = ''
    avatarUrl.value = ''
    unreadCount.value = 0
    return
  }
  try {
    const [infoRes, unreadRes] = await Promise.all([
      request.get('/user/info'),
      request.get('/chat/unread')
    ])
    const user = infoRes.data
    userName.value = user.nickname || user.username
    avatarUrl.value = user.avatar || ''
    isAdmin.value = user.roleCode === 'admin'
    localStorage.setItem('userRole', isAdmin.value ? 'admin' : 'user')
    unreadCount.value = unreadRes.data || 0
  } catch (e) {
    localStorage.clear()
    isLogin.value = false
    isAdmin.value = false
  }
}

let unreadHandler = null
onMounted(() => {
  loadStatus()
  window.addEventListener('storage', loadStatus)
  unreadHandler = (e) => { unreadCount.value = e.detail }
  window.addEventListener('unreadUpdate', unreadHandler)
})
onBeforeUnmount(() => {
  window.removeEventListener('storage', loadStatus)
  window.removeEventListener('unreadUpdate', unreadHandler)
})

const logout = () => {
  localStorage.clear()
  isLogin.value = false
  isAdmin.value = false
  router.push('/')
}
</script>



<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; background: #f5f7fa; }
.header { background: white; border-bottom: 1px solid #f0f0f0; position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
.logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.logo-text { font-size: 20px; font-weight: 700; color: #1677ff; }
.nav { display: flex; gap: 4px; }
.nav .el-button { color: #666; padding: 8px 16px; border-radius: 8px; }
.nav .el-button.active { color: #1677ff; background: rgba(22,119,255,0.08); }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.user-avatar { background: #1677ff; }
.msg-badge { margin-right: 4px; }
.btn-outline { border: 1px solid #ddd; border-radius: 20px; padding: 6px 20px; }
.btn-primary { border-radius: 20px; padding: 6px 20px; }
.container { flex: 1; max-width: 1200px; width: 100%; margin: 0 auto; padding: 24px; }
.footer { background: white; border-top: 1px solid #f0f0f0; margin-top: auto; padding: 20px; text-align: center; color: #999; font-size: 13px; }
</style>