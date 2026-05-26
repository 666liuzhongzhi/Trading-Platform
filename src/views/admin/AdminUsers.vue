<template>
  <el-card class="tab-card" shadow="never">
    <div class="card-header">
      <el-input v-model="userSearch" placeholder="搜索用户名/昵称" clearable style="width: 200px" @keyup.enter="fetchUsers(1)" />
      <el-select v-model="userStatus" placeholder="状态" clearable style="width: 100px; margin-left: 10px" @change="fetchUsers(1)">
        <el-option label="正常" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-select v-model="userRoleId" placeholder="角色" clearable style="width: 120px; margin-left: 10px" @change="fetchUsers(1)">
        <el-option v-for="r in roleList" :key="r.id" :label="r.roleName" :value="r.id" />
      </el-select>
    </div>

    <el-table :data="userList" border stripe v-loading="userLoading">
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
          <el-tag v-if="row.roleCode === 'admin'" type="danger" effect="plain">管理员</el-tag>
          <el-tag v-else type="info" effect="plain">普通用户</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注册时间" width="120">
        <template #default="{ row }">{{ row.createTime?.substring(0,10) }}</template>
      </el-table-column>
      <el-table-column label="操作" min-width="340" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openUserDetail(row.id)">详情</el-button>
          <el-button size="small" type="warning" @click="openEditUser(row)">编辑</el-button>
          <el-button size="small" :type="row.status === 1 ? 'info' : 'success'" @click="toggleUserStatus(row)">{{ row.status === 1 ? '禁用' : '启用' }}</el-button>
          <el-popconfirm title="确定重置密码为123456？" @confirm="resetPassword(row)">
            <template #reference>
              <el-button size="small" type="warning">重置密码</el-button>
            </template>
          </el-popconfirm>
          <el-popconfirm title="确定删除？" @confirm="deleteUser(row)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination class="pagination" background layout="prev, pager, next" :total="userTotal" :page-size="userPageSize" @current-change="fetchUsers" />

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="userDetailVisible" title="用户详情" width="800px">
      <div v-if="userDetail" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">{{ userDetail.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ userDetail.user?.nickname }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ userDetail.user?.roleCode === 'admin' ? '管理员' : '普通用户' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ userDetail.user?.status === 1 ? '正常' : '禁用' }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ userDetail.user?.phone || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="宿舍">{{ userDetail.user?.dormitory || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ userDetail.user?.createTime?.substring(0,10) }}</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <h4>发布的商品</h4>
        <el-table :data="userDetail.published" border stripe max-height="200">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="price" label="价格" />
          <el-table-column label="状态"><template #default="{ row }">{ ${ {0:'待审核',1:'已通过',2:'已驳回',3:'已售'}[row.status] || '' } }</template></el-table-column>
        </el-table>
        <el-divider />
        <h4>购买的记录</h4>
        <el-table :data="userDetail.bought" border stripe max-height="200">
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="price" label="价格" />
          <el-table-column label="卖家"><template #default="{ row }">{{ row.sellerName || 'ID:'+row.userId }}</template></el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 编辑用户弹窗 -->
    <el-dialog v-model="editVisible" title="编辑用户" width="400px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="昵称"><el-input v-model="editForm.nickname" /></el-form-item>
        <el-form-item label="角色">
          <el-radio-group v-model="editForm.roleCode">
            <el-radio value="user">普通用户</el-radio>
            <el-radio value="admin">管理员</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditUser">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const userLoading = ref(false)
const userList = ref([])
const userSearch = ref('')
const userStatus = ref(null)
const userRoleId = ref(null)
const roleList = ref([])
const userTotal = ref(0)
const userPageSize = ref(10)

const userDetailVisible = ref(false)
const userDetail = ref(null)
const editVisible = ref(false)
const editForm = ref({ id: null, nickname: '', roleCode: 'user', status: 1 })

const fetchUsers = async (page = 1) => {
  userLoading.value = true
  try {
    const params = { page, size: userPageSize.value, keyword: userSearch.value }
    if (userStatus.value !== null) params.status = userStatus.value
    if (userRoleId.value !== null && userRoleId.value !== '') params.roleId = userRoleId.value
    const res = await request.get('/admin/users', { params })
    userList.value = res.data.records || []
    userTotal.value = res.data.total
  } catch (e) { userList.value = [] } finally { userLoading.value = false }
}

const openUserDetail = async (id) => {
  try {
    const res = await request.get('/admin/user/' + id + '/detail')
    userDetail.value = res.data
    userDetailVisible.value = true
  } catch (e) { ElMessage.error('获取用户详情失败') }
}

const openEditUser = (row) => {
  editForm.value = { id: row.id, nickname: row.nickname || row.username, roleCode: row.roleCode || 'user', status: row.status }
  editVisible.value = true
}

const submitEditUser = async () => {
  try {
    await request.put('/admin/user/' + editForm.value.id, {
      nickname: editForm.value.nickname,
      roleCode: editForm.value.roleCode,
      status: editForm.value.status
    })
    ElMessage.success('用户信息已更新')
    editVisible.value = false
    fetchUsers()
  } catch (e) { ElMessage.error('更新失败') }
}

const toggleUserStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await request.put('/admin/user/' + row.id, { status: newStatus })
    ElMessage.success(newStatus === 0 ? '已禁用' : '已启用')
    fetchUsers()
  } catch (e) { ElMessage.error('操作失败') }
}

const deleteUser = async (row) => {
  try {
    await request.delete('/admin/user/' + row.id)
    ElMessage.success('已删除')
    fetchUsers()
  } catch (e) { ElMessage.error('删除失败') }
}

const resetPassword = async (row) => {
  try {
    await request.put('/admin/user/' + row.id + '/reset-password')
    ElMessage.success('密码已重置为123456')
  } catch (e) { ElMessage.error('重置失败') }
}

const fetchRoles = async () => {
  try {
    const res = await request.get('/admin/roles')
    roleList.value = res.data || []
  } catch (e) { roleList.value = [] }
}

onMounted(() => { fetchUsers(); fetchRoles() })
</script>

<style scoped>
.tab-card { border-radius: 12px; border: 1px solid #f0f0f0; }
.card-header { display: flex; align-items: center; margin-bottom: 20px; }
.pagination { margin-top: 15px; justify-content: center; }
</style>