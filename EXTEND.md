# How to Extend Amozon Express - Feature Roadmap 🚀

This guide shows how to add features to the app.

---

## Adding a New Field to Deliveries

### Example: Add "Weight" Field

**Step 1: Update Database**
```sql
-- Run in Supabase SQL Editor
ALTER TABLE deliveries ADD COLUMN weight_kg DECIMAL(10,2);
```

**Step 2: Update Form (SendPackage.jsx)**
```javascript
// In formData state
const [formData, setFormData] = useState({
  // ... existing fields ...
  weight_kg: '' // NEW
})

// In form JSX
<div>
  <label className="block text-sm font-medium text-primary mb-2">
    Weight (kg)
  </label>
  <input
    type="number"
    name="weight_kg"
    value={formData.weight_kg}
    onChange={handleChange}
    required
    placeholder="0.5"
    className="w-full px-4 py-3 border border-border rounded-xl..."
  />
</div>
```

**Step 3: Update Database Insert**
```javascript
// In handleSubmit function
const { error: insertError } = await supabase
  .from('deliveries')
  .insert([
    {
      ...formData,
      weight_kg: parseFloat(formData.weight_kg), // NEW
      // ... rest of data
    }
  ])
```

**Step 4: Display in Track Page**
```javascript
// In Track.jsx delivery card
<div>
  <p className="text-sm text-text-muted mb-1">Weight</p>
  <p className="font-medium text-primary">{delivery.weight_kg} kg</p>
</div>
```

**Step 5: Show in Admin Table**
```javascript
// In Admin.jsx, add column header
<th className="text-left py-4 px-4 font-medium text-primary">Weight</th>

// In table row
<td className="py-4 px-4 text-text-muted">{delivery.weight_kg} kg</td>
```

---

## Adding Authentication

### Step 1: Enable Supabase Auth
```sql
-- Go to Supabase → Authentication → Providers
-- Enable Email provider
```

### Step 2: Create Auth Context
```javascript
// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user)
      }
    )

    return () => listener?.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Step 3: Create Login Page
```javascript
// src/pages/Login.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      navigate('/')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="max-w-md mx-auto mt-20">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full px-4 py-2 border rounded mb-4"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full px-4 py-2 border rounded mb-4"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-2 rounded"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Step 4: Update App.jsx
```javascript
// Wrap with AuthProvider
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* existing routes */}
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

---

## Adding Email Notifications

### Step 1: Create Supabase Function
```sql
-- Supabase → Edge Functions → Create new function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const client = new Client({
  from: "noreply@amozon-express.com",
  apiKey: Deno.env.get("RESEND_API_KEY"),
})

serve(async (req) => {
  const { delivery_id, email, status } = await req.json()

  await client.emails.send({
    to: email,
    subject: `Your package status: ${status}`,
    html: `<p>Your package ${delivery_id} is now ${status}</p>`,
  })

  return new Response("Email sent!")
})
```

### Step 2: Call on Status Update
```javascript
// In Admin.jsx, after update
await supabase
  .functions
  .invoke('send-notification', {
    body: {
      delivery_id: delivery.id,
      email: delivery.receiver_email,
      status: editingStatus
    }
  })
```

---

## Adding Payment Integration (Stripe)

### Step 1: Install Stripe
```bash
pnpm add @stripe/react-stripe-js @stripe/js
```

### Step 2: Create Checkout Component
```javascript
// src/components/PaymentForm.jsx
import { loadStripe } from "@stripe/js"
import { Elements } from "@stripe/react-stripe-js"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY)

export default function PaymentForm({ deliveryId, amount }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setProcessing(true)

    const { token } = await stripe.createToken(
      elements.getElement(CardElement)
    )

    // Send token to backend to process payment
    const response = await fetch('/api/process-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.id,
        amount,
        deliveryId
      })
    })

    setProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={processing} type="submit">
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}
```

---

## Adding Map Tracking

### Step 1: Install Maps Library
```bash
pnpm add react-simple-maps d3-geo topojson-client
```

### Step 2: Create Map Component
```javascript
// src/components/TrackingMap.jsx
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'

export default function TrackingMap({ pickup, destination }) {
  return (
    <ComposableMap>
      <Geographies geography={"/countries-110m.json"}>
        {({ geographies }) =>
          geographies.map((geo) => (
            <Geography key={geo.rsmKey} geography={geo} />
          ))
        }
      </Geographies>
      <Marker coordinates={pickup}>
        <circle r={8} fill="#0f172a" />
      </Marker>
      <Marker coordinates={destination}>
        <circle r={8} fill="#22c55e" />
      </Marker>
    </ComposableMap>
  )
}
```

### Step 3: Use in Track Page
```javascript
// In Track.jsx
<TrackingMap
  pickup={delivery.pickup_location}
  destination={delivery.destination}
/>
```

---

## Adding Search & Filters (Admin)

### Current Admin Table
```javascript
// Admin.jsx currently shows all deliveries
const { data } = await supabase
  .from('deliveries')
  .select('*')
  .order('created_at', { ascending: false })
```

### Add Filter
```javascript
// In Admin.jsx, add state
const [filterStatus, setFilterStatus] = useState('')
const [searchText, setSearchText] = useState('')

// Update fetch
const query = supabase.from('deliveries').select('*')

if (filterStatus) {
  query = query.eq('status', filterStatus)
}

if (searchText) {
  query = query.or(
    `tracking_id.ilike.%${searchText}%,
     sender_name.ilike.%${searchText}%,
     receiver_name.ilike.%${searchText}%`
  )
}

const { data } = await query.order('created_at', { ascending: false })

// Add UI controls
<div className="mb-4 flex gap-2">
  <input
    placeholder="Search..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    className="px-4 py-2 border rounded"
  />
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className="px-4 py-2 border rounded"
  >
    <option value="">All Status</option>
    <option value="processing">Processing</option>
    <option value="picked_up">Picked Up</option>
    <option value="in_transit">In Transit</option>
    <option value="delivered">Delivered</option>
  </select>
</div>
```

---

## Adding User History

### Step 1: Add History Page
```javascript
// src/pages/History.jsx
import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function History() {
  const { user } = useContext(AuthContext)
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user])

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('deliveries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setDeliveries(data || [])
    setLoading(false)
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">My Deliveries</h1>

      {loading ? (
        <p>Loading...</p>
      ) : deliveries.length === 0 ? (
        <p className="text-gray-500">No deliveries yet</p>
      ) : (
        <div className="grid gap-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="border rounded p-4">
              <p className="font-bold">{delivery.tracking_id}</p>
              <p>To: {delivery.receiver_name}</p>
              <p>Status: {delivery.status}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
```

### Step 2: Update SendPackage to Set user_id
```javascript
// When inserting, add user_id
const { error } = await supabase
  .from('deliveries')
  .insert([
    {
      ...formData,
      user_id: user.id, // NEW
      // ... other fields
    }
  ])
```

---

## Adding Notifications (Toast)

### Step 1: Install Toast Library
```bash
pnpm add react-hot-toast
```

### Step 2: Use in Components
```javascript
import toast from 'react-hot-toast'

// Success
toast.success('Package created!')

// Error
toast.error('Failed to update status')

// Loading
toast.loading('Creating package...')
```

---

## Adding Analytics

### Step 1: Create Analytics Table
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT,
  delivery_id UUID,
  user_id UUID,
  timestamp TIMESTAMP DEFAULT now()
);
```

### Step 2: Log Events
```javascript
// In SendPackage.jsx, after successful creation
await supabase
  .from('analytics')
  .insert([{
    event_type: 'package_created',
    delivery_id: newDelivery.id,
    user_id: user?.id
  }])
```

### Step 3: Create Dashboard
```javascript
// src/pages/Analytics.jsx
const { data: stats } = await supabase
  .from('analytics')
  .select('event_type, count')
  .eq('event_type', 'package_created')

return (
  <div>
    <h1>Total Packages: {stats[0].count}</h1>
  </div>
)
```

---

## Environment Variables for Extensions

Add to `.env`:
```
# Email
VITE_SMTP_KEY=...

# Stripe
VITE_STRIPE_KEY=...

# Maps
VITE_MAPS_API_KEY=...

# Analytics
VITE_ANALYTICS_KEY=...
```

---

## Testing Extensions

```javascript
// Quick test in browser console
import { supabase } from './lib/supabaseClient'

// Test new field
const { data } = await supabase
  .from('deliveries')
  .select('*')
  .limit(1)

console.log(data[0]) // See all fields including new ones
```

---

## Deployment After Changes

```bash
# 1. Update database (if schema changed)
# - Go to Supabase SQL Editor
# - Run migration

# 2. Install new dependencies (if any)
pnpm install

# 3. Build
pnpm build

# 4. Test
pnpm preview

# 5. Deploy
# Vercel: git push
# Netlify: Drag dist/ folder
```

---

## Common Extensions Done Easy

| Feature | Time | Difficulty |
|---------|------|-----------|
| Add field | 10 min | Easy ⭐ |
| Authentication | 30 min | Medium ⭐⭐ |
| Email notifications | 20 min | Medium ⭐⭐ |
| Payment (Stripe) | 45 min | Hard ⭐⭐⭐ |
| Maps | 30 min | Medium ⭐⭐ |
| Analytics | 25 min | Medium ⭐⭐ |
| Search/Filter | 15 min | Easy ⭐ |

---

## Getting Help

- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com
- Stripe Docs: https://stripe.com/docs

---

**The best part: All extensions work without changing the core MVP! 🎉**

**Keep shipping! 🚀**
