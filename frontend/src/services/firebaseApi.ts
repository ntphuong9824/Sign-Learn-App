import axios from 'axios';
import { AppCheck } from '../helpers/app-check';

// Create axios instance
const api = axios.create({
  baseURL: 'https://us-central1-sign-mt.cloudfunctions.net',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add AppCheck token
api.interceptors.request.use(
  async (config) => {
    // Add AppCheck token for Firebase Functions requests
    if (
      config.url?.includes('cloudfunctions.net') ||
      config.url?.includes('sign-mt/us-central1')
    ) {
      try {
        const token = await AppCheck.getToken();
        console.log('🔐 AppCheck Token for', config.url, ':', token);
        config.headers['X-Firebase-AppCheck'] = token;
        config.headers['X-AppCheck-Token'] = token;
      } catch (error) {
        console.error('Failed to get AppCheck token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
