import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Detect if we should use the mock client (missing or placeholder credentials)
const isMissingEnv = !supabaseUrl || !supabaseAnonKey || 
  supabaseUrl.includes('your_') || 
  supabaseAnonKey.includes('your_') || 
  supabaseUrl.includes('your-project') || 
  supabaseAnonKey.includes('your_anon_key_here');

// Seed mock data if localStorage is empty
const STORAGE_KEY = 'axl_mock_deliveries';
const seedMockData = () => {
  if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
    const initialData = [
      {
        id: '1',
        tracking_id: 'AXL-000001',
        sender_name: 'John Doe',
        receiver_name: 'Jane Smith',
        pickup_location: 'New York, NY',
        destination: 'Los Angeles, CA',
        phone: '+1 (555) 123-4567',
        sender_phone: '+1 (555) 222-3333',
        receiver_phone: '+1 (555) 123-4567',
        item_description: 'Electronics',
        price: 120,
        package_type: 'standard',
        status: 'in_transit',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 3600000).toISOString()   // 1 hour ago
      },
      {
        id: '2',
        tracking_id: 'AXL-000002',
        sender_name: 'Sarah Connor',
        receiver_name: 'John Connor',
        pickup_location: 'Chicago, IL',
        destination: 'Miami, FL',
        phone: '+1 (555) 987-6543',
        sender_phone: '+1 (555) 777-8888',
        receiver_phone: '+1 (555) 987-6543',
        item_description: 'Documents',
        price: 45,
        package_type: 'fragile',
        status: 'processing',
        created_at: new Date(Date.now() - 3600000).toISOString(),  // 1 hour ago
        updated_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        tracking_id: 'AXL-000003',
        sender_name: 'Bruce Wayne',
        receiver_name: 'Clark Kent',
        pickup_location: 'Gotham City',
        destination: 'Metropolis',
        phone: '+1 (555) 111-2222',
        sender_phone: '+1 (555) 333-4444',
        receiver_phone: '+1 (555) 111-2222',
        item_description: 'Materials',
        price: 0,
        package_type: 'hazardous',
        status: 'delivered',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 86400000).toISOString()  // 1 day ago
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  }
};

if (isMissingEnv) {
  console.warn(
    '⚠️ Supabase credentials are not configured or are set to placeholders.\n' +
    'The application is running in MOCK DATABASE SANDBOX MODE using localStorage.'
  );
  seedMockData();
}

// In-memory event bus for real-time subscription notifications
const listeners = new Set();
const notifyListeners = () => {
  listeners.forEach(cb => {
    try { cb(); } catch (err) { console.error('Subscription error:', err); }
  });
};

class MockQueryBuilder {
  constructor(table) {
    this.table = table;
    this.operation = 'select'; // 'select', 'insert', 'update', 'delete'
    this.payload = null;
    this.filters = [];
    this.orderConfig = null;
    this.isSingle = false;
  }

  select(columns) {
    this.operation = 'select';
    return this;
  }

  insert(rows) {
    this.operation = 'insert';
    this.payload = rows;
    return this;
  }

  update(fields) {
    this.operation = 'update';
    this.payload = fields;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column, value) {
    this.filters.push((row) => String(row[column]).toLowerCase() === String(value).toLowerCase());
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderConfig = { column, ascending };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (this.operation === 'insert') {
      const rows = this.payload || [];
      const newRows = rows.map(row => ({
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'processing',
        ...row
      }));
      const updatedData = [...newRows, ...data];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      
      // Notify in-process realtime listeners
      setTimeout(() => notifyListeners(), 10);
      
      return { data: newRows, error: null };
    }

    if (this.operation === 'update') {
      const fields = this.payload || {};
      let updatedRows = [];
      const updatedData = data.map(row => {
        const matches = this.filters.every(filter => filter(row));
        if (matches) {
          const updatedRow = {
            ...row,
            ...fields,
            updated_at: new Date().toISOString()
          };
          updatedRows.push(updatedRow);
          return updatedRow;
        }
        return row;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      
      // Notify in-process realtime listeners
      setTimeout(() => notifyListeners(), 10);
      
      return { data: updatedRows, error: null };
    }

    if (this.operation === 'delete') {
      const remainingData = data.filter(row => !this.filters.every(filter => filter(row)));
      const deletedRows = data.filter(row => this.filters.every(filter => filter(row)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingData));

      setTimeout(() => notifyListeners(), 10);

      return { data: deletedRows, error: null };
    }

    // Default: select
    let result = data.filter(row => this.filters.every(filter => filter(row)));

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      result.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA < valB) return ascending ? -1 : 1;
        if (valA > valB) return ascending ? 1 : -1;
        return 0;
      });
    }

    if (this.isSingle) {
      if (result.length === 0) {
        return { 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        };
      }
      return { data: result[0], error: null };
    }

    return { data: result, error: null };
  }

  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const mockSupabase = {
  isMock: true,
  from(table) {
    return new MockQueryBuilder(table);
  },
  channel(name) {
    let activeCallback = null;
    return {
      on(event, filter, callback) {
        activeCallback = callback;
        listeners.add(callback);
        return this;
      },
      subscribe() {
        return {
          unsubscribe() {
            if (activeCallback) {
              listeners.delete(activeCallback);
            }
          }
        };
      }
    };
  }
};

export const supabase = isMissingEnv 
  ? mockSupabase 
  : createClient(supabaseUrl, supabaseAnonKey)
