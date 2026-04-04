import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  Bell,
  BarChart2,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';

const navItems = [
  { to: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/shipments',    label: 'Shipments',    icon: Package },
  { to: '/disruptions',  label: 'Disruptions',  icon: AlertTriangle },
  { to: '/alerts',       label: 'Alerts',       icon: Bell },
  { to: '/reports',      label: 'Reports',      icon: BarChart2 },
];

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <ShieldAlert size={22} className="text-blue-400" />
              <span className="font-bold text-sm tracking-wide">SupplyGuard</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-700 p-4">
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors w-full flex justify-center"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-gray-800 font-semibold text-lg">
            Supply Chain Disruption Monitor
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Welcome, {user?.fullName}</span>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content — Outlet renders the child route */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
