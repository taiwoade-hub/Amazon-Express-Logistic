# Amazon Express Logisics

A modern courier delivery and tracking system built with **React.js** and **Supabase**.  
It allows users to send packages, generate tracking IDs, and track deliveries in real-time.

---

## 🚀 Features

### 📦 User Features
- Send package delivery requests
- Upload up to **4** package images (auto-compressed)
- Auto-generated tracking IDs
- Real-time shipment tracking
- View delivery status updates with timeline visualization
- Modern delivery receipts for **Delivered** and **Cancelled** packages
- Receipt notifications (toast popup + saved inbox page)
- Pickup & destination country selectors
- Delivery notes + delivery notes language
- Pinned/frequent addresses (up to 10, saved per user when database table exists with safe local fallback)

### 🧑‍💼 Admin Features
- View all deliveries in a dashboard table
- Update shipment status in real-time
- Mark shipments as **cancelled** or **delivered** (generates receipts for users)
- Track delivery records and metadata

---

## 🧠 System Overview

The system is built around 3 core actions:

1. **Create Delivery** - Submit package details via form
2. **Store in Supabase** - Data persisted in PostgreSQL
3. **Track via Tracking ID** - Retrieve and monitor package status

---

## 🛠️ Tech Stack

- **Frontend**: React.js + Vite
- **Routing**: React Router
- **Backend**: Supabase (Database + Realtime)
- **Database**: PostgreSQL (via Supabase)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## 🗄️ Database Structure (Supabase)

### Table: `deliveries`

```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id TEXT UNIQUE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  receiver_name TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_country TEXT,
  destination TEXT NOT NULL,
  destination_country TEXT,
  phone TEXT NOT NULL,
  package_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  package_image TEXT,
  delivery_language TEXT,
  delivery_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

**Status Values**: `processing`, `picked_up`, `in_transit`, `delivered`, `cancelled`

**Package Images (`package_image`)**
- Supports up to **4** images
- Stored as either:
  - a single image string (backward compatible)
  - a JSON array string of images

### Table: `address_book` (Pinned Addresses)

```sql
CREATE TABLE address_book (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_email TEXT NOT NULL,
  label TEXT NOT NULL,
  location TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## Environment Variables

Create a `.env` file in the root directory (copy `.env.example`):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8787
VITE_ADMIN_EMAIL=admin@gmail.com
VITE_ADMIN_PASSWORD=##5351235admin
```

For Supabase: get the URL + anon key from your Supabase project settings.

Admin access:
- The admin user is determined by the `admin_email` value in the `app_settings` table (or `VITE_ADMIN_EMAIL` as a fallback for UI gating).
- There is no hardcoded admin password in the codebase.
- For local mock-only usage (no Supabase), `VITE_ADMIN_PASSWORD` can be used to allow an admin login on the client.

---

## 🔌 Supabase Setup

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. In the SQL Editor, run the schema creation script:
   - Copy the SQL from `src/lib/createSchema.sql`
   - Execute it in your Supabase SQL Editor
   - Run it again anytime you pull updates (it uses `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`)
4. Copy your API keys:
   - Go to Settings → API
   - Copy `Project URL` and `anon public` key
5. Add them to your `.env` file

---

## 📁 Project Structure

```
src/
 ├── components/
 │    ├── Navbar.jsx              # Navigation component
 │    ├── DeliveryReceipt.jsx     # Modern receipt UI
 │    └── ToastHost.jsx           # Toast notifications renderer
 │
 ├── pages/
 │    ├── Home.jsx                # Landing page
 │    ├── SendPackage.jsx          # Create delivery form
 │    ├── Track.jsx                # Track delivery by ID
 │    ├── Notifications.jsx        # Receipt inbox page
 │    └── Admin.jsx                # Admin dashboard
 │
 ├── lib/
 │    ├── supabaseClient.js        # Supabase client initialization
 │    └── createSchema.sql         # Database schema
 │    └── countries.js             # Country list for dropdowns
 │    └── deliveryLanguages.js     # Delivery-notes language list
 │    └── deliveryImages.js        # Multi-image helpers (max 4)
 │    └── companyProfile.js        # Site name/logo/contact details
 │
 ├── context/
 │    └── ToastContext.jsx         # In-app toast notifications
 │
 ├── App.jsx                        # Main app with routing
 ├── main.jsx                       # React entry point
 └── index.css                      # Global styles
```

---

## 📦 Core Workflow

### 1. Create Delivery
- User fills form on `/send`
- React validates and sends to Supabase
- Auto-generated tracking ID (format: `AXL-XXXXXX`)

### 2. Generate Tracking ID
```javascript
const random = Math.floor(Math.random() * 1000000)
const trackingId = `AXL-${String(random).padStart(6, '0')}`
// Example: AXL-839201
```

### 3. Track Package
- User enters tracking ID on `/track`
- System queries Supabase for delivery
- Display timeline with current status

### 4. Update Status (Admin)
- Admin navigates to `/admin`
- Table shows all deliveries
- Click edit icon to change status
- Real-time Supabase subscription updates data

---

## 📍 Tracking Status Flow

```
Processing → Picked Up → In Transit → Delivered
```

Timeline visualization shows active and completed steps.

---

## 🔔 Notifications & Receipt Inbox

- Toast notification appears when a tracked package becomes **Delivered** or **Cancelled**
- `/notifications` page keeps a history of receipts (delivered/cancelled) and updates in realtime
- Receipts include tracking code, sender/receiver details, notes, timestamps, and up to 4 photos

---

⚙️ Installation & Setup

```bash
# 1. Clone or install the project
git clone <your-repo>

# 2. Install dependencies
npm install

# 3. Create .env file with Supabase keys
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Set up database schema
# - Go to Supabase SQL Editor
# - Copy/paste src/lib/createSchema.sql
# - Execute

# 5. Start development server
npm run dev

# 6. Open http://localhost:5173 in your browser
```

---

## 🚀 Production Build

```bash
# Build for production
npm run build

# Preview build locally
npm run preview
```

Output will be in the `dist/` folder.

---

## 🎨 Design System

The app follows a clean, modern design with:
- Primary Color: `#0f172a` (dark navy)
- Background: `#ffffff` (white)
- Soft Background: `#f8fafc` (light blue-gray)
- Text Muted: `#64748b` (slate gray)
- Border: `#e2e8f0` (light gray)

All components use Tailwind CSS with rounded corners (`rounded-xl`), soft borders, and subtle hover effects.

---

## 🖼️ UI Updates

- Home page background image: `public/home-bg.jpg`
- Track page background image: `public/track-bg.jpg`
- Auth page (Sign In / Sign Up) is full-viewport, centered, and non-scrollable (Amazon-style)

---

## 🧪 Future Improvements

- Stronger Supabase RLS policies for production hardening
- Map-based delivery tracking
- SMS/Email notifications
- Rider assignment system
- Payment integration (Stripe)
- Mobile app version
- Real-time WebSocket updates
- Package weight/dimensions tracking
- Rate calculation based on distance/type

---

## ⬆️ Push Updates To GitHub

If you already pushed this project before, you just need to commit your new changes and push again:

```bash
git status
git add .
git commit -m "feat: receipts notifications inbox"
git push origin main
```

If GitHub asks for login, use a GitHub Personal Access Token (PAT) as the password.

## 🎯 Project Goal

To build a fast, simple, and scalable courier tracking system that can be expanded into a full logistics platform.

---

## 📄 License

This project is open-source and available for personal and commercial use.

---

## 👨‍💻 Support

For issues or questions:
1. Check the Supabase documentation: https://supabase.com/docs
2. Review the React Router docs: https://reactrouter.com
3. Check Tailwind CSS: https://tailwindcss.com

---

**Built with ❤️ for modern logistics**
