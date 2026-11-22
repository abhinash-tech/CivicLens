import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  BarChart3, 
  Lock, 
  Menu, 
  X, 
  LayoutDashboard, 
  LogOut 
} from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('civiclens_token');
    setIsAdminLoggedIn(!!token);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('civiclens_token');
    localStorage.removeItem('civiclens_admin');
    setIsAdminLoggedIn(false);
    navigate('/admin/login');
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'text-teal-700 bg-teal-100 font-semibold shadow-2xs'
        : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
    }`;

  const mobileNavItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-base font-medium transition-colors ${
      isActive
        ? 'text-teal-700 bg-teal-100 font-semibold'
        : 'text-slate-700 hover:text-navy-900 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs group-hover:bg-teal-700 transition-colors">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-navy-900 group-hover:text-teal-700 transition-colors">
                Civic<span className="text-teal-600">Lens</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                AI Municipal Hub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navItemClass}>
              Home
            </NavLink>
            <NavLink to="/report" className={navItemClass}>
              <PlusCircle size={15} />
              Report Issue
            </NavLink>
            <NavLink to="/track" className={navItemClass}>
              <Search size={15} />
              Track Status
            </NavLink>
            <NavLink to="/transparency" className={navItemClass}>
              <BarChart3 size={15} />
              Transparency
            </NavLink>
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-navy-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                >
                  <LayoutDashboard size={14} />
                  Admin Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-navy-900 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shadow-2xs"
              >
                <Lock size={13} />
                Admin Portal
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1 animate-in slide-in-from-top-2 duration-150 shadow-md">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavItemClass}
          >
            Home
          </NavLink>
          <NavLink
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavItemClass}
          >
            <PlusCircle size={18} />
            Report Issue
          </NavLink>
          <NavLink
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavItemClass}
          >
            <Search size={18} />
            Track Status
          </NavLink>
          <NavLink
            to="/transparency"
            onClick={() => setMobileMenuOpen(false)}
            className={mobileNavItemClass}
          >
            <BarChart3 size={18} />
            Transparency Portal
          </NavLink>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAdminLoggedIn ? (
              <>
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold bg-navy-900 text-white hover:bg-slate-800 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Admin Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Lock size={15} />
                Admin Portal
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
