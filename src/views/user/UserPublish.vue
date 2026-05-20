<template>
  <div>
    <h3 class="content-title">我的发布</h3>
    <div v-if="goodsList.length > 0" class="goods-list">
      <div
        v-for="item in goodsList"
        :key="item.id"
        class="goods-item"
        @click="goToGoods(item.id)"
      >
        <img
          :src="getImageUrl(item.images)"
          class="goods-item-img"
          @error="e => e.target.src = 'https://picsum.photos/80/60'"
        />
        <div class="goods-item-info">
          <div class="goods-item-name">{{ item.name }}</div>
          <div class="goods-item-price">¥ {{ item.price }}</div>
        </div>
        <div class="goods-item-actions">
          <el-tag :type="statusType(item.status)">{{ statusText(item.status) }}</el-tag>
          <el-button size="small" type="warning" @click.stop="openEditDialog(item)">编辑</el-button>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无发布" />

    <!-- 编辑商品对话框 -->
    <el-dialog
      v-model="editVisible"
      title="编辑商品"
      width="600px"
      @closed="editForm = {}; editPreviews = []; editBase64s = []"
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="物品名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="期望价格（元）">
          <el-input v-model="editForm.price" type="number" />
        </el-form-item>
        <el-form-item label="物品分类">
          <el-select v-model="editForm.category" style="width:100%">
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <!-- 驳回理由展示 -->
        <el-alert
          v-if="editForm.auditReason"
          title="上次审核驳回理由"
          :description="editForm.auditReason"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 15px"
        />
        <el-form-item label="物品图片（可重新上传）">
          <div class="edit-upload">
            <input
              type="file"
              accept="image/*"
              multiple
              ref="editFileInput"
              style="display:none"
              @change="onEditFiles"
            />
            <el-button @click="editFileInput.click()">选择图片</el-button>
            <div class="preview-list" v-if="editPreviews.length">
              <img
                v-for="(img, i) in editPreviews"
                :key="i"
                :src="img"
                class="preview-thumb"
              />
            </div>
            <span v-else>不修改则保留原图片</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editLoading" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()

const goodsList = ref([])

// 编辑相关
const editVisible = ref(false)
const editLoading = ref(false)
const editFileInput = ref(null)
const editPreviews = ref([])
const editBase64s = ref([])
const editForm = ref({
  id: null,
  name: '',
  price: '',
  category: '',
  description: '',
  images: '',
  auditReason: ''
})

const categories = ['书籍教材', '数码产品', '生活用品', '运动器材', '服饰美妆', '其他闲置']

// ---------- 工具函数 ----------
const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/80/60'
  const arr = str.split(',').filter(s => s && s !== 'data:' && s !== 'data:image')
  if (arr.length === 0) return 'https://picsum.photos/80/60'
  const first = arr[0].trim()
  if (first.startsWith('http') || first.startsWith('data:image')) return first
  return 'data:image/jpeg;base64,' + first
}

const statusText = (s) => ({ 0: '待审核', 1: '已通过', 2: '已驳回', 3: '已售' }[s] || '')
const statusType = (s) => ({ 0: 'warning', 1: 'success', 2: 'info', 3: '' }[s] || 'info')

// ---------- 数据请求 ----------
const fetchMyGoods = async () => {
  try {
    const userId = localStorage.getItem('userId')
    const res = await request.get('/goods/list', {
      params: { page: 1, size: 100, userId, status: null }
    })
    goodsList.value = res.data.records || []
  } catch (e) {
    goodsList.value = []
  }
}

// ---------- 用户操作 ----------
const goToGoods = (id) => {
  if (id) router.push('/goods/' + id)
}

// ---------- 编辑商品相关 ----------
const openEditDialog = (item) => {
  editForm.value = {
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category,
    description: item.description,
    images: item.images || '',
    auditReason: item.auditReason || ''
  }
  editPreviews.value = []
  editBase64s.value = []
  // 显示原图片预览
  if (item.images) {
    const firstImg = getImageUrl(item.images)
    if (firstImg && firstImg !== 'https://picsum.photos/80/60') {
      editPreviews.value = [firstImg]
    }
  }
  editVisible.value = true
}

const onEditFiles = (e) => {
  const files = e.target.files
  if (!files.length) return
  editPreviews.value = []
  editBase64s.value = []
  for (let file of files) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      if (dataUrl && dataUrl.startsWith('data:image')) {
        editPreviews.value.push(dataUrl)
        editBase64s.value.push(dataUrl)
        editForm.value.images = editBase64s.value.join(',')
      }
    }
    reader.readAsDataURL(file)
  }
}

const submitEdit = async () => {
  if (!editForm.value.name || !editForm.value.price) {
    ElMessage.warning('名称和价格不能为空')
    return
  }
  editLoading.value = true
  try {
    // 编辑后自动重置为待审核状态，清空驳回理由
    await request.put('/goods/' + editForm.value.id, {
      ...editForm.value,
      status: 0,
      auditReason: ''
    })
    ElMessage.success('商品已更新，已重新提交审核')
    editVisible.value = false
    fetchMyGoods()
  } catch (e) {
    // 拦截器已处理
  } finally {
    editLoading.value = false
  }
}

onMounted(fetchMyGoods)
</script>

<style scoped>
.content-title { font-size: 18px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-light); color: var(--text-heading); }
.goods-list { display: flex; flex-direction: column; gap: 12px; }
.goods-item {
  display: flex; align-items: center; gap: 16px; padding: 14px;
  border-radius: var(--radius-sm); border: 1px solid var(--border-light);
  cursor: pointer; transition: all var(--transition-base); background: white;
}
.goods-item:hover {
  background: var(--bg-warm); border-color: var(--primary);
  box-shadow: 0 4px 16px rgba(232, 93, 63, 0.08);
  transform: translateY(-1px);
}
.goods-item-img { width: 80px; height: 60px; border-radius: var(--radius-xs); object-fit: cover; }
.goods-item-info { flex: 1; }
.goods-item-name { font-size: 14px; margin-bottom: 4px; color: var(--text-heading); }
.goods-item-price { color: var(--danger); font-weight: 600; }
.goods-item-actions { display: flex; align-items: center; gap: 8px; }
.goods-item-actions :deep(.el-tag--warning) { background: linear-gradient(135deg, #FFF6EA, #FFECD0); color: #D4771C; border: none; }
.goods-item-actions :deep(.el-tag--success) { background: linear-gradient(135deg, #EDF8F1, #D4F0DC); color: #2D8A4E; border: none; }
.goods-item-actions :deep(.el-tag--info) { background: linear-gradient(135deg, #F5F3F0, #E8E4DE); color: #6B635B; border: none; }
.edit-upload { display: flex; flex-direction: column; gap: 8px; }
.preview-list { display: flex; gap: 6px; flex-wrap: wrap; }
.preview-thumb { width: 80px; height: 60px; object-fit: cover; border-radius: var(--radius-xs); border: 1px solid var(--border-light); }
</style>