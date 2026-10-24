"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasPermission } from "@/lib/access";
import { authService, needsTwoFactor, type Portal } from "@/services/auth.service";
import { ROUTES } from "@/constants/routes";
import type { LoginInput, RegisterInput } from "@/validations/auth";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useCurrentUser() {
  return useQuery({ queryKey: authKeys.me, queryFn: authService.me, staleTime: 60_000 });
}

export function usePermission(permission?: string): boolean {
  const { data: user } = useCurrentUser();
  return hasPermission(user, permission);
}

export function useLogin(portal: Portal) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(portal, input),
    onSuccess: ({ data }) => {
      if (!needsTwoFactor(data)) queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useTwoFactorChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof authService.twoFactorChallenge>[0]) =>
      authService.twoFactorChallenge(input),
    onSuccess: ({ data }) => queryClient.setQueryData(authKeys.me, data.user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
    onSuccess: ({ data }) => queryClient.setQueryData(authKeys.me, data.user),
  });
}

export function useLogout(portal: Portal) {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      queryClient.clear();
      router.replace(portal === "admin" ? ROUTES.admin.login : ROUTES.login);
      router.refresh();
    },
  });
}

/** Sends the user to the login page when the API reports the session has expired. */
export function useUnauthorizedRedirect(portal: Portal) {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => {
      queryClient.clear();
      router.replace(portal === "admin" ? ROUTES.admin.login : ROUTES.login);
    };
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [portal, queryClient, router]);
}
