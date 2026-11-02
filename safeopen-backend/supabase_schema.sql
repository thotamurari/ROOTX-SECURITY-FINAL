-- SafeOpen Supabase PostgreSQL Schema Migration
-- Please run this entire script in the Supabase SQL Editor.

-- Enable gen_random_uuid() if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Mirrors Auth Users)
-- We reference auth.users(id) to keep identities consistent
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    device_fingerprint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Scans Table
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scan_type TEXT NOT NULL CHECK (scan_type IN ('url', 'file', 'message', 'apk')),
    input TEXT NOT NULL,
    input_hash TEXT,
    risk_score INTEGER NOT NULL,
    threat_level TEXT NOT NULL CHECK (threat_level IN ('safe', 'caution', 'danger', 'critical')),
    threat_type TEXT,
    indicators JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    ai_analysis JSONB,
    community_matches INTEGER DEFAULT 0,
    scan_duration INTEGER NOT NULL,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Behavior Profiles Table
CREATE TABLE IF NOT EXISTS public.behavior_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    baseline JSONB NOT NULL,
    today JSONB NOT NULL,
    anomaly_score INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Behavior Events Table
CREATE TABLE IF NOT EXISTS public.behavior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tracker Connections Table
CREATE TABLE IF NOT EXISTS public.tracker_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL,
    app_icon TEXT,
    destination_ip TEXT NOT NULL,
    country TEXT,
    country_code TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    data_type TEXT,
    is_flagged BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    risk_score INTEGER DEFAULT 0,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Behavior Profiles (Mirror table for legacy support if needed)
-- This table is already created above as #3.

-- 7. Community Reports Table
CREATE TABLE IF NOT EXISTS public.community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    input_hash TEXT NOT NULL,
    threat_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    trust_score INTEGER DEFAULT 50,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_connections ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can only see and modify their own data
CREATE POLICY "Users can manage their own profile" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own scans" ON public.scans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own behavior" ON public.behavior_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own events" ON public.behavior_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own connections" ON public.tracker_connections FOR ALL USING (auth.uid() = user_id);

-- 8. Performance Optimization Indexes
-- Indexes for faster queries with multiple users
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON public.scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_input_hash ON public.scans(input_hash);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.behavior_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON public.behavior_events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_trackers_user_id ON public.tracker_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_trackers_flagged ON public.tracker_connections(is_flagged) WHERE is_flagged = true;

CREATE INDEX IF NOT EXISTS idx_community_reports_hash ON public.community_reports(input_hash);
CREATE INDEX IF NOT EXISTS idx_community_reports_created ON public.community_reports(created_at DESC);

