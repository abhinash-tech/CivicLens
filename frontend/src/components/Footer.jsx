import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, ExternalLink, Activity } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-slate-400 border-t border-slate-800 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <ShieldCheck size={20} />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Civic<span className="text-teal-400">Lens</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-driven civic triage & smart municipal infrastructure resolution platform. Empowering citizens and local governance through real-time transparency.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/report" className="hover:text-teal-300 transition-colors">
                  Report Civic Issue
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-teal-300 transition-colors">
                  Track Complaint Status
                </Link>
              </li>
              <li>
                <Link to="/transparency" className="hover:text-teal-300 transition-colors">
                  Public Transparency Dashboard
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-teal-300 transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Departments */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Municipal Departments
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400">Roads & Infrastructure</li>
              <li className="text-slate-400">Solid Waste Management</li>
              <li className="text-slate-400">Water Supply & Drainage</li>
              <li className="text-slate-400">Electrical & Street Lighting</li>
              <li className="text-slate-400">Public Health & Safety</li>
            </ul>
          </div>

          {/* Governance & Disclaimer */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Administration
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/admin/login" className="hover:text-teal-300 transition-colors flex items-center gap-1">
                  Administrator Portal
                  <ExternalLink size={12} />
                </Link>
              </li>
              <li className="pt-2">
                <span className="inline-block px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-teal-400">
                  Powered by Gemini Vision 2.5
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            &copy; {currentYear} CivicLens. Built for IDEA//FORGE Hackathon. Not an official municipal agency portal.
          </p>
          <p className="flex items-center gap-1 text-slate-400">
            Engineered with <Heart size={12} className="text-rose-500 fill-rose-500" /> for smarter, cleaner cities.
          </p>
        </div>
      </div>
    </footer>
  );
}
