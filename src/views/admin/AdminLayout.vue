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
      <el-tab-pane label="订单管理" name="orders">
        <AdminOrders />
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
import AdminOrders from './AdminOrders.vue'

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
  else if (path.includes('/admin/orders')) activeTab.value = 'orders'
}, { immediate: true })

onMounted(fetchStats)
</script>

<style scoped>
.admin-page { max-width: 1100px; margin: 0 auto; }
.admin-header { text-align: center; margin-bottom: 30px; }
.admin-header h2 { font-size: 26px; color: #1a1a1a; margin-bottom: 6px; }
.subtitle { color: #999; font-size: 14px; }

.stats-row { margin-bottom: 30px; }
.stat-card {
  background: white; border-radius: 12px; padding: 20px;
  display: flex; align-items: center; gap: 16px; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #f0f0f0;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
.stat-icon { width: 48px; height: 48px; background: #ebf1ff; color: #1677ff; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 22px; }
.stat-card.warning .stat-icon { background: #fff3e0; color: #e6a23c; }
.stat-card.success .stat-icon { background: #e0f2f1; color: #67c23a; }
.stat-content { flex: 1; }
.stat-label { font-size: 13px; color: #999; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; color: #1a1a1a; }

.admin-tabs { margin-top: 10px; }
</style>