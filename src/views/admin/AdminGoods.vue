<template>
  <el-card class="tab-card" shadow="never">
    <div class="card-header">
      <el-input v-model="goodsSearch" placeholder="搜索商品名称/描述" clearable style="width: 200px" @keyup.enter="fetchGoodsList(1)" />
      <el-select v-model="goodsStatus" placeholder="状态筛选" clearable style="width: 120px; margin-left: 10px" @change="fetchGoodsList(1)">
        <el-option label="全部" :value="null" />
        <el-option label="待审核" :value="0" />
        <el-option label="已通过" :value="1" />
        <el-option label="已驳回" :value="2" />
        <el-option label="已售" :value="3" />
      </el-select>
    </div>

    <el-table :data="goodsList" border stripe v-loading="goodsLoading">
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
          <el-link type="primary" @click="openGoodsDetail(row.id)" :underline="false">{{ row.name }}</el-link>
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
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openGoodsDetail(row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination class="pagination" background layout="prev, pager, next" :total="goodsTotal" :page-size="goodsPageSize" @current-change="fetchGoodsList" />

    <!-- 商品详情弹窗 -->
    <el-dialog v-model="goodsDetailVisible" title="商品详情" width="650px">
      <div v-if="goodsDetail" class="goods-detail">
        <div v-if="sanitizedImages.length > 0" class="detail-carousel">
          <el-carousel :interval="0" height="300px" indicator-position="outside">
            <el-carousel-item v-for="(img, idx) in sanitizedImages" :key="idx">
              <el-image :src="img" fit="contain" style="height: 100%; width: 100%;">
                <template #error><div class="image-error-slot"><el-icon :size="40"><PictureFilled /></el-icon></div></template>
              </el-image>
            </el-carousel-item>
          </el-carousel>
        </div>
        <div v-else class="no-image">暂无图片</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">{{ goodsDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ goodsDetail.category }}</el-descriptions-item>
          <el-descriptions-item label="价格">¥ {{ goodsDetail.price }}</el-descriptions-item>
          <el-descriptions-item label="卖家">{{ goodsDetail.sellerName }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ statusText(goodsDetail.status) }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ goodsDetail.createTime?.substring(0,10) }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ goodsDetail.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { PictureFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

const goodsLoading = ref(false)
const goodsList = ref([])
const goodsSearch = ref('')
const goodsStatus = ref(null)
const goodsTotal = ref(0)
const goodsPageSize = ref(10)

const goodsDetailVisible = ref(false)
const goodsDetail = ref(null)

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

const sanitizedImages = computed(() => {
  if (!goodsDetail.value || !goodsDetail.value.images) return []
  return getAllImageUrls(goodsDetail.value.images)
})

const statusText = (s) => ({ 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已售' }[s] || '')
const statusType = (s) => ({ 0: 'warning', 1: 'success', 2: 'info', 3: '' }[s] || 'info')

const fetchGoodsList = async (page = 1) => {
  goodsLoading.value = true
  try {
    const res = await request.get('/admin/goods', { params: { page, size: goodsPageSize.value, keyword: goodsSearch.value, status: goodsStatus.value } })
    goodsList.value = res.data.records || []
    goodsTotal.value = res.data.total
  } catch (e) { goodsList.value = [] } finally { goodsLoading.value = false }
}

const openGoodsDetail = async (id) => {
  try {
    const res = await request.get('/goods/' + id)
    goodsDetail.value = res.data
    goodsDetailVisible.value = true
  } catch (e) { ElMessage.error('获取商品详情失败') }
}

onMounted(() => fetchGoodsList())
</script>

<style scoped>
.tab-card { border-radius: 12px; border: 1px solid #f0f0f0; }
.card-header { display: flex; align-items: center; margin-bottom: 20px; }
.goods-thumb { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; }
.image-slot { display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #999; }
.image-error-slot { display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #ccc; }
.no-image { height: 200px; display: flex; align-items: center; justify-content: center; color: #999; }
.pagination { margin-top: 15px; justify-content: center; }
.detail-carousel { margin-bottom: 20px; }
</style>