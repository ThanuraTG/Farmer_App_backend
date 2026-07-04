const AdminLog = require('../models/AdminLog');

/**
 * Log an administrative action to the database.
 * @param {string} adminId - The user ID of the admin performing the action
 * @param {string} actionType - 'create' | 'update' | 'delete'
 * @param {string} targetEntity - The name of the collection/entity (e.g., 'Crop', 'MarketPrice', 'Division')
 * @param {string} targetId - The ID of the affected document
 */
const logAdminAction = async (adminId, actionType, targetEntity, targetId) => {
  try {
    await AdminLog.create({
      admin_id: adminId,
      action_type: actionType,
      target_entity: targetEntity,
      target_id: targetId.toString()
    });
    console.log(`[ADMIN LOG] Admin ${adminId} performed ${actionType} on ${targetEntity} (${targetId})`);
  } catch (error) {
    console.error('[ADMIN LOG ERROR] Failed to write ADMIN_LOG:', error.message);
  }
};

module.exports = { logAdminAction };
