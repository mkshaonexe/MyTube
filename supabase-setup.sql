-- =============================================
-- MyTube App Update System - Supabase Setup
-- Run this SQL in Supabase SQL Editor
-- =============================================

-- Create app_versions table
CREATE TABLE IF NOT EXISTS app_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version_code INTEGER NOT NULL UNIQUE,
    version_name TEXT NOT NULL,
    download_url TEXT NOT NULL,
    release_notes TEXT,
    is_mandatory BOOLEAN DEFAULT false,
    min_supported_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_versions_code ON app_versions(version_code DESC);

-- Enable Row Level Security
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read (public access for app to check updates)
CREATE POLICY "Allow public read access" ON app_versions
    FOR SELECT
    TO anon
    USING (true);

-- Create policy for authenticated users to insert/update (admin only)
CREATE POLICY "Allow authenticated insert" ON app_versions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON app_versions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert initial version (your current app version)
INSERT INTO app_versions (version_code, version_name, download_url, release_notes, is_mandatory, min_supported_version)
VALUES (
    1,
    '1.0.0',
    'https://your-website.com/downloads/mytube-v1.0.0.apk',
    'Initial release with ad-blocking and notification features',
    false,
    1
);

-- =============================================
-- HOW TO ADD NEW VERSION (run when you release update):
-- =============================================
-- INSERT INTO app_versions (version_code, version_name, download_url, release_notes, is_mandatory, min_supported_version)
-- VALUES (
--     2,
--     '1.1.0',
--     'https://your-website.com/downloads/mytube-v1.1.0.apk',
--     'Bug fixes and performance improvements',
--     true,  -- Set to true to force immediate update
--     1      -- Minimum version that can still work (versions below this are blocked)
-- );
