-- ═══════════════════════════════════════════════════════════════════════
-- SafeOpen: migrate user identity columns from Supabase Auth UUIDs to
-- Firebase UIDs (plain strings, e.g. "aB3xQ...", NOT UUID-formatted).
--
-- WHY: The backend now verifies the frontend's Firebase ID token directly
-- (see safeopen-backend/src/middleware/auth.ts) instead of a Supabase Auth
-- session. That fixes the bug where every scan silently 401'd and fell back
-- to fake client-side results. But it also means:
--   1. req.userId is now a Firebase UID, not a Supabase auth.users(id) UUID
--      — so the `UUID REFERENCES auth.users(id)` foreign keys below would
--      reject every insert.
--   2. There's no Supabase session, so RLS policies using auth.uid() can
--      never match. The backend now uses the Supabase SERVICE ROLE key
--      (bypasses RLS) and enforces per-user scoping itself in every query
--      (e.g. `.eq('user_id', req.userId)`). RLS stays enabled below as a
--      safety net — it just means only the service-role key can touch these
--      tables now, which is the correct model when identity lives outside
--      Supabase Auth.
--
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Safe to re-run (every statement is idempotent / guarded).
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Drop foreign keys that point at auth.users(id) — Firebase UIDs don't exist there.
ALTER TABLE public.users              DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.scans              DROP CONSTRAINT IF EXISTS scans_user_id_fkey;
ALTER TABLE public.behavior_profiles  DROP CONSTRAINT IF EXISTS behavior_profiles_user_id_fkey;
ALTER TABLE public.behavior_events    DROP CONSTRAINT IF EXISTS behavior_events_user_id_fkey;
ALTER TABLE public.tracker_connections DROP CONSTRAINT IF EXISTS tracker_connections_user_id_fkey;
ALTER TABLE public.community_reports  DROP CONSTRAINT IF EXISTS community_reports_reporter_id_fkey;

-- 2. Widen id/user_id columns from UUID to TEXT so Firebase UIDs fit.
ALTER TABLE public.users              ALTER COLUMN id          TYPE TEXT;
ALTER TABLE public.scans              ALTER COLUMN user_id     TYPE TEXT;
ALTER TABLE public.behavior_profiles  ALTER COLUMN user_id     TYPE TEXT;
ALTER TABLE public.behavior_events    ALTER COLUMN user_id     TYPE TEXT;
ALTER TABLE public.tracker_connections ALTER COLUMN user_id    TYPE TEXT;
ALTER TABLE public.community_reports  ALTER COLUMN reporter_id TYPE TEXT;

-- 3. Re-add a (much lighter) foreign key from scans/etc → public.users(id),
--    now that public.users.id is itself a plain Firebase UID string owned
--    by this app rather than mirroring auth.users. Keeps referential
--    integrity without depending on Supabase Auth.
ALTER TABLE public.scans
    ADD CONSTRAINT scans_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.behavior_profiles
    ADD CONSTRAINT behavior_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.behavior_events
    ADD CONSTRAINT behavior_events_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.tracker_connections
    ADD CONSTRAINT tracker_connections_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.community_reports
    ADD CONSTRAINT community_reports_reporter_id_fkey
    FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Replace the old auth.uid()-based RLS policies (they can never match a
--    Firebase-authenticated request) with service-role-only access. RLS
--    stays ON; the backend's service-role key bypasses it by design, and
--    anon/authenticated Supabase clients (e.g. any stray frontend calls)
--    are now correctly denied instead of silently matching the wrong rows.
DROP POLICY IF EXISTS "Users can manage their own profile"     ON public.users;
DROP POLICY IF EXISTS "Users can manage their own scans"       ON public.scans;
DROP POLICY IF EXISTS "Users can manage their own behavior"    ON public.behavior_profiles;
DROP POLICY IF EXISTS "Users can manage their own events"      ON public.behavior_events;
DROP POLICY IF EXISTS "Users can manage their own connections" ON public.tracker_connections;

-- 5. APK scan table (added alongside the new real APK Scanner feature).
CREATE TABLE IF NOT EXISTS public.apk_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    package_name TEXT,
    app_name TEXT,
    version_name TEXT,
    version_code TEXT,
    min_sdk INTEGER,
    target_sdk INTEGER,
    file_size BIGINT,
    sha256 TEXT NOT NULL,
    sha1 TEXT,
    md5 TEXT,
    permissions JSONB DEFAULT '[]'::jsonb,
    dangerous_permissions JSONB DEFAULT '[]'::jsonb,
    components JSONB DEFAULT '{}'::jsonb,
    certificate JSONB,
    native_libs JSONB DEFAULT '[]'::jsonb,
    indicators JSONB DEFAULT '[]'::jsonb,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.apk_scans ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_apk_scans_user_id ON public.apk_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_apk_scans_sha256 ON public.apk_scans(sha256);

-- Done. Restart the backend after setting SUPABASE_SERVICE_ROLE_KEY and the
-- FIREBASE_* variables in safeopen-backend/.env for this to take effect.
