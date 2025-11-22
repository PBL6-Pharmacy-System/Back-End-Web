// User Management Module - Centralized exports
// This module manages all user types: customers, staff, admins, and general users

import userRoutes from './users/userRoutes.js';
import customerRoutes from './customers/customerRoutes.js';
import staffRoutes from './staff/staffRoutes.js';
import adminRoutes from './admin/adminRoutes.js';

export {
  userRoutes,
  customerRoutes,
  staffRoutes,
  adminRoutes
};
