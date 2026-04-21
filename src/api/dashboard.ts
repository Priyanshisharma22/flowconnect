import { http } from "./httpClient";

const ANALYTICS_URL = import.meta.env.VITE_AUTH_API_BASE_URL || 'http://localhost:4000';

export interface ExecutionHistoryData {
  date: string;
  executions: number;
}

export interface SuccessFailureStats {
  successful: number;
  failed: number;
}

export interface MostActiveFlow {
  name: string;
  executions: number;
}

export interface RecentActivity {
  id: string;
  name: string;
  timestamp: string;
  status: string;
  executionCount: number;
}

export interface DashboardAnalytics {
  executionHistory: ExecutionHistoryData[];
  successFailureStats: SuccessFailureStats;
  mostActiveFlows: MostActiveFlow[];
  recentActivity: RecentActivity[];
  summary: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    connectedApps: number;
  };
}

export async function getDashboardAnalytics(dateRange: '7days' | '30days' | 'all' = '30days') {
  return http.get(`${ANALYTICS_URL}/api/dashboard/analytics?dateRange=${dateRange}`);
}
