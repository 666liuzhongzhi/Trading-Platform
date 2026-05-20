<template>
  <div class="ai-float">
    <!-- 悬浮球按钮 -->
    <div class="ai-ball" :class="{ active: visible }" @click="visible = !visible">
      <el-icon :size="22" v-if="!visible"><ChatLineSquare /></el-icon>
      <el-icon :size="18" v-else><Close /></el-icon>
    </div>

    <!-- 对话面板 -->
    <transition name="ai-panel">
      <div v-if="visible" class="ai-panel">
        <div class="ai-panel-header">
          <div class="ai-panel-title">
            <span class="ai-dot"></span>
            AI 助手
          </div>
          <div class="ai-panel-actions">
            <el-dropdown v-if="sessions.length > 0" @command="switchSession" trigger="click">
              <el-button link class="session-btn">
                <el-icon :size="16"><Grid /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="s in sessions"
                    :key="s.id"
                    :command="s.id"
                    :class="{ 'is-active': s.id === currentSessionId }"
                  >
                    {{ s.title || '新对话' }}
                    <el-button link class="del-session-btn" @click.stop="deleteSession(s.id)">
                      <el-icon :size="14"><Delete /></el-icon>
                    </el-button>
                  </el-dropdown-item>
                  <el-dropdown-item divided command="new">
                    <el-icon :size="14"><Plus /></el-icon> 新对话
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link class="close-btn" @click="visible = false">
              <el-icon :size="18"><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="ai-messages" ref="msgBox">
          <div v-if="messages.length === 0" class="ai-welcome">
            <span class="welcome-icon">✨</span>
            <p>你好，我是校园二手集市的 AI 助手</p>
            <p class="welcome-sub">可以帮你推荐商品、解答使用问题</p>
          </div>
          <div
            v-for="msg in messages"
            :key="msg.id || msg._key"
            class="ai-msg"
            :class="msg.role"
          >
            <div class="ai-msg-bubble">
              <span v-if="msg.role === 'assistant'" class="msg-avatar">🤖</span>
              <div class="msg-content">{{ msg.content }}</div>
            </div>
          </div>
          <div v-if="loading" class="ai-msg assistant">
            <div class="ai-msg-bubble">
              <span class="msg-avatar">🤖</span>
              <div class="msg-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-input">
          <el-input
            v-model="inputText"
            placeholder="输入你的问题..."
            @keyup.enter="send"
            :disabled="loading"
            clearable
          />
          <el-button type="primary" class="send-btn" @click="send" :disabled="loading || !inputText.trim()">
            <el-icon :size="16"><Promotion /></el-icon>
          </el-button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import { ChatLineSquare, Close, Promotion, Grid, Delete, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const visible = ref(false)
const loading = ref(false)
const inputText = ref('')
const messages = ref([])
const sessions = ref([])
const currentSessionId = ref(null)
const msgBox = ref(null)
let unread = 0

const scrollBottom = async () => {
  await nextTick()
  if (msgBox.value) {
    msgBox.value.scrollTop = msgBox.value.scrollHeight
  }
}

const loadSessions = async () => {
  if (!localStorage.getItem('token')) return
  try {
    const res = await request.get('/ai/sessions')
    sessions.value = res.data || []
  } catch (e) { /* ignore */ }
}

const loadMessages = async (sessionId) => {
  if (!sessionId) return
  try {
    const res = await request.get('/ai/messages/' + sessionId)
    messages.value = (res.data || []).map(m => ({
      ...m,
      _key: m.id || Math.random()
    }))
    await scrollBottom()
  } catch (e) { /* ignore */ }
}

const createSession = async () => {
  try {
    const res = await request.post('/ai/session')
    const s = res.data
    sessions.value.unshift(s)
    return s.id
  } catch (e) {
    return null
  }
}

const switchSession = async (id) => {
  if (id === 'new') {
    currentSessionId.value = null
    messages.value = []
    return
  }
  currentSessionId.value = id
  await loadMessages(id)
}

const deleteSession = async (id) => {
  try {
    await request.delete('/ai/session/' + id)
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (currentSessionId.value === id) {
      currentSessionId.value = null
      messages.value = []
    }
  } catch (e) { /* ignore */ }
}

const send = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  inputText.value = ''

  messages.value.push({
    _key: Date.now(),
    role: 'user',
    content: text
  })
  await scrollBottom()

  let sid = currentSessionId.value
  if (!sid) {
    sid = await createSession()
    if (!sid) {
      messages.value.pop()
      return
    }
    currentSessionId.value = sid
  }

  loading.value = true
  try {
    const res = await request.post('/ai/chat', {
      sessionId: sid,
      question: text
    })
    messages.value.push({
      _key: 'a_' + Date.now(),
      role: 'assistant',
      content: res.data.answer
    })
    await loadSessions()
  } catch (e) {
    messages.value.push({
      _key: 'a_' + Date.now(),
      role: 'assistant',
      content: '抱歉，AI 服务暂时不可用，请稍后重试。'
    })
    await loadSessions()
    // 如果是会话被删了
    if (e.response && e.response.status === 403) {
      currentSessionId.value = null
      messages.value = []
    }
  } finally {
    loading.value = false
    await scrollBottom()
  }
}

watch(visible, async (val) => {
  if (val) {
    await loadSessions()
    if (!currentSessionId.value && sessions.value.length > 0) {
      currentSessionId.value = sessions.value[0].id
      await loadMessages(currentSessionId.value)
    }
    await scrollBottom()
  }
})

onMounted(() => {
  if (localStorage.getItem('token')) {
    loadSessions()
  }
})
</script>

<style scoped>
.ai-float { position: fixed; right: 24px; bottom: 24px; z-index: 1000; }

/* 悬浮球 */
.ai-ball {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: var(--primary, #1677ff);
  color: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(22,119,255,0.35);
  transition: 0.3s;
  user-select: none;
}
.ai-ball:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(22,119,255,0.45); }
.ai-ball.active { background: #fff; color: var(--text, #555); box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

/* 面板 */
.ai-panel {
  position: absolute;
  right: 0; bottom: 68px;
  width: 380px; height: 520px;
  background: white;
  border-radius: var(--radius-md, 12px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.ai-panel-enter-active { transition: 0.25s ease; }
.ai-panel-leave-active { transition: 0.2s ease; }
.ai-panel-enter-from, .ai-panel-leave-to {
  opacity: 0; transform: translateY(12px) scale(0.96);
}

/* 头部 */
.ai-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border, #f0f0f0);
}
.ai-panel-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--text-heading, #1a1a1a); }
.ai-dot { width: 8px; height: 8px; border-radius: 50%; background: #52c41a; }
.ai-panel-actions { display: flex; align-items: center; gap: 4px; }
.session-btn, .close-btn { color: var(--text-secondary, #8c8c8c); padding: 4px; }
.is-active { background: var(--primary-bg, rgba(22,119,255,0.08)); color: var(--primary, #1677ff); }
.del-session-btn { float: right; padding: 0; margin-left: 8px; color: #ccc; }
.del-session-btn:hover { color: #ff4d4f; }

/* 消息区 */
.ai-messages {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 14px;
  background: var(--bg, #f5f7fa);
}
.ai-welcome { text-align: center; padding: 40px 20px; color: var(--text-secondary, #8c8c8c); }
.welcome-icon { font-size: 40px; display: block; margin-bottom: 12px; }
.welcome-sub { font-size: 13px; margin-top: 4px; }

.ai-msg { display: flex; }
.ai-msg.user { justify-content: flex-end; }
.ai-msg-bubble { display: flex; align-items: flex-start; gap: 8px; max-width: 85%; }
.msg-avatar { font-size: 18px; flex-shrink: 0; margin-top: 2px; }
.msg-content {
  padding: 10px 14px; border-radius: 14px;
  font-size: 14px; line-height: 1.65; white-space: pre-wrap; word-break: break-word;
}
.ai-msg.user .msg-content {
  background: var(--primary, #1677ff); color: white;
  border-bottom-right-radius: 4px;
}
.ai-msg.assistant .msg-content {
  background: white; color: var(--text, #555);
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

/* 打字动画 */
.typing { display: flex; gap: 4px; align-items: center; padding: 14px 18px; }
.typing span {
  width: 6px; height: 6px; border-radius: 50%; background: #bbb;
  animation: ai-bounce 1.2s infinite;
}
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes ai-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

/* 输入区 */
.ai-input {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px; border-top: 1px solid var(--border, #f0f0f0);
}
.ai-input :deep(.el-input__wrapper) {
  border-radius: 20px; background: var(--bg, #f5f7fa);
  border: none; box-shadow: none;
}
.send-btn {
  width: 36px; height: 36px; border-radius: 50%;
  flex-shrink: 0; padding: 0;
}
</style>
