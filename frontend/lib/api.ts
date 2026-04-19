const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;
const AI_URL = process.env.NEXT_PUBLIC_AI_URL!;

export interface AIAnalysisResult {
  scope: string;
  price_min: number;
  price_max: number;
  complexity: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  type: "smartphone" | "keypad";
  pin_code: string;
  language: string;
  is_available: boolean;
  partner_id: string | null;
}

export interface Job {
  id: string;
  category: string;
  photo_url: string;
  pin_code: string;
  scope: string;
  price_min: number;
  price_max: number;
  complexity: string;
  status: "pending" | "broadcast" | "matched" | "completed";
  matched_worker_id: string | null;
  matched_worker?: Worker;
}

export interface AdminStatus {
  total_workers: number;
  available_workers: number;
  total_jobs: number;
  pending_jobs: number;
  partners: number;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({ success: false, error: "Invalid JSON from server" }));
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Request failed: ${res.status} ${res.statusText}`);
  }
  return json;
}

export async function analyseImage(
  image: File,
  category: string
): Promise<AIAnalysisResult> {
  const form = new FormData();
  form.append("image", image);
  form.append("category", category);
  const res = await fetch(`${AI_URL}/ai/analyse`, { method: "POST", body: form });
  const json = await res.json().catch(() => { throw new Error("AI service returned invalid response"); });
  if (!res.ok) throw new Error(json.error || "AI analysis failed");
  return json.result;
}

export async function createJob(
  category: string,
  pin_code: string,
  photo: File
): Promise<{ success: boolean; data: Job }> {
  const form = new FormData();
  form.append("category", category);
  form.append("pin_code", pin_code);
  form.append("photo", photo);
  const res = await fetch(`${BACKEND_URL}/jobs/create`, { method: "POST", body: form });
  return handleResponse(res);
}

export async function broadcastJob(
  job_id: string
): Promise<{ success: boolean; data: { job_id: string; notified_count: number } }> {
  const res = await fetch(`${BACKEND_URL}/jobs/broadcast/${job_id}`, { method: "POST" });
  return handleResponse(res);
}

export async function getJob(
  job_id: string
): Promise<{ success: boolean; data: Job }> {
  const res = await fetch(`${BACKEND_URL}/jobs/${job_id}`);
  return handleResponse(res);
}

export async function acceptJob(
  job_id: string,
  worker_id: string
): Promise<{ success: boolean; data: { message: string; job_id: string } }> {
  const form = new FormData();
  form.append("job_id", job_id);
  form.append("worker_id", worker_id);
  const res = await fetch(`${BACKEND_URL}/workers/accept`, { method: "POST", body: form });
  return handleResponse(res);
}

export async function getAvailableWorkers(
  pin_code: string
): Promise<{ success: boolean; data: Worker[] }> {
  const res = await fetch(`${BACKEND_URL}/workers/available/${pin_code}`);
  return handleResponse(res);
}

export async function partnerAccept(
  job_id: string,
  worker_id: string,
  partner_id: string
): Promise<{ success: boolean; data: { message: string; commission: number } }> {
  const form = new FormData();
  form.append("job_id", job_id);
  form.append("worker_id", worker_id);
  form.append("partner_id", partner_id);
  const res = await fetch(`${BACKEND_URL}/partners/accept`, { method: "POST", body: form });
  return handleResponse(res);
}

export async function seedWorkers(): Promise<{ success: boolean; data: string }> {
  const res = await fetch(`${BACKEND_URL}/admin/seed`, { method: "POST" });
  return handleResponse(res);
}

export async function resetDemo(): Promise<{ success: boolean; data: string }> {
  const res = await fetch(`${BACKEND_URL}/admin/reset`, { method: "POST" });
  return handleResponse(res);
}

export async function getAdminStatus(): Promise<{ success: boolean; data: AdminStatus }> {
  const res = await fetch(`${BACKEND_URL}/admin/status`);
  return handleResponse(res);
}
