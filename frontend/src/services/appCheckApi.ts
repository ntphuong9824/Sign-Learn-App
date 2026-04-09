import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SPRING_BOOT_API_URL || '/api/v1';

export interface AppCheckTokenResponse {
  status: string;
  message: string;
  source?: string;
}

export interface AppCheckStatusResponse {
  hasValidToken: boolean;
  tokenInfo: Record<string, string>;
}

/**
 * Service for managing AppCheck tokens between client and backend
 * Supports cancellation via AbortController
 */
export const appCheckApi = {
  /**
   * Send AppCheck token to backend for caching
   * @param token The AppCheck token from Firebase
   * @param source Source identifier (e.g., 'react', 'mobile')
   * @param signal Optional AbortSignal for cancellation
   */
  sendToken: async (
    token: string,
    source: string = 'react',
    signal?: AbortSignal
  ): Promise<AppCheckTokenResponse> => {
    const response = await axios.post<AppCheckTokenResponse>(
      `${API_BASE_URL}/appcheck/token`,
      { token },
      {
        headers: {
          'X-Client-Source': source,
          'Content-Type': 'application/json',
        },
        signal,
      }
    );
    return response.data;
  },

  /**
   * Check if backend has a valid AppCheck token
   * @param signal Optional AbortSignal for cancellation
   */
  checkStatus: async (signal?: AbortSignal): Promise<AppCheckStatusResponse> => {
    const response = await axios.get<AppCheckStatusResponse>(
      `${API_BASE_URL}/appcheck/status`,
      { signal }
    );
    return response.data;
  },

  /**
   * Clear all cached tokens from backend
   * @param signal Optional AbortSignal for cancellation
   */
  clearTokens: async (signal?: AbortSignal): Promise<AppCheckTokenResponse> => {
    const response = await axios.delete<AppCheckTokenResponse>(
      `${API_BASE_URL}/appcheck/token`,
      { signal }
    );
    return response.data;
  },
};

export default appCheckApi;
