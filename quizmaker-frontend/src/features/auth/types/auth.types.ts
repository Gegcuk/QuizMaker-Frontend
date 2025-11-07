// Authentication-related type definitions
// Used for user registration, login, token management, and user profile operations as documented in the API specification

/**
 * User registration request
 * Matches RegisterRequest DTO from API documentation
 */
export interface RegisterRequest {
  username: string;  // 4-20 characters
  email: string;     // Valid email format
  password: string;  // 8-100 characters
}

/**
 * User login request
 * Matches LoginRequest DTO from API documentation
 */
export interface LoginRequest {
  username: string;  // Username or email
  password: string;  // User password
}

/**
 * JWT authentication response
 * Matches JwtResponse DTO from API documentation
 */
export interface JwtResponse {
  accessToken: string;           // JWT access token
  refreshToken: string;          // JWT refresh token
  accessExpiresInMs: number;     // Access token validity (ms)
  refreshExpiresInMs: number;    // Refresh token validity (ms)
}

/**
 * Token refresh request
 * Matches RefreshRequest DTO from API documentation
 */
export interface RefreshRequest {
  refreshToken: string;  // Valid refresh token
}

/**
 * User data transfer object
 * Matches UserDto from API documentation
 */
export interface UserDto {
  id: string;                  // Unique user identifier
  username: string;            // Username
  email: string;               // Email address
  isActive: boolean;           // Account status
  roles: string[];             // User roles (e.g., ["ROLE_USER"])
  lastLoginDate?: string;      // Last login time
  createdAt: string;           // Account creation timestamp
  updatedAt: string;           // Last update timestamp
}

/**
 * Available user roles from API documentation
 */
export type UserRole = 
  | 'ROLE_USER'           // Basic user - can take quizzes, view public content
  | 'ROLE_QUIZ_CREATOR'   // Can create and manage their own quizzes
  | 'ROLE_MODERATOR'      // Can moderate content, manage reported items
  | 'ROLE_ADMIN'          // Can manage users, categories, and system settings
  | 'ROLE_SUPER_ADMIN';   // Full system access

/**
 * Authenticated user DTO from API documentation
 * More detailed than UserDto, used for authenticated responses
 */
export interface AuthenticatedUserDto {
  id: string;              // UUID
  username: string;
  email: string;
  isActive: boolean;
  roles: UserRole[];       // Set<RoleName> in Java
  createdAt: string;       // ISO date-time (LocalDateTime in Java)
  lastLoginDate: string | null; // ISO date-time (LocalDateTime in Java)
  updatedAt: string;       // ISO date-time (LocalDateTime in Java)
}

/**
 * Forgot password request
 * Matches ForgotPasswordRequest DTO from API documentation
 */
export interface ForgotPasswordRequest {
  email: string; // valid email
}

/**
 * Forgot password response
 * Matches ForgotPasswordResponse DTO from API documentation
 */
export interface ForgotPasswordResponse {
  message: string;
}

/**
 * Reset password request
 * Matches ResetPasswordRequest DTO from API documentation
 */
export interface ResetPasswordRequest {
  newPassword: string; // same password rules as register
}

/**
 * Reset password response
 * Matches ResetPasswordResponse DTO from API documentation
 */
export interface ResetPasswordResponse {
  message: string;
}

/**
 * Verify email request
 * Matches VerifyEmailRequest DTO from API documentation
 */
export interface VerifyEmailRequest {
  token: string; // <=512 chars
}

/**
 * Verify email response
 * Matches VerifyEmailResponse DTO from API documentation
 */
export interface VerifyEmailResponse {
  verified: boolean;
  message: string;
  verifiedAt: string; // ISO date-time (LocalDateTime in Java)
}

/**
 * Resend verification request
 * Matches ResendVerificationRequest DTO from API documentation
 */
export interface ResendVerificationRequest {
  email: string; // valid email
}

/**
 * Resend verification response
 * Matches ResendVerificationResponse DTO from API documentation
 */
export interface ResendVerificationResponse {
  message: string;
}

/**
 * User profile response
 * Matches UserProfileResponse DTO from API documentation
 * Full user profile with preferences and metadata
 */
export interface UserProfileResponse {
  id: string;                       // UUID
  username: string;
  email: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  preferences?: Record<string, any>; // User preferences (JSON object)
  joinedAt: string;                 // ISO date-time (account creation)
  verified: boolean;                // Email verified flag
  roles: string[];                  // Assigned roles
  version: number;                  // Entity version for optimistic locking
}

/**
 * Avatar upload response
 * Matches AvatarUploadResponse DTO from API documentation
 */
export interface AvatarUploadResponse {
  avatarUrl: string;  // Public URL of the uploaded avatar
  message: string;    // Human friendly message
}

/**
 * OAuth provider types
 * Supported OAuth2 social login providers
 */
export type OAuthProvider = 'GOOGLE' | 'GITHUB' | 'FACEBOOK' | 'MICROSOFT' | 'APPLE';

/**
 * OAuth account DTO
 * Matches OAuthAccountDto from API documentation
 * Represents a linked OAuth social login account
 */
export interface OAuthAccountDto {
  id: number;                 // Unique identifier of the OAuth account
  provider: OAuthProvider;    // OAuth provider name
  email: string;              // Email address from the OAuth provider
  name: string;               // Display name from the OAuth provider
  profileImageUrl?: string;   // Profile image URL from the OAuth provider
  createdAt: string;          // When the OAuth account was linked (ISO date-time)
  updatedAt: string;          // Last time the OAuth account info was updated (ISO date-time)
}

/**
 * Linked accounts response
 * Matches LinkedAccountsResponse from API documentation
 * Contains all OAuth accounts linked to the authenticated user
 */
export interface LinkedAccountsResponse {
  accounts: OAuthAccountDto[]; // List of linked OAuth accounts
}

/**
 * Unlink account request
 * Matches UnlinkAccountRequest from API documentation
 * Used to unlink an OAuth provider from the user account
 */
export interface UnlinkAccountRequest {
  provider: OAuthProvider; // OAuth provider to unlink
} 