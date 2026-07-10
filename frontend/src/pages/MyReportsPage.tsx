import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';        
import type { WeeklyReport } from '../types';       

export  function MyReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const params = selectedWeek ? { week_start_date: selectedWeek } : {};
      const res = await apiClient.get('/reports', { params });
      setReports(res.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedWeek]);

  const handleNewReport = () => {
    navigate('/reports/new');           // ← Better than window.location
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Weekly Reports</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.full_name}</p>
        </div>
        <button
          onClick={handleNewReport}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
        >
          + New Report
        </button>
      </div>

      {/* Week Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Week Start Date</label>
        <input
          type="date"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <p className="text-center py-8">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No reports found for this period.</p>
          <button 
            onClick={handleNewReport} 
            className="mt-4 text-blue-600 hover:underline font-medium"
          >
            Create your first report →
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{report.project.name}</h3>
                  <p className="text-sm text-gray-500">
                    Week of {new Date(report.week_start_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  report.status === 'submitted' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {report.status.toUpperCase()}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">Tasks Completed</span>
                  <p className="line-clamp-3">{report.tasks_completed}</p>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Planned for Next Week</span>
                  <p className="line-clamp-3">{report.tasks_planned}</p>
                </div>
              </div>

              {report.blockers && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                  <strong>Blockers:</strong> {report.blockers}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}