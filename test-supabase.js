import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://trcbdmocvhtpnarnwrei.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyY2JkbW9jdmh0cG5hcm53cmVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNzQ0NzEsImV4cCI6MjA5NDg1MDQ3MX0.LlXLF0ZBBptXF3ms1BXHHCsMPklxcTPq40uAJtu2NMM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  console.log('Testing connection to Supabase...')
  try {
    const { data, error } = await supabase.from('deliveries').select('id').limit(1)
    if (error) {
      console.error('Error connecting to Supabase:', error)
    } else {
      console.log('Success! Connection established. Deliveries count check result:', data)
    }
  } catch (err) {
    console.error('Exception caught:', err)
  }
}

test()
