import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type {
  DashboardSummary,
  TaskTrendPoint,
  ProjectWorkload,
  ActivityItem,
} from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function TeamDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tasksTrend, setTasksTrend] = useState<TaskTrendPoint[]>([]);
  const [workload, setWorkload] = useState<ProjectWorkload[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('');

  const { user } = useAuth();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const weekParams = selectedWeek ? { week_start_date: selectedWeek } : {};

      const [summaryRes, trendRes, workloadRes, activityRes] = await Promise.all([
        apiClient.get<DashboardSummary>('/dashboard/summary', { params: weekParams }),
        apiClient.get<TaskTrendPoint[]>('/dashboard/charts/tasks-trend'),
        apiClient.get<ProjectWorkload[]>('/dashboard/charts/workload-by-project', {
          params: weekParams,
        }),
        apiClient.get<ActivityItem[]>('/dashboard/activity-feed'),
      ]);

      setSummary(summaryRes.data);
      setTasksTrend(trendRes.data);
      setWorkload(workloadRes.data);
      setActivity(activityRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek]);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!summary) return <div className="p-8 text-center text-red-600">Failed to load dashboard</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Team Dashboard</h1>
          <p className="text-gray-600">Overview • {user?.full_name}</p>
        </div>
        <input
          type="date"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-gray-500 text-sm">Total Reports Submitted</p>
          <p className="text-4xl font-bold mt-2">{summary.total_reports_submitted}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-gray-500 text-sm">Compliance Rate</p>
          <p className="text-4xl font-bold mt-2 text-green-600">
            {Math.round(summary.compliance_rate * 100)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-gray-500 text-sm">Open Blockers</p>
          <p className="text-4xl font-bold mt-2 text-orange-600">{summary.open_blockers_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-semibold mb-4">Reports Submitted Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tasksTrend}>
              <XAxis dataKey="week_start_date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="reports_submitted" fill="#3b82f6" radius={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Workload by Project */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="font-semibold mb-4">Workload by Project</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={workload}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="report_count"
                nameKey="project_name"
              >
                {workload.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activity.map((item) => (
            <div key={item.report_id} className="flex justify-between py-3 border-b last:border-0">
              <div>
                <p className="font-medium">{item.user_full_name}</p>
                <p className="text-sm text-gray-500">
                  {item.project_name} — {item.status}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                {new Date(item.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
