import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import type { WeeklyReport, Project } from '../types';

export  function ReportFormPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const isEditing = Boolean(reportId);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    project_id: '',
    week_start_date: '',
    tasks_completed: '',
    tasks_planned: '',
    blockers: '',
    hours_worked: '',
    notes: '',
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  // Load projects and existing report (if editing)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projRes] = await Promise.all([
          apiClient.get('/projects')
        ]);
        setProjects(projRes.data);

        if (isEditing && reportId) {
          const reportRes = await apiClient.get(`/reports/${reportId}`);
          const r = reportRes.data;
          setForm({
            project_id: String(r.project_id),
            week_start_date: r.week_start_date,
            tasks_completed: r.tasks_completed,
            tasks_planned: r.tasks_planned,
            blockers: r.blockers || '',
            hours_worked: r.hours_worked ? String(r.hours_worked) : '',
            notes: r.notes || '',
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, [reportId, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing) {
        await apiClient.put(`/reports/${reportId}`, form);
      } else {
        await apiClient.post('/reports', form);
      }
      navigate('/reports');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">
        {isEditing ? 'Edit Weekly Report' : 'New Weekly Report'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border">
        <div>
          <label className="block text-sm font-medium mb-2">Project / Category</label>
          <select
            name="project_id"
            value={form.project_id}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Week Start Date</label>
          <input
            type="date"
            name="week_start_date"
            value={form.week_start_date}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tasks Completed This Week</label>
          <textarea
            name="tasks_completed"
            value={form.tasks_completed}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="List what you accomplished..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tasks Planned for Next Week</label>
          <textarea
            name="tasks_planned"
            value={form.tasks_planned}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="What will you work on next week..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Blockers / Challenges (Optional)</label>
          <textarea
            name="blockers"
            value={form.blockers}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Any issues slowing you down?"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Hours Worked (Optional)</label>
            <input
              type="number"
              name="hours_worked"
              value={form.hours_worked}
              onChange={handleChange}
              step="0.5"
              min="0"
              max="168"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Additional Notes / Links (Optional)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="Any extra comments..."
          />
        </div>

        <div className="flex gap-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditing ? 'Update Report' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
}