import { getPublicStats, getPublicRecentComplaints } from '../repositories/complaintsRepository.js';

/**
 * Public transparency statistics summary.
 * GET /api/public/stats
 */
export async function getStats(req, res, next) {
  try {
    const stats = await getPublicStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * Public recent complaints preview list.
 * GET /api/public/recent
 */
export async function getRecent(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const recent = await getPublicRecentComplaints(limit);
    return res.status(200).json({
      success: true,
      data: recent
    });
  } catch (err) {
    return next(err);
  }
}

export default {
  getStats,
  getRecent
};
