"use client";

/**
 * Хуки данных для страниц. Работают только через HermesApi,
 * поэтому смена мока на бэкенд не затрагивает страницы.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDataLayer } from "@/data";
import type { RequestFilter } from "@/data/api";

export const api = () => getDataLayer().api;

export const qk = {
  plans: ["plans"] as const,
  plan: (id: string) => ["plans", id] as const,
  settings: ["settings"] as const,
  session: ["session"] as const,
  access: ["access"] as const,
  payment: (id: string) => ["payment", id] as const,
  admin: {
    plans: ["admin", "plans"] as const,
    inventory: ["admin", "inventory"] as const,
    requests: (f: RequestFilter) => ["admin", "requests", f] as const,
  },
};

export const usePlans = () => useQuery({ queryKey: qk.plans, queryFn: () => api().listPlans() });
export const usePlan = (id: string) => useQuery({ queryKey: qk.plan(id), queryFn: () => api().getPlan(id) });
export const useLandingSettings = () => useQuery({ queryKey: qk.settings, queryFn: () => api().getLandingSettings() });
export const useSession = () => useQuery({ queryKey: qk.session, queryFn: () => api().getSession() });
export const useMyAccess = (enabled = true) =>
  useQuery({ queryKey: qk.access, queryFn: () => api().getMyAccess(), enabled });
export const usePayment = (id: string) => useQuery({ queryKey: qk.payment(id), queryFn: () => api().getPayment(id) });

export const useAdminPlans = () => useQuery({ queryKey: qk.admin.plans, queryFn: () => api().admin.listPlans() });
export const useInventory = () => useQuery({ queryKey: qk.admin.inventory, queryFn: () => api().admin.listInventory() });
export const useRequests = (filter: RequestFilter) =>
  useQuery({ queryKey: qk.admin.requests(filter), queryFn: () => api().admin.listRequests(filter), placeholderData: (prev) => prev });

/** Мутация, после которой обновляются все связанные данные (наличие, цены, заявки…). */
export function useAction<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries(),
  });
}
