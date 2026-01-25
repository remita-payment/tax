// routes.js - COMPLETE AND FIXED
export const publicRoutes = [
  '/verify-TCC/[id]',
  '/payyobe/[id]',
  '/taxpayer-doc/[id]',
  '/unauthorized', // 🚨 CRITICAL: Prevents redirect loops
  '/receipt/[id]',  // ADDED: Receipt pages should be publicly accessible
  '/slip/[id]',     // ADDED: Slip pages should be publicly accessible
];

export const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/auth/new-verification',
  '/auth/forgot-password',
  '/auth/new-password'
];

// Make /dashboard accessible to all authenticated users
export const commonAuthenticatedRoutes = [
  '/dashboard',
  '/dashboard/*' // Allow all subroutes under dashboard
];

export const adminRoutes = [
  '/dashboard/orders',
  '/dashboard/orders/*',
  '/dashboard/categories',
  '/dashboard/categories/*',
  '/dashboard/products',
  '/dashboard/products/*',
  '/dashboard/delivery',
  '/dashboard/delivery/*',
  '/dashboard/profit',
  '/dashboard/profit/*',
  '/dashboard/revenue',
  '/dashboard/users',
  '/dashboard/users/*',
  '/dashboard/settings',
  '/taxpayer/[id]',
  '/slip/[id]',
  '/receipt/[id]',  // ADDED: Admin can access receipts
];

export const userRoutes = [
  '/dashboard/orders',
  '/dashboard/orders/*',
  '/dashboard/settings',
  '/taxpayer/[id]',
  '/slip/[id]',
  '/receipt/[id]',  // ADDED: Users can access receipts
];

export const customerRoutes = [
  '/dashboard/my-order',
  '/dashboard/my-order/*',
  '/dashboard/my-referral',
  '/dashboard/settings',
  '/transaction/[id]',
  '/receipt/[id]',  // ADDED: Customers can access receipts
];

export const apiAuthPrefix = [
  '/api/auth',
  '/api/users/*',
  '/api/two-factor/*',
];

export const DEFAULT_LOGIN_REDIRECT = '/dashboard/products';