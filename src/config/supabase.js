const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL || 'https://acrpnbgpfrirfsdecipt.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseConnectionString = process.env.DATABASE_URL || 'postgresql://postgres:99147Jov@@db.acrpnbgpfrirfsdecipt.supabase.co:5432/postgres';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
  supabase,
  supabaseConnectionString
}; 