<template>
  <div>
    <h3 class="content-title">我的收藏</h3>
    <div v-if="favGoods.length > 0" class="goods-list">
      <div
        v-for="fav in favGoods"
        :key="fav.favoriteId"
        class="goods-item"
        @click="$router.push('/goods/' + fav.goodsId)"
      >
        <img :src="getImageUrl(fav.images)" class="goods-item-img" @error="e => e.target.src = 'https://picsum.photos/80/60'" />
        <div class="goods-item-info">
          <div class="goods-item-name">{{ fav.name }}</div>
          <div class="goods-item-price">¥ {{ fav.price }}</div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无收藏" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const favGoods = ref([])

const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/80/60'
  const arr = str.split(',').filter(s => s && s !== 'data:' && s !== 'data:image')
  if (arr.length === 0) return 'https://picsum.photos/80/60'
  const first = arr[0].trim()
  if (first.startsWith('http') || first.startsWith('data:image')) return first
  return 'data:image/jpeg;base64,' + first
}

const fetchFavorites = async () => {
  try {
    const res = await request.get('/favorite/list')
    // 返回的数据格式：{ favoriteId, goodsId, name, price, images }
    favGoods.value = res.data || []
  } catch (e) { favGoods.value = [] }
}

onMounted(fetchFavorites)
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
</style>