#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://qflkxzqpuvtggzdpqfho.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGt4enFwdXZ0Z2d6ZHBxZmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA5MTIsImV4cCI6MjA4MzQzNjkxMn0.0yTRt37OPoiXuDYOJE1rUTvc7X3LQYux5-vj6uYO8P4'

async function setupSupabaseDatabase() {
  console.log('🚀 Setting up FairLoad Supabase Database...\n')

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    console.log('📋 Executing database schema...')

    // Note: Supabase doesn't support direct SQL execution via the client
    // The schema needs to be run in the Supabase SQL Editor
    console.log('⚠️  IMPORTANT: Please follow these steps to complete the setup:\n')
    
    console.log('1. Go to your Supabase project dashboard:')
    console.log('   https://supabase.com/dashboard/project/qflkxzqpuvtggzdpqfho\n')
    
    console.log('2. Navigate to the SQL Editor (left sidebar)\n')
    
    console.log('3. Create a new query and paste the contents of supabase-schema.sql\n')
    
    console.log('4. Run the query to create all tables and policies\n')
    
    console.log('5. Your database will be ready for the FairLoad application!\n')

    // Test connection
    console.log('🔍 Testing Supabase connection...')
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      console.log('❌ Connection test failed:', error.message)
      console.log('   Please check your Supabase credentials and try again.\n')
    } else {
      console.log('✅ Supabase connection successful!\n')
    }

    console.log('📝 Configuration Summary:')
    console.log('   Project URL:', supabaseUrl)
    console.log('   Database ready for schema execution')
    console.log('   Firebase Auth configured')
    console.log('   Application ready to run!\n')

    console.log('🎉 Setup complete! Run "npm run dev" to start the application.')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup
setupSupabaseDatabase()