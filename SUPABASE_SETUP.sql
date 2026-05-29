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
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS sender_phone text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS receiver_phone text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS pickup_country text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS destination_country text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_language text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS item_description text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_notes text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS price numeric;

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

CREATE TABLE IF NOT EXISTS public.email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  tracking_id text,
  recipient text NOT NULL,
  resend_id text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enable_email_events_read" ON public.email_events;
CREATE POLICY "enable_email_events_read"
ON public.email_events
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "enable_email_events_write" ON public.email_events;
CREATE POLICY "enable_email_events_write"
ON public.email_events
FOR INSERT
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_tracking_id ON public.email_events(tracking_id);

CREATE TABLE IF NOT EXISTS public.receipt_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.receipt_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enable_receipt_links_read" ON public.receipt_links;
CREATE POLICY "enable_receipt_links_read"
ON public.receipt_links
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "enable_receipt_links_write" ON public.receipt_links;
CREATE POLICY "enable_receipt_links_write"
ON public.receipt_links
FOR INSERT
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_receipt_links_tracking_id ON public.receipt_links(tracking_id);

CREATE TABLE IF NOT EXISTS public.user_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enable_user_signups_read" ON public.user_signups;
CREATE POLICY "enable_user_signups_read"
ON public.user_signups
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "enable_user_signups_write" ON public.user_signups;
CREATE POLICY "enable_user_signups_write"
ON public.user_signups
FOR INSERT
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_signups_created_at ON public.user_signups(created_at DESC);

GRANT ALL ON TABLE public.deliveries TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.address_book TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.email_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.receipt_links TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_signups TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your database is ready to use.
-- The app at http://localhost:5173 will now connect successfully.
-- ============================================
