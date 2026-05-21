# 📸 SUPABASE SETUP - VISUAL GUIDE

## 🔗 Your Project Link
**https://app.supabase.com** (login with your email)

---

## 📍 STEP 1: Open Your Project

**Location:** Top left of Supabase dashboard
- You should see your projects listed
- Find: `trcbdmocvhtpnarnwrei`
- Click on it

```
Dashboard
├── Create New Project
├── trcbdmocvhtpnarnwrei  ← Click HERE
└── [Other projects if any]
```

---

## 📍 STEP 2: Go to SQL Editor

**Location:** Left sidebar

```
Left Sidebar:
├── Home
├── Editor
├── SQL Editor  ← Click HERE
├── Table Editor
├── Storage
├── Authentication
└── Settings
```

---

## 📍 STEP 3: Create New Query

**Location:** Top right of SQL Editor

```
SQL Editor
┌─────────────────────────┐
│ New Query (blue button) ← Click HERE
└─────────────────────────┘
│ [New tab opens]
```

---

## 📍 STEP 4: Paste SQL Code

**In the empty SQL editor:**

1. Right-click → Paste
2. OR Ctrl+V

Your SQL should look like:
```
CREATE TABLE IF NOT EXISTS public.deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id text NOT NULL UNIQUE,
  ...
```

---

## 📍 STEP 5: Run the Query

**Location:** Top right of SQL editor

```
[SQL CODE HERE]

┌─────────────────────────┐
│  Run (blue button)  ← Click HERE
│  (or press Ctrl+Enter)
└─────────────────────────┘
```

---

## ✅ SUCCESS INDICATORS

After clicking **Run**, you should see:

```
Query Results:
✅ Executed successfully
✅ 0 rows returned (that's good!)
✅ No errors shown
```

---

## 📊 VERIFY IT WORKED

### Go to Table Editor

**Location:** Left sidebar → Table Editor

You should see:
```
Tables
├── _realtime (system table)
├── _supabase_migrations (system table)
└── deliveries ← NEW TABLE! Click it
```

### Check the Table

Click `deliveries` table:
```
Columns visible:
├── id (uuid)
├── tracking_id (text)
├── sender_name (text)
├── receiver_name (text)
├── pickup_location (text)
├── destination (text)
├── phone (text)
├── package_type (text)
├── status (text)
├── created_at (timestamp)
└── updated_at (timestamp)

Data: (empty - that's normal!)
```

---

## 🔒 VERIFY SECURITY POLICIES

**Location:** Left sidebar → Authentication → Policies

You should see 4 policies listed:
```
Policies on "public.deliveries"
├── enable_read_all (SELECT)
├── enable_insert_all (INSERT)
├── enable_update_all (UPDATE)
└── enable_delete_all (DELETE)
```

All should be **ENABLED** (green toggle)

---

## 📈 VERIFY INDEXES

**Location:** Left sidebar → SQL Editor → Run this query:**

```sql
SELECT * FROM pg_indexes WHERE tablename = 'deliveries';
```

You should see 3 indexes:
```
idx_deliveries_tracking_id
idx_deliveries_status
idx_deliveries_created_at
```

---

## 🔌 VERIFY CONNECTION

**Your .env file already has:**
```
VITE_SUPABASE_URL=https://trcbdmocvhtpnarnwrei.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (your key)
```

This is already configured! ✅

---

## 🚀 NEXT: START YOUR APP

Once all verifications pass:

```bash
# In your project folder:
pnpm dev

# Then open:
http://localhost:5173
```

---

## 📍 WHERE EVERYTHING IS

| Feature | Location |
|---------|----------|
| Your data | Table Editor → deliveries |
| Policies | Authentication → Policies |
| SQL queries | SQL Editor |
| Project settings | Settings (bottom left) |
| API keys | Settings → API |
| Documentation | Help (?) icon |

---

## ✨ YOU'RE READY!

Once you see the table with columns, your database is ready!

Just go to http://localhost:5173 and start tracking packages! 🚚

---

## 🐛 TROUBLESHOOTING

### "Query failed" error
→ Check SQL syntax (copy from `SQL_QUICK_COPY.md`)

### "Table already exists" error
→ That's OK! The SQL has `IF NOT EXISTS`
→ Just run it again, no problem

### Can't find my project
→ Make sure you're logged in at supabase.com
→ Check email in top right

### No tables showing
→ Wait 10 seconds and refresh the page
→ Or go to SQL Editor and refresh there

---

## 🎓 FINAL STEP

1. ✅ Run the SQL (this page)
2. ✅ Verify the table (this page)
3. ✅ Run `pnpm dev`
4. ✅ Visit http://localhost:5173
5. ✅ Create your first delivery
6. ✅ Done! 🎉
