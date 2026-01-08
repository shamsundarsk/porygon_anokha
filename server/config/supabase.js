const { createClient } = require('@supabase/supabase-js')

// Supabase configuration for server-side operations
const supabaseUrl = process.env.SUPABASE_URL || 'https://qflkxzqpuvtggzdpqfho.supabase.com'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGt4enFwdXZ0Z2d6ZHBxZmhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg2MDkxMiwiZXhwIjoyMDgzNDM2OTEyfQ.7JmZRto3cW6EzvCDnoj6w9HaSqrJWQ_nMXzMl_mtWFA'

// Create Supabase client with service role key for server operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

module.exports = { supabase }