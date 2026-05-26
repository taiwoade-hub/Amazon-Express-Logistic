-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  phone TEXT NOT NULL,
  sender_phone TEXT,
  receiver_phone TEXT,
  package_type TEXT NOT NULL,
  item_description TEXT,
  currency TEXT,
  price NUMERIC,
  status TEXT DEFAULT 'processing',
  package_image TEXT,
  sender_email TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS pickup_country TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS destination_country TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_language TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS sender_phone TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS receiver_phone TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS item_description TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS price NUMERIC;

-- Create index on tracking_id for faster searches
CREATE INDEX IF NOT EXISTS idx_tracking_id ON deliveries(tracking_id);

-- Enable RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    COALESCE(
      (auth.jwt() ->> 'email') =
        (SELECT value FROM public.app_settings WHERE key = 'admin_email' LIMIT 1),
      false
    )
$$;

DROP POLICY IF EXISTS "Allow public delivery read" ON public.deliveries;
CREATE POLICY "Allow public delivery read" ON deliveries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public delivery insert" ON public.deliveries;
CREATE POLICY "Allow public delivery insert" ON deliveries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin delivery update" ON public.deliveries;
CREATE POLICY "Allow admin delivery update" ON deliveries
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin delivery delete" ON public.deliveries;
CREATE POLICY "Allow admin delivery delete" ON deliveries
  FOR DELETE USING (public.is_admin());

CREATE TABLE IF NOT EXISTS address_book (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  label TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE address_book ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow address book owner access" ON address_book;
CREATE POLICY "Allow address book owner access" ON address_book
  FOR ALL USING ((auth.jwt() ->> 'email') = owner_email) WITH CHECK ((auth.jwt() ->> 'email') = owner_email);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow app settings read" ON app_settings;
CREATE POLICY "Allow app settings read" ON app_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow app settings admin write" ON app_settings;
CREATE POLICY "Allow app settings admin write" ON app_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO app_settings(key, value)
VALUES ('admin_email', 'admin@gmail.com')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  tracking_id TEXT,
  recipient TEXT NOT NULL,
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow email events read" ON email_events;
CREATE POLICY "Allow email events read" ON email_events
  FOR SELECT USING (public.is_admin());

CREATE TABLE IF NOT EXISTS receipt_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE receipt_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow receipt links read" ON receipt_links;
CREATE POLICY "Allow receipt links read" ON receipt_links
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow receipt links insert" ON receipt_links;
CREATE POLICY "Allow receipt links insert" ON receipt_links
  FOR INSERT WITH CHECK (true);

CREATE TABLE IF NOT EXISTS user_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE user_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user signups read" ON user_signups;
CREATE POLICY "Allow user signups read" ON user_signups
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow user signups insert" ON user_signups;
CREATE POLICY "Allow user signups insert" ON user_signups
  FOR INSERT WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
