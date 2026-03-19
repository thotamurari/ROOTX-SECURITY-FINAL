-- SafeOpen Supabase PostgreSQL Schema Migration
-- Please run this entire script in the Supabase SQL Editor.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    device_fingerprint TEXT,
    refresh_tokens TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Scans Table
CREATE TABLE public.scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE TABLE public.behavior_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    baseline JSONB NOT NULL,
    today JSONB NOT NULL,
    anomaly_score INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Behavior Events Table
CREATE TABLE public.behavior_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tracker Connections Table
CREATE TABLE public.tracker_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- 6. Community Reports Table
CREATE TABLE public.community_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
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

-- 7. Threat Feed Table
CREATE TABLE public.threat_feeds (
    indicator TEXT PRIMARY KEY,
    threat_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source TEXT NOT NULL,
    reported_count INTEGER DEFAULT 1,
    verified BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
