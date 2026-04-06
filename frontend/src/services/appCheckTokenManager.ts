import { getAppCheckToken } from './firebaseAppCheck';
import { appCheckApi } from './appCheckApi';

/**
 * Service to manage AppCheck token lifecycle
 * - Gets token from Firebase AppCheck
 * - Sends token to Spring Boot backend
 * - Refreshes token periodically
 */

class AppCheckTokenManager {
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private readonly REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the token manager
   * - Gets initial token
   - Sets up periodic refresh
   */
  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      console.log('Initializing AppCheck Token Manager...');

      // Send initial token
      await this.sendToken();

      // Set up periodic refresh
      this.startPeriodicRefresh();

      console.log('AppCheck Token Manager initialized');
    })().catch((error) => {
      this.initializationPromise = null;
      throw error;
    });

    return this.initializationPromise;
  }

  async ensureInitialized(): Promise<void> {
    await this.initialize();
  }

  /**
   * Send AppCheck token to backend
   */
  async sendToken(): Promise<boolean> {
    try {
      const token = await getAppCheckToken();

      if (!token) {
        console.warn('Failed to get AppCheck token');
        return false;
      }

      await appCheckApi.sendToken(token, 'react');
      console.log('AppCheck token sent to backend successfully');
      return true;
    } catch (error) {
      console.error('Failed to send AppCheck token to backend:', error);
      return false;
    }
  }

  /**
   * Start periodic token refresh
   */
  private startPeriodicRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(() => {
      console.log('Refreshing AppCheck token...');
      this.sendToken();
    }, this.refreshIntervalMs);
  }

  /**
   * Stop periodic token refresh
   */
  stopPeriodicRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('AppCheck token refresh stopped');
    }
  }

  /**
   * Get refresh interval in milliseconds
   */
  get refreshIntervalMs(): number {
    return this.REFRESH_INTERVAL_MS;
  }

  /**
   * Check if backend has a valid token
   */
  async checkBackendStatus(): Promise<boolean> {
    try {
      const status = await appCheckApi.checkStatus();
      return status.hasValidToken;
    } catch (error) {
      console.error('Failed to check backend AppCheck status:', error);
      return false;
    }
  }

  /**
   * Clear all tokens from backend
   */
  async clearBackendTokens(): Promise<void> {
    try {
      await appCheckApi.clearTokens();
      console.log('Backend tokens cleared');
    } catch (error) {
      console.error('Failed to clear backend tokens:', error);
    }
  }
}

// Export singleton instance
export const appCheckTokenManager = new AppCheckTokenManager();

export default appCheckTokenManager;
