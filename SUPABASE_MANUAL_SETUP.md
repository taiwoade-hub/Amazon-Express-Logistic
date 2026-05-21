# 🚀 SUPABASE SETUP GUIDE - Step by Step

## Your Supabase Project
- **URL:** https://trcbdmocvhtpnarnwrei.supabase.co
- **Status:** ✅ Configured in your `.env` file

---

## 📋 Setup Instructions (3 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to **https://app.supabase.com**
2. Click on your project: `trcbdmocvhtpnarnwrei`
3. Click **SQL Editor** (left sidebar)
4. Click **New Query** (blue button)

### Step 2: Copy & Paste the Schema
1. Open this file: `/SUPABASE_SETUP.sql`
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)

### Step 3: Verify Success
You should see green checkmarks ✅ for:
- ✅ Table created: `deliveries`
- ✅ Indexes created (3 total)
- ✅ RLS enabled
- ✅ Policies created (4 total)
- ✅ Trigger created

### Step 4: Test Connection
1. Go back to your project folder
2. Run: `pnpm dev`
3. Open: http://localhost:5173
4. Try creating a delivery
5. Check Supabase dashboard to see the data appear

---

## 🎯 What Gets Created

### 1. `deliveries` Table
Stores all package delivery information with these columns:

```
id                 → Unique identifier (UUID)
tracking_id        → AXL-123456 format (UNIQUE)
sender_name        → Who is sending
receiver_name      → Who is receiving
pickup_location    → Where it starts
destination        → Where it ends
phone              → Contact number
package_type       → standard, express, fragile, etc.
status             → processing / picked_up / in_transit / delivered / cancelled
created_at         → Timestamp (auto-set)
updated_at         → Timestamp (auto-updated)
```

### 2. Indexes (For Speed)
- `idx_deliveries_tracking_id` → Fast lookups by tracking ID
- `idx_deliveries_status` → Filter by delivery status
- `idx_deliveries_created_at` → Sort by newest first

### 3. Row Level Security (RLS)
Policies that control who can do what:
- **Read** → Anyone can view any delivery
- **Insert** → Anyone can create a delivery
- **Update** → Anyone can update any delivery
- **Delete** → Anyone can delete (admin use)

### 4. Auto-Update Trigger
Automatically sets `updated_at` timestamp whenever a row is modified.

---

## ✅ Verification Checklist

After running the SQL, verify in Supabase:

- [ ] Go to **Table Editor**
- [ ] See `deliveries` table listed
- [ ] Click on it → columns match above
- [ ] Go to **Authentication → Policies**
- [ ] See 4 policies listed
- [ ] Go back to **SQL Editor**
- [ ] Run: `SELECT * FROM public.deliveries;`
- [ ] See empty table (or existing data)

---

## 🔗 Connection Test

Once setup is complete, the app connects automatically via:

```javascript
// From .env file:
VITE_SUPABASE_URL=https://trcbdmocvhtpnarnwrei.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (your key)

// From src/lib/supabaseClient.js:
const supabase = createClient(url, anonKey)
```

---

## 🐛 Troubleshooting

### Issue: "Table already exists"
**Solution:** The SQL has `IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: "Policy already exists"
**Solution:** Same as above, safe to run again.

### Issue: App says "Cannot connect to Supabase"
**Solution:** 
1. Verify `.env` has correct URL and key
2. Restart the dev server: `pnpm dev`
3. Check browser console for errors

### Issue: "RLS policy denies access"
**Solution:** Check the 4 policies are all enabled (see Supabase dashboard)

---

## 📚 SQL File Location

The complete SQL is in: `/SUPABASE_SETUP.sql`

You can also copy-paste the raw SQL below:

```sql
-- See the full SUPABASE_SETUP.sql file for all SQL
```

---

## ✨ You're Done!

Once the SQL runs successfully:
1. Your database is ready
2. Your app is configured
3. Just run `pnpm dev` and start using it!

The app will automatically:
- Create tracking IDs (AXL-XXXXXX)
- Store deliveries in Supabase
- Allow real-time tracking
- Let admins update status

---

## 🎓 Next Steps

1. ✅ Run the SQL (this page)
2. ✅ Start the app: `pnpm dev`
3. ✅ Create your first delivery
4. ✅ Track it in real-time
5. ✅ Test admin panel

**Happy Tracking! 🚚**
