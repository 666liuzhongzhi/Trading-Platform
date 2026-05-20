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

      <!-- 骨架屏 -->
      <div v-if="loading" class="goods-grid">
        <div v-for="i in 8" :key="'s'+i" class="skeleton-card">
          <div class="skeleton-img"></div>
          <div class="skeleton-body">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-price"></div>
          </div>
        </div>
      </div>

      <div v-else-if="goodsList.length > 0" class="goods-grid">
        <el-card
          v-for="(item, idx) in goodsList"
          :key="item.id"
          class="goods-card"
          shadow="hover"
          :style="{ animationDelay: idx * 0.05 + 's' }"
          @click="goToDetail(item.id)"
        >
          <div class="card-img-wrap">
            <img
              :src="getImageUrl(item.images)"
              class="card-img"
              @error="handleImgError($event, item.id)"
            />
          </div>
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
const loading = ref(false)

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
  loading.value = true
  try {
    const res = await request.get('/goods/list', {
      params: {
        page: currentPage.value,
        size: 12,
        keyword: searchKeyword.value,
        category: activeCategory.value,
        status: 1
      }
    })
    goodsList.value = res.data.records
  } catch (e) {
    goodsList.value = []
  } finally {
    loading.value = false
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

/* 搜索区域 */
.search-section {
  background: linear-gradient(160deg, #FFFFFF 0%, #FFF9F5 50%, #FDF3EC 100%);
  border-radius: var(--radius-lg);
  padding: 30px 24px; margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(232, 93, 63, 0.06);
}
.search-inner { max-width: 640px; margin: 0 auto; }
.search-input :deep(.el-input__wrapper) {
  background: #ffffff;
  border-radius: 28px 0 0 28px !important;
  border: 2px solid var(--border-normal);
  box-shadow: none !important; padding-left: 16px;
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}
.search-input :deep(.el-input__wrapper:focus-within),
.search-input :deep(.el-input__wrapper:hover) {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(232, 93, 63, 0.1) !important;
}
.search-input :deep(.el-input-group__append) {
  background: var(--primary-gradient);
  border-radius: 0 28px 28px 0 !important;
  border: 2px solid var(--primary); border-left: none;
  box-shadow: none !important;
}
.search-input :deep(.el-input-group__append .el-button) {
  border: none !important; box-shadow: none !important;
  background: transparent !important;
}
.search-input :deep(.el-input-group__append::before),
.search-input :deep(.el-input-group__prepend::before) { display: none !important; }
.search-btn { color: white !important; font-weight: 600; }
.search-icon { color: var(--primary); }
.hot-tags { display: flex; gap: 8px; margin-top: 14px; align-items: center; flex-wrap: wrap; }
.tag-label { font-size: 13px; color: var(--text-secondary); }
.hot-tag { cursor: pointer; border-radius: var(--radius-full); font-size: 12px; }

/* 分类 */
.category-section { margin-bottom: 24px; }
.category-list { display: flex; gap: 10px; overflow-x: auto; padding: 4px 0; }
.category-item {
  display: flex; flex-direction: column; align-items: center;
  padding: 14px 20px; background: white; border-radius: var(--radius-md);
  cursor: pointer; min-width: 80px; box-shadow: var(--shadow-xs);
  border: 2px solid transparent;
  transition: all var(--transition-base);
}
.category-item:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }

/* 六种分类渐变色 */
.category-item:nth-child(1):hover { border-color: #E85D3F; background: rgba(232,93,63,0.04); }
.category-item:nth-child(2):hover { border-color: #E84A7F; background: rgba(232,74,127,0.04); }
.category-item:nth-child(3):hover { border-color: #F2A65C; background: rgba(242,166,92,0.04); }
.category-item:nth-child(4):hover { border-color: #5EBE7E; background: rgba(94,190,126,0.04); }
.category-item:nth-child(5):hover { border-color: #7C5CBF; background: rgba(124,92,191,0.04); }
.category-item:nth-child(6):hover { border-color: #3D9E9E; background: rgba(61,158,158,0.04); }

.category-item.active:nth-child(1) { background: linear-gradient(135deg, #E85D3F, #F2A65C); }
.category-item.active:nth-child(2) { background: linear-gradient(135deg, #E84A7F, #F5A0B5); }
.category-item.active:nth-child(3) { background: linear-gradient(135deg, #F2A65C, #FCD08A); }
.category-item.active:nth-child(4) { background: linear-gradient(135deg, #5EBE7E, #8ED4A0); }
.category-item.active:nth-child(5) { background: linear-gradient(135deg, #7C5CBF, #B39DDB); }
.category-item.active:nth-child(6) { background: linear-gradient(135deg, #3D9E9E, #6EC4C4); }
.category-item.active { color: white; box-shadow: var(--shadow-md); transform: scale(1.05); }
.category-item.active .cat-name { color: white; }
.cat-icon { font-size: 22px; }
.cat-name { font-size: 12px; white-space: nowrap; color: var(--text-body); }

/* Banner */
.banner { border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 32px; }
.banner-item {
  height: 100%; display: flex; align-items: center;
  justify-content: space-between; padding: 0 40px; color: white;
}
.banner-content h2 { font-size: 28px; color: white; margin-bottom: 6px; }
.banner-content p { font-size: 16px; opacity: 0.9; }
.banner-emoji { font-size: 64px; opacity: 0.75; animation: float 3s ease-in-out infinite; }
.banner-item:nth-child(2) .banner-emoji { animation-delay: 0.5s; }
.banner-item:nth-child(3) .banner-emoji { animation-delay: 1s; }

/* 标题 */
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.section-title {
  font-size: 20px; color: var(--text-heading);
  display: flex; align-items: center; gap: 10px;
}
.title-bar {
  display: inline-block; width: 4px; height: 22px;
  background: var(--primary-gradient); border-radius: 2px;
}
.more-btn { color: var(--text-secondary); font-size: 14px; }

/* 商品网格 */
.goods-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

/* 商品卡片 */
.goods-card {
  border-radius: var(--radius-md); overflow: hidden;
  cursor: pointer; border: 1px solid var(--border-light);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
  animation: fadeInUp 0.4s ease both;
}
.goods-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(45, 34, 28, 0.14);
}
.card-img-wrap { overflow: hidden; }
.card-img {
  width: 100%; height: 180px; object-fit: cover; display: block;
  transition: transform 0.4s ease;
}
.goods-card:hover .card-img { transform: scale(1.06); }
.card-info { padding: 14px; }
.card-name {
  font-size: 14px; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; margin-bottom: 8px; color: var(--text-heading);
}
.card-price {
  font-size: 20px; font-weight: 700; color: var(--danger);
  margin-bottom: 8px;
}
.card-meta {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--text-secondary);
}
.card-location { display: flex; align-items: center; gap: 2px; }

/* 骨架屏 */
.skeleton-card {
  background: white; border-radius: var(--radius-md); overflow: hidden;
  border: 1px solid var(--border-light);
}
.skeleton-img {
  width: 100%; height: 180px;
  background: linear-gradient(90deg, #EDE8E2 25%, #E5DED6 50%, #EDE8E2 75%);
  background-size: 300px 100%;
  animation: shimmer 1.6s infinite;
}
.skeleton-body { padding: 14px; }
.skeleton-line {
  height: 14px; border-radius: 4px; margin-bottom: 8px;
  background: linear-gradient(90deg, #EDE8E2 25%, #E5DED6 50%, #EDE8E2 75%);
  background-size: 300px 100%;
  animation: shimmer 1.6s infinite;
}
.skeleton-title { width: 70%; }
.skeleton-price { width: 40%; height: 22px; margin-bottom: 0; }

.empty-state { text-align: center; padding: 40px; }

@media (max-width: 768px) {
  .goods-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>