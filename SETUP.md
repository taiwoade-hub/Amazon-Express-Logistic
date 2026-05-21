# Quick Setup Guide - Amozon Express Logistics

Follow these steps to get the app running with your Supabase database.

---

## Step 1: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Give it a name and password
   - Wait for it to initialize (2-3 minutes)

2. **Create the Database Table**
   - In your Supabase dashboard, click "SQL Editor" (left sidebar)
   - Click "New Query"
   - Copy and paste the entire contents of `src/lib/createSchema.sql`
   - Click "Run"
   - You should see a success message

3. **Get Your API Keys**
   - In your Supabase dashboard, click "Settings" (bottom left)
   - Click "API"
   - Copy these values:
     - `Project URL` → `VITE_SUPABASE_URL`
     - `anon public` (under API Keys) → `VITE_SUPABASE_ANON_KEY`

---

## Step 2: Configure Environment Variables

1. **Create `.env` file**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your Supabase keys**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

---

## Step 3: Install and Run

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start the dev server**
   ```bash
   pnpm dev
   ```

3. **Open in browser**
   - The terminal will show the URL (usually `http://localhost:5173`)
   - Copy and paste it into your browser

---

## Step 4: Test the App

1. **Home Page (`/`)**
   - Should display hero section with features
   - Try the quick track input
   - Click "Send Package" button

2. **Send Package (`/send`)**
   - Fill in all fields
   - Click "Create Delivery"
   - You'll get a tracking ID like `AXL-123456`
   - Copy and save it

3. **Track Package (`/track`)**
   - Paste your tracking ID
   - Click "Track"
   - You should see your delivery details and status timeline

4. **Admin Dashboard (`/admin`)**
   - Should show a table of all deliveries
   - Click the edit icon next to a delivery
   - Change the status dropdown
   - Click the save icon to update
   - Status should change instantly

---

## Troubleshooting

### Issue: "VITE_SUPABASE_URL is not defined"
**Solution**: Make sure your `.env` file exists in the root directory with both keys set.

### Issue: "Tracking ID not found"
**Solution**: Make sure you:
1. Created a delivery first on the `/send` page
2. Copied the exact tracking ID
3. The database table was created successfully

### Issue: Admin page shows empty table
**Solution**:
1. Go to `/send` and create at least one delivery
2. Refresh the admin page
3. If still empty, check Supabase SQL Editor to confirm the `deliveries` table exists

### Issue: Can't connect to Supabase
**Solution**:
1. Double-check your API keys in `.env`
2. Make sure they're in the right order (URL first, then anon key)
3. No extra spaces or quotes

---

## File Structure

```
src/
├── components/Navbar.jsx       # Top navigation
├── pages/
│   ├── Home.jsx               # Landing page
│   ├── SendPackage.jsx        # Create delivery
│   ├── Track.jsx              # Track by ID
│   └── Admin.jsx              # Admin panel
├── lib/
│   ├── supabaseClient.js      # Supabase setup
│   └── createSchema.sql       # Database schema
├── App.jsx                     # Routing
├── main.jsx                    # Entry point
└── index.css                   # Tailwind styles
```

---

## Next Steps

Once everything is working:

1. **Customize Colors** - Edit `tailwind.config.js` theme colors
2. **Add More Fields** - Modify the form in `SendPackage.jsx` and update the database schema
3. **Deploy** - Use Vercel, Netlify, or your preferred platform
4. **Authentication** - Add Supabase Auth for user accounts

---

## API Routes (Built-in)

All API calls go directly to Supabase through the client:

- **Create**: `supabase.from('deliveries').insert()`
- **Read**: `supabase.from('deliveries').select()`
- **Update**: `supabase.from('deliveries').update()`
- **Realtime**: `supabase.channel('deliveries').on('*')`

No custom backend needed! Supabase handles everything.

---

## Support

- Supabase Docs: https://supabase.com/docs
- React Router Docs: https://reactrouter.com
- Tailwind CSS: https://tailwindcss.com
- Vite: https://vitejs.dev

---

**You're all set! Happy shipping! 🚚**
