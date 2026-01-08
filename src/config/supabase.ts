import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qflkxzqpuvtggzdpqfho.supabase.com'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmbGt4enFwdXZ0Z2d6ZHBxZmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NjA5MTIsImV4cCI6MjA4MzQzNjkxMn0.0yTRt37OPoiXuDYOJE1rUTvc7X3LQYux5-vj6uYO8P4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)