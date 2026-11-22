import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Filter, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Sparkles, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Building2,
  FileEdit,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import AIAssessmentCard from '../components/AIAssessmentCard';
import Modal from '../components/Modal';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  // Auth check
  const [adminUser, setAdminUser] = useState(null);

  // Complaints & Pagination
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for Detail/Action Modal
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Status Update Form State
  const [newStatus, setNewStatus] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState(null);
  const [updateErrorMsg, setUpdateErrorMsg] = useState(null);

  // Overall metrics state
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    highCritical: 0,
    resolved: 0,
  });

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem('civiclens_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    const storedAdmin = localStorage.getItem('civiclens_admin');
    if (storedAdmin) {
      try {
        setAdminUser(JSON.parse(storedAdmin));
      } catch (e) {
        setAdminUser({ fullName: 'Administrator', email: 'admin@civiclens.gov' });
      }
    }
  }, [navigate]);

  // Load complaints whenever filters or page changes
  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.getAdminComplaints({
        status: statusFilter,
        severity: severityFilter,
        department: departmentFilter,
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (res?.success && res?.data) {
        const list = res.data.complaints || [];
        setComplaints(list);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }

        // Calculate quick metric summaries
        const total = res.data.pagination?.total ?? list.length;
        const pending = list.filter(c => c.status === 'SUBMITTED' || c.status === 'IN_REVIEW').length;
        const highCritical = list.filter(c => c.severity === 'Critical' || c.severity === 'High').length;
        const resolved = list.filter(c => c.status === 'RESOLVED').length;

        setMetrics({
          total,
          pending,
          highCritical,
          resolved,
        });
      } else {
        throw new Error(res?.message || 'Failed to load complaints');
      }
    } catch (err) {
      console.error('Failed to fetch admin complaints:', err);
      if (err.status === 401) {
        navigate('/admin/login');
        return;
      }
      setError(err.message || 'Error connecting to complaint records server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [pagination.page, statusFilter, severityFilter, departmentFilter]);

  // Debounced search or manual search trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchComplaints();
  };

  // Open modal and fetch full detail
  const handleOpenDetail = async (complaintId) => {
    setSelectedComplaintId(complaintId);
    setIsModalOpen(true);
    setLoadingDetail(true);
    setUpdateSuccessMsg(null);
    setUpdateErrorMsg(null);

    try {
      const res = await api.getAdminComplaintDetail(complaintId);
      if (res?.success && res?.data) {
        setSelectedComplaint(res.data);
        setNewStatus(res.data.status || 'SUBMITTED');
        setAdminNotes(res.data.adminNotes || '');
        setChangeReason('');
      } else {
        throw new Error(res?.message || 'Failed to retrieve complaint detail');
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
      setUpdateErrorMsg(err.message || 'Error loading complaint detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedComplaint(null);
    setSelectedComplaintId(null);
  };

  // Update complaint status
  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaintId) return;

    setUpdatingStatus(true);
    setUpdateSuccessMsg(null);
    setUpdateErrorMsg(null);

    try {
      const res = await api.updateComplaintStatus(selectedComplaintId, {
        status: newStatus,
        adminNotes: adminNotes.trim(),
        reason: changeReason.trim() || `Status updated to ${newStatus} by administrator`,
      });

      if (res?.success) {
        setUpdateSuccessMsg('Status and notes updated successfully.');
        
        // Refresh local complaint state inside modal
        setSelectedComplaint(prev => ({
          ...prev,
          status: newStatus,
          adminNotes: adminNotes.trim(),
          timeline: [
            ...(prev?.timeline || []),
            {
              status: newStatus,
              changedBy: adminUser?.fullName || 'Municipal Administrator',
              reason: changeReason.trim() || `Status updated to ${newStatus}`,
              timestamp: new Date().toISOString(),
            },
          ],
        }));

        // Refresh main list in background
        fetchComplaints();
      } else {
        throw new Error(res?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setUpdateErrorMsg(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('civiclens_token');
    localStorage.removeItem('civiclens_admin');
    navigate('/admin/login');
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSeverityFilter('ALL');
    setDepartmentFilter('ALL');
    setSearchQuery('');
    setPagination(p => ({ ...p, page: 1 }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Officer Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="text-xs uppercase font-bold tracking-wider text-[#087F72]">
              Admin Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Municipal Complaint Oversight
          </h1>
          <p className="text-xs text-[#64748B]">
            Welcome, <span className="font-semibold text-[#111827]">{adminUser?.fullName || 'Municipal Administrator'}</span> ({adminUser?.email || 'admin@civiclens.gov'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchComplaints}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-semibold text-[#111827] shadow-xs transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] text-xs font-semibold transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Total Filtered</span>
          <div className="text-3xl font-extrabold text-[#111827] mt-1">
            {pagination.total || complaints.length}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">Total active municipal records</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">Pending Review</span>
          <div className="text-3xl font-extrabold text-[#D97706] mt-1">
            {metrics.pending}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">SUBMITTED or IN_REVIEW</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#DC2626]">High / Critical Urgency</span>
          <div className="text-3xl font-extrabold text-[#DC2626] mt-1">
            {metrics.highCritical}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">Requires immediate remediation</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">Resolved</span>
          <div className="text-3xl font-extrabold text-[#15803D] mt-1">
            {metrics.resolved}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1">Verified work completion</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-3 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search code, title, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] placeholder-[#94A3B8] focus:border-[#087F72]"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] bg-white focus:border-[#087F72]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="ACTION_SCHEDULED">ACTION_SCHEDULED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] bg-white focus:border-[#087F72]"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPagination(p => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs text-[#111827] bg-white focus:border-[#087F72]"
            >
              <option value="ALL">All Departments</option>
              <option value="Roads and Infrastructure">Roads & Infrastructure</option>
              <option value="Solid Waste Management">Solid Waste Management</option>
              <option value="Water Supply & Drainage">Water Supply & Drainage</option>
              <option value="Electrical & Streetlights">Electrical & Streetlights</option>
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 rounded-lg bg-[#087F72] text-white text-xs font-semibold hover:bg-[#06665C] transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="py-2 px-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-medium text-[#64748B] transition-colors"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden space-y-0">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#B2E3D8] border-t-[#087F72] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#64748B] font-medium">Loading municipal complaints records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[#DC2626] space-y-2">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchComplaints}
              className="text-xs font-bold text-[#087F72] underline"
            >
              Try Again
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] space-y-2">
            <p className="text-sm font-medium">No complaints match your current filter selection.</p>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-[#087F72] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase font-semibold">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Title & Issue</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {complaints.map((item) => (
                  <tr key={item.id || item.complaintCode} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#087F72] whitespace-nowrap">
                      {item.complaintCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#111827] max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                      {item.locality}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                      {item.department || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={item.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-[#94A3B8] whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Recent'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(item.id || item.complaintCode)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#087F72] text-white font-semibold hover:bg-[#06665C] transition-colors shadow-xs"
                      >
                        <Eye size={12} />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] text-xs text-[#64748B]">
            <div>
              Showing page <span className="font-bold text-[#111827]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[#111827]">{pagination.totalPages}</span> ({pagination.total} complaints)
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded border border-[#E2E8F0] disabled:opacity-40 hover:bg-white"
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded border border-[#E2E8F0] disabled:opacity-40 hover:bg-white"
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail / Action Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          selectedComplaint
            ? `Manage Complaint: ${selectedComplaint.complaintCode} - ${selectedComplaint.title}`
            : 'Complaint Inspection'
        }
        maxWidth="max-w-4xl"
      >
        {loadingDetail ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#B2E3D8] border-t-[#087F72] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#64748B] font-medium">Loading full complaint profile...</p>
          </div>
        ) : selectedComplaint ? (
          <div className="space-y-6 text-sm">
            {/* Success & Error alerts */}
            {updateSuccessMsg && (
              <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#15803D]" />
                <span>{updateSuccessMsg}</span>
              </div>
            )}
            {updateErrorMsg && (
              <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs flex items-center gap-2">
                <AlertOctagon size={16} className="text-[#DC2626]" />
                <span>{updateErrorMsg}</span>
              </div>
            )}

            {/* Quick Status / Severity strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#64748B]">Current Status:</span>
                <StatusBadge status={selectedComplaint.status} size="md" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#64748B]">Urgency:</span>
                <SeverityBadge severity={selectedComplaint.severity} size="md" />
              </div>
            </div>

            {/* Photo & Citizen Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Site Evidence Photo
                </span>
                {selectedComplaint.imageUrl ? (
                  <div className="rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#111827] max-h-56 relative group">
                    <img
                      src={selectedComplaint.imageUrl}
                      alt={selectedComplaint.title}
                      className="w-full h-56 object-cover"
                    />
                    <a
                      href={selectedComplaint.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 hover:bg-black/90 text-white rounded text-[11px] backdrop-blur-xs flex items-center gap-1"
                    >
                      <span>Full Photo</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                ) : (
                  <div className="h-40 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] text-xs">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* Citizen Details */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Citizen Contact Info
                </span>
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-[#111827]">
                    <User size={14} className="text-[#94A3B8]" />
                    <span className="font-medium">{selectedComplaint.citizenName || 'Anonymous Citizen'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Phone size={14} className="text-[#94A3B8]" />
                    <span>{selectedComplaint.citizenPhone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#64748B]">
                    <Mail size={14} className="text-[#94A3B8]" />
                    <span>{selectedComplaint.citizenEmail || 'No email provided'}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8F0] text-[#64748B]">
                    <div>Locality: <span className="font-medium text-[#111827]">{selectedComplaint.locality}</span></div>
                    {selectedComplaint.landmark && (
                      <div>Landmark: <span className="font-medium text-[#111827]">{selectedComplaint.landmark}</span></div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Citizen Incident Description
              </span>
              <p className="text-xs sm:text-sm text-[#111827] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] leading-relaxed whitespace-pre-wrap">
                {selectedComplaint.description}
              </p>
            </div>

            {/* AI Assessment Card */}
            {selectedComplaint.aiAssessment && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#087F72]" />
                  Gemini Vision AI Analysis
                </span>
                <AIAssessmentCard assessment={{
                  issueType: selectedComplaint.issueType || selectedComplaint.aiAssessment.issueType,
                  severity: selectedComplaint.severity || selectedComplaint.aiAssessment.severity,
                  department: selectedComplaint.department || selectedComplaint.aiAssessment.department,
                  summary: selectedComplaint.aiAssessment.summary,
                  riskReason: selectedComplaint.aiAssessment.riskReason,
                  recommendedAction: selectedComplaint.aiAssessment.recommendedAction,
                  confidence: selectedComplaint.aiAssessment.confidence,
                  needsHumanReview: selectedComplaint.aiAssessment.needsHumanReview,
                }} />
              </div>
            )}

            {/* Municipal Status Transition Action Form */}
            <div className="p-5 bg-[#F0FDF9] rounded-2xl border border-[#A7F3D0] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#065F54] flex items-center gap-2">
                <FileEdit size={15} className="text-[#087F72]" />
                Update Status & Record Audit Action
              </h4>

              <form onSubmit={handleStatusUpdateSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs bg-white font-medium text-[#111827] focus:border-[#087F72]"
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="ACTION_SCHEDULED">ACTION_SCHEDULED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                      Reason for Change (Audit Log)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dispatched Ward 82 repair crew to site"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs placeholder-[#94A3B8] focus:border-[#087F72]"
                    >
                    </input>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    Municipal Admin Notes (Internal / Citizen visible)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Work order #, technician dispatch schedule, inspection notes..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] text-xs placeholder-[#94A3B8] focus:border-[#087F72]"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-4 py-2 rounded-lg bg-[#087F72] hover:bg-[#06665C] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    {updatingStatus ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Audit Record...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Save Status Transition</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Audit History Timeline */}
            {selectedComplaint.timeline && selectedComplaint.timeline.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Full Audit History Trail
                </span>
                <div className="space-y-2">
                  {selectedComplaint.timeline.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} size="sm" />
                        <span className="text-[#111827] font-medium">{item.reason || item.changeReason || 'Transition logged'}</span>
                      </div>
                      <div className="text-[11px] text-[#94A3B8] shrink-0">
                        {item.changedBy} &bull;{' '}
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
