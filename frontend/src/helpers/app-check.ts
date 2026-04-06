import { getAppCheckToken } from '../services/firebaseAppCheck';

export const AppCheck = {
  async getToken(): Promise<string> {
    const token = await getAppCheckToken();
    if (!token) {
      throw new Error('Failed to get Firebase App Check token');
    }
    return token;
  },
};
