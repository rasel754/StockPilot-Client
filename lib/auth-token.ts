let memoryToken: string | null = null;

export const getAccessToken = (): string | null => {
  return memoryToken;
};

export const setAccessToken = (token: string | null): void => {
  memoryToken = token;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

export const setRefreshToken = (token: string | null): void => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }
};

export const clearTokens = (): void => {
  memoryToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refreshToken');
  }
};
