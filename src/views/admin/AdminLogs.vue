<template>
  <el-card class="tab-card" shadow="never">
    <div class="card-header">
      <div>
        <h3>操作日志</h3>
        <p class="card-desc">记录管理员所有关键操作，可用于安全审计和问题回溯。</p>
      </div>
    </div>

    <div class="filter-bar">
      <span class="filter-label">日期范围：</span>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        :shortcuts="dateShortcuts"
        @change="onDateChange"
      />
      <el-button type="primary" @click="fetchLogs" :loading="loading">查询</el-button>
    </div>

    <el-table :data="logList" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="操作用户" width="120" />
      <el-table-column prop="operation" label="操作描述" min-width="150" show-overflow-tooltip />
      <el-table-column prop="method" label="请求方法" width="120" />
      <el-table-column prop="ip" label="IP地址" width="140" />
      <el-table-column prop="createTime" label="操作时间" width="160">
        <template #default="{ row }">{{ row.createTime?.substring(0, 16) }}</template>
      </el-table-column>
    </el-table>

    <el-empty v-if="logList.length === 0 && !loading" description="暂无操作记录" />

    <div class="pagination-wrap" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '@/utils/request'

const loading = ref(false)
const logList = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const today = () => new Date().toISOString().substring(0, 10)
const yesterday = () => {
  const d = new Date(); d.setDate(d.getDate() - 1)
  return d.toISOString().substring(0, 10)
}

const dateRange = ref([today(), today()])

const dateShortcuts = [
  { text: '今天', value: [today(), today()] },
  { text: '昨天', value: [yesterday(), yesterday()] },
  { text: '最近7天', value: [(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().substring(0, 10); })(), today()] },
  { text: '最近30天', value: [(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().substring(0, 10); })(), today()] },
]

const startDate = computed(() => dateRange.value?.[0] || '')
const endDate = computed(() => dateRange.value?.[1] || '')

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/logs', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        startDate: startDate.value,
        endDate: endDate.value,
      }
    })
    if (res.data && res.data.records) {
      logList.value = res.data.records
      total.value = res.data.total
    } else {
      logList.value = res.data || []
      total.value = logList.value.length
    }
  } catch (e) {
    logList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const onDateChange = () => { currentPage.value = 1; fetchLogs() }
const onPageChange = () => fetchLogs()
const onSizeChange = () => { currentPage.value = 1; fetchLogs() }

onMounted(fetchLogs)
</script>

<style scoped>
.tab-card { border-radius: 12px; border: 1px solid #f0f0f0; }
.card-header { margin-bottom: 16px; }
.card-desc { color: #999; font-size: 13px; margin-top: 5px; }
.filter-bar {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 16px; flex-wrap: wrap;
}
.filter-label { color: #606266; font-size: 14px; white-space: nowrap; }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
