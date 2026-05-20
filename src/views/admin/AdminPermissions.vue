<template>
  <el-card class="tab-card" shadow="never">
    <div class="card-header">
      <div>
        <h3>权限管理</h3>
        <p class="card-desc">定义系统各个功能的权限标识，例如 user:manage 表示用户管理权限。</p>
      </div>
      <el-button type="primary" @click="openAddPerm">新增权限</el-button>
    </div>
    <el-table :data="permList" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="permName" label="权限名称" />
      <el-table-column prop="permCode" label="权限编码" />
      <el-table-column prop="parentId" label="父级ID" width="100" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="openEditPerm(row)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="deletePerm(row)">
            <template #reference><el-button size="small" type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑权限' : '新增权限'" width="400px">
      <el-form :model="permForm" label-width="80px">
        <el-form-item label="权限名称"><el-input v-model="permForm.permName" /></el-form-item>
        <el-form-item label="权限编码"><el-input v-model="permForm.permCode" /></el-form-item>
        <el-form-item label="父权限ID"><el-input-number v-model="permForm.parentId" :min="0" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPerm">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const permList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const permForm = ref({ permName: '', permCode: '', parentId: 0 })

const fetchPerms = async () => {
  loading.value = true
  try { const res = await request.get('/admin/permissions'); permList.value = res.data || [] } catch (e) { permList.value = [] } finally { loading.value = false }
}

const openAddPerm = () => { isEdit.value = false; permForm.value = { permName: '', permCode: '', parentId: 0 }; dialogVisible.value = true }
const openEditPerm = (row) => { isEdit.value = true; permForm.value = { ...row }; dialogVisible.value = true }

const submitPerm = async () => {
  if (!permForm.value.permName || !permForm.value.permCode) { ElMessage.warning('请填写完整'); return }
  try {
    if (isEdit.value) await request.put('/admin/permissions/' + permForm.value.id, permForm.value)
    else await request.post('/admin/permissions', permForm.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchPerms()
  } catch (e) { ElMessage.error('操作失败') }
}

const deletePerm = async (row) => {
  try { await request.delete('/admin/permissions/' + row.id); ElMessage.success('已删除'); fetchPerms() } catch (e) { ElMessage.error('删除失败') }
}

onMounted(fetchPerms)
</script>

<style scoped>
.tab-card { border-radius: 12px; border: 1px solid #f0f0f0; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.card-desc { color: #999; font-size: 13px; margin-top: 5px; }
</style>