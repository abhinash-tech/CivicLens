import complaintsRepository, {
  generateComplaintCode,
  formatComplaintRow,
  createComplaint,
  getComplaintByCode,
  getComplaintById,
  listComplaints,
  updateComplaintStatus,
  getPublicStats,
  getPublicRecentComplaints,
} from './complaintsRepository.js';

import adminRepository, {
  formatAdminRow,
  findAdminByEmail,
  createAdmin,
  findAdminById,
} from './adminRepository.js';

import statusHistoryRepository, {
  formatStatusHistoryRow,
  getComplaintStatusHistory,
  addComplaintStatusHistory,
} from './statusHistoryRepository.js';

export {
  // Complaints Repository
  complaintsRepository,
  generateComplaintCode,
  formatComplaintRow,
  createComplaint,
  getComplaintByCode,
  getComplaintById,
  listComplaints,
  updateComplaintStatus,
  getPublicStats,
  getPublicRecentComplaints,

  // Admin Repository
  adminRepository,
  formatAdminRow,
  findAdminByEmail,
  createAdmin,
  findAdminById,

  // Status History Repository
  statusHistoryRepository,
  formatStatusHistoryRow,
  getComplaintStatusHistory,
  addComplaintStatusHistory,
};

export default {
  complaints: complaintsRepository,
  admin: adminRepository,
  statusHistory: statusHistoryRepository,
};
