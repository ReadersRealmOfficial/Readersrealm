import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kfvgvjqxmaoondltteea.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmdmd2anF4bWFvb25kbHR0ZWVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjMzODcsImV4cCI6MjA5MTIzOTM4N30.gSnqqT8FClNmlXvM53Z-NJyqb-q0QtRSe_wxhYMNScQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
