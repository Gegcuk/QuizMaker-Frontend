/**
 * Authentication endpoints
 * Based on auth_controller.md API specification
 */
export const AUTH_ENDPOINTS = {
  // Core authentication
  REGISTER: '/v1/auth/register',
  LOGIN: '/v1/auth/login',
  REFRESH: '/v1/auth/refresh',
  LOGOUT: '/v1/auth/logout',
  ME: '/v1/auth/me',
  
  // Password management
  FORGOT_PASSWORD: '/v1/auth/forgot-password',
  RESET_PASSWORD: '/v1/auth/reset-password',
  
  // Email verification
  VERIFY_EMAIL: '/v1/auth/verify-email',
  RESEND_VERIFICATION: '/v1/auth/resend-verification',
} as const;
