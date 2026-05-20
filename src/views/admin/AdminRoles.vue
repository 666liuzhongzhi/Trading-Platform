<template>
  <el-card class="tab-card" shadow="never">
    <div class="card-header">
      <div>
        <h3>角色管理</h3>
        <p class="card-desc">管理系统中的角色，不同角色拥有不同的菜单和操作权限。管理员通常拥有全部权限。</p>
      </div>
      <el-button type="primary" @click="openAddRole">新增角色</el-button>
    </div>
    <el-table :data="roleList" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="roleName" label="角色名称" />
      <el-table-column prop="roleCode" label="唯一编码" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button size="small" @click="openAssignPerm(row)">分配权限</el-button>
          <el-button size="small" @click="openEditRole(row)">编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="deleteRole(row)">
            <template #reference><el-button size="small" type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="400px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="角色名称"><el-input v-model="roleForm.roleName" /></el-form-item>
        <el-form-item label="角色编码"><el-input v-model="roleForm.roleCode" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="roleForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRole">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const roleList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const roleForm = ref({ roleName: '', roleCode: '', status: 1 })

const fetchRoles = async () => {
  loading.value = true
  try { const res = await request.get('/admin/roles'); roleList.value = res.data || [] } catch (e) { roleList.value = [] } finally { loading.value = false }
}

const openAddRole = () => { isEdit.value = false; roleForm.value = { roleName: '', roleCode: '', status: 1 }; dialogVisible.value = true }
const openEditRole = (row) => { isEdit.value = true; roleForm.value = { ...row }; dialogVisible.value = true }

const submitRole = async () => {
  if (!roleForm.value.roleName || !roleForm.value.roleCode) { ElMessage.warning('请填写完整'); return }
  try {
    if (isEdit.value) await request.put('/admin/roles/' + roleForm.value.id, roleForm.value)
    else await request.post('/admin/roles', roleForm.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    fetchRoles()
  } catch (e) { ElMessage.error('操作失败') }
}

const deleteRole = async (row) => {
  try { await request.delete('/admin/roles/' + row.id); ElMessage.success('已删除'); fetchRoles() } catch (e) { ElMessage.error('删除失败') }
}

const openAssignPerm = (row) => {
  // 分配权限功能可后续实现，此处占位
  ElMessage.info('分配权限功能开发中')
}

onMounted(fetchRoles)
</script>

<style scoped>
.tab-card { border-radius: 12px; border: 1px solid #f0f0f0; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.card-desc { color: #999; font-size: 13px; margin-top: 5px; }
</style>