# 🚀 QUICK COPY - SQL SETUP

**Just copy and paste this SQL into your Supabase SQL Editor and run it!**

---

```sql
-- Create deliveries table
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

-- Add optional columns used by the app (safe to re-run)
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS sender_phone text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS receiver_phone text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS pickup_country text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS destination_country text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_language text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS item_description text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS delivery_notes text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS currency text;
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS price numeric;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking_id ON public.deliveries(tracking_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at DESC);

-- Enable RLS
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first to prevent duplicate errors)
DROP POLICY IF EXISTS "enable_read_all" ON public.deliveries;
DROP POLICY IF EXISTS "enable_read_all" ON deliveries;
CREATE POLICY "enable_read_all" ON public.deliveries FOR SELECT USING (true);

DROP POLICY IF EXISTS "enable_insert_all" ON public.deliveries;
DROP POLICY IF EXISTS "enable_insert_all" ON deliveries;
CREATE POLICY "enable_insert_all" ON public.deliveries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "enable_update_all" ON public.deliveries;
DROP POLICY IF EXISTS "enable_update_all" ON deliveries;
CREATE POLICY "enable_update_all" ON public.deliveries FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "enable_delete_all" ON public.deliveries;
DROP POLICY IF EXISTS "enable_delete_all" ON deliveries;
CREATE POLICY "enable_delete_all" ON public.deliveries FOR DELETE USING (true);

-- Create auto-update trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
```

---

## Steps:
1. Go to https://app.supabase.com
2. Click your project
3. Click **SQL Editor** → **New Query**
4. Paste the SQL above
5. Click **Run**
6. Done! ✅

Your app will now work perfectly at http://localhost:5173
