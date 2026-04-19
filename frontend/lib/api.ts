import { createClient } from "./supabase";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
const AI_URL      = (process.env.NEXT_PUBLIC_AI_URL      ?? "").replace(/\/$/, "");

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AIAnalysisResult {
  scope:     string;
  price_min: number;
  price_max: number;
  complexity: "low" | "medium" | "high";
}

export interface Worker {
  id:           string;
  name:         string;
  phone:        string;
  type:         "smartphone" | "keypad";
  pin_code:     string;
  language:     string;
  is_available: boolean;
  partner_id:   string | null;
}

export interface Job {
  id:                string;
  category:          string;
  photo_url:         string | null;
  pin_code:          string;
  scope:             string | null;
  price_min:         number | null;
  price_max:         number | null;
  complexity:        string | null;
  status:            "pending" | "broadcast" | "matched" | "completed" | "cancelled";
  matched_worker_id: string | null;
  matched_worker?:   Worker;
  created_at?:       string;
  updated_at?:       string;
}

export interface AdminStatus {
  total_workers:     number;
  available_workers: number;
  total_jobs:        number;
  pending_jobs:      number;
  partners:          number;
}

// ─────────────────────────────────────────────────────────────
// Core fetch helper
// ─────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  let body: Record<string, unknown>;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}): non-JSON response`);
  }

  if (!res.ok || !body.success) {
    // FastAPI 422 wraps the error in detail.error
    const detail = body.detail as Record<string, unknown> | undefined;
    const msg =
      (detail?.error as string) ??
      (body.error as string) ??
      `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return body as T;
}

// ─────────────────────────────────────────────────────────────
// AIheaders = await getAuthHeaders();
  const res  = await fetch(`${AI_URL}/ai/analyse`, { method: "POST", body: form, headers });
  const body = await res.json().catch(() => { throw new Error("AI service unavailable"); });
  if (!res.ok || !body.success) throw new Error(body.error ?? "AI analysis failed");
  return body.result as AIAnalysisResult;
}

// ─────────────────────────────────────────────────────────────
// Jobs
// ─────────────────────────────────────────────────────────────

export async function createJob(
  category: string,
  pin_code: string,
  photo: File,
): Promise<{ success: boolean; data: Job }> {
  const form = new FormData();
  form.append("category", category);
  form.append("pin_code",  pin_code);
  form.append("photo",     photo);
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/jobs/create`, { method: "POST", body: form, headers });
  return handleResponse(res);
}

export async function broadcastJob(
  job_id: string,
): Promise<{ success: boolean; data: { job_id: string; notified_count: number } }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/jobs/broadcast/${job_id}`, { method: "POST", headers });
  return handleResponse(res);
}

export async function getJob(job_id: string): Promise<{ success: boolean; data: Job }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/jobs/${job_id}`, { headers });
  return handleResponse(res);
}

export async function listJobs(params?: {
  status?: string;
  pin_code?: string;
  limit?: number;
}): Promise<{ success: boolean; data: Job[] }> {
  const qs = new URLSearchParams();
  if (params?.status)   qs.set("status",   params.status);
  if (params?.pin_code) qs.set("pin_code", params.pin_code);
  if (params?.limit)    qs.set("limit",    String(params.limit));
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/jobs/list?${qs}`, { headers });
  return handleResponse(res);
}

export async function completeJob(
  job_id: string,
): Promise<{ success: boolean; data: { message: string; job_id: string } }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/jobs/${job_id}/complete`, { method: "PATCH", headers });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// Workers
// ─────────────────────────────────────────────────────────────

export async function acceptJob(
  job_id: string,
  worker_id: string,
): Promise<{ success: boolean; data: { message: string; job_id: string } }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/workers/accept`, { 
    method: "POST", 
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ job_id, worker_id })
  });
  return handleResponse(res);
}

export async function getAvailableWorkers(
  pin_code: string,
): Promise<{ success: boolean; data: Worker[] }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/workers/available/${pin_code}`, { headers });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// Partners
// ─────────────────────────────────────────────────────────────

export async function partnerAccept(
  job_id: string,
  worker_id: string,
  partner_id: string,
): Promise<{ success: boolean; data: { message: string; commission: number } }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/partners/accept`, { 
    method: "POST", 
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ job_id, worker_id, partner_id })
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────

export async function seedWorkers(): Promise<{ success: boolean; data: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/admin/seed`, { method: "POST", headers });
  return handleResponse(res);
}

export async function resetDemo(): Promise<{ success: boolean; data: string }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/admin/reset`, { method: "POST", headers });
  return handleResponse(res);
}

export async function getAdminStatus(): Promise<{ success: boolean; data: AdminStatus }> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/admin/status`, { headers }
export async function resetDemo(): Promise<{ success: boolean; data: string }> {
  const res = await fetch(`${BACKEND_URL}/admin/reset`, { method: "POST" });
  return handleResponse(res);
}

export async function getAdminStatus(): Promise<{ success: boolean; data: AdminStatus }> {
  const res = await fetch(`${BACKEND_URL}/admin/status`);
  return handleResponse(res);
}