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
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 70vh;
	}

	.login-card {
		width: 420px;
		padding: 40px 30px;
		border-radius: 16px;
		border: 1px solid #f0f0f0;
	}

	.login-header {
		text-align: center;
		margin-bottom: 32px;
	}

	.login-header h2 {
		font-size: 24px;
		color: #1a1a1a;
	}

	.login-header p {
		color: #999;
		font-size: 14px;
	}

	.login-btn {
		width: 100%;
		height: 44px;
		border-radius: 22px;
		font-size: 16px;
	}

	.switch-text {
		text-align: center;
		font-size: 14px;
		color: #999;
		margin-top: 10px;
	}

	.switch-text span {
		color: #1677ff;
		cursor: pointer;
		font-weight: 500;
	}

	.demo-tip {
		text-align: center;
		margin-top: 12px;
		font-size: 12px;
		color: #ccc;
	}
</style>