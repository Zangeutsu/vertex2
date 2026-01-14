import { Client, ComplianceRecord, Contract, DashboardData, ETTWorker, Timesheet, WorkerDetail, Activity, Shift, Booking } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(init?.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Erro ao comunicar com o servidor");
  }
  return (await res.json()) as T;
}

export const api = {
  dashboard: () => request<DashboardData>("/dashboard"),
  workers: {
    list: () => request<ETTWorker[]>("/workers"),
    get: (id: string) => request<WorkerDetail>(`/workers/${id}`),
    create: (data: Partial<ETTWorker>) =>
      request<ETTWorker>("/workers", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/workers/${id}`, { method: "DELETE" }),
  },
  clients: {
    list: () => request<Client[]>("/clients"),
    create: (data: Partial<Client>) =>
      request<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/clients/${id}`, { method: "DELETE" }),
  },
  contracts: {
    list: () => request<Contract[]>("/contracts"),
    create: (data: Partial<Contract>) =>
      request<Contract>("/contracts", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/contracts/${id}`, { method: "DELETE" }),
    upload: (id: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<Contract>(`/contracts/${id}/upload`, {
        method: "POST",
        body: formData,
        headers: {},
      });
    },
  },
  compliance: {
    list: () => request<ComplianceRecord[]>("/compliance"),
    create: (data: Partial<ComplianceRecord>) =>
      request<ComplianceRecord>("/compliance", { method: "POST", body: JSON.stringify(data) }),
    upload: (id: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<ComplianceRecord>(`/compliance/${id}/upload`, {
        method: "POST",
        body: formData,
        headers: {},
      });
    },
  },
  timesheets: {
    list: () => request<Timesheet[]>("/timesheets"),
    create: (data: Partial<Timesheet>) =>
      request<Timesheet>("/timesheets", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/timesheets/${id}`, { method: "DELETE" }),
  },
  activities: {
    list: (limit: number = 10) => request<Activity[]>(`/activities/?limit=${limit}`),
  },
  scheduling: {
    listShifts: (start: string, end: string) =>
      request<Shift[]>(`/scheduling/shifts?start_date=${start}&end_date=${end}`),
    createShift: (data: Partial<Shift>) =>
      request<Shift>("/scheduling/shifts", { method: "POST", body: JSON.stringify(data) }),
    updateShift: (id: string, data: Partial<Shift>) =>
      request<Shift>(`/scheduling/shifts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    deleteShift: (id: string) =>
      request<void>(`/scheduling/shifts/${id}`, { method: "DELETE" }),
    createBooking: (data: { shift_id: string; worker_id: string }) =>
      request<Booking>("/scheduling/bookings", { method: "POST", body: JSON.stringify(data) }),
    deleteBooking: (id: string) =>
      request<void>(`/scheduling/bookings/${id}`, { method: "DELETE" }),
  },
  reports: {
    workersUrl: `${API_BASE}/reports/workers`,
    contractsUrl: `${API_BASE}/reports/contracts`,
  },
};
