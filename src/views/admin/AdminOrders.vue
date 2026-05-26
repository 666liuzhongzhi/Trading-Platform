<template>
  <el-card class="tab-card" shadow="never">
    <div class="card-header">
      <h3>订单管理</h3>
    </div>

    <el-table :data="orderList" border stripe v-loading="loading">
      <el-table-column label="序号" width="60" align="center">
        <template #default="{ $index }">{{ $index + 1 }}</template>
      </el-table-column>
      <el-table-column prop="id" label="订单号" width="100" />
      <el-table-column prop="goodsId" label="商品ID" width="90" />
      <el-table-column prop="buyerId" label="买家ID" width="90" />
      <el-table-column prop="sellerId" label="卖家ID" width="90" />
      <el-table-column prop="price" label="金额" width="100">
        <template #default="{ row }">¥ {{ row.price }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.status === 1" type="warning">待发货</el-tag>
          <el-tag v-else-if="row.status === 2" type="primary">已发货</el-tag>
          <el-tag v-else-if="row.status === 3" type="success">已完成</el-tag>
          <el-tag v-else type="info">未知</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="address" label="收货地址" min-width="200" show-overflow-tooltip />
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ row.createTime?.substring(0, 19) }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const loading = ref(false)
const orderList = ref([])

const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/orders')
    orderList.value = res.data || []
  } catch (e) { orderList.value = [] } finally { loading.value = false }
}

onMounted(fetchOrders)
</script>

<style scoped>
.tab-card { border-radius: 12px; border: 1px solid #f0f0f0; }
.card-header { margin-bottom: 20px; }
.card-header h3 { font-size: 16px; margin: 0; }
</style>
