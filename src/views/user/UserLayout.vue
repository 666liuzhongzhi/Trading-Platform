<template>
  <div class="user-page">
    <el-row :gutter="24">
      <el-col :span="8">
        <el-card class="profile-card" shadow="never">
          <div class="profile-header">
            <div class="avatar-wrapper" @click="triggerUpload">
              <el-avatar :size="80" :src="avatarUrl" class="profile-avatar">{{ nickname?.charAt(0) || '' }}</el-avatar>
              <div class="avatar-mask">修改头像</div>
            </div>
            <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleAvatarChange" />
            <h3 class="profile-name">{{ nickname || '未设置' }}</h3>
            <p class="profile-bio">闲置交易达人</p>
          </div>
          <div class="profile-stats">
            <div class="stat-item"><span class="stat-value">{{ stats.onSale }}</span><span class="stat-label">在售</span></div>
            <div class="stat-item"><span class="stat-value">{{ stats.sold }}</span><span class="stat-label">已售</span></div>
            <div class="stat-item"><span class="stat-value">{{ stats.favCount }}</span><span class="stat-label">收藏</span></div>
          </div>
          <el-divider />
          <el-menu :default-active="$route.path" @select="handleMenuSelect">
            <el-menu-item index="/user/profile"><el-icon><User /></el-icon> 个人资料</el-menu-item>
            <el-menu-item index="/user/publish"><el-icon><Goods /></el-icon> 我的发布</el-menu-item>
            <el-menu-item index="/user/sold"><el-icon><Sell /></el-icon> 我卖出的</el-menu-item>
            <el-menu-item index="/user/bought"><el-icon><ShoppingCart /></el-icon> 我买到的</el-menu-item>
            <el-menu-item index="/user/favorite"><el-icon><Star /></el-icon> 我的收藏</el-menu-item>
            <el-menu-item index="/user/history"><el-icon><Clock /></el-icon> 浏览历史</el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="content-card" shadow="never">
          <router-view />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Goods, Star, Clock, Sell, ShoppingCart } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const handleMenuSelect = (index) => router.push(index)

const nickname = ref('')
const avatarUrl = ref('')
const fileInput = ref(null)
const stats = reactive({ onSale: 0, sold: 0, favCount: 0 })

const fetchUserInfo = async () => {
  try {
    const res = await request.get('/user/info')
    const u = res.data
    nickname.value = u.nickname || u.username || ''
    avatarUrl.value = u.avatar || ''
  } catch (e) {}
}

const fetchStats = async () => {
  try {
    const res = await request.get('/user/stats')
    Object.assign(stats, res.data)
  } catch (e) {}
}

const triggerUpload = () => fileInput.value.click()
const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) return ElMessage.warning('图片不能超过2MB')
  const reader = new FileReader()
  reader.onload = (ev) => { avatarUrl.value = ev.target.result }
  reader.readAsDataURL(file)
  // 可以在此保存头像
}

onMounted(() => { fetchUserInfo(); fetchStats() })
</script>

<style scoped>
.user-page { max-width: 1000px; margin: 0 auto; animation: fadeIn 0.4s ease; }
.profile-card { border-radius: var(--radius-lg); text-align: center; border: 1px solid var(--border-light); box-shadow: var(--shadow-xs); }
.profile-header { padding: 24px 0 16px; }
.avatar-wrapper { position: relative; display: inline-block; cursor: pointer; }
.avatar-mask {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.4); color: white; font-size: 12px;
  padding: 4px 0; border-radius: 0 0 40px 40px; opacity: 0;
  transition: opacity var(--transition-fast);
}
.avatar-wrapper:hover .avatar-mask { opacity: 1; }
.profile-avatar {
  margin-bottom: 10px;
  border: 3px solid transparent;
  background: linear-gradient(135deg, #E85D3F, #F2A65C) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
.profile-name { font-size: 18px; margin-bottom: 4px; color: var(--text-heading); }
.profile-bio { color: var(--text-secondary); font-size: 13px; }
.profile-stats { display: flex; justify-content: space-around; padding: 16px 0; }
.stat-item {
  display: flex; flex-direction: column; padding: 8px 16px;
  border-radius: var(--radius-sm); transition: all var(--transition-fast);
}
.stat-item:hover { background: var(--primary-bg); transform: translateY(-2px); }
.stat-value { font-size: 22px; font-weight: 700; color: var(--primary); }
.stat-label { font-size: 12px; color: var(--text-secondary); }

/* 菜单激活状态 */
.profile-card :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, var(--primary-bg), transparent);
  border-right: 3px solid var(--primary);
  color: var(--primary); font-weight: 600;
}
.profile-card :deep(.el-menu-item) {
  border-right: 3px solid transparent; transition: all var(--transition-fast);
}
.profile-card :deep(.el-menu-item:hover) {
  background: linear-gradient(90deg, rgba(232,93,63,0.03), transparent);
}

.content-card {
  border-radius: var(--radius-lg); border: 1px solid var(--border-light);
  min-height: 400px; padding: 24px; box-shadow: var(--shadow-xs);
}
</style>