// Example usage of the AuthService
// This file demonstrates how to use the new AuthService with proper TypeScript types

import { AuthService } from '../api/auth.service';
import { axiosInstance } from '../api';
import { 
  LoginRequest, 
  RegisterRequest, 
  RefreshRequest,
  UserDto,
  JwtResponse,
  AuthError 
} from '../types/auth.types';

// Initialize the auth service
const authService = new AuthService(axiosInstance);

/**
 * Example: User Registration
 */
export async function exampleRegister(): Promise<void> {
  try {
    const registerData: RegisterRequest = {
      username: 'newuser',
      email: 'user@example.com',
      password: 'SecurePassword123!'
    };

    const user: UserDto = await authService.register(registerData);
    console.log('User registered successfully:', user);
    
    // User object will contain:
    // {
    //   id: "uuid",
    //   username: "newuser",
    //   email: "user@example.com",
    //   isActive: true,
    //   roles: ["ROLE_USER"],
    //   createdAt: "2025-01-21T15:30:00",
    //   lastLoginDate: null,
    //   updatedAt: "2025-01-21T15:30:00"
    // }
    
  } catch (error) {
    const authError = error as AuthError;
    
    switch (authError.type) {
      case 'VALIDATION_ERROR':
        console.error('Validation errors:', authError.details);
        break;
      case 'CONFLICT_ERROR':
        console.error('Username or email already exists');
        break;
      default:
        console.error('Registration failed:', authError.message);
    }
  }
}

/**
 * Example: User Login
 */
export async function exampleLogin(): Promise<void> {
  try {
    const loginData: LoginRequest = {
      username: 'newuser',
      password: 'SecurePassword123!'
    };

    const jwtResponse: JwtResponse = await authService.login(loginData);
    console.log('Login successful:', jwtResponse);
    
    // JWT response will contain:
    // {
    //   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    //   refreshToken: "dGhpc2lzYXJlZnJlc2h0b2tlbg==",
    //   accessExpiresInMs: 3600000,
    //   refreshExpiresInMs: 864000000
    // }
    
    // Store tokens securely (e.g., in localStorage or secure storage)
    localStorage.setItem('accessToken', jwtResponse.accessToken);
    localStorage.setItem('refreshToken', jwtResponse.refreshToken);
    
  } catch (error) {
    const authError = error as AuthError;
    
    if (authError.type === 'AUTHENTICATION_ERROR') {
      console.error('Invalid credentials');
    } else {
      console.error('Login failed:', authError.message);
    }
  }
}

/**
 * Example: Get Current User
 */
export async function exampleGetCurrentUser(): Promise<void> {
  try {
    const user: UserDto = await authService.getCurrentUser();
    console.log('Current user:', user);
    
  } catch (error) {
    const authError = error as AuthError;
    
    if (authError.type === 'AUTHENTICATION_ERROR') {
      console.error('Not authenticated');
      // Redirect to login page
    } else {
      console.error('Failed to get user:', authError.message);
    }
  }
}

/**
 * Example: Refresh Token
 */
export async function exampleRefreshToken(): Promise<void> {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshData: RefreshRequest = {
      refreshToken: refreshToken
    };

    const jwtResponse: JwtResponse = await authService.refreshToken(refreshData);
    console.log('Token refreshed:', jwtResponse);
    
    // Update stored tokens
    localStorage.setItem('accessToken', jwtResponse.accessToken);
    localStorage.setItem('refreshToken', jwtResponse.refreshToken);
    
  } catch (error) {
    const authError = error as AuthError;
    
    if (authError.type === 'AUTHENTICATION_ERROR') {
      console.error('Invalid refresh token');
      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } else {
      console.error('Token refresh failed:', authError.message);
    }
  }
}

/**
 * Example: Logout
 */
export async function exampleLogout(): Promise<void> {
  try {
    await authService.logout();
    console.log('Logout successful');
    
    // Clear stored tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear tokens even if logout request fails
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

/**
 * Example: Token Validation
 */
export function exampleTokenValidation(): void {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    console.log('No access token found');
    return;
  }

  // Check if token is valid
  const isValid = authService.validateToken(accessToken);
  console.log('Token is valid:', isValid);

  // Check if token is expiring soon
  const isExpiringSoon = authService.isTokenExpiringSoon(accessToken, 5); // 5 minutes buffer
  console.log('Token expiring soon:', isExpiringSoon);

  // Get token expiration time
  const expiration = authService.getTokenExpiration(accessToken);
  console.log('Token expires at:', expiration);
}

/**
 * Example: Check Authentication Status
 */
export async function exampleCheckAuthStatus(): Promise<void> {
  try {
    const isAuthenticated = await authService.isAuthenticated();
    console.log('User is authenticated:', isAuthenticated);
    
    if (isAuthenticated) {
      const user = await authService.getCurrentUser();
      console.log('User details:', user);
    }
    
  } catch (error) {
    console.error('Failed to check auth status:', error);
  }
}

/**
 * Example: Role-based Access Control
 */
export async function exampleRoleCheck(): Promise<void> {
  try {
    const user = await authService.getCurrentUser();
    
    // Check if user has specific roles
    const hasAdminRole = user.roles.includes('ROLE_ADMIN');
    const hasQuizCreatorRole = user.roles.includes('ROLE_QUIZ_CREATOR');
    const hasModeratorRole = user.roles.includes('ROLE_MODERATOR');
    
    console.log('User roles:', user.roles);
    console.log('Is admin:', hasAdminRole);
    console.log('Can create quizzes:', hasQuizCreatorRole);
    console.log('Is moderator:', hasModeratorRole);
    
    // Example role-based logic
    if (hasAdminRole) {
      console.log('User has admin privileges');
    } else if (hasQuizCreatorRole) {
      console.log('User can create and manage quizzes');
    } else {
      console.log('User has basic access');
    }
    
  } catch (error) {
    console.error('Failed to check user roles:', error);
  }
} 