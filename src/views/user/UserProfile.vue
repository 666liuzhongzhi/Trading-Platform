<template>
  <div>
    <h3 class="content-title">个人资料</h3>
    <el-form label-width="80px">
      <el-form-item label="昵称"><el-input v-model="nickname" /></el-form-item>
      <el-form-item label="手机号"><el-input v-model="phone" /></el-form-item>
      <el-form-item label="QQ号"><el-input v-model="qq" /></el-form-item>
      <el-form-item label="宿舍楼"><el-input v-model="dormitory" /></el-form-item>
      <el-form-item label="收货地址"><el-input v-model="location" /></el-form-item>
      <el-form-item><el-button type="primary" @click="saveInfo">保存修改</el-button></el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const nickname = ref('')
const phone = ref('')
const location = ref('')
const qq = ref('')
const dormitory = ref('')

const fetchUserInfo = async () => {
  try {
    const res = await request.get('/user/info')
    const u = res.data
    nickname.value = u.nickname || u.username || ''
    phone.value = u.phone || ''
    location.value = u.location || ''
    qq.value = u.qq || ''
    dormitory.value = u.dormitory || ''
  } catch (e) {}
}

const saveInfo = async () => {
  try {
    await request.put('/user/update', {
      nickname: nickname.value,
      phone: phone.value,
      location: location.value,
      qq: qq.value,
      dormitory: dormitory.value
    })
    localStorage.setItem('userName', nickname.value)
    window.dispatchEvent(new Event('storage'))
    ElMessage.success('资料更新成功')
  } catch (e) { ElMessage.error('保存失败') }
}

onMounted(fetchUserInfo)
</script>