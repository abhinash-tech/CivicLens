import { findAdminByEmail } from '../repositories/adminRepository.js';
import {
  listComplaints,
  getComplaintById,
  updateComplaintStatus
} from '../repositories/complaintsRepository.js';
import { comparePassword } from '../services/auth/passwordService.js';
import { generateToken } from '../services/auth/jwtService.js';

/**
 * Admin authentication login.
 * POST /api/admin/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      });
    }

    const admin = await findAdminByEmail(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    const tokenPayload = {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role
        }
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Filtered and paginated list of complaints for administrators.
 * GET /api/admin/complaints
 */
export async function getComplaints(req, res, next) {
  try {
    const { status, severity, department, search, page, limit } = req.query;

    const result = await listComplaints({
      status,
      severity,
      department,
      search,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20
    });

    return res.status(200).json({
      success: true,
      data: {
        complaints: result.complaints,
        pagination: result.pagination
      }
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Full details of a complaint including citizen contacts, timeline, and AI assessment.
 * GET /api/admin/complaints/:id
 */
export async function getComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const complaintId = parseInt(id, 10);

    if (isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Complaint ID must be a valid number'
      });
    }

    const complaint = await getComplaintById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Complaint with ID ${id} not found`
      });
    }

    return res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Update complaint status with admin notes and audit trail reason.
 * PATCH /api/admin/complaints/:id/status
 */
export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const complaintId = parseInt(id, 10);

    if (isNaN(complaintId)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: 'Complaint ID must be a valid number'
      });
    }

    const { status, adminNotes, reason } = req.body;

    const updated = await updateComplaintStatus({
      complaintId,
      status,
      adminNotes,
      changedBy: req.admin?.fullName || 'Municipal Administrator',
      reason
    });

    return res.status(200).json({
      success: true,
      data: {
        id: updated.id,
        complaintCode: updated.complaintCode,
        status: updated.status,
        adminNotes: updated.adminNotes,
        updatedAt: updated.updatedAt
      },
      message: 'Status updated successfully.'
    });
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: err.message
      });
    }
    return next(err);
  }
}

export default {
  login,
  getComplaints,
  getComplaint,
  updateStatus
};
