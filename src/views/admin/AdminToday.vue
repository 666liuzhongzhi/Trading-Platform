<template>
  <el-card class="tab-card" shadow="never">
    <el-tabs v-model="todayTab" type="border-card">
      <el-tab-pane label="新增用户" name="todayUsers">
        <el-table :data="todayUserList" border stripe v-loading="todayLoading">
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :size="40" :src="row.avatar">{{ row.username?.charAt(0) }}</el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="username" label="账号" width="120" />
          <el-table-column prop="nickname" label="昵称" width="120" />
          <el-table-column label="角色" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.roleCode === 'admin' ? 'danger' : 'info'" effect="plain">{{ row.roleCode === 'admin' ? '管理员' : '普通用户' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="注册时间" width="160">
            <template #default="{ row }">{{ row.createTime?.substring(0, 16) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="todayUserList.length === 0 && !todayLoading" description="今日暂无新用户" />
      </el-tab-pane>
      <el-tab-pane label="新增商品" name="todayGoods">
        <el-table :data="todayGoodsList" border stripe v-loading="todayLoading">
          <el-table-column label="序号" width="60" align="center">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column label="图片" width="100">
            <template #default="{ row }">
              <el-image :src="getThumbUrl(row.images)" class="goods-thumb" fit="cover"
                :preview-src-list="getAllImageUrls(row.images)" preview-teleported>
                <template #error><div class="image-slot"><el-icon><PictureFilled /></el-icon></div></template>
              </el-image>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" min-width="180">
            <template #default="{ row }">
              <el-link type="primary" @click="$router.push('/goods/' + row.id)" :underline="false">{{ row.name }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="100" />
          <el-table-column prop="price" label="价格" width="100" align="center">
            <template #default="{ row }">¥ {{ row.price }}</template>
          </el-table-column>
          <el-table-column label="卖家" width="100" prop="sellerName" />
          <el-table-column label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="todayGoodsList.length === 0 && !todayLoading" description="今日暂无新商品" />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PictureFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

const todayTab = ref('todayUsers')
const todayLoading = ref(false)
const todayUserList = ref([])
const todayGoodsList = ref([])

// 图片处理函数
const fixImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/200/150'
  if (Array.isArray(str)) str = str[0] || ''
  if (typeof str !== 'string') return 'https://picsum.photos/200/150'
  const trimmed = str.trim()
  if (trimmed.startsWith('http') || trimmed.startsWith('data:image/')) return trimmed
  if (trimmed.length > 100) return 'data:image/jpeg;base64,' + trimmed
  if (trimmed.length >= 30) return 'data:image/jpeg;base64,' + trimmed
  return 'https://picsum.photos/200/150'
}

const getThumbUrl = (raw) => {
  if (!raw) return 'https://picsum.photos/200/150'
  const tokens = raw.split(',').filter(p => p.length > 10)
  if (tokens.length === 0) return 'https://picsum.photos/200/150'
  return fixImageUrl(tokens[0])
}

const getAllImageUrls = (raw) => {
  if (!raw) return []
  const tokens = raw.split(',').filter(p => p.length > 10)
  return tokens.map(t => fixImageUrl(t)).filter(url => url !== 'https://picsum.photos/200/150')
}

const statusText = (s) => ({ 0:'待审核',1:'已通过',2:'已驳回',3:'已售' }[s]||'')
const statusType = (s) => ({ 0:'warning',1:'success',2:'info',3:'' }[s]||'info')

const fetchTodayData = async () => {
  todayLoading.value = true
  try {
    const [userRes, goodsRes] = await Promise.all([
      request.get('/admin/today/users'),
      request.get('/admin/today/goods')
    ])
    todayUserList.value = userRes.data || []
    todayGoodsList.value = goodsRes.data || []
  } catch (e) { todayUserList.value = []; todayGoodsList.value = [] } finally { todayLoading.value = false }
}

onMounted(fetchTodayData)
</script>

<style scoped>
.tab-card { border-radius: 12px; border: 1px solid #f0f0f0; }
.goods-thumb { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; }
.image-slot { display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #999; }
</style>