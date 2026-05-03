import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Users, Zap, TrendingUp, Gauge } from 'lucide-react'
import './LiveStats.css'

interface Stats {
  total_users: number
  active_flows: number
  total_executions: number
  success_rate: number
  uptime_percentage: number
}

export default function LiveStats() {
  const ref = useRef<HTMLElement | null>(null)
  const isInView = useInView(ref, { once: false, margin: '-100px' })

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const AUTH_BASE =
    import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:4000'

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)

      const response = await fetch(`${AUTH_BASE}/api/stats/public`, {
        signal,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data: Stats = await response.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err)
        setError('Unable to load live stats')
      }
    } finally {
      setLoading(false)
    }
  }, [AUTH_BASE])

  // Initial fetch
  useEffect(() => {
    const controller = new AbortController()
    fetchStats(controller.signal)

    return () => controller.abort()
  }, [fetchStats])

  // Live interval (only when visible)
  useEffect(() => {
    if (!isInView) return

    const controller = new AbortController()

    const interval = setInterval(() => {
      fetchStats(controller.signal)
    }, 30000)

    return () => {
      clearInterval(interval)
      controller.abort()
    }
  }, [isInView, fetchStats])

  const statItems = useMemo(
    () => [
      {
        label: 'Active Users',
        value: stats?.total_users ?? 0,
        icon: Users,
        color: 'blue',
      },
      {
        label: 'Active Flows',
        value: stats?.active_flows ?? 0,
        icon: Zap,
        color: 'amber',
      },
      {
        label: 'Workflows Executed',
        value: stats?.total_executions ?? 0,
        icon: TrendingUp,
        color: 'green',
      },
      {
        label: 'Success Rate',
        value: `${stats?.success_rate ?? 100}%`,
        icon: Gauge,
        color: 'purple',
      },
    ],
    [stats]
  )

  return (
    <section className="live-stats section" id="live-stats" ref={ref}>
      <div className="container">

        {/* Header */}
        <motion.div
          className="live-stats__header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-badge">
            <Zap size={14} />
            Live Activity
          </div>

          <h2 className="section-title">
            Platform <span className="gradient-text">Live Statistics</span>
          </h2>
        </motion.div>

        {/* Error State */}
        {error && (
          <div className="live-stats__error">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && stats ? (
          <motion.div
            className="live-stats__grid"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {statItems.map((item, i) => {
              const Icon = item.icon

              return (
                <motion.div
                  key={item.label}
                  className={`live-stats__card live-stats__card--${item.color}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  whileHover={{ y: -6 }}
                >
                  <div className="live-stats__card-icon">
                    <Icon size={22} />
                  </div>

                  <div className="live-stats__card-content">
                    <div className="live-stats__card-value">
                      {typeof item.value === 'number'
                        ? item.value.toLocaleString()
                        : item.value}
                    </div>
                    <div className="live-stats__card-label">
                      {item.label}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <div className="live-stats__loading">
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
            <div className="skeleton-bar" />
          </div>
        )}

        {/* Footer */}
        {lastUpdated && (
          <motion.p
            className="live-stats__updated"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Updated: {lastUpdated.toLocaleTimeString()} · Refreshes every 30s
          </motion.p>
        )}
      </div>
    </section>
  )
}