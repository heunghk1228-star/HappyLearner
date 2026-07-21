-- Run this in Supabase SQL Editor to add fillblank_sentence column
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS fillblank_sentence TEXT DEFAULT '';