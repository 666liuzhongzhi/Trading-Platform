<template>
  <div class="home-page">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-inner">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索你想要的校园好物..."
          size="large"
          class="search-input"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
          <template #append>
            <el-button class="search-btn" @click="handleSearch">
              <el-icon><Search /></el-icon> 搜索
            </el-button>
          </template>
        </el-input>
        <div class="hot-tags">
          <span class="tag-label">热门搜索：</span>
          <el-tag
            v-for="tag in hotTags"
            :key="tag"
            class="hot-tag"
            @click="searchKeyword = tag; handleSearch()"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="category-section">
      <div class="category-list">
        <div
          v-for="cat in categories"
          :key="cat.name"
          class="category-item"
          :class="{ active: activeCategory === cat.name }"
          @click="activeCategory = activeCategory === cat.name ? '' : cat.name"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
        </div>
      </div>
    </div>

    <!-- 轮播 -->
    <el-carousel class="banner" height="200px" :interval="4000" indicator-position="none">
      <el-carousel-item v-for="(banner, idx) in banners" :key="idx">
        <div class="banner-item" :style="{ background: banner.bg }">
          <div class="banner-content">
            <h2>{{ banner.title }}</h2>
            <p>{{ banner.desc }}</p>
          </div>
          <span class="banner-emoji">{{ banner.emoji }}</span>
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 商品列表 -->
    <div class="goods-section">
      <div class="section-header">
        <h2 class="section-title">
          <span class="title-bar"></span>
          {{ activeCategory || '热门推荐' }}
        </h2>
        <el-button link class="more-btn" @click="viewMore">
          查看更多 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>

      <div v-if="goodsList.length > 0" class="goods-grid">
        <el-card
          v-for="item in goodsList"
          :key="item.id"
          class="goods-card"
          shadow="hover"
          @click="goToDetail(item.id)"
        >
          <img
            :src="getImageUrl(item.images)"
            class="card-img"
            @error="handleImgError($event, item.id)"
          />
          <div class="card-info">
            <h3 class="card-name">{{ item.name }}</h3>
            <div class="card-price">¥ {{ item.price }}</div>
            <div class="card-meta">
              <span class="card-location">
                <el-icon><Location /></el-icon> {{ getTradeLocation(item) }}
              </span>
              <span class="card-views">{{ item.views || 0 }}人看过</span>
            </div>
          </div>
        </el-card>
      </div>

      <div v-else class="empty-state">
        <el-empty description="没有找到相关商品" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowRight, Location } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const searchKeyword = ref('')
const activeCategory = ref('')

const hotTags = ['考研教材', '数码产品', '宿舍电器', '运动器材', '生活用品']
const categories = [
  { name: '书籍教材', icon: '📚' },
  { name: '数码产品', icon: '💻' },
  { name: '生活用品', icon: '🏠' },
  { name: '运动器材', icon: '⚽' },
  { name: '服饰美妆', icon: '👗' },
  { name: '其他闲置', icon: '📦' }
]
const banners = [
  { title: '毕业季狂欢', desc: '学长学姐好物清仓', emoji: '🎓', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { title: '数码捡漏专区', desc: '笔记本、平板超值转让', emoji: '💻', bg: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { title: '宿舍必备好物', desc: '小风扇、床上书桌', emoji: '🛏️', bg: 'linear-gradient(135deg, #4facfe, #00f2fe)' }
]

const goodsList = ref([])
const currentPage = ref(1)

/**
 * 安全获取图片地址
 */
const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/400/300?random=' + Math.random()
  const arr = str.split(',').map(s => s.trim()).filter(s => {
    if (s === '') return false
    if (s === 'data:') return false
    if (s === 'data:image') return false
    if (s.startsWith('data:image/') && s.length < 50) return false
    return true
  })
  if (arr.length === 0) return 'https://picsum.photos/400/300?random=' + Math.random()
  const first = arr[0]
  if (first.startsWith('http') || first.startsWith('data:image')) return first
  return 'data:image/jpeg;base64,' + first
}

/**
 * 图片加载失败时使用占位图
 */
const handleImgError = (event, goodsId) => {
  event.target.src = 'https://picsum.photos/400/300?random=' + goodsId
}

/**
 * 根据交易方式返回位置显示文本
 */
const getTradeLocation = (item) => {
  const type = item.tradeType
  if (type === 'face') return '校内'
  if (type === 'express') return '非校内'
  if (type === 'both') return '校内/邮寄'
  return item.location || '校内'
}

// 获取商品列表
const fetchGoods = async () => {
  try {
    const res = await request.get('/goods/list', {
      params: {
        page: currentPage.value,
        size: 12,
        keyword: searchKeyword.value,
        category: activeCategory.value,
        status: 1   // 只显示通过的商品
      }
    })
    goodsList.value = res.data.records
  } catch (e) {
    goodsList.value = []
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchGoods()
}

const viewMore = () => {
  currentPage.value = 1
  fetchGoods()
}

const goToDetail = (id) => {
  router.push('/goods/' + id)
}

watch([searchKeyword, activeCategory], () => {
  currentPage.value = 1
  fetchGoods()
})

onMounted(fetchGoods)
</script>

<style scoped>
.home-page { padding-bottom: 40px; }
.search-section { background: white; border-radius: 16px; padding: 24px 20px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.search-inner { max-width: 640px; margin: 0 auto; }
/* 搜索框样式：完整浅蓝色实线边框，隐藏右侧竖线 */
.search-input :deep(.el-input__wrapper) {
  background: #ffffff;
  border-radius: 24px 0 0 24px !important;
  border: 1.5px solid #4096ff;
  box-shadow: none !important;
}
.search-input :deep(.el-input-group__append) {
  background: #4096ff;
  border-radius: 0 24px 24px 0 !important;
  border: 1.5px solid #4096ff;
  border-left: none;
  box-shadow: none !important;
}
.search-input :deep(.el-input-group__append .el-button) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
/* 移除竖线 */
.search-input :deep(.el-input-group__append::before),
.search-input :deep(.el-input-group__prepend::before) {
  display: none !important;
}
.search-btn { color: white !important; font-weight: 600; }
.hot-tags { display: flex; gap: 8px; margin-top: 12px; align-items: center; flex-wrap: wrap; }
.tag-label { font-size: 13px; color: #999; }
.hot-tag { cursor: pointer; border-radius: 12px; font-size: 12px; }
.category-section { margin-bottom: 24px; }
.category-list { display: flex; gap: 10px; overflow-x: auto; padding: 4px 0; }
.category-item { display: flex; flex-direction: column; align-items: center; padding: 14px 20px; background: white; border-radius: 12px; cursor: pointer; min-width: 80px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
.category-item.active { background: #1677ff; color: white; }
.category-item.active .cat-name { color: white; }
.cat-icon { font-size: 22px; }
.cat-name { font-size: 12px; white-space: nowrap; }
.banner { border-radius: 16px; overflow: hidden; margin-bottom: 32px; }
.banner-item { height: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; color: white; }
.banner-content h2 { font-size: 28px; color: white; margin-bottom: 6px; }
.banner-content p { font-size: 16px; opacity: 0.9; }
.banner-emoji { font-size: 64px; opacity: 0.7; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-title { font-size: 20px; color: #1a1a1a; display: flex; align-items: center; gap: 10px; }
.title-bar { display: inline-block; width: 4px; height: 20px; background: #1677ff; border-radius: 2px; }
.more-btn { color: #999; font-size: 14px; }
.goods-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.goods-card { border-radius: 12px; overflow: hidden; cursor: pointer; transition: 0.3s; border: 1px solid #f0f0f0; }
.goods-card:hover { transform: translateY(-6px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.card-img { width: 100%; height: 180px; object-fit: cover; display: block; }
.card-info { padding: 14px; }
.card-name { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 8px; color: #333; }
.card-price { font-size: 20px; font-weight: 700; color: #ff4d4f; margin-bottom: 8px; }
.card-meta { display: flex; justify-content: space-between; font-size: 12px; color: #999; }
.empty-state { text-align: center; padding: 40px; }
@media (max-width: 768px) {
  .goods-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>