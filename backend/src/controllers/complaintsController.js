import { z } from 'zod';
import {
  createComplaint,
  getComplaintByCode,
  generateComplaintCode
} from '../repositories/complaintsRepository.js';
import { analyzeIssue, classifyByKeywords } from '../services/ai/index.js';
import { uploadComplaintImage } from '../services/storage/index.js';

export const complaintSubmissionSchema = z.object({
  title: z.string({
    required_error: 'Title is required',
    invalid_type_error: 'Title must be a string'
  }).min(5, 'Title must contain at least 5 character(s)').max(200, 'Title cannot exceed 200 characters'),

  description: z.string({
    required_error: 'Description is required',
    invalid_type_error: 'Description must be a string'
  }).min(10, 'Description must contain at least 10 character(s)').max(2000, 'Description cannot exceed 2000 characters'),

  locality: z.string({
    required_error: 'Locality is required',
    invalid_type_error: 'Locality must be a string'
  }).min(2, 'Locality must contain at least 2 character(s)').max(100, 'Locality cannot exceed 100 characters'),

  landmark: z.string().max(255).optional().nullable(),
  citizenName: z.string().max(150).optional().nullable(),
  citizenPhone: z.string().max(30).optional().nullable(),
  citizenEmail: z.union([z.string().email('Invalid email address format'), z.literal('')]).optional().nullable()
});

/**
 * Submit a new civic complaint.
 * POST /api/complaints
 */
export async function submitComplaint(req, res, next) {
  try {
    // 1. Validate form fields
    const validatedData = complaintSubmissionSchema.parse(req.body);

    const {
      title,
      description,
      locality,
      landmark = null,
      citizenName = null,
      citizenPhone = null,
      citizenEmail = null
    } = validatedData;

    // 2. Handle optional image upload
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await uploadComplaintImage({
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          filename: req.file.originalname
        });

        if (uploadResult) {
          imageUrl = uploadResult.imageUrl || null;
          imagePublicId = uploadResult.publicId || null;
        }
      } catch (uploadErr) {
        console.warn('[ComplaintsController] Image upload error:', uploadErr.message);
      }
    }

    // 3. Run AI Issue Analysis (with resilient keyword fallback)
    let aiAssessment;
    try {
      aiAssessment = await analyzeIssue({
        imageBuffer: req.file ? req.file.buffer : null,
        mimeType: req.file ? req.file.mimetype : 'image/jpeg',
        title,
        description,
        locality,
        landmark
      });
    } catch (aiErr) {
      console.warn('[ComplaintsController] AI assessment failed, using fallback:', aiErr.message);
      aiAssessment = classifyByKeywords({ title, description, locality, landmark });
    }

    // 4. Generate unique tracking code CL-YYYY-XXXX
    const complaintCode = generateComplaintCode();

    // 5. Persist complaint in repository
    const createdComplaint = await createComplaint({
      complaintCode,
      title,
      description,
      locality,
      landmark,
      citizenName,
      citizenPhone,
      citizenEmail: citizenEmail || null,
      imageUrl,
      imagePublicId,
      issueType: aiAssessment.issueType,
      severity: aiAssessment.severity,
      department: aiAssessment.department,
      aiSummary: aiAssessment.summary,
      aiRiskReason: aiAssessment.riskReason,
      aiRecommendedAction: aiAssessment.recommendedAction,
      aiConfidence: aiAssessment.confidence,
      needsHumanReview: aiAssessment.needsHumanReview,
      status: 'SUBMITTED'
    });

    // 6. Return 201 Created response
    return res.status(201).json({
      success: true,
      data: {
        complaintCode: createdComplaint.complaintCode,
        title: createdComplaint.title,
        status: createdComplaint.status,
        locality: createdComplaint.locality,
        createdAt: createdComplaint.createdAt,
        imageUrl: createdComplaint.imageUrl,
        aiAssessment: {
          issueType: createdComplaint.issueType,
          severity: createdComplaint.severity,
          department: createdComplaint.department,
          summary: createdComplaint.aiAssessment?.summary || aiAssessment.summary,
          riskReason: createdComplaint.aiAssessment?.riskReason || aiAssessment.riskReason,
          recommendedAction: createdComplaint.aiAssessment?.recommendedAction || aiAssessment.recommendedAction,
          confidence: createdComplaint.aiAssessment?.confidence || aiAssessment.confidence,
          needsHumanReview: createdComplaint.aiAssessment?.needsHumanReview ?? aiAssessment.needsHumanReview
        }
      },
      message: 'Complaint submitted successfully.'
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details
      });
    }
    return next(err);
  }
}

/**
 * Track a complaint by tracking code.
 * GET /api/complaints/track/:code
 */
export async function trackComplaint(req, res, next) {
  try {
    const { code } = req.params;

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CODE',
        message: 'Complaint tracking code is required'
      });
    }

    const complaint = await getComplaintByCode(code.trim());

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `No complaint found with code ${code}`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        complaintCode: complaint.complaintCode,
        title: complaint.title,
        description: complaint.description,
        locality: complaint.locality,
        landmark: complaint.landmark,
        imageUrl: complaint.imageUrl,
        issueType: complaint.issueType,
        severity: complaint.severity,
        department: complaint.department,
        status: complaint.status,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        aiAssessment: {
          summary: complaint.aiAssessment?.summary || null,
          recommendedAction: complaint.aiAssessment?.recommendedAction || null
        },
        timeline: complaint.timeline || []
      }
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  submitComplaint,
  trackComplaint,
  complaintSubmissionSchema
};
