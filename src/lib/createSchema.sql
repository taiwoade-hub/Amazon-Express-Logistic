-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  destination TEXT NOT NULL,
  phone TEXT NOT NULL,
  package_type TEXT NOT NULL,
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

-- Create index on tracking_id for faster searches
CREATE INDEX IF NOT EXISTS idx_tracking_id ON deliveries(tracking_id);

-- Enable RLS
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (drop first to prevent duplicate errors)
DROP POLICY IF EXISTS "Allow public read" ON public.deliveries;
DROP POLICY IF EXISTS "Allow public read" ON deliveries;
CREATE POLICY "Allow public read" ON deliveries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.deliveries;
DROP POLICY IF EXISTS "Allow public insert" ON deliveries;
CREATE POLICY "Allow public insert" ON deliveries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.deliveries;
DROP POLICY IF EXISTS "Allow public update" ON deliveries;
CREATE POLICY "Allow public update" ON deliveries
  FOR UPDATE USING (true) WITH CHECK (true);

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

DROP POLICY IF EXISTS "Allow app settings write" ON app_settings;
CREATE POLICY "Allow app settings write" ON app_settings
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO app_settings(key, value)
VALUES ('admin_email', 'admin@gmail.com')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
