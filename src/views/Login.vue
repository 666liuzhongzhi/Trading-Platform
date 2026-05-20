<template>
	<div class="login-page">
		<el-card class="login-card" shadow="never">
			<template v-if="!showRegister">
				<div class="login-header">
					<h2>👋 欢迎回来</h2>
					<p>登录你的校园二手账户</p>
				</div>
				<el-form label-position="top">
					<el-form-item label="账号">
						<el-input v-model="username" placeholder="请输入账号" size="large" :prefix-icon="User" />
					</el-form-item>
					<el-form-item label="密码">
						<el-input v-model="password" type="password" placeholder="请输入密码" size="large"
							:prefix-icon="Lock" show-password />
					</el-form-item>
					<el-form-item>
						<el-button type="primary" size="large" class="login-btn" :loading="loading" @click="login">
							{{ loading ? '登录中...' : '登录' }}
						</el-button>
					</el-form-item>
				</el-form>
				<div class="switch-text">还没有账号？<span @click="showRegister = true">立即注册</span></div>
				<div class="demo-tip">演示账号：admin / 123456</div>
			</template>
			<template v-else>
				<div class="login-header">
					<h2>📝 注册账号</h2>
					<p>加入校园二手集市</p>
				</div>
				<el-form label-position="top">
					<el-form-item label="账号">
						<el-input v-model="regUser" placeholder="请输入账号" size="large" :prefix-icon="User" />
					</el-form-item>
					<el-form-item label="密码">
						<el-input v-model="regPwd" type="password" placeholder="请输入密码" size="large" :prefix-icon="Lock"
							show-password />
					</el-form-item>
					<el-form-item>
						<el-button type="primary" size="large" class="login-btn" :loading="loading"
							@click="register">注册</el-button>
					</el-form-item>
				</el-form>
				<div class="switch-text">已有账号？<span @click="showRegister = false">返回登录</span></div>
			</template>
		</el-card>
	</div>
</template>

<script setup>
	import {
		ref
	} from 'vue'
	import {
		useRouter
	} from 'vue-router'
	import {
		ElMessage
	} from 'element-plus'
	import {
		User,
		Lock
	} from '@element-plus/icons-vue'
	import request from '@/utils/request'

	const router = useRouter()
	const username = ref('')
	const password = ref('')
	const regUser = ref('')
	const regPwd = ref('')
	const showRegister = ref(false)
	const loading = ref(false)

	const login = async () => {
		if (!username.value || !password.value) {
			ElMessage.warning('请输入账号和密码');
			return
		}
		loading.value = true
		try {
			const res = await request.post('/user/login', {
				username: username.value,
				password: password.value
			})
			const {
				token,
				userId,
				username: uname,
				nickname,
				role
			} = res.data
			localStorage.setItem('token', token)
			localStorage.setItem('userId', userId)
			localStorage.setItem('isLogin', 'true')
			localStorage.setItem('userRole', role)
			localStorage.setItem('userName', nickname || uname)
			window.dispatchEvent(new Event('storage'))
			ElMessage.success('登录成功')
			router.push('/')
		} catch (e) {} finally {
			loading.value = false
		}
	}

	const register = async () => {
		if (!regUser.value || !regPwd.value) {
			ElMessage.warning('请填写完整');
			return
		}
		loading.value = true
		try {
			await request.post('/user/register', {
				username: regUser.value,
				password: regPwd.value
			})
			ElMessage.success('注册成功，请登录')
			showRegister.value = false
			regUser.value = ''
			regPwd.value = ''
		} catch (e) {} finally {
			loading.value = false
		}
	}
</script>

<style scoped>
.login-page {
  display: flex; justify-content: center; align-items: center;
  min-height: 80vh; position: relative; overflow: hidden;
}
/* 浮动装饰圆 */
.login-page::before,
.login-page::after {
  content: ''; position: absolute; border-radius: 50%; z-index: 0;
  opacity: 0.3; pointer-events: none;
}
.login-page::before {
  width: 320px; height: 320px;
  background: linear-gradient(135deg, #E85D3F, #F2A65C);
  top: -80px; right: -60px;
  animation: float 6s ease-in-out infinite;
}
.login-page::after {
  width: 220px; height: 220px;
  background: linear-gradient(135deg, #E84A7F, #F5A0B5);
  bottom: -40px; left: -30px;
  animation: float 6s ease-in-out infinite reverse;
}

.login-card {
  width: 420px; padding: 40px 30px;
  border-radius: var(--radius-lg); position: relative; z-index: 1;
  border: none; box-shadow: var(--shadow-lg); animation: scaleIn 0.5s ease;
}
/* 卡片顶部渐变色条 */
.login-card :deep(.el-card__body) {
  position: relative; padding-top: 8px;
}
.login-card :deep(.el-card__body)::before {
  content: ''; position: absolute; top: 0; left: 24px; right: 24px;
  height: 3px;
  background: linear-gradient(90deg, #E85D3F, #F2A65C, #E84A7F);
  border-radius: 0 0 4px 4px;
}

.login-header { text-align: center; margin-bottom: 32px; }
.login-header h2 {
  font-size: 26px; margin-bottom: 6px;
  background: linear-gradient(135deg, #2D221C, #E85D3F);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.login-header p { color: var(--text-secondary); font-size: 14px; }

/* 输入框 */
.login-card :deep(.el-input__wrapper) {
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-normal);
  transition: all var(--transition-base);
  box-shadow: none !important;
}
.login-card :deep(.el-input__wrapper:focus-within),
.login-card :deep(.el-input__wrapper:hover) {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(232, 93, 63, 0.1) !important;
}

/* 登录按钮 */
.login-btn {
  width: 100%; height: 48px; border-radius: var(--radius-xl);
  font-size: 16px; font-weight: 600; border: none;
  background: var(--primary-gradient);
  transition: all var(--transition-base);
  position: relative; overflow: hidden;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(232, 93, 63, 0.35);
}
.login-btn:active { transform: translateY(0) scale(0.98); }

.switch-text { text-align: center; font-size: 14px; color: var(--text-secondary); margin-top: 10px; }
.switch-text span { color: var(--primary); cursor: pointer; font-weight: 500; }
.demo-tip { text-align: center; margin-top: 14px; font-size: 12px; color: var(--text-disabled); }
</style>