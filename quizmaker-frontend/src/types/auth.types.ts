// Authentication-related type definitions
// Used for user registration, login, token management, and user profile operations

import { BaseEntity, AuditableEntity } from './common.types';

/**
 * User registration request
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  confirmPassword?: string;
}

/**
 * User login request
 */
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * JWT authentication response
 */
export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserDto;
}

/**
 * Token refresh request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * User data transfer object
 */
export interface UserDto extends BaseEntity, AuditableEntity {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  roles: RoleDto[];
  profile?: UserProfileDto;
}

/**
 * User profile information
 */
export interface UserProfileDto {
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: AddressDto;
  preferences?: UserPreferencesDto;
}

/**
 * User address information
 */
export interface AddressDto {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

/**
 * User preferences
 */
export interface UserPreferencesDto {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'auto';
  emailNotifications: boolean;
  pushNotifications: boolean;
  privacySettings: PrivacySettingsDto;
}

/**
 * Privacy settings
 */
export interface PrivacySettingsDto {
  profileVisibility: 'public' | 'private' | 'friends';
  showEmail: boolean;
  showPhone: boolean;
  allowMessages: boolean;
}

/**
 * Role information
 */
export interface RoleDto extends BaseEntity {
  name: string;
  description?: string;
  permissions: PermissionDto[];
}

/**
 * Permission information
 */
export interface PermissionDto extends BaseEntity {
  name: string;
  description?: string;
  resource: string;
  action: string;
}

/**
 * Password change request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * Email verification request
 */
export interface EmailVerificationRequest {
  token: string;
}

/**
 * Resend email verification request
 */
export interface ResendEmailVerificationRequest {
  email: string;
}

/**
 * Two-factor authentication setup request
 */
export interface TwoFactorSetupRequest {
  method: 'sms' | 'email' | 'authenticator';
  phoneNumber?: string;
}

/**
 * Two-factor authentication verification request
 */
export interface TwoFactorVerifyRequest {
  code: string;
  method: 'sms' | 'email' | 'authenticator';
}

/**
 * Two-factor authentication disable request
 */
export interface TwoFactorDisableRequest {
  password: string;
}

/**
 * Social login request
 */
export interface SocialLoginRequest {
  provider: 'google' | 'facebook' | 'github' | 'linkedin';
  token: string;
  redirectUri?: string;
}

/**
 * Account deletion request
 */
export interface DeleteAccountRequest {
  password: string;
  reason?: string;
}

/**
 * Session information
 */
export interface SessionDto extends BaseEntity {
  userId: string;
  deviceInfo: DeviceInfoDto;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  isActive: boolean;
  expiresAt: string;
}

/**
 * Device information
 */
export interface DeviceInfoDto {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  browserVersion: string;
  operatingSystem: string;
  operatingSystemVersion: string;
}

/**
 * Authentication statistics
 */
export interface AuthStatisticsDto {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  failedLoginAttempts: number;
  successfulLogins: number;
  averageSessionDuration: number;
}

/**
 * Login attempt tracking
 */
export interface LoginAttemptDto extends BaseEntity {
  userId?: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  attemptTime: string;
}

/**
 * Account lockout information
 */
export interface AccountLockoutDto {
  userId: string;
  lockedUntil?: string;
  failedAttempts: number;
  maxAttempts: number;
  lockoutDuration: number;
}

/**
 * Authentication audit log entry
 */
export interface AuthAuditLogDto extends BaseEntity, AuditableEntity {
  userId?: string;
  action: 'login' | 'logout' | 'register' | 'password_change' | 'password_reset' | 'email_verification' | 'two_factor_setup' | 'two_factor_verify' | 'account_deletion';
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Authentication configuration
 */
export interface AuthConfigDto {
  passwordPolicy: PasswordPolicyDto;
  sessionPolicy: SessionPolicyDto;
  lockoutPolicy: LockoutPolicyDto;
  twoFactorPolicy: TwoFactorPolicyDto;
  socialLoginProviders: SocialLoginProviderDto[];
}

/**
 * Password policy configuration
 */
export interface PasswordPolicyDto {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialCharacters: boolean;
  preventCommonPasswords: boolean;
  maxAge: number; // days
}

/**
 * Session policy configuration
 */
export interface SessionPolicyDto {
  maxSessions: number;
  sessionTimeout: number; // minutes
  rememberMeTimeout: number; // days
  idleTimeout: number; // minutes
}

/**
 * Account lockout policy configuration
 */
export interface LockoutPolicyDto {
  maxFailedAttempts: number;
  lockoutDuration: number; // minutes
  enableLockout: boolean;
}

/**
 * Two-factor authentication policy configuration
 */
export interface TwoFactorPolicyDto {
  enabled: boolean;
  required: boolean;
  methods: ('sms' | 'email' | 'authenticator')[];
  backupCodesEnabled: boolean;
  backupCodesCount: number;
}

/**
 * Social login provider configuration
 */
export interface SocialLoginProviderDto {
  name: string;
  enabled: boolean;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  icon?: string;
} 