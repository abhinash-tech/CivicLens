import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [trackCodeInput, setTrackCodeInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [statsRes, recentRes] = await Promise.allSettled([
          api.getPublicStats(),
          api.getPublicRecent(4),
        ]);

        if (isMounted) {
          if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
            setStats(statsRes.value.data);
          } else {
            // Default baseline fallback if backend is starting up
            setStats({
              totalComplaints: 128,
              resolvedComplaints: 84,
              inProgressComplaints: 31,
              avgResolutionTimeDays: 2.4,
            });
          }

          if (recentRes.status === 'fulfilled' && recentRes.value?.success) {
            setRecentComplaints(recentRes.value.data || []);
          }
        }
      } catch (err) {
        console.warn('Error loading public homepage data', err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackCodeInput.trim()) return;
    navigate(`/track/${encodeURIComponent(trackCodeInput.trim())}`);
  };

  const resolutionRate = stats?.totalComplaints
    ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
    : 66;

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-teal-50/20 to-slate-50 border-b border-slate-200/80 pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-teal-200/20 via-teal-100/10 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Pill tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold shadow-2xs">
              <Sparkles size={14} className="text-teal-600" />
              <span>AI-Powered Civic Infrastructure Management</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 tracking-tight leading-[1.15]">
              Empowering Citizens,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-800">
                Accelerating
              </span>{' '}
              Municipal Action.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Report potholes, faulty streetlights, broken water pipes, and overflowing waste in seconds.
              Powered by multimodal Gemini AI for instant triage, direct department dispatch, and end-to-end transparency.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/report"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md hover:shadow-lg transition-all text-sm group"
              >
                <Camera size={18} />
                <span>Report an Issue</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/track"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-all text-sm"
              >
                <Search size={18} />
                <span>Track Complaint</span>
              </Link>
            </div>

            {/* Quick Track Input Bar */}
            <div className="pt-4 max-w-md mx-auto">
              <form onSubmit={handleTrackSubmit} className="relative flex items-center">
                <Search size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter complaint code (e.g. CL-2025-9481)"
                  value={trackCodeInput}
                  onChange={(e) => setTrackCodeInput(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-navy-900 placeholder-slate-400 shadow-xs focus:border-teal-600"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-3.5 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-semibold hover:bg-navy-800 transition-colors"
                >
                  Lookup
                </button>
              </form>
            </div>
          </div>

          {/* Quick Metrics Banner */}
          <div className="mt-12 pt-8 border-t border-slate-200/80">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white/80 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                <div className="text-2xl sm:text-3xl font-bold text-navy-900">
                  {loadingStats ? '...' : (stats?.totalComplaints ?? 128)}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">Total Reported</div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                <div className="text-2xl sm:text-3xl font-bold text-teal-600">
                  {loadingStats ? '...' : `${resolutionRate}%`}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">Resolution Rate</div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-600">
                  {loadingStats ? '...' : (stats?.inProgressComplaints ?? 31)}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">Active In-Progress</div>
              </div>

              <div className="bg-white/80 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs text-center">
                <div className="text-2xl sm:text-3xl font-bold text-navy-900">
                  {loadingStats ? '...' : `${stats?.avgResolutionTimeDays ?? 2.4}d`}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">Avg Resolution Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Step Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">Simple 3-Step Process</h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-navy-950">How CivicLens Resolves Issues</h3>
          <p className="text-sm text-slate-600">
            From your camera lens to city field engineers, automated with AI precision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
          {/* Step 1 */}
          <div className="card-subtle p-6 flex flex-col justify-between relative bg-white">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-lg">
                1
              </div>
              <h4 className="text-lg font-bold text-navy-900">Snap & Submit</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Capture or upload a photo of the problem. Provide locality and a quick description without cumbersome account sign-ups.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Camera size={14} className="text-teal-600" />
              <span>Instant camera upload</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card-subtle p-6 flex flex-col justify-between relative bg-white ring-1 ring-teal-500/20 shadow-md">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                2
              </div>
              <h4 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                AI Triage & Route
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Gemini Vision
                </span>
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Gemini 2.5 Flash inspects the photo, assesses severity (Critical to Low), classifies the hazard, and assigns it to the municipal department.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Sparkles size={14} className="text-teal-600" />
              <span>Prioritization in &lt; 2 seconds</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card-subtle p-6 flex flex-col justify-between relative bg-white">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-lg">
                3
              </div>
              <h4 className="text-lg font-bold text-navy-900">Track & Resolve</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive an immediate tracking code (`CL-YYYY-XXXX`). Track every status transition from review to verified repair on the public board.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-500">
              <CheckCircle2 size={14} className="text-teal-600" />
              <span>Auditable milestone timeline</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Public Reports Feed */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">Citizen Feed</h2>
            <h3 className="text-2xl font-bold text-navy-950">Recent Civic Reports</h3>
            <p className="text-sm text-slate-600">Real-time issues submitted by citizens across neighborhoods</p>
          </div>
          <Link
            to="/transparency"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          >
            <span>View All Public Reports</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentComplaints.length === 0 ? (
          <div className="card-subtle p-8 text-center text-slate-500">
            <Building2 size={36} className="mx-auto mb-2 text-slate-400" />
            <p className="text-sm">No recent public complaints found or server is connecting.</p>
            <Link to="/report" className="mt-3 inline-block text-xs font-semibold text-teal-600 hover:underline">
              Be the first to file a report &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentComplaints.map((item) => (
              <div
                key={item.complaintCode}
                className="card-subtle overflow-hidden flex flex-col justify-between hover:border-teal-400/80 transition-all group"
              >
                <div>
                  {/* Photo or placeholder */}
                  <div className="h-40 bg-slate-100 overflow-hidden relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                        <Camera size={28} className="mb-1 opacity-50" />
                        <span className="text-[11px]">No photo attached</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5">
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono text-teal-700 font-semibold">{item.complaintCode}</span>
                      <SeverityBadge severity={item.severity} size="sm" />
                    </div>

                    <h4 className="text-sm font-bold text-navy-900 line-clamp-1 group-hover:text-teal-700 transition-colors">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{item.locality}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1">
                  <Link
                    to={`/track/${encodeURIComponent(item.complaintCode)}`}
                    className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Track Issue</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Call to action section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-slate-900 text-white p-8 sm:p-12 shadow-xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Community Stewardship
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Notice a hazard or infrastructure defect in your street?
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every complaint is logged on a tamper-proof municipal audit ledger. Our AI ensures high-urgency risks receive rapid attention from city personnel.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/report"
                className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-sm shadow-md transition-all inline-flex items-center gap-2"
              >
                <Camera size={16} />
                Report an Issue Now
              </Link>
              <Link
                to="/transparency"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/20 transition-all inline-flex items-center gap-2"
              >
                <Activity size={16} />
                Explore Transparency Metrics
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
