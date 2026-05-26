<template>
  <div class="detail-page" v-if="goods">
    <el-breadcrumb separator="›" class="breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>{{ goods.category }}</el-breadcrumb-item>
      <el-breadcrumb-item>{{ goods.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="detail-card">
      <div class="detail-content">
        <!-- 左侧图片区 -->
        <div class="img-section">
          <el-image :src="mainImage" fit="cover" class="main-img" :preview-src-list="imageList">
            <template #error>
              <div class="image-slot"><el-icon :size="40"><PictureFilled /></el-icon></div>
            </template>
          </el-image>
          <div class="thumb-list" v-if="imageList.length > 1">
            <img
              v-for="(img, i) in imageList"
              :key="i"
              :src="img"
              class="thumb-item"
              :class="{ active: img === mainImage }"
              @click="mainImage = img"
              @error="e => e.target.src = 'https://picsum.photos/64/64?random=' + i"
            />
          </div>
        </div>

        <!-- 右侧信息区 -->
        <div class="info-section">
          <h1 class="goods-name">{{ goods.name }}</h1>
          <div class="price-row">
            <span class="goods-price">¥ {{ goods.price }}</span>
            <span v-if="goods.originalPrice" class="original-price">¥ {{ goods.originalPrice }}</span>
            <el-tag v-if="goods.status === 3" type="danger" size="small" style="margin-left:10px">已售</el-tag>
          </div>
          <div class="info-grid">
            <div class="info-item"><span class="label">分类</span><el-tag size="small">{{ goods.category }}</el-tag></div>
            <div class="info-item"><span class="label">发布时间</span><span>{{ goods.createTime?.substring(0, 10) }}</span></div>
            <div class="info-item">
              <span class="label">卖家</span>
              <span class="seller-name" @click.stop="showSellerInfo">
                <el-avatar :size="20" :src="sellerAvatar" class="seller-avatar">{{ sellerName.charAt(0) }}</el-avatar>
                {{ sellerName }}
              </span>
            </div>
            <div class="info-item"><span class="label">位置</span><span><el-icon><Location /></el-icon> {{ tradeLocation }}</span></div>
          </div>

          <div v-if="goods.status === 2 && goods.auditReason" class="audit-reason-box">
            <el-alert title="审核驳回理由" :description="goods.auditReason" type="warning" show-icon :closable="false" />
          </div>

          <div class="desc-section">
            <h3 class="desc-title">商品描述</h3>
            <p class="desc-text">{{ goods.description }}</p>
          </div>

          <div class="action-row">
            <el-button v-if="goods.status === 1" type="danger" size="large" class="btn-buy" @click="handleBuy">立即购买</el-button>
            <el-button v-if="goods.status === 2 && goods.userId === userId" type="warning" size="large" class="btn-buy" @click="goToEdit">重新编辑</el-button>
            <!-- 发货按钮：仅卖家可见，商品已售且未发货 -->
            <el-button v-if="goods.status === 3 && goods.userId === userId && !orderShipped" type="success" size="large" class="btn-buy" @click="handleShip">确认发货</el-button>
            <span v-if="orderShipped" class="text-success">已发货</span>
            <el-button type="primary" size="large" @click="openChat"><el-icon><ChatDotRound /></el-icon> 联系卖家</el-button>
            <el-button size="large" @click="toggleFavorite"><el-icon><Star /></el-icon> {{ isFav ? '已收藏' : '收藏' }}</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 你可能感兴趣 -->
    <div class="section" v-if="recommendList.length > 0">
      <h2 class="section-title">你可能感兴趣</h2>
      <div class="mini-grid">
        <div
          v-for="item in recommendList"
          :key="item.id"
          class="mini-card"
          @click="$router.push('/goods/' + item.id)"
        >
          <img :src="getImageUrl(item.images)" class="mini-img" @error="e => e.target.src = 'https://picsum.photos/200/150?random=' + item.id" />
          <div class="mini-info">
            <div class="mini-name">{{ item.name }}</div>
            <div class="mini-price">¥ {{ item.price }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天弹窗 -->
    <el-dialog v-model="chatVisible" :title="'与 ' + sellerName + ' 聊天'" width="400px">
      <div class="chat-box" ref="chatBox">
        <div v-for="msg in chatMsgs" :key="msg.id" class="chat-msg" :class="{ 'msg-right': msg.senderId === userId }">
          <div>{{ msg.content }}</div>
        </div>
      </div>
      <div class="chat-input">
        <el-input v-model="chatText" @keyup.enter="sendMsg" placeholder="输入消息..." />
        <el-button type="primary" @click="sendMsg">发送</el-button>
      </div>
    </el-dialog>

    <!-- 卖家信息弹窗 -->
    <el-dialog v-model="sellerInfoVisible" title="卖家信息" width="400px">
      <div v-if="sellerInfoData" class="seller-info-dialog">
        <div class="info-header">
          <el-avatar :size="50" :src="sellerInfoData.avatar">{{ sellerInfoData.nickname?.charAt(0) }}</el-avatar>
          <h3>{{ sellerInfoData.nickname }}</h3>
        </div>
        <div class="info-detail">
          <p><span>电话：</span>{{ sellerInfoData.phone || '未填写' }}</p>
          <p><span>QQ：</span>{{ sellerInfoData.qq || '未填写' }}</p>
          <p><span>宿舍：</span>{{ sellerInfoData.dormitory || sellerInfoData.location || '未填写' }}</p>
        </div>
        <div class="user-goods" v-if="sellerGoods.length > 0">
          <h4>TA在售的闲置</h4>
          <div
            class="mini-goods"
            v-for="g in sellerGoods"
            :key="g.id"
            @click="$router.push('/goods/' + g.id); sellerInfoVisible = false"
          >
            <img :src="getImageUrl(g.images)" @error="e => e.target.src = 'https://picsum.photos/60/45'" />
            <div>
              <div class="g-name">{{ g.name }}</div>
              <div class="g-price">¥ {{ g.price }}</div>
            </div>
          </div>
        </div>
        <div v-else>暂无在售商品</div>
      </div>
    </el-dialog>

    <!-- 地址填写弹窗（支持选择已保存地址） -->
    <el-dialog v-model="addressDialogVisible" title="填写收货地址" width="500px">
      <!-- 已保存地址 -->
      <div v-if="savedAddresses.length > 0" class="saved-addresses">
        <div class="section-label">已保存的地址（点击选择）</div>
        <div
          v-for="addr in savedAddresses"
          :key="addr.id"
          class="saved-addr-item"
          :class="{ 'is-selected': selectedAddrId === addr.id }"
          @click="selectSavedAddress(addr)"
        >
          <div class="addr-summary">
            <span class="addr-receiver">{{ addr.receiverName }}</span>
            <span class="addr-phone">{{ addr.phone }}</span>
            <el-tag v-if="addr.isDefault === 1" type="danger" size="small">默认</el-tag>
          </div>
          <div class="addr-full">{{ addr.province }}{{ addr.city }}{{ addr.district }} {{ addr.detail }}</div>
        </div>
        <el-divider />
      </div>
      <el-form :model="addressForm" label-width="80px">
        <el-form-item label="收件人">
          <el-input v-model="addressForm.receiverName" placeholder="请输入收件人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addressForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-row :gutter="10">
          <el-col :span="8">
            <el-form-item label="省" label-width="40px">
              <el-input v-model="addressForm.province" placeholder="省份" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="市" label-width="40px">
              <el-input v-model="addressForm.city" placeholder="城市" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区" label-width="40px">
              <el-input v-model="addressForm.district" placeholder="区县" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.detail" type="textarea" placeholder="街道、门牌号等" />
        </el-form-item>
        <el-form-item label="保存地址">
          <el-switch v-model="addressForm.saveAddress" />
          <span class="form-tip">将此地址保存到地址簿</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddressAndBuy">确认购买</el-button>
      </template>
    </el-dialog>
  </div>

  <div v-else class="empty-state">
    <el-empty description="商品不存在或已下架" />
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Star, ChatDotRound, Location, PictureFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const goodsId = ref(route.params.id)
watch(() => route.params.id, (newId) => {
  if (newId && newId !== goodsId.value) {
    goodsId.value = newId
    fetchDetail()
  }
})

const goods = ref(null)
const mainImage = ref('')
const imageList = ref([])
const recommendList = ref([])
const isFav = ref(false)
const sellerName = ref('')
const sellerAvatar = ref('')
const sellerLocation = ref('')
const sellerId = ref(0)
const userId = Number(localStorage.getItem('userId'))

const chatVisible = ref(false)
const chatMsgs = ref([])
const chatText = ref('')
const chatBox = ref(null)

const sellerInfoVisible = ref(false)
const sellerInfoData = ref(null)
const sellerGoods = ref([])

const orderShipped = ref(false)
const addressDialogVisible = ref(false)
const savedAddresses = ref([])
const selectedAddrId = ref(null)
const addressForm = ref({
  receiverName: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  saveAddress: false
})

const tradeLocation = computed(() => {
  if (!goods.value) return ''
  const t = goods.value.tradeType
  if (t === 'face') return '校内'
  if (t === 'express') return '非校内'
  if (t === 'both') return '校内/邮寄'
  return goods.value.location || '校内'
})

const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/200/150'
  const arr = str.split(',').filter(s => s && s !== 'data:' && s !== 'data:image')
  if (arr.length === 0) return 'https://picsum.photos/200/150'
  const first = arr[0].trim()
  if (first.startsWith('http') || first.startsWith('data:image')) return first
  return 'data:image/jpeg;base64,' + first
}

const fetchDetail = async () => {
  try {
    const res = await request.get('/goods/' + goodsId.value)
    goods.value = res.data
    sellerName.value = res.data.sellerName || '卖家'
    sellerAvatar.value = res.data.sellerAvatar || ''
    sellerLocation.value = res.data.sellerLocation || res.data.location || '校内'
    sellerId.value = res.data.userId

    if (goods.value.images) {
      const raw = goods.value.images.split(',').map(s => s.trim()).filter(s => s.length > 30)
      imageList.value = raw.map(getImageUrl)
      mainImage.value = imageList.value[0] || 'https://picsum.photos/600/400'
    } else {
      mainImage.value = 'https://picsum.photos/600/400'
      imageList.value = []
    }

    if (goods.value.status === 1) {
      request.post('/goods/view/' + goods.value.id).catch(() => {})
    }

    // 不再检查订单状态，避免无关404错误
    if (goods.value.status === 3 && goods.value.userId === userId) {
      orderShipped.value = false  // 默认未发货，卖家点击发货后前端直接设为true
    }

    try {
      const recRes = await request.get('/goods/list', { params: { page: 1, size: 4, category: goods.value.category, status: 1 } })
      recommendList.value = recRes.data.records.filter(g => Number(g.id) !== Number(goodsId.value))
    } catch (e) {}

    try {
      const favRes = await request.get('/favorite/list')
      isFav.value = favRes.data.some(f => Number(f.goodsId) === Number(goodsId.value))
    } catch (e) {}

    if (localStorage.getItem('token')) {
      request.post('/history/add/' + goodsId.value).catch(() => {})
    }
  } catch (e) {
    goods.value = null
  }
}

// 购买
const handleBuy = async () => {
  if (!localStorage.getItem('token')) { ElMessage.warning('请先登录'); router.push('/login'); return }
  const type = goods.value.tradeType
  if (type === 'face') {
    try {
      await ElMessageBox.confirm('确认购买该商品？', '购买确认', { confirmButtonText: '确认购买', type: 'warning' })
      await request.post('/goods/buy/' + goods.value.id, {})
      ElMessage.success('购买成功')
      fetchDetail()
    } catch (e) { if (e !== 'cancel') ElMessage.error('购买失败') }
  } else if (type === 'express') {
    fetchSavedAddresses()
    addressDialogVisible.value = true
  } else if (type === 'both') {
    try {
      await ElMessageBox.confirm('是否需要填写收货地址？', '选择交易方式', {
        confirmButtonText: '填写地址并购买', cancelButtonText: '不填，直接购买', distinguishCancelAndClose: true
      })
      fetchSavedAddresses()
      addressDialogVisible.value = true
    } catch (e) {
      if (e === 'cancel' || e === 'close') {
        try {
          await ElMessageBox.confirm('确认购买该商品？', '购买确认', { confirmButtonText: '确认购买', type: 'warning' })
          await request.post('/goods/buy/' + goods.value.id, {})
          ElMessage.success('购买成功')
          fetchDetail()
        } catch (err) { if (err !== 'cancel') ElMessage.error('购买失败') }
      }
    }
  }
}

// 打开地址弹窗时加载已保存地址
const fetchSavedAddresses = async () => {
  try {
    const res = await request.get('/address/list')
    savedAddresses.value = res.data || []
  } catch (e) { savedAddresses.value = [] }
}

const selectSavedAddress = (addr) => {
  selectedAddrId.value = addr.id
  addressForm.value.receiverName = addr.receiverName || ''
  addressForm.value.phone = addr.phone || ''
  addressForm.value.province = addr.province || ''
  addressForm.value.city = addr.city || ''
  addressForm.value.district = addr.district || ''
  addressForm.value.detail = addr.detail || ''
}

// 填写地址后购买
const confirmAddressAndBuy = async () => {
  if (!addressForm.value.receiverName || !addressForm.value.phone || !addressForm.value.detail) {
    ElMessage.warning('请填写收件人、手机号和详细地址')
    return
  }
  const fullAddress = `${addressForm.value.receiverName} ${addressForm.value.phone} ` +
    `${addressForm.value.province || ''}${addressForm.value.city || ''}${addressForm.value.district || ''} ${addressForm.value.detail}`
  try {
    await request.post('/goods/buy/' + goods.value.id, {
      address: fullAddress,
      receiverName: addressForm.value.receiverName,
      phone: addressForm.value.phone,
      province: addressForm.value.province,
      city: addressForm.value.city,
      district: addressForm.value.district,
      detail: addressForm.value.detail
    })
    // 用户选择保存地址到地址簿
    if (addressForm.value.saveAddress) {
      request.post('/address/save', {
        receiverName: addressForm.value.receiverName,
        phone: addressForm.value.phone,
        province: addressForm.value.province,
        city: addressForm.value.city,
        district: addressForm.value.district,
        detail: addressForm.value.detail,
        isDefault: savedAddresses.value.length === 0 ? 1 : 0
      }).catch(() => {})
    }
    ElMessage.success('购买成功，已通知卖家')
    addressDialogVisible.value = false
    fetchDetail()
  } catch (e) { ElMessage.error('购买失败') }
}

// 卖家发货（不再检查订单状态，直接更新本地变量）
const handleShip = async () => {
  try {
    await ElMessageBox.confirm('确认已发货？', '发货确认', { confirmButtonText: '确认发货', type: 'warning' })
    await request.put('/goods/ship/' + goods.value.id)
    orderShipped.value = true
    ElMessage.success('已确认发货，买家将收到通知')
  } catch (e) { if (e !== 'cancel') ElMessage.error('操作失败') }
}

const openChat = () => {
  if (!localStorage.getItem('token')) { ElMessage.warning('请先登录'); router.push('/login'); return }
  if (sellerId.value === userId) { ElMessage.warning('这是您自己的商品'); return }
  router.push({ path: '/chat', query: { userId: sellerId.value, goodsId: goodsId.value } })
}

const sendMsg = async () => { /* ... */ }
const scrollChat = () => { /* ... */ }

const toggleFavorite = async () => {
  if (!localStorage.getItem('token')) { ElMessage.warning('请先登录'); router.push('/login'); return }
  try {
    await request.post('/favorite/toggle/' + goods.value.id)
    isFav.value = !isFav.value
    ElMessage.success(isFav.value ? '已收藏' : '已取消收藏')
  } catch (e) { ElMessage.error('操作失败') }
}

const showSellerInfo = async () => {
  try {
    const res = await request.get('/user/info/' + sellerId.value)
    sellerInfoData.value = res.data.user
    sellerGoods.value = res.data.goodsList || []
    sellerInfoVisible.value = true
  } catch (e) { ElMessage.error('获取卖家信息失败') }
}

const goToEdit = () => {
  router.push({ path: '/user/edit', query: { id: goods.value.id } })
}

onMounted(fetchDetail)
</script>

<style scoped>
/* 样式保持不变 */
.detail-page { max-width: 1120px; margin: 0 auto; }
.breadcrumb { margin-bottom: 16px; }
.detail-card { background: white; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #f0f0f0; }
.detail-content { display: flex; gap: 40px; }
.img-section { flex: 1; max-width: 500px; }
.main-img { width: 100%; height: 360px; border-radius: 12px; object-fit: cover; cursor: zoom-in; }
.image-slot { display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; }
.thumb-list { display: flex; gap: 8px; margin-top: 12px; }
.thumb-item { width: 64px; height: 64px; border-radius: 6px; object-fit: cover; cursor: pointer; border: 2px solid transparent; opacity: 0.7; transition: 0.2s; }
.thumb-item:hover { opacity: 1; }
.thumb-item.active { border-color: #1677ff; opacity: 1; }
.info-section { flex: 1; }
.goods-name { font-size: 22px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; }
.price-row { display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; }
.goods-price { font-size: 32px; font-weight: 700; color: #ff4d4f; }
.original-price { font-size: 14px; color: #999; text-decoration: line-through; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
.info-item { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.info-item .label { color: #999; min-width: 60px; }
.seller-name { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.desc-section { margin-bottom: 24px; }
.desc-title { font-size: 15px; margin-bottom: 8px; }
.desc-text { line-height: 1.8; color: #555; font-size: 14px; }
.action-row { display: flex; gap: 12px; padding-top: 20px; border-top: 1px solid #f0f0f0; }
.btn-buy, .btn-contact, .btn-fav { border-radius: 24px; }
.audit-reason-box { margin-bottom: 20px; }
.section { margin-bottom: 32px; }
.section-title { font-size: 18px; margin-bottom: 16px; }
.mini-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.mini-card { background: white; border-radius: 12px; overflow: hidden; cursor: pointer; border: 1px solid #f0f0f0; transition: box-shadow 0.2s; }
.mini-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.mini-img { width: 100%; height: 140px; object-fit: cover; display: block; }
.mini-info { padding: 10px; }
.mini-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 6px; }
.mini-price { color: #ff4d4f; font-weight: 600; }
.chat-box { height: 200px; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; background: #f9f9f9; }
.chat-msg { margin-bottom: 8px; display: flex; }
.chat-msg > div { max-width: 70%; padding: 6px 12px; border-radius: 8px; background: #fff; }
.msg-right { justify-content: flex-end; }
.msg-right > div { background: #1677ff; color: #fff; }
.chat-input { display: flex; gap: 8px; }
.text-success { color: #67c23a; font-weight: 600; margin-left: 10px; }
.saved-addresses { margin-bottom: 10px; }
.section-label { font-size: 13px; color: #666; margin-bottom: 8px; }
.saved-addr-item { padding: 10px 12px; border: 1px solid #e8e8e8; border-radius: 6px; margin-bottom: 8px; cursor: pointer; transition: 0.2s; }
.saved-addr-item:hover { border-color: #1677ff; }
.saved-addr-item.is-selected { border-color: #1677ff; background: #f0f5ff; }
.addr-summary { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.addr-receiver { font-weight: 600; font-size: 14px; }
.addr-phone { color: #666; font-size: 13px; }
.addr-full { font-size: 12px; color: #888; }
.form-tip { font-size: 12px; color: #999; margin-left: 8px; }
.empty-state { text-align: center; padding: 80px 0; }
.mini-goods { display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 8px; cursor: pointer; }
.mini-goods:hover { background: #f5f5f5; }
.mini-goods img { width: 60px; height: 45px; border-radius: 6px; object-fit: cover; }
.g-name { font-size: 14px; }
.g-price { color: #ff4d4f; font-weight: 600; }
.no-conversation { flex: 1; display: flex; align-items: center; justify-content: center; color: #999; }
</style>