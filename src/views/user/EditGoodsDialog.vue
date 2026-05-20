<template>
  <el-dialog v-model="visible" title="编辑商品" width="600px" @closed="handleClose">
    <el-form :model="editForm" label-position="top">
      <el-form-item label="物品名称">
        <el-input v-model="editForm.name" />
      </el-form-item>
      <el-form-item label="期望价格（元）">
        <el-input v-model="editForm.price" type="number" />
      </el-form-item>
      <el-form-item label="物品分类">
        <el-select v-model="editForm.category" style="width:100%">
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </el-form-item>
      <el-form-item label="详细描述">
        <el-input v-model="editForm.description" type="textarea" :rows="3" />
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
          <input type="file" accept="image/*" multiple ref="editFileInput" style="display:none" @change="onEditFiles" />
          <el-button @click="editFileInput.click()">选择图片</el-button>
          <div class="preview-list" v-if="editPreviews.length">
            <img v-for="(img, i) in editPreviews" :key="i" :src="img" class="preview-thumb" />
          </div>
          <span v-else>不修改则保留原图片</span>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submitEdit">保存修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const props = defineProps({
  modelValue: Boolean,
  goodsItem: Object
})
const emit = defineEmits(['update:modelValue', 'saved'])

const categories = ['书籍教材', '数码产品', '生活用品', '运动器材', '服饰美妆', '其他闲置']

const visible = ref(props.modelValue)
const editForm = ref({ id: null, name: '', price: '', category: '', description: '', images: '', auditReason: '' })
const editPreviews = ref([])
const editBase64s = ref([])
const editFileInput = ref(null)
const loading = ref(false)

watch(() => props.modelValue, (val) => { visible.value = val })
watch(() => props.goodsItem, (item) => {
  if (item) {
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
    if (item.images) {
      const firstImg = item.images.split(',')[0]
      if (firstImg) {
        if (firstImg.startsWith('data:image')) editPreviews.value = [firstImg]
        else editPreviews.value = ['data:image/jpeg;base64,' + firstImg.trim()]
      }
    }
  }
})

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
  loading.value = true
  try {
    // 编辑后自动重置为待审核状态
    await request.put('/goods/' + editForm.value.id, {
      ...editForm.value,
      status: 0,
      auditReason: ''
    })
    ElMessage.success('商品已更新，已重新提交审核')
    emit('saved')
    visible.value = false
  } catch (e) { /* 拦截器已处理 */ } finally { loading.value = false }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

watch(visible, (val) => emit('update:modelValue', val))
</script>

<style scoped>
.edit-upload { display: flex; flex-direction: column; gap: 8px; }
.preview-list { display: flex; gap: 6px; flex-wrap: wrap; }
.preview-thumb { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #eee; }
</style>