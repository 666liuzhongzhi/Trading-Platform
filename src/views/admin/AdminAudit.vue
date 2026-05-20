<template>
  <el-card class="tab-card" shadow="never">
    <div class="card-header">
      <h3>商品审核列表</h3>
      <el-tag type="warning">共 {{ auditList.length }} 件待处理</el-tag>
    </div>
    <el-table :data="auditList" border stripe v-loading="auditLoading">
      <el-table-column label="序号" width="60" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column label="图片" width="100">
        <template #default="{ row }">
          <el-image
            :src="getThumbUrl(row.images)"
            class="goods-thumb"
            fit="cover"
            :preview-src-list="getAllImageUrls(row.images)"
            preview-teleported
          >
            <template #error>
              <div class="image-slot"><el-icon><PictureFilled /></el-icon></div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column label="商品名称" min-width="180">
        <template #default="{ row }">
          <el-link type="primary" @click="openGoodsDetail(row.id)" :underline="false">{{ row.name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="100" />
      <el-table-column prop="price" label="价格" width="100" align="center">
        <template #default="{ row }">¥ {{ row.price }}</template>
      </el-table-column>
      <el-table-column label="卖家" width="100" prop="sellerName" />
      <el-table-column prop="description" label="描述" width="120" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'warning' : 'info'">{{ row.status === 0 ? '待审核' : row.status === 2 ? '已驳回' : '已通过' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" align="center">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="handleAudit(row.id, 1)">通过</el-button>
          <el-button type="danger" size="small" @click="handleAudit(row.id, 2)">驳回</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="auditList.length === 0 && !auditLoading" class="empty-state">
      <el-empty description="暂无待审核商品" />
    </div>

    <el-dialog v-model="goodsDetailVisible" title="商品详情" width="650px">
      <div v-if="goodsDetail" class="goods-detail">
        <div v-if="detailImages.length > 0" class="detail-carousel">
          <el-carousel :interval="0" height="300px" indicator-position="outside">
            <el-carousel-item v-for="(img, idx) in detailImages" :key="idx">
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
          <el-descriptions-item v-if="goodsDetail.auditReason" label="驳回理由" :span="2">{{ goodsDetail.auditReason }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { PictureFilled } from '@element-plus/icons-vue'
import request from '@/utils/request'

const auditLoading = ref(false)
const auditList = ref([])
const goodsDetailVisible = ref(false)
const goodsDetail = ref(null)

// 统一图片处理函数
const safeImage = (raw) => {
  if (!raw) return 'https://picsum.photos/200/150'
  if (Array.isArray(raw)) raw = raw[0] || ''
  if (typeof raw !== 'string') return 'https://picsum.photos/200/150'
  const trimmed = raw.trim()
  if (trimmed.startsWith('http') || trimmed.startsWith('data:image/')) return trimmed
  const parts = trimmed.split(',').filter(s => s.length > 100)
  if (parts.length > 0) {
    const first = parts[0]
    if (first.startsWith('http') || first.startsWith('data:image/')) return first
    return 'data:image/jpeg;base64,' + first
  }
  if (trimmed.length > 100) return 'data:image/jpeg;base64,' + trimmed
  return 'https://picsum.photos/200/150'
}

const getThumbUrl = (raw) => safeImage(raw)
const getAllImageUrls = (raw) => {
  if (!raw) return []
  return raw.split(',').filter(s => s.length > 100).map(s => safeImage(s))
}
const detailImages = computed(() => {
  if (!goodsDetail.value || !goodsDetail.value.images) return []
  return getAllImageUrls(goodsDetail.value.images)
})

const statusText = (s) => ({0:'待审核',1:'已通过',2:'已驳回',3:'已售'}[s]||'')

const fetchAuditList = async () => {
  auditLoading.value = true
  try { const res = await request.get('/admin/audit/list'); auditList.value = res.data || [] } catch (e) { auditList.value = [] } finally { auditLoading.value = false }
}

const openGoodsDetail = async (id) => {
  try { const res = await request.get('/goods/' + id); goodsDetail.value = res.data; goodsDetailVisible.value = true } catch (e) { ElMessage.error('获取商品详情失败') }
}

const handleAudit = async (goodsId, status) => {
  let reason = ''
  if (status === 2) {
    try {
      const { value } = await ElMessageBox.prompt('请输入驳回理由（可选）', '驳回商品', {
        confirmButtonText: '确定', cancelButtonText: '取消', inputPlaceholder: '可填写理由...'
      })
      reason = value || ''
    } catch { return }
  }
  try {
    await request.put(`/admin/audit/${goodsId}?status=${status}&reason=${encodeURIComponent(reason)}`)
    ElMessage.success(status === 1 ? '审核通过' : '已驳回')
    fetchAuditList()
  } catch (e) { ElMessage.error('审核操作失败') }
}

onMounted(fetchAuditList)
</script>

<style scoped>
.tab-card { border-radius: 12px; border: 1px solid #f0f0f0; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-header h3 { font-size: 18px; }
.goods-thumb { width: 60px; height: 60px; border-radius: 6px; object-fit: cover; }
.image-slot { display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #999; }
.image-error-slot { display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; color: #ccc; }
.no-image { height: 200px; display: flex; align-items: center; justify-content: center; color: #999; }
.detail-carousel { margin-bottom: 20px; }
.empty-state { padding: 40px; text-align: center; }
</style>