import axios from 'axios';
import { getAccessToken, setAccessToken, getRefreshToken, clearTokens } from './auth-token';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const transformIds = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(transformIds);
  }

  const transformed: any = {};
  for (const key of Object.keys(obj)) {
    transformed[key] = transformIds(obj[key]);
  }

  if (obj._id && !obj.id) {
    transformed.id = obj._id;
  }

  return transformed;
};

apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = transformIds(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh request itself fails
    if (originalRequest?.url === '/auth/refresh' || originalRequest?.url?.endsWith('/auth/refresh')) {
      clearTokens();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      if (originalRequest) {
        originalRequest._retry = true;
      }
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        clearTokens();
        // Redirect to login if on the client
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const data = response.data;
        if (data?.success && data?.data?.accessToken) {
          const newAccessToken = data.data.accessToken;
          setAccessToken(newAccessToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          
          processQueue(null, newAccessToken);
          isRefreshing = false;
          return apiClient(originalRequest);
        } else {
          throw new Error('Token refresh response did not contain new access token');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
