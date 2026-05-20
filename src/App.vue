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
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
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
.app { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg-page); }

/* 导航栏 — 玻璃拟态 */
.header {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--glass-border);
  box-shadow: 0 1px 8px rgba(45, 34, 28, 0.04);
  position: sticky; top: 0; z-index: 100;
}
.header-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  height: 64px; display: flex; align-items: center; justify-content: space-between;
}
.logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.logo-text {
  font-size: 22px; font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 导航链接 — 下划线动画 */
.nav { display: flex; gap: 4px; }
.nav .el-button {
  color: var(--text-body); padding: 8px 16px; border-radius: var(--radius-sm);
  font-weight: 500; position: relative; transition: color var(--transition-base);
}
.nav .el-button::after {
  content: ''; position: absolute; bottom: 2px; left: 50%;
  width: 0; height: 2.5px;
  background: var(--primary-gradient); border-radius: 2px;
  transition: width var(--transition-base), left var(--transition-base);
}
.nav .el-button:hover { color: var(--primary); }
.nav .el-button:hover::after,
.nav .el-button.active::after { width: 60%; left: 20%; }
.nav .el-button.active {
  color: var(--primary); font-weight: 600;
  background: var(--primary-bg);
}

.header-right { display: flex; align-items: center; gap: 16px; }
.user-info { display: flex; align-items: center; gap: 8px; cursor: pointer; transition: transform var(--transition-fast); }
.user-info:hover { transform: scale(1.04); }
.user-avatar {
  background: var(--primary-gradient);
  transition: box-shadow var(--transition-fast);
}
.user-info:hover .user-avatar {
  box-shadow: 0 0 0 3px rgba(232, 93, 63, 0.25);
}
.msg-badge { margin-right: 4px; }

.btn-outline {
  border: 1.5px solid var(--border-normal); border-radius: var(--radius-full);
  padding: 6px 20px; color: var(--text-body); font-weight: 500;
  transition: all var(--transition-base);
}
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
.btn-primary { border-radius: var(--radius-full); padding: 6px 20px; font-weight: 500; }

.container { flex: 1; max-width: 1200px; width: 100%; margin: 0 auto; padding: 24px; }

/* 页脚 */
.footer {
  background: linear-gradient(180deg, #FFFFFF 0%, var(--bg-page) 100%);
  border-top: 1px solid var(--border-light);
  margin-top: auto; padding: 20px; text-align: center;
  color: var(--text-secondary); font-size: 13px;
}

/* 页面过渡 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from { opacity: 0; transform: translateY(8px); }
.page-fade-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>