import type { AxiosInstance } from 'axios';
import { AUTH_ENDPOINTS } from './auth.endpoints';
import { 
  LoginRequest, 
  RegisterRequest, 
  RefreshRequest, 
  JwtResponse, 
  UserDto,
  AuthenticatedUserDto,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse
} from '@/types';
import { BaseService } from '@/services';

/**
 * Authentication service for handling user authentication operations
 * Implements all endpoints from the AuthController API documentation
 */
export class AuthService extends BaseService<UserDto> {
  constructor(axiosInstance: AxiosInstance) {
    super(axiosInstance, '/v1/auth');
  }

  /**
   * Register a new user account
   * POST /api/v1/auth/register
   */
  async register(data: RegisterRequest): Promise<UserDto> {
    try {
      const response = await this.axiosInstance.post<UserDto>(AUTH_ENDPOINTS.REGISTER, data);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Authenticate user and get JWT tokens
   * POST /api/v1/auth/login
   */
  async login(data: LoginRequest): Promise<JwtResponse> {
    try {
      const response = await this.axiosInstance.post<JwtResponse>(AUTH_ENDPOINTS.LOGIN, data);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Refresh access token using refresh token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(data: RefreshRequest): Promise<JwtResponse> {
    try {
      const response = await this.axiosInstance.post<JwtResponse>(AUTH_ENDPOINTS.REFRESH, data);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout user and revoke access token
   * POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Don't throw error on logout failure, just log it
      console.warn('Logout request failed:', error);
    }
  }

  /**
   * Get current authenticated user details
   * GET /api/v1/auth/me
   */
  async getCurrentUser(): Promise<AuthenticatedUserDto> {
    try {
      const response = await this.axiosInstance.get<AuthenticatedUserDto>(AUTH_ENDPOINTS.ME);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Initiate password reset flow
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await this.axiosInstance.post<ForgotPasswordResponse>(AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Reset password using a reset token
   * POST /api/v1/auth/reset-password?token=<string>
   */
  async resetPassword(token: string, data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const response = await this.axiosInstance.post<ResetPasswordResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, data, {
        params: { token }
      });
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify email using a verification token
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    try {
      const response = await this.axiosInstance.post<VerifyEmailResponse>(AUTH_ENDPOINTS.VERIFY_EMAIL, data);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend email verification link
   * POST /api/v1/auth/resend-verification
   */
  async resendVerification(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    try {
      const response = await this.axiosInstance.post<ResendVerificationResponse>(AUTH_ENDPOINTS.RESEND_VERIFICATION, data);
      return response.data;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Handle auth-specific errors
   */
  private handleAuthError(error: any): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Validation error: ${message}`);
        case 401:
          return new Error('Authentication failed');
        case 409:
          return new Error('Username or email already exists');
        case 429:
          return new Error('Too many requests. Please try again later.');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Authentication operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
} 