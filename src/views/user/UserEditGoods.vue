<template>
  <div class="edit-goods-page">
    <el-breadcrumb separator="›" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/user' }">个人中心</el-breadcrumb-item>
      <el-breadcrumb-item>重新编辑商品</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="edit-card" shadow="never">
      <h2 class="card-title">重新编辑商品</h2>

      <!-- 驳回理由显示 -->
      <el-alert
        v-if="goods.auditReason"
        title="上次审核驳回理由"
        :description="goods.auditReason"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-form :model="form" label-position="top" ref="formRef">
        <el-form-item label="物品名称" prop="name" :rules="[{ required: true, message: '请输入名称' }]">
          <el-input v-model="form.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期望价格（元）" prop="price" :rules="[{ required: true, message: '请输入价格' }]">
              <el-input v-model="form.price" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物品分类" prop="category" :rules="[{ required: true, message: '请选择分类' }]">
              <el-select v-model="form.category" style="width:100%">
                <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细描述" prop="description" :rules="[{ required: true, message: '请输入描述' }]">
          <el-input v-model="form.description" type="textarea" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="物品图片（可重新上传）">
          <div class="upload-area">
            <input type="file" accept="image/*" multiple ref="fileInput" style="display:none" @change="handleFiles" />
            <div class="upload-trigger" @click="fileInput.click()">
              <el-icon :size="28"><Camera /></el-icon>
              <span>拍照/上传 (最多5张)</span>
            </div>
            <div class="preview-list">
              <div v-for="(img, i) in previews" :key="i" class="preview-item">
                <img :src="img" />
                <el-icon class="remove-btn" @click="removeImg(i)"><Close /></el-icon>
              </div>
            </div>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="submit-btn" :loading="submitting" @click="handleSubmit">保存并重新提交审核</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Camera, Close } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const goodsId = ref(route.query.id)

const goods = ref({})
const form = ref({
  name: '',
  price: '',
  category: '',
  description: '',
  images: ''
})
const previews = ref([])      // 用于展示的图片URL数组
const base64s = ref([])       // 新上传的base64字符串数组
const fileInput = ref(null)
const submitting = ref(false)
const categories = ['书籍教材', '数码产品', '生活用品', '运动器材', '服饰美妆', '其他闲置']

// 公共图片处理函数（与其它页面一致）
const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/200/150'
  if (Array.isArray(str)) str = str[0] || ''
  if (typeof str !== 'string') return 'https://picsum.photos/200/150'
  const trimmed = str.trim()
  if (trimmed.startsWith('http') || trimmed.startsWith('data:image/')) return trimmed
  if (trimmed.length > 100) return 'data:image/jpeg;base64,' + trimmed
  return 'https://picsum.photos/200/150'
}

// 获取商品原始信息
const fetchGoods = async () => {
  try {
    const res = await request.get('/goods/' + goodsId.value)
    goods.value = res.data
    form.value.name = goods.value.name
    form.value.price = goods.value.price
    form.value.category = goods.value.category
    form.value.description = goods.value.description
    // 处理原始图片：将每张图片转为可显示的URL存入previews数组
    if (goods.value.images) {
      const rawImages = goods.value.images.split(',').filter(Boolean)
      previews.value = rawImages.map(img => getImageUrl(img))
      base64s.value = rawImages.map(img => getImageUrl(img)) // 保持原图数据供提交
      form.value.images = goods.value.images
    }
  } catch (e) {
    ElMessage.error('获取商品信息失败')
    router.replace('/user')
  }
}

const handleFiles = (e) => {
  const files = e.target.files
  if (files.length + previews.value.length > 5) {
    ElMessage.warning('最多上传5张图片')
    return
  }
  for (let file of files) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      // 新上传的图片用压缩后的data URL
      const dataUrl = ev.target.result
      previews.value.push(dataUrl)
      base64s.value.push(dataUrl) // 存储为base64
      form.value.images = base64s.value.join(',')
    }
    reader.readAsDataURL(file)
  }
  fileInput.value.value = ''
}

const removeImg = (idx) => {
  previews.value.splice(idx, 1)
  base64s.value.splice(idx, 1)
  form.value.images = base64s.value.join(',')
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.price || !form.value.category || !form.value.description) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    await request.put('/goods/' + goodsId.value, {
      ...form.value,
      status: 0,          // 重新提交审核
      auditReason: ''     // 清空驳回理由
    })
    ElMessage.success('商品已重新提交审核')
    router.replace('/user/publish')
  } catch (e) {
    // 拦截器已处理
  } finally {
    submitting.value = false
  }
}

onMounted(fetchGoods)
</script>

<style scoped>
.edit-goods-page { max-width: 800px; margin: 0 auto; }
.breadcrumb { margin-bottom: 16px; }
.edit-card { border-radius: 16px; padding: 30px; border: 1px solid #f0f0f0; }
.card-title { font-size: 24px; text-align: center; margin-bottom: 30px; }
.upload-area { display: flex; flex-direction: column; gap: 12px; }
.upload-trigger {
  width: 120px; height: 100px; border: 1px dashed #ddd; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; color: #666; font-size: 13px;
}
.upload-trigger:hover { border-color: #1677ff; color: #1677ff; }
.preview-list { display: flex; gap: 8px; flex-wrap: wrap; }
.preview-item { position: relative; width: 80px; height: 80px; border-radius: 6px; overflow: hidden; }
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; cursor: pointer; font-size: 14px; }
.submit-btn { width: 100%; border-radius: 24px; height: 48px; font-size: 16px; margin-top: 20px; }
</style>