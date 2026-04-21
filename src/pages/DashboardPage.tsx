import React, { useState, useEffect } from 'react'
import { ArrowLeft, BarChart3, TrendingUp, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  LineChart, Line, BarChart, Bar, PieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { getDashboardAnalytics, type DashboardAnalytics } from '../api/dashboard'
import '../styles/DashboardPage.css'

const COLORS = ['#10b981', '#ef4444']

function DashboardPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'all'>('30days')

  useEffect(() => {
    fetchDashboardData()
  }, [dateRange])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await getDashboardAnalytics(dateRange)
      setData(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="dashboard-loading">Loading analytics...</div>
  }

  if (!data) {
    return <div className="dashboard-error">Failed to load data</div>
  }

  const successRate = data.successFailureStats.successful + data.successFailureStats.failed > 0
    ? (data.successFailureStats.successful / (data.successFailureStats.successful + data.successFailureStats.failed) * 100).toFixed(1)
    : 0

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header__left">
          <Link to="/builder" className="dashboard-header__back">
            <ArrowLeft size={20} />
          </Link>
          <h1>Dashboard</h1>
        </div>
        <div className="dashboard-filters">
          <button
            className={`filter-btn ${dateRange === '7days' ? 'active' : ''}`}
            onClick={() => setDateRange('7days')}
          >
            7 days
          </button>
          <button
            className={`filter-btn ${dateRange === '30days' ? 'active' : ''}`}
            onClick={() => setDateRange('30days')}
          >
            30 days
          </button>
          <button
            className={`filter-btn ${dateRange === 'all' ? 'active' : ''}`}
            onClick={() => setDateRange('all')}
          >
            All time
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <StatCard label="Total Workflows" value={data.summary.totalWorkflows} icon="📊" />
        <StatCard label="Active Workflows" value={data.summary.activeWorkflows} icon="⚡" />
        <StatCard label="Total Executions" value={data.summary.totalExecutions} icon="🔄" />
        <StatCard label="Connected Apps" value={data.summary.connectedApps} icon="🔌" />
      </div>

      <div className="dashboard-charts">
        <div className="chart-box chart-full">
          <h3>Execution History</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.executionHistory}>
              <defs>
                <linearGradient id="colorExec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="executions" stroke="#3b82f6" fill="url(#colorExec)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h3>Success Rate</h3>
          <div className="chart-pie">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Success', value: data.successFailureStats.successful },
                    { name: 'Failed', value: data.successFailureStats.failed },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <p className="success-rate">{successRate}%</p>
          </div>
        </div>

        <div className="chart-box">
          <h3>Most Active Flows</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.mostActiveFlows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="executions" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {data.recentActivity.length > 0 ? (
            data.recentActivity.map((item) => (
              <div key={item.id} className="activity-item">
                <div className={`status-dot ${item.status}`}></div>
                <div className="activity-info">
                  <p className="activity-name">{item.name}</p>
                  <p className="activity-time">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <span className="exec-count">{item.executionCount} runs</span>
              </div>
            ))
          ) : (
            <p className="no-activity">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  )
}

export default DashboardPage
