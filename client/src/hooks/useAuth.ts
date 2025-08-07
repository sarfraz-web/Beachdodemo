import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: false, // Start disabled to prevent immediate requests
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error
  };
}
