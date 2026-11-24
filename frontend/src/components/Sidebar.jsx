import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  User,
  FileUp,
  Briefcase,
  ClipboardList,
  Calendar,
  Users,
  Search,
  ListChecks,
  Brain,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';
import { useState } from 'react';

const navItems = {
  candidate: [
    { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/candidate/profile', label: 'My Profile', icon: User },
    { to: '/candidate/resume', label: 'Upload Resume', icon: FileUp },
    { to: '/candidate/jobs', label: 'Browse Jobs', icon: Briefcase },
    { to: '/candidate/applications', label: 'My Applications', icon: ClipboardList },
    { to: '/candidate/interviews', label: 'My Interviews', icon: Calendar },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/jobs', label: 'Job Management', icon: Briefcase },
    { to: '/admin/resumes', label: 'Bulk Resume Upload', icon: FileUp },
    { to: '/admin/candidates', label: 'Candidates', icon: Users },
    { to: '/admin/matching', label: 'AI Matching', icon: Brain },
    { to: '/admin/search', label: 'Semantic Search', icon: Search },
    { to: '/admin/shortlist', label: 'Shortlist', icon: ListChecks },
    { to: '/admin/interviews', label: 'Interviews', icon: Calendar },
  ],
  interviewer: [
    { to: '/interviewer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/interviewer/interviews', label: 'Assigned Interviews', icon: Calendar },
    { to: '/interviewer/feedback', label: 'Submit Feedback', icon: MessageSquare },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = {
    candidate: 'Candidate',
    admin: 'Admin',
    interviewer: 'Interviewer',
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-200 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">AI Recruit</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
            <Brain className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-100">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
            {roleLabel[user?.role] || 'User'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-200 p-2">
        {!collapsed && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-slate-400 hover:text-slate-600 transition-colors mt-1"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
