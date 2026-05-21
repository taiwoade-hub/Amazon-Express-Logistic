-- ============================================
-- AMOZON EXPRESS LOGISTICS - SUPABASE SETUP
-- ============================================
-- Run this SQL in your Supabase dashboard
-- Go to: https://app.supabase.com → SQL Editor → New Query
-- ============================================

-- 1. CREATE DELIVERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text NOT NULL UNIQUE,
  sender_name text NOT NULL,
  receiver_name text NOT NULL,
  pickup_location text NOT NULL,
  destination text NOT NULL,
  phone text NOT NULL,
  package_type text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'processing',
  package_image text,
  sender_email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('processing', 'picked_up', 'in_transit', 'delivered', 'cancelled'))
);

ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS package_image text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS sender_email text;

-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking_id ON public.deliveries(tracking_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES
-- ============================================
-- Drop existing policies first if they exist to prevent database execution errors
DROP POLICY IF EXISTS "enable_read_all" ON public.deliveries;
DROP POLICY IF EXISTS "enable_read_all" ON deliveries;
-- Allow anyone to read all deliveries
CREATE POLICY "enable_read_all" 
ON public.deliveries 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "enable_insert_all" ON public.deliveries;
DROP POLICY IF EXISTS "enable_insert_all" ON deliveries;
-- Allow anyone to create deliveries
CREATE POLICY "enable_insert_all" 
ON public.deliveries 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "enable_update_all" ON public.deliveries;
DROP POLICY IF EXISTS "enable_update_all" ON deliveries;
-- Allow anyone to update deliveries
CREATE POLICY "enable_update_all" 
ON public.deliveries 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "enable_delete_all" ON public.deliveries;
DROP POLICY IF EXISTS "enable_delete_all" ON deliveries;
-- Allow anyone to delete deliveries (admin feature)
CREATE POLICY "enable_delete_all" 
ON public.deliveries 
FOR DELETE 
USING (true);

-- 5. CREATE TRIGGER FOR UPDATED_AT (Auto-update timestamp)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger first to prevent duplicate trigger errors on rerun
DROP TRIGGER IF EXISTS handle_deliveries_updated_at ON public.deliveries;
CREATE TRIGGER handle_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enable_app_settings_read" ON public.app_settings;
CREATE POLICY "enable_app_settings_read"
ON public.app_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "enable_app_settings_write" ON public.app_settings;
CREATE POLICY "enable_app_settings_write"
ON public.app_settings
FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO public.app_settings(key, value)
VALUES ('admin_email', 'admin@gmail.com')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your database is ready to use.
-- The app at http://localhost:5173 will now connect successfully.
-- ============================================
