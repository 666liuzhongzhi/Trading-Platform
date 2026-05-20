<template>
  <div>
    <h3 class="content-title">我买到的</h3>
    <div v-if="boughtOrders.length > 0" class="goods-list">
      <div v-for="item in boughtOrders" :key="item.orderId" class="goods-item" @click="goToGoods(item.goodsId)">
        <img :src="getImageUrl(item.images)" class="goods-item-img" @error="e => e.target.src = 'https://picsum.photos/80/60'" />
        <div class="goods-item-info">
          <div class="goods-item-name">{{ item.name }}</div>
          <div class="goods-item-price">¥ {{ item.price }}</div>
          <div class="goods-item-seller">卖家：{{ item.sellerName }}</div>
          <div class="goods-item-address" v-if="item.address">收货地址：{{ item.address }}</div>
        </div>
        <div class="goods-item-actions">
          <el-tag v-if="item.status === 1" type="warning">待发货</el-tag>
          <el-tag v-else-if="item.status === 2" type="success">已发货</el-tag>
          <el-tag v-else>已完成</el-tag>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无买到的商品" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const boughtOrders = ref([])

const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/80/60'
  if (Array.isArray(str)) str = str[0] || ''
  if (typeof str !== 'string') return 'https://picsum.photos/80/60'
  const trimmed = str.trim()
  if (trimmed.startsWith('http') || trimmed.startsWith('data:image/')) return trimmed
  const parts = trimmed.split(',').filter(s => s.length > 100)
  if (parts.length > 0) {
    const first = parts[0]
    if (first.startsWith('http') || first.startsWith('data:image/')) return first
    return 'data:image/jpeg;base64,' + first
  }
  if (trimmed.length > 100) return 'data:image/jpeg;base64,' + trimmed
  return 'https://picsum.photos/80/60'
}

const fetchBought = async () => {
  try {
    const res = await request.get('/user/bought')
    boughtOrders.value = res.data || []
  } catch (e) { boughtOrders.value = [] }
}

const goToGoods = (id) => {
  if (id) window.open('/goods/' + id, '_blank')
}

onMounted(fetchBought)
</script>

<style scoped>
.content-title { font-size: 18px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-light); color: var(--text-heading); }
.goods-list { display: flex; flex-direction: column; gap: 12px; }
.goods-item {
  display: flex; align-items: center; gap: 16px; padding: 14px;
  border-radius: var(--radius-sm); border: 1px solid var(--border-light);
  cursor: pointer; transition: all var(--transition-base); background: white;
}
.goods-item:hover { background: var(--bg-warm); border-color: var(--primary); box-shadow: 0 4px 16px rgba(232, 93, 63, 0.08); transform: translateY(-1px); }
.goods-item-img { width: 80px; height: 60px; border-radius: var(--radius-xs); object-fit: cover; }
.goods-item-info { flex: 1; }
.goods-item-name { font-size: 14px; margin-bottom: 4px; color: var(--text-heading); }
.goods-item-price { color: var(--danger); font-weight: 600; }
.goods-item-seller, .goods-item-address { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.goods-item-actions { display: flex; align-items: center; gap: 8px; }
.goods-item-actions :deep(.el-tag--warning) { background: linear-gradient(135deg, #FFF6EA, #FFECD0); color: #D4771C; border: none; }
.goods-item-actions :deep(.el-tag--success) { background: linear-gradient(135deg, #EDF8F1, #D4F0DC); color: #2D8A4E; border: none; }
</style>