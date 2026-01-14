import useSWR from "swr";
import { api } from "./api";

export function useDashboard() {
  return useSWR("dashboard", () => api.dashboard());
}

export function useWorkers() {
  return useSWR("workers", () => api.workers.list());
}

export function useWorkerDetail(id: number) {
  return useSWR(id ? `workers/${id}` : null, () => api.workers.get(id));
}

export function useClients() {
  return useSWR("clients", () => api.clients.list());
}

export function useContracts() {
  return useSWR("contracts", () => api.contracts.list());
}

export function useCompliance() {
  return useSWR("compliance", () => api.compliance.list());
}

export const useTimesheets = () => useSWR("timesheets", () => api.timesheets.list());
export const useInvoices = () => useSWR("invoices", () => api.invoices.list());
export const useActivities = (limit: number = 10) => useSWR(`activities-${limit}`, () => api.activities.list(limit));

export function useShifts(start: string, end: string) {
  return useSWR(start && end ? `scheduling/shifts?start=${start}&end=${end}` : null, () => api.scheduling.listShifts(start, end));
}
