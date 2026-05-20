<template>
  <div>
    <h3 class="content-title">浏览历史</h3>
    <div v-if="uniqueHistory.length > 0" class="goods-list">
      <div
        v-for="h in uniqueHistory"
        :key="h.goodsId"
        class="goods-item"
        @click="$router.push('/goods/' + h.goodsId)"
      >
        <img :src="getImageUrl(h.images)" class="goods-item-img" @error="e => e.target.src = 'https://picsum.photos/80/60'" />
        <div class="goods-item-info">
          <div class="goods-item-name">{{ h.name || '商品已删除' }}</div>
          <div class="goods-item-time">{{ h.time }}</div>
        </div>
        <div class="goods-item-actions">
          <el-tag v-if="h.status === 3" type="danger" size="small">已售</el-tag>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无记录" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'

const historyList = ref([])

const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/80/60'
  const arr = str.split(',').filter(s => s && s !== 'data:' && s !== 'data:image')
  if (arr.length === 0) return 'https://picsum.photos/80/60'
  const first = arr[0].trim()
  if (first.startsWith('http') || first.startsWith('data:image')) return first
  return 'data:image/jpeg;base64,' + first
}

const uniqueHistory = computed(() => {
  const map = new Map()
  historyList.value.forEach(item => {
    if (!map.has(item.goodsId)) map.set(item.goodsId, item)
  })
  return Array.from(map.values())
})

const fetchHistory = async () => {
  try {
    const res = await request.get('/history/list')
    const items = res.data || []
    // 并行获取每个商品的状态和名称
    const promises = items.map(async (h) => {
      try {
        const gRes = await request.get('/goods/' + h.goodsId)
        return {
          goodsId: h.goodsId,
          name: gRes.data.name,
          images: gRes.data.images,
          time: h.createTime?.substring(0, 10),
          status: gRes.data.status
        }
      } catch (e) {
        return { goodsId: h.goodsId, name: '商品已删除', images: '', time: h.createTime?.substring(0, 10), status: 3 }
      }
    })
    historyList.value = await Promise.all(promises)
  } catch (e) { historyList.value = [] }
}

onMounted(fetchHistory)
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
.goods-item-time { color: var(--text-secondary); font-size: 13px; }
.goods-item-actions { display: flex; align-items: center; gap: 8px; }
</style>