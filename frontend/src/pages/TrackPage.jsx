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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F5F1] border border-[#B2E3D8] text-[#087F72] text-xs font-semibold">
          <Search size={14} className="text-[#087F72]" />
          <span>Real-Time Citizen Tracking</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">
          Track Complaint Status
        </h1>
        <p className="text-sm text-[#64748B]">
          Enter your unique tracking code (`CL-YYYY-XXXX`) to inspect audit timeline, municipal assignments, and resolution progress.
        </p>

        {/* Search input bar */}
        <form onSubmit={handleSearchSubmit} className="pt-4 max-w-md mx-auto">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="e.g. CL-2025-9481"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-28 py-3 rounded-xl border border-[#E2E8F0] text-sm font-mono placeholder:font-sans placeholder-[#94A3B8] shadow-xs focus:border-[#087F72] uppercase"
            />
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="absolute right-1.5 px-4 py-2 rounded-lg bg-[#087F72] hover:bg-[#06665C] disabled:opacity-50 text-white text-xs font-bold transition-colors"
            >
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center space-y-4 shadow-sm">
          <div className="w-10 h-10 border-4 border-[#B2E3D8] border-t-[#087F72] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#64748B] font-medium">
            Fetching complaint record and timeline...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-[#FEF2F2] rounded-2xl p-8 text-center space-y-4 border border-[#FECACA]">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#991B1B]">Record Not Found</h3>
            <p className="text-sm text-[#DC2626] mt-1">{error}</p>
          </div>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Please double-check the tracking code provided when you submitted the issue, or search our public transparency portal.
          </p>
        </div>
      )}

      {/* Loaded Complaint Details */}
      {!loading && complaint && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Overview Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg sm:text-xl font-bold text-[#087F72]">
                    {complaint.complaintCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-1.5 text-[#94A3B8] hover:text-[#087F72] hover:bg-[#E6F5F1] rounded-md transition-colors"
                    title="Copy complaint code"
                  >
                    {copied ? <Check size={16} className="text-[#15803D]" /> : <Copy size={16} />}
                  </button>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#111827]">
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
              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[#94A3B8] font-semibold uppercase block mb-1">Locality & Landmark</span>
                <div className="flex items-start gap-1.5 text-[#111827] font-medium text-sm">
                  <MapPin size={15} className="text-[#087F72] mt-0.5 shrink-0" />
                  <div>
                    <span>{complaint.locality}</span>
                    {complaint.landmark && (
                      <span className="block text-xs text-[#64748B] font-normal mt-0.5">
                        Landmark: {complaint.landmark}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[#94A3B8] font-semibold uppercase block mb-1">Assigned Department</span>
                <div className="flex items-center gap-1.5 text-[#111827] font-medium text-sm">
                  <Building2 size={15} className="text-[#087F72] shrink-0" />
                  <span>{complaint.department || 'Public Works Department'}</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-[#94A3B8] font-semibold uppercase block mb-1">Reported Timestamp</span>
                <div className="flex items-center gap-1.5 text-[#111827] font-medium text-sm">
                  <Calendar size={15} className="text-[#94A3B8] shrink-0" />
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Citizen Incident Description
              </h4>
              <p className="text-sm text-[#111827] bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </div>

            {/* Photo attachment if available */}
            {complaint.imageUrl && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <Camera size={14} />
                  Site Photo Evidence
                </h4>
                <div className="relative inline-block rounded-xl overflow-hidden border border-[#E2E8F0] max-h-72 shadow-xs group">
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
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-[#E2E8F0] pb-3">
              <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <Clock size={20} className="text-[#087F72]" />
                Resolution Progress Timeline
              </h3>
              <p className="text-xs text-[#64748B]">
                Tamper-proof municipal milestone tracking with timestamped audit entries.
              </p>
            </div>

            {/* If Rejected */}
            {complaint.status === 'REJECTED' ? (
              <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm flex items-start gap-3">
                <AlertCircle size={20} className="text-[#DC2626] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-[#991B1B]">Complaint Rejected or Closed</h4>
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
                  <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-[#E2E8F0] -z-0" />
                  <div
                    className="absolute top-4 left-[10%] h-0.5 bg-[#087F72] transition-all duration-500 -z-0"
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
                              ? 'bg-[#087F72] text-white shadow-sm ring-4 ring-[#E6F5F1]'
                              : 'bg-white border-2 border-[#CBD5E1] text-[#94A3B8]'
                          }`}
                        >
                          {isCompleted ? <Check size={14} /> : idx + 1}
                        </div>
                        <span
                          className={`text-xs mt-2 font-semibold ${
                            isCurrent ? 'text-[#087F72]' : isCompleted ? 'text-[#111827]' : 'text-[#94A3B8]'
                          }`}
                        >
                          {stage.label}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] leading-tight mt-0.5 hidden md:block">
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
                              ? 'bg-[#087F72] text-white shadow-xs'
                              : 'bg-white border-2 border-[#CBD5E1] text-[#94A3B8]'
                          }`}
                        >
                          {isCompleted ? <Check size={12} /> : idx + 1}
                        </div>
                        <div>
                          <div
                            className={`text-sm font-semibold ${
                              isCurrent ? 'text-[#087F72]' : isCompleted ? 'text-[#111827]' : 'text-[#94A3B8]'
                            }`}
                          >
                            {stage.label}
                          </div>
                          <div className="text-xs text-[#64748B]">{stage.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Audit History Logs */}
            {complaint.timeline && complaint.timeline.length > 0 && (
              <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Municipal Action Log
                </h4>
                <div className="space-y-3">
                  {complaint.timeline.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} size="sm" />
                        <span className="text-[#111827] font-medium">{item.reason || 'Status update logged'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[#94A3B8] shrink-0">
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
              <h3 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Sparkles size={18} className="text-[#087F72]" />
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
