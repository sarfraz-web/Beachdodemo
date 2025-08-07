import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No token');
      
      const response = await apiRequest('GET', '/api/auth/me');
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!localStorage.getItem('accessToken'), // Only enabled if token exists
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error
  };
}
