<template>
  <div class="admin-page">
    <div class="admin-header">
      <h2>🛠️ 管理员后台</h2>
      <p class="subtitle">审核商品 · 管理用户 · 商品管理 · 今日新增 · 系统管理</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card" @click="activeTab='users'">
          <div class="stat-icon"><el-icon><User /></el-icon></div>
          <div class="stat-content">
            <div class="stat-label">用户总数</div>
            <div class="stat-value">{{ stats.userCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" @click="activeTab='goods'">
          <div class="stat-icon"><el-icon><Goods /></el-icon></div>
          <div class="stat-content">
            <div class="stat-label">商品总数</div>
            <div class="stat-value">{{ stats.goodsCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning" @click="activeTab='audit'">
          <div class="stat-icon"><el-icon><Clock /></el-icon></div>
          <div class="stat-content">
            <div class="stat-label">待审核</div>
            <div class="stat-value">{{ stats.pendingCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success" @click="activeTab='today'">
          <div class="stat-icon"><el-icon><DataLine /></el-icon></div>
          <div class="stat-content">
            <div class="stat-label">今日新增</div>
            <div class="stat-value">{{ (stats.todayNewUsers || 0) + (stats.todayNewGoods || 0) }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" type="card" class="admin-tabs">
      <el-tab-pane label="商品审核" name="audit">
        <AdminAudit />
      </el-tab-pane>
      <el-tab-pane label="商品管理" name="goods">
        <AdminGoods />
      </el-tab-pane>
      <el-tab-pane label="用户管理" name="users">
        <AdminUsers />
      </el-tab-pane>
      <el-tab-pane label="今日新增" name="today">
        <AdminToday />
      </el-tab-pane>
      <el-tab-pane label="角色管理" name="roles">
        <AdminRoles />
      </el-tab-pane>
      <el-tab-pane label="权限管理" name="permissions">
        <AdminPermissions />
      </el-tab-pane>
      <el-tab-pane label="操作日志" name="logs">
        <AdminLogs />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { User, Goods, Clock, DataLine } from '@element-plus/icons-vue'
import request from '@/utils/request'
import AdminAudit from './AdminAudit.vue'
import AdminGoods from './AdminGoods.vue'
import AdminUsers from './AdminUsers.vue'
import AdminToday from './AdminToday.vue'
import AdminRoles from './AdminRoles.vue'
import AdminPermissions from './AdminPermissions.vue'
import AdminLogs from './AdminLogs.vue'

const route = useRoute()
const activeTab = ref('audit')
const stats = reactive({ userCount: 0, goodsCount: 0, pendingCount: 0, todayNewUsers: 0, todayNewGoods: 0 })

const fetchStats = async () => {
  try {
    const res = await request.get('/admin/stats')
    Object.assign(stats, res.data)
  } catch (e) {}
}

// 根据 URL 路径同步 activeTab
watch(() => route.path, (path) => {
  if (path.includes('/admin/audit')) activeTab.value = 'audit'
  else if (path.includes('/admin/goods')) activeTab.value = 'goods'
  else if (path.includes('/admin/users')) activeTab.value = 'users'
  else if (path.includes('/admin/today')) activeTab.value = 'today'
  else if (path.includes('/admin/roles')) activeTab.value = 'roles'
  else if (path.includes('/admin/permissions')) activeTab.value = 'permissions'
  else if (path.includes('/admin/logs')) activeTab.value = 'logs'
}, { immediate: true })

onMounted(fetchStats)
</script>

<style scoped>
.admin-page { max-width: 1100px; margin: 0 auto; animation: fadeIn 0.4s ease; }
.admin-header { text-align: center; margin-bottom: 30px; }
.admin-header h2 {
  font-size: 28px; margin-bottom: 6px;
  background: linear-gradient(135deg, #2D221C, #434343);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.subtitle { color: var(--text-secondary); font-size: 14px; }

.stats-row { margin-bottom: 30px; }
.stat-card {
  background: white; border-radius: var(--radius-md); padding: 24px 20px;
  display: flex; align-items: center; gap: 16px; cursor: pointer;
  border: 1px solid var(--border-light); box-shadow: var(--shadow-xs);
  transition: all var(--transition-base); position: relative; overflow: hidden;
}
.stat-card::after {
  content: ''; position: absolute; top: 0; right: 0;
  width: 80px; height: 100%;
  background: linear-gradient(90deg, transparent, var(--primary-bg));
  pointer-events: none; opacity: 0; transition: opacity var(--transition-base);
}
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.stat-card:hover::after { opacity: 1; }

.stat-icon {
  width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm); font-size: 24px;
  background: linear-gradient(135deg, #E6F0FF, #BAE0FF);
  color: var(--accent-blue);
  transition: transform var(--transition-fast);
}
.stat-card:hover .stat-icon { transform: scale(1.1); }

/* 不同统计卡片的图标配色 */
.stat-card:nth-child(1) .stat-icon { background: linear-gradient(135deg, #FFF0EB, #FDDCD3); color: var(--primary); }
.stat-card:nth-child(3) .stat-icon { background: linear-gradient(135deg, #FFF6EA, #FFECD0); color: var(--warning); }
.stat-card:nth-child(4) .stat-icon { background: linear-gradient(135deg, #EDF8F1, #D4F0DC); color: var(--success); }

.stat-content { flex: 1; }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.stat-value {
  font-size: 26px; font-weight: 700; color: var(--text-heading);
  animation: countUp 0.6s ease both;
}
.stat-card:nth-child(2) .stat-value { animation-delay: 0.1s; }
.stat-card:nth-child(3) .stat-value { animation-delay: 0.2s; }
.stat-card:nth-child(4) .stat-value { animation-delay: 0.3s; }

.admin-tabs { margin-top: 10px; }
</style>