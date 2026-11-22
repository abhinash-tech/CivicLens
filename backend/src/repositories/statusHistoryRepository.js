import { pool, query } from '../config/database.js';

/**
 * Transforms a raw database status history row to a normalized camelCase object.
 * @param {object} row
 * @returns {object}
 */
export function formatStatusHistoryRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    complaintId: row.complaint_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedBy: row.changed_by,
    changeReason: row.change_reason,
    createdAt: row.created_at,
    // Timeline friendly fields
    status: row.to_status,
    timestamp: row.created_at,
    reason: row.change_reason,
  };
}

/**
 * Retrieves the full chronological status history for a given complaint ID.
 * @param {number} complaintId
 * @param {import('mysql2/promise').PoolConnection} [connection]
 * @returns {Promise<Array>}
 */
export async function getComplaintStatusHistory(complaintId, connection) {
  const sql = `
    SELECT id, complaint_id, from_status, to_status, changed_by, change_reason, created_at
    FROM complaint_status_history
    WHERE complaint_id = ?
    ORDER BY created_at ASC, id ASC
  `;

  const executor = connection || pool;
  const [rows] = await executor.query(sql, [complaintId]);

  return Array.isArray(rows) ? rows.map(formatStatusHistoryRow) : [];
}

/**
 * Appends a new status transition record to the history table.
 * @param {object} params
 * @param {number} params.complaintId
 * @param {string|null} params.fromStatus
 * @param {string} params.toStatus
 * @param {string} params.changedBy
 * @param {string|null} [params.changeReason]
 * @param {import('mysql2/promise').PoolConnection} [connection]
 * @returns {Promise<object>}
 */
export async function addComplaintStatusHistory(
  { complaintId, fromStatus = null, toStatus, changedBy = 'System', changeReason = null },
  connection
) {
  const sql = `
    INSERT INTO complaint_status_history (
      complaint_id, from_status, to_status, changed_by, change_reason
    ) VALUES (?, ?, ?, ?, ?)
  `;

  const executor = connection || pool;
  const [result] = await executor.query(sql, [
    complaintId,
    fromStatus,
    toStatus,
    changedBy,
    changeReason,
  ]);

  return {
    id: result.insertId,
    complaintId,
    fromStatus,
    toStatus,
    changedBy,
    changeReason,
  };
}

export default {
  formatStatusHistoryRow,
  getComplaintStatusHistory,
  addComplaintStatusHistory,
};
