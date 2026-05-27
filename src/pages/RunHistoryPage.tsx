import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getRunHistory, retryJob, type ExecutionLog } from "../api/runHistory";
import "../styles/RunHistoryPage.css";

export default function RunHistoryPage() {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  async function handleRetry(logId: string) {
    setRetrying((prev) => new Set(prev).add(logId));
    try {
      await retryJob(logId);
      setLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, success: true, error: undefined } : l))
      );
    } catch (err: any) {
      alert(err.message || "Retry failed");
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(logId);
        return next;
      });
    }
  }

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await getRunHistory();
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch run history", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const chartData = React.useMemo(() => {
    const dailyStats: Record<string, { date: string; success: number; failed: number }> = {};
    logs.forEach((log) => {
      const date = new Date(log.executed_at).toLocaleDateString();
      if (!dailyStats[date]) dailyStats[date] = { date, success: 0, failed: 0 };
      if (log.success) dailyStats[date].success += 1;
      else dailyStats[date].failed += 1;
    });
    return Object.values(dailyStats).reverse();
  }, [logs]);

  if (loading) {
    return <div className="runhistory-loading">Loading execution history...</div>;
  }

  return (
    <div className="runhistory-page">
      <div className="runhistory-inner">

        {/* Header */}
        <div className="runhistory-header">
          <h1>Run History</h1>
          <p>View past workflow executions, success rates, and debug payloads.</p>
        </div>

        {/* Chart */}
        <div className="runhistory-card">
          <h2>Execution Trends</h2>
          <div style={{ height: 300, width: "100%" }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-hover)' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="success" name="Successful Runs" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="failed" name="Failed Runs" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="runhistory-chart-empty">No data to display yet</div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="runhistory-table-card">
          <div className="runhistory-table-header">
            <h2>Execution Logs</h2>
          </div>
          <div className="runhistory-table-scroll">
            <table className="runhistory-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Workflow Name</th>
                  <th>Status</th>
                  <th>Payload / Error</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="runhistory-ts">{new Date(log.executed_at).toLocaleString()}</td>
                      <td className="runhistory-workflow">{log.workflow_name}</td>
                      <td>
                        <span className={`runhistory-badge ${log.success ? "success" : "failed"}`}>
                          {log.success ? "Success" : "Failed"}
                        </span>
                      </td>
                      <td>
                        <div className={`runhistory-payload${!log.success && log.error ? " error" : ""}`}>
                          {!log.success && log.error ? log.error : JSON.stringify(log.payload)}
                        </div>
                      </td>
                      <td>
                        {!log.success && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            disabled={retrying.has(log.id)}
                            className="runhistory-retry"
                          >
                            {retrying.has(log.id) ? "Retrying…" : "Retry"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="runhistory-empty">No executions recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
