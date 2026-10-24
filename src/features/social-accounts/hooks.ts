"use client";

import { useQuery } from "@tanstack/react-query";
import { accountsService } from "@/services/accounts.service";

export const accountKeys = {
  all: ["social-accounts"] as const,
  platforms: ["platforms"] as const,
};

export function useSocialAccounts() {
  return useQuery({ queryKey: accountKeys.all, queryFn: accountsService.list });
}

export function usePlatforms() {
  return useQuery({
    queryKey: accountKeys.platforms,
    queryFn: accountsService.platforms,
    staleTime: 5 * 60_000,
  });
}
