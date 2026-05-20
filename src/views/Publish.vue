<template>
  <div class="publish-page">
    <el-card class="publish-card" shadow="never">
      <div class="publish-header">
        <h2>📦 发布闲置物品</h2>
        <p class="subtitle">让闲置流转，让资源再利用</p>
      </div>

      <el-form :model="form" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物品分类">
              <el-select v-model="form.category" placeholder="请选择" size="large" style="width:100%">
                <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望价格（元）">
              <el-input v-model="form.price" placeholder="0.00" size="large" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="物品名称">
          <el-input v-model="form.name" maxlength="30" show-word-limit size="large" placeholder="请输入物品名称" />
        </el-form-item>

        <el-form-item label="物品图片">
          <div class="upload-wrapper">
            <input
              type="file"
              accept="image/*"
              multiple
              ref="fileInput"
              style="display:none"
              @change="handleFiles"
            />
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

        <el-form-item label="详细描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请描述物品成色、使用情况、交易方式等"
          />
        </el-form-item>

        <el-form-item label="交易方式">
          <el-radio-group v-model="form.tradeType">
            <el-radio value="face">校内面交</el-radio>
            <el-radio value="express">快递邮寄</el-radio>
            <el-radio value="both">都可以</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" size="large" class="submit-btn" @click="handlePublish" :loading="submitting">
            {{ submitting ? '提交中...' : '立即发布' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Camera, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const categories = ['书籍教材', '数码产品', '生活用品', '运动器材', '服饰美妆', '其他闲置']
const submitting = ref(false)
const fileInput = ref(null)
const previews = ref([])
const base64s = ref([])

const form = ref({
  category: '',
  price: '',
  name: '',
  description: '',
  tradeType: 'face',
  images: ''
})

/**
 * 压缩图片至指定宽度和质量，返回压缩后的 Data URL
 */
const compressImage = (file, maxWidth = 800, quality = 0.6) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve(compressed)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const handleFiles = async (e) => {
  const files = e.target.files
  if (!files.length) return
  if (files.length + previews.value.length > 5) {
    ElMessage.warning('最多上传5张图片')
    return
  }
  for (let file of files) {
    try {
      // 压缩图片后再存储
      const compressedDataUrl = await compressImage(file, 800, 0.6)
      previews.value.push(compressedDataUrl)
      base64s.value.push(compressedDataUrl)
      form.value.images = base64s.value.join(',')
    } catch (err) {
      ElMessage.error('图片处理失败，请重试')
    }
  }
  fileInput.value.value = ''
}

const removeImg = (index) => {
  previews.value.splice(index, 1)
  base64s.value.splice(index, 1)
  form.value.images = base64s.value.join(',')
}

const handlePublish = async () => {
  if (!form.value.category || !form.value.name || !form.value.price || !form.value.description) {
    ElMessage.warning('请填写完整信息')
    return
  }
  submitting.value = true
  try {
    await request.post('/goods/publish', form.value)
    ElMessage.success('发布成功，等待审核')
    router.push('/')
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.publish-page { max-width: 800px; margin: 0 auto; }
.publish-card {
  border-radius: var(--radius-lg); padding: 30px;
  border: 1px solid var(--border-light); position: relative;
  box-shadow: var(--shadow-sm);
}
/* 标题底部渐变色条 */
.publish-header { text-align: center; margin-bottom: 32px; }
.publish-header h2 {
  font-size: 24px; margin-bottom: 8px; color: var(--text-heading);
}
.publish-header::after {
  content: ''; display: block; width: 48px; height: 3px;
  background: var(--primary-gradient); border-radius: 2px;
  margin: 12px auto 0;
}
.subtitle { color: var(--text-secondary); font-size: 14px; }

.upload-wrapper { display: flex; flex-direction: column; gap: 12px; }
.upload-trigger {
  width: 120px; height: 100px; border: 2px dashed var(--border-normal); border-radius: var(--radius-sm);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; transition: all var(--transition-base); color: var(--text-secondary); font-size: 13px;
}
.upload-trigger:hover {
  border-color: var(--primary); color: var(--primary);
  background: linear-gradient(135deg, rgba(232,93,63,0.02), rgba(232,93,63,0.06));
}
.preview-list { display: flex; gap: 8px; flex-wrap: wrap; }
.preview-item { position: relative; width: 80px; height: 80px; border-radius: var(--radius-xs); overflow: hidden; }
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.remove-btn {
  position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.5); color: white;
  border-radius: 50%; cursor: pointer; font-size: 14px;
}
.submit-btn {
  width: 100%; border-radius: var(--radius-xl); height: 52px;
  font-size: 16px; font-weight: 600; margin-top: 20px;
  background: var(--primary-gradient); border: none;
  transition: all var(--transition-base);
}
.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(232, 93, 63, 0.35);
}
.submit-btn:active { transform: translateY(0) scale(0.98); }
</style>