import axios from 'axios';
import { getAppCheckToken } from './firebaseAppCheck';
import { appCheckTokenManager } from './appCheckTokenManager';
import type {
  NormalizeResponse,
  TranslateResponse,
  SignWritingResponse,
  TextToTextResponse,
} from '../types/translation';

// Use Vite proxy for development, direct URL for production
const API_BASE_URL = import.meta.env.VITE_SPRING_BOOT_API_URL || '/api/v1/translate';

// Create axios instance for API
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  await appCheckTokenManager.ensureInitialized();

  const token = await getAppCheckToken();
  if (token) {
    config.headers['X-Firebase-AppCheck'] = token;
    config.headers['X-AppCheck-Token'] = token;
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const translationApi = {
  normalize: async (lang: string, text: string): Promise<NormalizeResponse> => {
    const response = await api.get<{text: string}>('/normalize', {
      params: { lang, text },
    });
    return { text: response.data.text };
  },

  spokenToSigned: async (
    text: string,
    spoken: string,
    signed: string
  ): Promise<TranslateResponse> => {
    const response = await api.get<TranslateResponse>('/spoken-to-signed', {
      params: { text, spoken, signed },
    });
    return response.data;
  },

  describeSignWriting: async (fsw: string): Promise<SignWritingResponse> => {
    const response = await api.post<SignWritingResponse>(
      '/signwriting/describe',
      { fsw }
    );
    return response.data;
  },

  textToText: async (
    direction: string,
    from: string,
    to: string,
    text: string
  ): Promise<TextToTextResponse> => {
    const response = await api.get<TextToTextResponse>(
      `/text-to-text/${direction}`,
      { params: { from, to, text } }
    );
    return response.data;
  },
};

export default translationApi;
