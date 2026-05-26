# API Reference - Amozon Express Logistics

All data operations use Supabase client-side. No custom backend required.

---

## Database Schema

### `deliveries` Table

```sql
id: UUID (Primary Key)
tracking_id: TEXT (Unique)
sender_name: TEXT
receiver_name: TEXT
pickup_location: TEXT
destination: TEXT
phone: TEXT
package_type: TEXT ('standard' | 'fragile' | 'perishable' | 'hazardous')
status: TEXT ('processing' | 'picked_up' | 'in_transit' | 'delivered')
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

---

## API Operations

### 1. Create Delivery

**Function**: `sendPackage()` in `SendPackage.jsx`

```javascript
const { error } = await supabase
  .from('deliveries')
  .insert([
    {
      tracking_id: 'AXL-123456',
      sender_name: 'John Doe',
      receiver_name: 'Jane Smith',
      pickup_location: 'New York, NY',
      destination: 'Los Angeles, CA',
      phone: '+1 (555) 123-4567',
      package_type: 'standard',
      status: 'processing'
    }
  ])
```

**Response**: 
- Success: Returns inserted object
- Error: `error.message` contains reason

**Tracking ID Format**: `AXL-XXXXXX` (random 6 digits)

---

### 2. Fetch All Deliveries

**Function**: `fetchDeliveries()` in `Admin.jsx`

```javascript
const { data, error } = await supabase
  .from('deliveries')
  .select('*')
  .order('created_at', { ascending: false })
```

**Response**: 
- `data`: Array of delivery objects
- `error`: null if successful

---

### 3. Get Single Delivery by Tracking ID

**Function**: `handleSearch()` in `Track.jsx`

```javascript
const { data, error } = await supabase
  .from('deliveries')
  .select('*')
  .eq('tracking_id', 'AXL-123456')
  .single()
```

**Response**:
- `data`: Single delivery object
- `error.code === 'PGRST116'`: Delivery not found
- `error`: Other database error

---

### 4. Update Delivery Status

**Function**: `handleSaveStatus()` in `Admin.jsx`

```javascript
const { error } = await supabase
  .from('deliveries')
  .update({
    status: 'in_transit',
    updated_at: new Date().toISOString()
  })
  .eq('id', 'delivery-uuid')
```

**Valid Status Values**:
- `processing` → Initial state
- `picked_up` → Picked up by courier
- `in_transit` → On the way
- `delivered` → Delivered to recipient

---

### 5. Real-time Subscription

**Function**: Used in `Admin.jsx`

```javascript
const subscription = supabase
  .channel('deliveries')
  .on('postgres_changes', {
    event: '*',           // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema: 'public',
    table: 'deliveries'
  }, (payload) => {
    // payload.new = new data after change
    // payload.old = old data before change
    // payload.eventType = 'INSERT' | 'UPDATE' | 'DELETE'
    console.log(payload)
  })
  .subscribe()
```

**Cleanup**:
```javascript
subscription.unsubscribe()
```

---

## Status Flow Diagram

```
┌──────────────┐
│  Processing  │  Initial state (order just placed)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Picked Up   │  Courier picked up package
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  In Transit  │  Package on the way
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Delivered   │  Package delivered
└──────────────┘
```

---

## Error Handling

### Common Errors

#### 1. Supabase Connection Failed
```javascript
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}
```
**Solution**: Check `.env` file has correct keys.

#### 2. Tracking ID Not Found
```javascript
if (error?.code === 'PGRST116') {
  // Delivery not found
}
```
**Solution**: Make sure tracking ID is spelled correctly.

#### 3. Duplicate Tracking ID
```javascript
if (error?.code === '23505') {
  // Unique constraint violation
}
```
**Solution**: Generate new ID (shouldn't happen with random generation).

#### 4. Unauthorized (Row Level Security)
```javascript
if (error?.code === '42501') {
  // RLS policy denied access
}
```
**Solution**: Check Supabase RLS policies allow public access.

---

## Data Types & Validation

### Tracking ID
- Format: `AXL-XXXXXX`
- Must be unique
- Auto-generated on creation

### Phone
- Required field
- Should include country code for international
- Example: `+1 (555) 123-4567`

### Package Type
- Dropdown selection:
  - `standard` - Regular packages
  - `fragile` - Breakable items (glasses, electronics)
  - `perishable` - Food, flowers, ice cream
  - `hazardous` - Chemicals, flammables, etc.

### Locations
- Free text input
- Should include City, State/Country
- Example: `New York, NY 10001`

---

## Timestamps

- `created_at`: Set automatically on insert
- `updated_at`: Set automatically, updated on any change

**Format**: ISO 8601 (e.g., `2024-01-15T10:30:45.123456+00:00`)

**Usage**:
```javascript
const dateObj = new Date(delivery.created_at)
const formatted = dateObj.toLocaleString() // Human-readable
```

---

## Row Level Security (RLS)

The `deliveries` table has public access policies:

```sql
-- Anyone can read
CREATE POLICY "Allow public read" ON deliveries
  FOR SELECT USING (true);

-- Anyone can insert
CREATE POLICY "Allow public insert" ON deliveries
  FOR INSERT WITH CHECK (true);

-- Anyone can update
CREATE POLICY "Allow public update" ON deliveries
  FOR UPDATE USING (true) WITH CHECK (true);
```

**Future Enhancement**: Add authentication to restrict access by user.

---

## Performance Tips

1. **Index on tracking_id**: Created for faster lookups
   ```sql
   CREATE INDEX idx_tracking_id ON deliveries(tracking_id);
   ```

2. **Pagination** (if needed):
   ```javascript
   const { data } = await supabase
     .from('deliveries')
     .select('*')
     .range(0, 10)  // First 10 records
   ```

3. **Filtering** (if needed):
   ```javascript
   const { data } = await supabase
     .from('deliveries')
     .select('*')
     .eq('status', 'in_transit')
   ```

---

## Testing API Calls

### In Browser Console
```javascript
import { supabase } from './lib/supabaseClient.js'

// Test read
const { data } = await supabase.from('deliveries').select('*')
console.log(data)
```

### Using cURL
```bash
curl -X GET 'https://your-project.supabase.co/rest/v1/deliveries' \
  -H 'apikey: your_anon_key' \
  -H 'Content-Type: application/json'
```

---

## Rate Limits

Supabase free tier limits:
- 100,000 API requests/month
- Realtime connections: 200
- Database size: 500MB

For production, upgrade to a paid plan.

---

## Security

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend. Only use:
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅

---

## Related Files

- `src/lib/supabaseClient.js` - Client initialization
- `src/lib/createSchema.sql` - Database schema
- `src/pages/SendPackage.jsx` - Create operation
- `src/pages/Track.jsx` - Read operation
- `src/pages/Admin.jsx` - Update + realtime operations

---

**For more info**: https://supabase.com/docs/reference/javascript
