-- ═══════════════════════════════════════════════════════════════════════
-- SafeOpen: device/session tracking for "view your devices, log out others".
--
-- WHY A SEPARATE TABLE (instead of relying on Firebase alone): Firebase ID
-- tokens are refreshed directly by the client SDK and stay valid for up to
-- an hour even if the user clicks "log out this device" from a different
-- device/tab. authMiddleware (see src/middleware/auth.ts) checks this table
-- on every authenticated request — via the X-Device-Id header the frontend
-- now sends — so a revoked device is rejected immediately, independent of
-- whether its Firebase token is still technically unexpired.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'android', 'ios')),
    user_agent TEXT,
    ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (user_id, device_id)
);

ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id ON public.device_sessions(device_id);

-- RLS stays enabled with no policies (deny-all to anon/authenticated
-- Supabase clients) — same model as every other table since this backend's
-- service-role key is the only thing that should ever touch it.
