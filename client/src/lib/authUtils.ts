export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*/.test(error.message) || error.message.includes('Unauthorized');
}

export function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearAuthTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}
