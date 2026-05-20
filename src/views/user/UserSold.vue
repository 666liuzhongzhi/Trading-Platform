<template>
  <div>
    <h3 class="content-title">我卖出的</h3>
    <div v-if="soldGoods.length > 0" class="goods-list">
      <div
        v-for="item in soldGoods"
        :key="item.id"
        class="goods-item"
        @click="$router.push('/goods/' + item.id)"
      >
        <img :src="getImageUrl(item.images)" class="goods-item-img" @error="e => e.target.src = 'https://picsum.photos/80/60'" />
        <div class="goods-item-info">
          <div class="goods-item-name">{{ item.name }}</div>
          <div class="goods-item-price">¥ {{ item.price }}</div>
          <div class="goods-item-buyer" v-if="item.buyerName">买家：{{ item.buyerName }}</div>
        </div>
        <div class="goods-item-actions">
          <el-tag type="info">已售</el-tag>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无卖出的商品" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const soldGoods = ref([])

const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/80/60'
  const arr = str.split(',').filter(s => s && s !== 'data:' && s !== 'data:image')
  if (arr.length === 0) return 'https://picsum.photos/80/60'
  const first = arr[0].trim()
  if (first.startsWith('http') || first.startsWith('data:image')) return first
  return 'data:image/jpeg;base64,' + first
}

const fetchSoldGoods = async () => {
  try {
    const res = await request.get('/user/sold')
    soldGoods.value = res.data || []
  } catch (e) { soldGoods.value = [] }
}

onMounted(fetchSoldGoods)
</script>

<style scoped>
.content-title { font-size: 18px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #f0f0f0; }
.goods-list { display: flex; flex-direction: column; gap: 12px; }
.goods-item {
  display: flex; align-items: center; gap: 16px; padding: 12px;
  border-radius: 8px; border: 1px solid #f0f0f0; cursor: pointer; transition: 0.2s;
}
.goods-item:hover { background: #f9f9f9; }
.goods-item-img { width: 80px; height: 60px; border-radius: 6px; object-fit: cover; }
.goods-item-info { flex: 1; }
.goods-item-name { font-size: 14px; margin-bottom: 4px; }
.goods-item-price { color: #ff4d4f; font-weight: 600; }
.goods-item-buyer { font-size: 12px; color: #666; margin-top: 2px; }
.goods-item-actions { display: flex; align-items: center; gap: 8px; }
</style>