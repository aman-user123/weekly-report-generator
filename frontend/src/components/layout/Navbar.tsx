import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-gray-900">Weekly Reports</span>

          <div className="flex items-center gap-2">
            <NavLink to="/reports" className={linkClass}>
              My Reports
            </NavLink>

            {(user?.role === 'manager' || user?.role === 'admin') && (
              <NavLink to="/dashboard" className={linkClass}>
                Team Dashboard
              </NavLink>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.full_name}{' '}
            <span className="text-xs text-gray-400">({user?.role})</span>
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}