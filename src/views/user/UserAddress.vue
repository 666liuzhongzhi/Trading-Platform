<template>
  <div>
    <div class="page-header">
      <h3 class="content-title">收货地址</h3>
      <el-button type="primary" @click="openAddDialog">新增地址</el-button>
    </div>

    <div v-if="addressList.length > 0" class="address-list">
      <div v-for="item in addressList" :key="item.id" class="address-card" :class="{ 'is-default': item.isDefault === 1 }">
        <div class="addr-info">
          <div class="addr-header">
            <span class="addr-receiver">{{ item.receiverName }}</span>
            <span class="addr-phone">{{ item.phone }}</span>
            <el-tag v-if="item.isDefault === 1" type="danger" size="small">默认</el-tag>
          </div>
          <div class="addr-detail">
            {{ item.province }}{{ item.city }}{{ item.district }} {{ item.detail }}
          </div>
        </div>
        <div class="addr-actions">
          <el-button size="small" text @click="openEditDialog(item)">编辑</el-button>
          <el-popconfirm title="确定删除此地址？" @confirm="handleDelete(item.id)">
            <template #reference>
              <el-button size="small" text type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无收货地址" />

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑地址' : '新增地址'" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="收件人">
          <el-input v-model="form.receiverName" placeholder="请输入收件人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-row :gutter="10">
          <el-col :span="8">
            <el-form-item label="省" label-width="40px">
              <el-input v-model="form.province" placeholder="省份" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="市" label-width="40px">
              <el-input v-model="form.city" placeholder="城市" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区" label-width="40px">
              <el-input v-model="form.district" placeholder="区县" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址">
          <el-input v-model="form.detail" type="textarea" placeholder="街道、门牌号等" />
        </el-form-item>
        <el-form-item label="默认地址">
          <el-switch v-model="form.isDefaultBool" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const addressList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const form = reactive({
  receiverName: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefaultBool: false
})

const fetchList = async () => {
  try {
    const res = await request.get('/address/list')
    addressList.value = res.data || []
  } catch (e) { addressList.value = [] }
}

const resetForm = () => {
  form.receiverName = ''
  form.phone = ''
  form.province = ''
  form.city = ''
  form.district = ''
  form.detail = ''
  form.isDefaultBool = false
  isEdit.value = false
  editId.value = null
}

const openAddDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (item) => {
  isEdit.value = true
  editId.value = item.id
  form.receiverName = item.receiverName || ''
  form.phone = item.phone || ''
  form.province = item.province || ''
  form.city = item.city || ''
  form.district = item.district || ''
  form.detail = item.detail || ''
  form.isDefaultBool = item.isDefault === 1
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!form.receiverName || !form.phone || !form.detail) {
    ElMessage.warning('请填写收件人、手机号和详细地址')
    return
  }
  const data = {
    receiverName: form.receiverName,
    phone: form.phone,
    province: form.province,
    city: form.city,
    district: form.district,
    detail: form.detail,
    isDefault: form.isDefaultBool ? 1 : 0
  }
  try {
    if (isEdit.value) {
      await request.put('/address/' + editId.value, data)
      ElMessage.success('地址已更新')
    } else {
      await request.post('/address/save', data)
      ElMessage.success('地址已添加')
    }
    dialogVisible.value = false
    fetchList()
  } catch (e) { ElMessage.error('操作失败') }
}

const handleDelete = async (id) => {
  try {
    await request.delete('/address/' + id)
    ElMessage.success('地址已删除')
    fetchList()
  } catch (e) { ElMessage.error('删除失败') }
}

onMounted(fetchList)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.content-title { font-size: 18px; margin: 0; }
.address-list { display: flex; flex-direction: column; gap: 12px; }
.address-card { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-radius: 8px; border: 1px solid #e8e8e8; transition: 0.2s; }
.address-card:hover { border-color: #1677ff; }
.address-card.is-default { border-color: #ff4d4f; background: #fff7f7; }
.addr-info { flex: 1; }
.addr-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.addr-receiver { font-size: 15px; font-weight: 600; }
.addr-phone { color: #666; font-size: 13px; }
.addr-detail { color: #666; font-size: 13px; }
.addr-actions { display: flex; gap: 4px; flex-shrink: 0; }
</style>
