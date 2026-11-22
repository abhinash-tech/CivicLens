import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Camera,
  ShieldCheck,
  User,
  Share2
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import AIAssessmentCard from '../components/AIAssessmentCard';

// The canonical standard progression stages
const STANDARD_STAGES = [
  { key: 'SUBMITTED', label: 'Submitted', description: 'Complaint logged in system' },
  { key: 'IN_REVIEW', label: 'In Review', description: 'Under municipal review' },
  { key: 'ACTION_SCHEDULED', label: 'Action Scheduled', description: 'Repair crew assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress', description: 'Field remediation underway' },
  { key: 'RESOLVED', label: 'Resolved', description: 'Issue rectified & inspected' },
];

export default function TrackPage() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(urlCode || '');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState(false);

  useEffect(() => {
    if (urlCode) {
      setSearchInput(urlCode);
      fetchComplaint(urlCode);
    } else {
      setComplaint(null);
      setError(null);
    }
  }, [urlCode]);

  const fetchComplaint = async (codeToSearch) => {
    if (!codeToSearch || !codeToSearch.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.trackComplaint(codeToSearch.trim());
      if (res?.success && res?.data) {
        setComplaint(res.data);
      } else {
        throw new Error(res?.message || 'Complaint not found');
      }
    } catch (err) {
      console.error('Error fetching complaint:', err);
      setComplaint(null);
      setError(err.message || `No complaint found for code: "${codeToSearch}"`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/track/${encodeURIComponent(searchInput.trim())}`);
  };

  const copyCode = () => {
    if (!complaint?.complaintCode) return;
    navigator.clipboard.writeText(complaint.complaintCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Helper to determine active step in standard timeline
  const getCurrentStageIndex = (currentStatus) => {
    if (!currentStatus) return 0;
    if (currentStatus === 'REJECTED') return -1;
    const idx = STANDARD_STAGES.findIndex(s => s.key === currentStatus);
    return idx >= 0 ? idx : 0;
  };

  const currentStageIdx = complaint ? getCurrentStageIndex(complaint.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Page Header */}
      <div className="space-y-2 text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
          <Search size={14} className="text-teal-600" />
          <span>Real-Time Citizen Tracking</span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy-950 tracking-tight">
          Track Complaint Status
        </h1>
        <p className="text-sm text-slate-600">
          Enter your unique tracking code (`CL-YYYY-XXXX`) to inspect audit timeline, municipal assignments, and resolution progress.
        </p>

        {/* Search input bar */}
        <form onSubmit={handleSearchSubmit} className="pt-4 max-w-md mx-auto">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. CL-2025-9481"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-28 py-3 rounded-xl border border-slate-300 text-sm font-mono placeholder:font-sans placeholder-slate-400 shadow-xs focus:border-teal-600 uppercase"
            />
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="absolute right-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card-subtle p-12 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">
            Fetching complaint record and timeline...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="card-subtle p-8 text-center space-y-4 border-rose-200 bg-rose-50/40">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy-900">Record Not Found</h3>
            <p className="text-sm text-slate-600 mt-1">{error}</p>
          </div>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please double-check the tracking code provided when you submitted the issue, or search our public transparency portal.
          </p>
        </div>
      )}

      {/* Loaded Complaint Details */}
      {!loading && complaint && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Overview Card */}
          <div className="card-subtle p-6 sm:p-8 space-y-6">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg sm:text-xl font-bold text-teal-700">
                    {complaint.complaintCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                    title="Copy complaint code"
                  >
                    {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-navy-950">
                  {complaint.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={complaint.status} size="lg" />
                <SeverityBadge severity={complaint.severity} size="lg" />
              </div>
            </div>

            {/* Locality & Department info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 font-semibold uppercase block mb-1">Locality & Landmark</span>
                <div className="flex items-start gap-1.5 text-slate-800 font-medium text-sm">
                  <MapPin size={15} className="text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <span>{complaint.locality}</span>
                    {complaint.landmark && (
                      <span className="block text-xs text-slate-500 font-normal mt-0.5">
                        Landmark: {complaint.landmark}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 font-semibold uppercase block mb-1">Assigned Department</span>
                <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm">
                  <Building2 size={15} className="text-teal-600 shrink-0" />
                  <span>{complaint.department || 'Public Works Department'}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                <span className="text-slate-400 font-semibold uppercase block mb-1">Reported Timestamp</span>
                <div className="flex items-center gap-1.5 text-slate-800 font-medium text-sm">
                  <Calendar size={15} className="text-slate-400 shrink-0" />
                  <span>
                    {complaint.createdAt
                      ? new Date(complaint.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Citizen Incident Description
              </h4>
              <p className="text-sm text-slate-700 bg-slate-50/60 p-4 rounded-xl border border-slate-200/50 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Photo attachment if available */}
            {complaint.imageUrl && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Camera size={14} />
                  Site Photo Evidence
                </h4>
                <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 max-h-72 shadow-2xs group">
                  <img
                    src={complaint.imageUrl}
                    alt={complaint.title}
                    className="max-h-72 w-auto object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <a
                    href={complaint.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black/90 text-white rounded text-xs backdrop-blur-xs flex items-center gap-1 transition-colors"
                  >
                    <span>View Full Image</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Milestone Progress Timeline */}
          <div className="card-subtle p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                <Clock size={20} className="text-teal-600" />
                Resolution Progress Timeline
              </h3>
              <p className="text-xs text-slate-500">
                Tamper-proof municipal milestone tracking with timestamped audit entries.
              </p>
            </div>

            {/* If Rejected */}
            {complaint.status === 'REJECTED' ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-900">Complaint Rejected or Closed</h4>
                  <p className="text-xs mt-1">
                    This issue was reviewed and flagged as outside municipal scope, duplicate, or unverified.
                  </p>
                </div>
              </div>
            ) : (
              /* Milestone Progress Steps Bar */
              <div className="relative py-2">
                <div className="hidden sm:grid grid-cols-5 gap-2 relative">
                  {/* Connecting Line behind steps */}
                  <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-0" />
                  <div
                    className="absolute top-4 left-[10%] h-0.5 bg-teal-600 transition-all duration-500 -z-0"
                    style={{
                      width: `${(Math.max(0, currentStageIdx) / (STANDARD_STAGES.length - 1)) * 80}%`,
                    }}
                  />

                  {STANDARD_STAGES.map((stage, idx) => {
                    const isCompleted = idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div key={stage.key} className="flex flex-col items-center text-center relative z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCompleted
                              ? 'bg-teal-600 text-white shadow-sm ring-4 ring-teal-50'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <Check size={14} /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs mt-2 font-semibold ${
                            isCurrent ? 'text-teal-700' : isCompleted ? 'text-navy-900' : 'text-slate-400'
                          }`}
                        >
                          {stage.label}
                        </span>
                        <span className="text-[10px] text-slate-400 leading-tight mt-0.5 hidden md:block">
                          {stage.description}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile vertical stepper */}
                <div className="sm:hidden space-y-4">
                  {STANDARD_STAGES.map((stage, idx) => {
                    const isCompleted = idx <= currentStageIdx;
                    const isCurrent = idx === currentStageIdx;

                    return (
                      <div key={stage.key} className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isCompleted
                              ? 'bg-teal-600 text-white shadow-2xs'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isCompleted ? <Check size={12} /> : idx + 1}
                        </div>
                        <div>
                          <div
                            className={`text-sm font-semibold ${
                              isCurrent ? 'text-teal-700' : isCompleted ? 'text-navy-900' : 'text-slate-400'
                            }`}
                          >
                            {stage.label}
                          </div>
                          <div className="text-xs text-slate-500">{stage.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Audit History Logs */}
            {complaint.timeline && complaint.timeline.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Municipal Action Log
                </h4>
                <div className="space-y-3">
                  {complaint.timeline.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} size="sm" />
                        <span className="text-slate-700 font-medium">{item.reason || 'Status update logged'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 shrink-0">
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {item.changedBy || 'Officer'}
                        </span>
                        <span>
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Assessment Details */}
          {complaint.aiAssessment && (
            <div className="space-y-2">
              <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <Sparkles size={18} className="text-teal-600" />
                Gemini AI Risk & Recommendation Breakdown
              </h3>
              <AIAssessmentCard assessment={{
                issueType: complaint.issueType || complaint.aiAssessment.issueType,
                severity: complaint.severity || complaint.aiAssessment.severity,
                department: complaint.department || complaint.aiAssessment.department,
                summary: complaint.aiAssessment.summary,
                riskReason: complaint.aiAssessment.riskReason,
                recommendedAction: complaint.aiAssessment.recommendedAction,
                confidence: complaint.aiAssessment.confidence || 'High',
                needsHumanReview: complaint.aiAssessment.needsHumanReview,
              }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
