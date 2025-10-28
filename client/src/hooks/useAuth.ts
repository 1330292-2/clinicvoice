import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    staleTime: Infinity, // Never expire - cache permanently until page reload
    gcTime: Infinity, // Never garbage collect
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
