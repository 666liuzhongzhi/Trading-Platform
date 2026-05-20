<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- 左侧会话列表 -->
      <div class="chat-left">
        <div class="chat-header">消息</div>
        <div class="conversation-list">
          <div
            v-for="conv in conversations"
            :key="conv.userId"
            class="conversation-item"
            :class="{ active: activeUserId === conv.userId }"
            @click="selectConversation(conv)"
          >
            <div class="conv-avatar" @click.stop="conv.userId !== 0 && showUserInfo(conv.userId)">
              <template v-if="conv.userId === 0">
                <el-icon :size="40"><ChatDotRound /></el-icon>
              </template>
              <template v-else>
                <el-avatar :size="40" :src="conv.avatar">{{ conv.userName?.charAt(0) }}</el-avatar>
              </template>
            </div>
            <div class="conv-content">
              <div class="conv-top">
                <span class="conv-name">{{ conv.userId === 0 ? '系统通知' : conv.userName }}</span>
                <span class="conv-time">{{ formatTime(conv.lastTime) }}</span>
              </div>
              <div class="conv-bottom">
                <span class="conv-preview">{{ conv.lastMessage }}</span>
                <el-badge v-if="conv.unreadCount > 0" :value="conv.unreadCount" class="conv-badge" />
              </div>
            </div>
          </div>
          <el-empty v-if="conversations.length === 0" description="暂无消息" />
        </div>
      </div>

      <!-- 右侧聊天区 -->
      <div class="chat-right" v-if="activeUserId !== null">
        <div class="chat-header-right">
          <div class="user-bar" @click="activeUserId !== 0 && showUserInfo(activeUserId)">
            <template v-if="activeUserId === 0">
              <el-icon :size="32"><ChatDotRound /></el-icon>
              <span class="user-name">系统通知</span>
            </template>
            <template v-else>
              <el-avatar :size="32" :src="activeConv?.avatar">{{ activeConv?.userName?.charAt(0) }}</el-avatar>
              <span class="user-name">{{ activeConv?.userName }}</span>
            </template>
          </div>
        </div>

        <!-- 从商品详情页带来的商品卡片 -->
        <div v-if="currentGoodsCard" class="goods-card-bar">
          <div class="goods-card" @click="goToGoods(currentGoodsCard.id)">
            <img :src="getImageUrl(currentGoodsCard.images)" class="goods-card-img" />
            <div class="goods-card-info">
              <div class="goods-card-name">{{ currentGoodsCard.name }}</div>
              <div class="goods-card-price">¥ {{ currentGoodsCard.price }}</div>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="chat-messages" ref="chatBox">
          <div
            v-for="msg in chatMsgs"
            :key="msg.id"
            :class="['msg', msg.senderId === 0 ? 'msg-system' : msg.senderId === myUserId ? 'msg-right' : 'msg-left']"
          >
            <!-- 文本消息 -->
            <div v-if="msg.type === 'text' || !msg.type" class="msg-bubble" :class="{'system-bubble': msg.senderId === 0}">
              <!-- 只要有关联商品，就渲染为链接 -->
              <template v-if="msg.goodsId">
                <el-link type="primary" @click="goToGoods(msg.goodsId)" :underline="false">
                  {{ msg.content }}
                </el-link>
              </template>
              <template v-else>
                {{ msg.content }}
              </template>
            </div>

            <!-- 商品卡片消息 -->
            <div
              v-else-if="msg.type === 'goods'"
              class="msg-goods-card"
              @click="goToGoods(msg.goodsId)"
            >
              <img
                :src="getGoodsImage(msg.goodsId)"
                class="msg-goods-img"
                @error="e => e.target.src = 'https://picsum.photos/220/120'"
              />
              <div class="msg-goods-info">
                <div class="msg-goods-name">{{ msg.content || '商品' }}</div>
                <div class="msg-goods-price">¥ {{ parseExtra(msg.extra).price || '0.00' }}</div>
                <div v-if="parseExtra(msg.extra).status === 3" class="msg-goods-sold">商品已下架</div>
              </div>
            </div>

            <!-- 图片消息 -->
            <div v-else-if="msg.type === 'image'" class="msg-image">
              <el-image
                :src="msg.content"
                class="msg-img-thumb"
                :preview-src-list="[msg.content]"
                fit="contain"
              />
            </div>

            <div class="msg-time">{{ formatTime(msg.createTime) }}</div>
          </div>
        </div>

        <!-- 底部工具栏 + 输入框（系统对话不显示） -->
        <div class="chat-bottom" v-if="activeUserId !== 0">
          <div class="chat-toolbar">
            <el-button class="tool-btn" @click="showMyGoodsSelector = true" title="发送商品">
              <el-icon :size="20"><Goods /></el-icon>
            </el-button>
            <el-button class="tool-btn" @click="triggerImageUpload" title="发送图片">
              <el-icon :size="20"><PictureFilled /></el-icon>
            </el-button>
            <input
              type="file"
              accept="image/*"
              ref="imageInput"
              style="display:none"
              @change="onImagePicked"
            />
          </div>
          <div class="chat-input-area">
            <el-input
              v-model="chatText"
              type="textarea"
              :rows="2"
              placeholder="输入消息..."
              @keyup.enter.exact="sendTextMessage"
            />
            <el-button type="primary" @click="sendTextMessage">发送</el-button>
          </div>
        </div>
      </div>

      <!-- 未选择会话 -->
      <div class="chat-right" v-else>
        <div class="no-conversation">选择一个会话开始聊天</div>
      </div>
    </div>

    <!-- 用户信息弹窗（已修复图片显示） -->
    <el-dialog v-model="infoVisible" title="用户信息" width="400px">
      <div v-if="infoUser" class="info-dialog">
        <div class="info-header">
          <el-avatar :size="50" :src="infoUser.avatar">{{ infoUser.nickname?.charAt(0) }}</el-avatar>
          <h3>{{ infoUser.nickname }}</h3>
        </div>
        <div class="info-detail">
          <p><span>电话：</span>{{ infoUser.phone || '未填写' }}</p>
          <p><span>QQ：</span>{{ infoUser.qq || '未填写' }}</p>
          <p><span>宿舍：</span>{{ infoUser.dormitory || infoUser.location || '未填写' }}</p>
        </div>
        <div class="user-goods" v-if="infoGoods.length > 0">
          <h4>TA在售的闲置</h4>
          <div
            class="mini-goods"
            v-for="g in infoGoods"
            :key="g.id"
            @click="$router.push('/goods/' + g.id); infoVisible = false"
          >
            <!-- 使用增强的 getImageUrl 处理多图片字符串 -->
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

    <!-- 选择自己的商品弹窗 -->
    <el-dialog v-model="showMyGoodsSelector" title="选择要发送的商品" width="500px">
      <div v-if="myGoods.length > 0" class="my-goods-list">
        <div
          v-for="item in myGoods"
          :key="item.id"
          class="my-goods-item"
          @click="sendGoodsMessage(item); showMyGoodsSelector = false"
        >
          <img :src="getImageUrl(item.images)" class="my-goods-img" />
          <div class="my-goods-info">
            <div class="my-goods-name">{{ item.name }}</div>
            <div class="my-goods-price">¥ {{ item.price }}</div>
          </div>
        </div>
      </div>
      <div v-else>暂无发布的商品</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Goods, PictureFilled, ChatDotRound } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const myUserId = Number(localStorage.getItem('userId'))

// 会话相关
const conversations = ref([])
const activeUserId = ref(null)
const chatMsgs = ref([])
const chatText = ref('')
const chatBox = ref(null)

// 用户信息弹窗
const infoVisible = ref(false)
const infoUser = ref(null)
const infoGoods = ref([])

// 商品详情页带来的商品卡片
const currentGoodsCard = ref(null)
// 选择我的商品
const showMyGoodsSelector = ref(false)
const myGoods = ref([])
// 图片上传
const imageInput = ref(null)

// 商品图片缓存
const goodsImageCache = ref(new Map())

const activeConv = computed(() =>
  conversations.value.find(c => c.userId === activeUserId.value)
)

// ========== 增强的图片处理函数 ==========
const getImageUrl = (str) => {
  if (!str) return 'https://picsum.photos/200/150'
  if (Array.isArray(str)) str = str[0] || ''
  if (typeof str !== 'string') return 'https://picsum.photos/200/150'
  
  // 如果已经是完整的 URL 或 Data URL，直接返回
  if (str.startsWith('http') || str.startsWith('data:image/')) {
    return str
  }
  
  // 可能包含逗号分隔的多张图片，分割并过滤无效项
  const parts = str.split(',').map(s => s.trim()).filter(s => s.length > 100)
  if (parts.length > 0) {
    const first = parts[0]
    // 如果第一张已经是完整的 Data URL 或 HTTP URL，直接返回
    if (first.startsWith('http') || first.startsWith('data:image/')) {
      return first
    }
    // 否则补全 base64 前缀
    return 'data:image/jpeg;base64,' + first
  }
  
  // 如果没有有效的分隔符，且字符串本身长度 > 100，视为纯 base64
  if (str.length > 100) {
    return 'data:image/jpeg;base64,' + str
  }
  
  return 'https://picsum.photos/200/150'
}

const parseExtra = (extra) => {
  if (!extra) return {}
  if (typeof extra === 'string') {
    try { return JSON.parse(extra) } catch (e) { return {} }
  }
  return extra
}

const getGoodsImage = (goodsId) => {
  if (!goodsId) return 'https://picsum.photos/220/120'
  if (goodsImageCache.value.has(goodsId)) {
    return goodsImageCache.value.get(goodsId)
  }
  request.get('/goods/' + goodsId).then(res => {
    const goods = res.data
    const imgUrl = goods?.images ? getImageUrl(goods.images) : 'https://picsum.photos/220/120'
    goodsImageCache.value.set(goodsId, imgUrl)
    goodsImageCache.value = new Map(goodsImageCache.value)
  }).catch(() => {
    goodsImageCache.value.set(goodsId, 'https://picsum.photos/220/120')
    goodsImageCache.value = new Map(goodsImageCache.value)
  })
  return 'https://picsum.photos/220/120'
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const scrollToBottom = () => {
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}

// ========== 数据请求 ==========
const fetchConversations = async () => {
  try {
    const res = await request.get('/chat/conversations')
    conversations.value = res.data.conversations || []
    window.dispatchEvent(new CustomEvent('unreadUpdate', { detail: res.data.totalUnread || 0 }))
  } catch (e) {}
}

const loadMessages = async (peerId, goodsIdParam) => {
  try {
    const params = { userId: peerId }
    if (goodsIdParam) params.goodsId = goodsIdParam
    const res = await request.get('/chat/conversation', { params })
    chatMsgs.value = res.data || []
    chatMsgs.value.forEach(msg => {
      if (msg.type === 'goods' && msg.goodsId) {
        getGoodsImage(msg.goodsId)
      }
    })
    await nextTick()
    scrollToBottom()
  } catch (e) {}
}

const fetchMyGoods = async () => {
  try {
    const res = await request.get('/goods/list', {
      params: { userId: myUserId, status: 1, page: 1, size: 100 }
    })
    myGoods.value = res.data.records
  } catch (e) {}
}

const initFromRoute = () => {
  const query = route.query
  if (query.userId) {
    activeUserId.value = Number(query.userId)
    if (query.goodsId) {
      request.get('/goods/' + query.goodsId).then(res => {
        currentGoodsCard.value = res.data
      }).catch(() => {})
    }
    loadMessages(activeUserId.value, query.goodsId)
    fetchMyGoods()
  }
}

const selectConversation = (conv) => {
  activeUserId.value = conv.userId
  currentGoodsCard.value = null
  loadMessages(conv.userId)
  fetchMyGoods()
}

// ========== 消息发送 ==========
const checkSelfChat = () => {
  if (activeUserId.value === myUserId) {
    ElMessage.warning('不能给自己发送消息')
    return true
  }
  return false
}

const sendTextMessage = async () => {
  if (checkSelfChat()) return
  if (!chatText.value.trim()) return
  const message = {
    receiverId: activeUserId.value,
    content: chatText.value,
    type: 'text',
    goodsId: currentGoodsCard.value?.id || null
  }
  await doSend(message)
  chatText.value = ''
}

const sendGoodsMessage = async (goods, isAuto = false) => {
  if (checkSelfChat()) return
  const extra = { name: goods.name, price: goods.price, status: goods.status }
  const message = {
    receiverId: activeUserId.value,
    type: 'goods',
    content: goods.name,
    goodsId: goods.id,
    extra: JSON.stringify(extra)
  }
  if (!isAuto) {
    await doSend(message)
  }
}

const onImagePicked = async (e) => {
  if (checkSelfChat()) return
  const file = e.target.files[0]
  if (!file) return
  const compress = (file) => new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > 800) { h = (h * 800) / w; w = 800 }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
  const base64 = await compress(file)
  const message = { receiverId: activeUserId.value, type: 'image', content: base64, extra: null }
  await doSend(message)
  imageInput.value.value = ''
}

const doSend = async (message) => {
  try {
    const res = await request.post('/chat/send', message)
    chatMsgs.value.push(res.data)
    await nextTick()
    scrollToBottom()
    fetchConversations()
  } catch (e) { ElMessage.error('发送失败') }
}

const triggerImageUpload = () => imageInput.value.click()
const goToGoods = (id) => { if (id) router.push('/goods/' + id) }

const showUserInfo = async (userId) => {
  try {
    const res = await request.get('/user/info/' + userId)
    infoUser.value = res.data.user
    infoGoods.value = res.data.goodsList || []
    infoVisible.value = true
  } catch (e) { ElMessage.error('获取用户信息失败') }
}

let intervalId = null
onMounted(() => {
  fetchConversations()
  initFromRoute()
  intervalId = setInterval(fetchConversations, 10000)
})
onBeforeUnmount(() => { if (intervalId) clearInterval(intervalId) })
watch(() => route.query, () => initFromRoute())
</script>

<style scoped>
.chat-page { height: calc(100vh - 120px); display: flex; }
.chat-container {
  flex: 1; display: flex; border: 1px solid var(--border-normal);
  border-radius: var(--radius-md); overflow: hidden; margin: 0 auto; max-width: 1000px;
  box-shadow: var(--shadow-sm);
}
.chat-left {
  width: 280px; background: #fff; border-right: 1px solid var(--border-light);
  display: flex; flex-direction: column;
}
.chat-header {
  padding: 16px; font-size: 16px; font-weight: 700; color: var(--text-heading);
  border-bottom: 1px solid var(--border-light);
}
.conversation-list { flex: 1; overflow-y: auto; }
.conversation-item {
  display: flex; align-items: center; padding: 12px 16px; cursor: pointer;
  transition: all var(--transition-fast); border-left: 3px solid transparent;
}
.conversation-item:hover { background: var(--bg-warm); }
.conversation-item.active {
  background: linear-gradient(90deg, var(--primary-bg), transparent);
  border-left-color: var(--primary);
}
.conv-avatar { margin-right: 10px; cursor: pointer; }
.conv-content { flex: 1; min-width: 0; }
.conv-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.conv-name { font-weight: 500; font-size: 14px; color: var(--text-heading); }
.conv-time { font-size: 12px; color: var(--text-secondary); }
.conv-bottom { display: flex; justify-content: space-between; align-items: center; }
.conv-preview { font-size: 13px; color: var(--text-body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
.conv-badge :deep(.el-badge__content) {
  background: linear-gradient(135deg, #E8483C, #FF7875);
  border: none; animation: scaleIn 0.3s ease;
}

.chat-right { flex: 1; display: flex; flex-direction: column; background: #fff; }
.chat-header-right {
  padding: 12px 16px; border-bottom: 1px solid var(--border-light);
  display: flex; align-items: center;
}
.user-bar { display: flex; align-items: center; cursor: pointer; gap: 10px; }
.user-name { font-weight: 600; color: var(--text-heading); }
.goods-card-bar { padding: 10px 16px; background: var(--bg-warm); border-bottom: 1px solid var(--border-light); }
.goods-card {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  background: white; padding: 8px; border-radius: var(--radius-sm);
  border: 1px solid var(--border-light); transition: all var(--transition-fast);
}
.goods-card:hover { border-color: var(--primary); box-shadow: var(--shadow-xs); }
.goods-card-img { width: 60px; height: 60px; border-radius: var(--radius-xs); object-fit: cover; }
.goods-card-info { flex: 1; }
.goods-card-name { font-size: 14px; margin-bottom: 4px; }
.goods-card-price { color: var(--danger); font-weight: 600; }

.chat-messages {
  flex: 1; padding: 16px; overflow-y: auto;
  background: linear-gradient(180deg, #FBF7F0, #FFF9F5);
  scrollbar-width: thin; scrollbar-color: transparent transparent;
}
.chat-messages:hover { scrollbar-color: rgba(45,34,28,0.15) transparent; }
.chat-messages::-webkit-scrollbar { width: 6px; }
.chat-messages::-webkit-scrollbar-track { background: transparent; }
.chat-messages::-webkit-scrollbar-thumb { background-color: transparent; border-radius: 3px; }
.chat-messages:hover::-webkit-scrollbar-thumb { background-color: rgba(45,34,28,0.15); }
.chat-messages:hover::-webkit-scrollbar-thumb:hover { background-color: rgba(45,34,28,0.28); }

.msg { margin-bottom: 20px; display: flex; flex-direction: column; animation: fadeInUp 0.3s ease both; }
.msg-right { align-items: flex-end; }
.msg-left { align-items: flex-start; }
.msg-system { justify-content: center; align-items: center; margin: 10px 0; }
.msg-bubble { max-width: 70%; padding: 10px 14px; border-radius: var(--radius-sm); background: #fff; word-break: break-all; }
.msg-right .msg-bubble {
  background: var(--primary-gradient); color: #fff;
  border-radius: 14px 14px 4px 14px;
  box-shadow: 0 2px 8px rgba(232, 93, 63, 0.2);
}
.msg-left .msg-bubble {
  box-shadow: 0 1px 4px rgba(45, 34, 28, 0.06);
  border-radius: 14px 14px 14px 4px;
}
.system-bubble { background: #EDE8E2; color: var(--text-body); max-width: 80%; text-align: center; }

.msg-goods-card {
  width: 220px; background: #fff; border: 1px solid var(--border-light);
  border-radius: var(--radius-md); overflow: hidden; cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}
.msg-goods-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.msg-goods-img { width: 100%; height: 120px; object-fit: cover; display: block; }
.msg-goods-info { padding: 8px 10px; }
.msg-goods-name { font-size: 14px; font-weight: 500; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-goods-price { font-size: 15px; font-weight: 700; color: var(--danger); }
.msg-goods-sold { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

.msg-image { max-width: 200px; }
.msg-img-thumb { width: 100%; border-radius: var(--radius-sm); cursor: pointer; }
.msg-time { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }

.chat-bottom { border-top: 1px solid var(--border-light); background: #fff; }
.chat-toolbar { padding: 6px 16px; display: flex; gap: 8px; }
.tool-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px; color: var(--text-secondary); border-radius: var(--radius-xs); transition: all var(--transition-fast); }
.tool-btn:hover { color: var(--primary); background: var(--primary-bg); }
.chat-input-area { padding: 0 16px 10px; display: flex; gap: 8px; align-items: flex-end; }

.my-goods-list { max-height: 300px; overflow-y: auto; }
.my-goods-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-bottom: 1px solid var(--border-light); cursor: pointer; transition: background var(--transition-fast); }
.my-goods-item:hover { background: var(--bg-warm); }
.my-goods-img { width: 60px; height: 45px; border-radius: 4px; object-fit: cover; }
.my-goods-info { flex: 1; }
.my-goods-name { font-size: 14px; }
.my-goods-price { color: var(--danger); font-weight: 600; }

.info-dialog .info-header { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
.info-dialog .info-header h3 { margin: 0; }
.info-dialog .info-detail p { margin: 8px 0; }
.info-dialog .info-detail span { color: var(--text-secondary); }
.user-goods { margin-top: 20px; }
.user-goods h4 { margin-bottom: 10px; }
.mini-goods { display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-bottom: 8px; cursor: pointer; transition: all var(--transition-fast); }
.mini-goods:hover { background: var(--bg-warm); border-color: var(--primary); }
.mini-goods img { width: 60px; height: 45px; border-radius: var(--radius-xs); object-fit: cover; }
.g-name { font-size: 14px; }
.g-price { color: var(--danger); font-weight: 600; }
.no-conversation { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); }
</style>