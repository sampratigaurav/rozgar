# Rozgar — Production Deployment Guide

## Architecture
```
Vercel (Frontend)
  ↕ REST
Render (Backend :8001)  ←→  Supabase (Postgres + Storage + Auth + Realtime)
  ↕ REST
Render (AI Service :8000)  ←→  Gemini API + Twilio
```

---

## 1. Supabase Setup (do this first)

1. Create a new Supabase project at https://supabase.com
2. **SQL Editor → New query** → paste `supabase/schema.sql` → Run
3. **Storage** → confirm bucket `job-photos` exists and is **Public**
4. **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`
5. **Database → Replication**: toggle ON for `jobs` and `workers` tables
6. Copy your **Project URL** and **anon public** key from Settings → API

---

## 2. AI Service (Render)

Root directory: `ai/`

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | From Google AI Studio |
| `TWILIO_ACCOUNT_SID` | From Twilio Console |
| `TWILIO_AUTH_TOKEN` | From Twilio Console |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` (sandbox) |
| `TWILIO_SMS_NUMBER` | Your Twilio SMS number |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |

Build: `pip install -r requirements.txt`
Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 3. Backend (Render)

Root directory: `backend/`

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `AI_SERVICE_URL` | https://your-ai-service.onrender.com |
| `FRONTEND_URL` | https://your-app.vercel.app |
| `PORT` | 8001 |

Build: `pip install -r requirements.txt`
Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

> **Render Free tier sleeps after 15 min**. Add UptimeRobot to ping
> `https://your-backend.onrender.com/health` every 5 min (free).

---

## 4. Frontend (Vercel)

Set these in Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_BACKEND_URL` | https://your-backend.onrender.com |
| `NEXT_PUBLIC_AI_URL` | https://your-ai-service.onrender.com |

Then: `vercel --prod` or connect GitHub for auto-deploys.

---

## 5. End-to-End Test Checklist

- [ ] `GET /health` on both Render services returns `{"status":"ok"}`
- [ ] Admin panel `/admin` loads without errors
- [ ] Seed workers: Admin → Step 1 → Seed Workers (check Available: 3)
- [ ] Customer flow: Sign up → Electrician → Photo → AI analysis populates scope/price
- [ ] Customer flow: Enter 560001 → Broadcast → job appears in polling screen
- [ ] Admin → Step 3: Broadcast job ID, then Step 4: Accept with worker UUID
- [ ] Customer screen: transitions from "polling" to "matched" with worker name
- [ ] Worker URL: `/worker?job_id=X&worker_id=Y` shows photo and Accept button
- [ ] Customer "Mark Complete" button → job status → completed, worker re-enabled

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| CORS error in browser | `FRONTEND_URL` not set in backend | Add env var in Render |
| Auth loop on login | Missing Supabase redirect URLs | Add `https://your-app.vercel.app/**` in Supabase Auth settings |
| `scope` always `null` | Old jobs.py bug (fixed) | Deploy updated `backend/routers/jobs.py` |
| Photo URL is filename, not URL | Old jobs.py bug (fixed) | Deploy updated `backend/routers/jobs.py` |
| `gemini-2.5-flash` 404 | Model not in API | Fixed: now uses `gemini-1.5-flash` |
| Storage 403 on upload | Bucket policies not set | Re-run schema.sql storage section |
| Realtime not working | Table not in publication | Enable `jobs`/`workers` in Supabase → DB → Replication |
| OTP via phone fails | Twilio not configured in Supabase Auth | Use email OTP instead (built-in) |