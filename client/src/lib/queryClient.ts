import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('accessToken');
  
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle 401 errors by trying to refresh token
  if (res.status === 401 && token) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          credentials: "include",
        });

        if (refreshRes.ok) {
          const tokens = await refreshRes.json();
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          // Retry original request with new token
          return fetch(url, {
            method,
            headers: {
              ...(data ? { "Content-Type": "application/json" } : {}),
              "Authorization": `Bearer ${tokens.accessToken}`
            },
            body: data ? JSON.stringify(data) : undefined,
            credentials: "include",
          });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
    
    // Clear tokens if refresh failed
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: {
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
