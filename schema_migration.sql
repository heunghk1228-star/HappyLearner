-- Run this in Supabase SQL Editor to add profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_style TEXT DEFAULT 'cat';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT '';