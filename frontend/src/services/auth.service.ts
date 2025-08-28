import { HttpService } from './base/http.service';
import { 
  AuthResponse, 
  LoginForm, 
  RegisterForm, 
  User
} from '@/types/api.types';

export class AuthService {
  private httpService: HttpService;
  private readonly TOKEN_KEY = 'recipe_app_token';
  private readonly REFRESH_TOKEN_KEY = 'recipe_app_refresh_token';
  private refreshPromise: Promise<AuthResponse | null> | null = null;

  constructor(httpService?: HttpService) {
    this.httpService = httpService || new HttpService();
  }

  private setAuthCookie(token: string): void {
    if (typeof document === 'undefined') return
    // Parse JWT to get expiry time for better cookie sync
    const tokenData = this.parseJwtPayload(token)
    const maxAgeSeconds = tokenData?.exp ? Math.max(0, (tokenData.exp as number) - Math.floor(Date.now() / 1000)) : 3600
    document.cookie = `auth_token=${encodeURIComponent(token)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`
  }

  private removeAuthCookie(): void {
    if (typeof document === 'undefined') return
    document.cookie = 'auth_token=; Max-Age=0; Path=/; SameSite=Lax'
  }

  public async login(credentials: LoginForm): Promise<AuthResponse> {
    const response = await this.httpService.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      this.httpService.setAuthToken(response.data.tokens.accessToken);
      this.setAuthCookie(response.data.tokens.accessToken);
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  }

  public async register(userData: RegisterForm): Promise<AuthResponse> {
    const response = await this.httpService.post<AuthResponse>('/auth/register', userData);
    
    if (response.success && response.data) {
      this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
      this.httpService.setAuthToken(response.data.tokens.accessToken);
      this.setAuthCookie(response.data.tokens.accessToken);
      return response.data;
    }
    
    throw new Error(response.message || 'Registration failed');
  }

  public async refreshToken(): Promise<AuthResponse | null> {
    // If a refresh is already in progress, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }

    // Create a new refresh promise
    this.refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Clear the refresh promise when done
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<AuthResponse | null> {
    try {
      const response = await this.httpService.post<AuthResponse>('/auth/refresh', {
        refreshToken
      });
      
      if (response.success && response.data) {
        this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
        this.httpService.setAuthToken(response.data.tokens.accessToken);
        this.setAuthCookie(response.data.tokens.accessToken);
        return response.data;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      return null;
    }
    
    return null;
  }

  public async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    // Fixed: Changed from POST to PATCH to match backend endpoint
    const response = await this.httpService.patch<{ message: string }>('/auth/change-password', {
      currentPassword: oldPassword,
      newPassword: newPassword
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  }

  public async forgotPassword(email: string): Promise<void> {
    const response = await this.httpService.post<void>('/auth/forgot-password', {
      email
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to send reset email');
    }
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await this.httpService.post<void>('/auth/reset-password', {
      token,
      newPassword
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to reset password');
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      this.httpService.setAuthToken(token);
      // Fixed: Changed from GET to POST to match backend endpoint
      const response = await this.httpService.post<User>('/auth/me');
      
      if (response.success && response.data) {
        return response.data;
      }
    } catch {
      // If getting current user fails, try to refresh token
      const refreshResult = await this.refreshToken();
      
      if (refreshResult) {
        try {
          // Fixed: Changed from GET to POST to match backend endpoint
          const response = await this.httpService.post<User>('/auth/me');
          return response.success ? (response.data ?? null) : null;
        } catch {
          this.logout();
          return null;
        }
      }
      
      this.logout();
      return null;
    }
    
    return null;
  }

  public logout(): void {
    this.removeTokens();
    this.httpService.removeAuthToken();
    this.removeAuthCookie();
  }

  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    const payload = this.parseJwtPayload(token);
    if (!payload || !payload.exp) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return (payload.exp as number) > currentTime;
  }

  /**
   * Parse JWT payload without verification (client-side only for expiry check)
   */
  private parseJwtPayload(token: string): Record<string, any> | null {
    try {
      const base64Payload = token.split('.')[1];
      const payload = atob(base64Payload);
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  public getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private removeTokens(): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Initialize the service with existing token if available
  public initialize(): void {
    const token = this.getToken();
    if (token) {
      this.httpService.setAuthToken(token);
      this.setAuthCookie(token);
    }
  }
} 