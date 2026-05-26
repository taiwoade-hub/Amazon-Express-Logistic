# Quick Start in 5 Minutes ⚡

## The Fastest Way to Get Running

### 1️⃣ Supabase Setup (3 min)
```
1. Go to https://supabase.com → Sign up/Login
2. Create new project (give it any name)
3. Wait for initialization
4. Go to SQL Editor
5. Run the schema from: src/lib/createSchema.sql
6. Go to Settings → API
7. Copy: Project URL and anon key
```

### 2️⃣ Create `.env` File (1 min)
```bash
# In project root, create .env with:
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

### 3️⃣ Run It (1 min)
```bash
pnpm install
pnpm dev
```

Done! 🎉

---

## Test It in 30 Seconds

1. Open http://localhost:5173
2. Click "Send Package" → Fill form → Get tracking ID
3. Click "Track" → Paste ID → See status
4. Click "Admin" → Click edit icon → Change status → Save

---

## File Overview (What Does What)

| File | Purpose |
|------|---------|
| `src/pages/Home.jsx` | Landing page with hero & features |
| `src/pages/SendPackage.jsx` | Create delivery form |
| `src/pages/Track.jsx` | Track by tracking ID |
| `src/pages/Admin.jsx` | Admin dashboard with updates |
| `src/App.jsx` | Routing setup |
| `src/lib/supabaseClient.js` | Database connection |
| `tailwind.config.js` | Colors & styling |

---

## 4 Pages Your App Has

### 1. Home (`/`)
- Hero section
- Quick track input
- Features showcase

### 2. Send Package (`/send`)
- Sender name, receiver name
- Pickup & destination
- Phone & package type
- Creates tracking ID

### 3. Track (`/track`)
- Search by tracking ID
- Shows delivery details
- Timeline with status progression

### 4. Admin (`/admin`)
- Table of all deliveries
- Edit status dropdown
- Real-time updates

---

## API in 3 Lines

```javascript
// Create
await supabase.from('deliveries').insert([{...}])

// Read
await supabase.from('deliveries').select('*')

// Update
await supabase.from('deliveries').update({...}).eq('id', id)
```

---

## Status Values (Copy-Paste)

```
processing  → Just created
picked_up   → Courier picked it up
in_transit  → On the way
delivered   → Delivered!
```

---

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| "Missing env vars" | Check `.env` file exists with correct keys |
| "Tracking not found" | Make sure you created a delivery first |
| "Admin page empty" | Create a delivery on `/send` first |
| Server won't start | Run `pnpm install` first |

---

## Customization Ideas (Easy)

1. **Change Colors** → Edit `tailwind.config.js`
2. **Add Logo** → Replace in `Navbar.jsx`
3. **Change Text** → Edit any `.jsx` file
4. **Add Fields** → Update form + database schema

---

## Deploy (Pick One)

### Vercel (Easiest)
```bash
npm install -g vercel
vercel
# Follow prompts, add env vars in Settings
```

### Netlify
```bash
npm run build
# Drag dist/ folder to Netlify
# Add env vars in Site Settings
```

### Docker
```bash
docker build -t amozon-express .
docker run -p 3000:3000 amozon-express
```

---

## Need Help?

- **Setup issues**: Read `SETUP.md`
- **API reference**: Read `API.md`
- **Full docs**: Read `README.md`

---

## Congratulations! 🎉

You now have a working courier tracking system with:
- ✅ Database (Supabase)
- ✅ Frontend (React)
- ✅ Real-time updates
- ✅ Admin panel

**Next: Ship it to production!**

---

### Command Cheatsheet
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm install      # Install dependencies
```

**Happy shipping! 🚚**
