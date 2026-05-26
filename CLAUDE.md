# 校园二手集市 — 项目上下文

## 技术栈
Vue 3 + Vite + Element Plus + Vue Router + Axios，纯前端 SPA

## 后端
localhost:8081/api，JWT Bearer 认证，token 存 localStorage

## 目录结构
- src/main.js — 入口，挂载 ElementPlus + Router
- src/App.vue — 全局布局（顶部导航 + router-view + 底部），含登录状态/AI悬浮球
- src/style.css — CSS 变量（--primary: #1677ff 等）
- src/router/index.js — 路由表 + beforeEach 守卫（token/role 检查）
- src/utils/request.js — Axios 实例，baseURL localhost:8081/api，请求/响应拦截器

## 页面
- / — 首页（搜索+分类+轮播+商品网格），src/views/Home.vue
- /login — 登录/注册，src/views/Login.vue
- /publish — 发布闲置（图片压缩上传 base64），src/views/Publish.vue  
- /goods/:id — 商品详情（购买/收藏/聊天/卖家信息），src/views/GoodsDetail.vue
- /chat — 聊天列表（会话+消息+商品卡片+图片），src/views/ChatList.vue
- /user/* — 个人中心（资料/发布/卖出/买到/收藏/历史/编辑），src/views/user/
- /admin/* — 管理后台（审核/商品/用户/今日/角色/权限/日志），src/views/admin/

## 图片处理
各页面有各自的 getImageUrl() 函数，处理逗号分隔的 base64 字符串，失败回退 picsum.photos

## 组件
- AiFloatBall.vue — 右下角 AI 悬浮球，多会话管理，后端 /ai/* 接口

## 关键状态
localStorage: token, userId, userRole (admin/user), userName

## 记忆系统
如遇复杂问题或重要决策，检查 `C:\Users\liuzhongzhi\.claude\projects\D--HBuilderProjects-Trading-Platform\memory\MEMORY.md` 获取跨会话记忆。
