import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[SUPABASE] SUPABASE_URL and SUPABASE_KEY must be set in .env');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    // Node.js 20 lacks native WebSocket — use the 'ws' package
    transport: ws,
  },
});

// Test connection by performing a lightweight query
export const testConnection = async () => {
  try {
    console.log('[SUPABASE] Testing connection to Supabase...');
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      throw error;
    }
    console.log('[SUPABASE] Connected successfully to Supabase PostgreSQL.');
  } catch (err) {
    console.error('[SUPABASE] Connection test failed:', err.message);
    console.warn('[SUPABASE] Make sure you have run the schema.sql in your Supabase SQL Editor.');
  }
};

// Seed default users on first boot if the users table is empty
export const seedDefaultUsers = async () => {
  try {
    const { data: existing, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[SUPABASE] Could not check users table for seeding:', error.message);
      return;
    }

    if (existing && existing.length > 0) {
      console.log('[SUPABASE] Users already exist. Skipping seed.');
      return;
    }

    console.log('[SUPABASE] No users found. Seeding default Admin and Staff accounts...');

    const adminHash = await bcrypt.hash('adminpassword', 10);
    const staffHash = await bcrypt.hash('staffpassword', 10);

    const { error: insertError } = await supabase.from('users').insert([
      {
        name: 'Avinash Kanaparthi (Admin)',
        email: 'admin@avinashinfra.com',
        password: adminHash,
        role: 'admin',
      },
      {
        name: 'Rohan Sharma (Staff)',
        email: 'staff@avinashinfra.com',
        password: staffHash,
        role: 'staff',
      },
    ]);

    if (insertError) {
      console.error('[SUPABASE] Failed to seed users:', insertError.message);
    } else {
      console.log('[SUPABASE] Database seeded successfully:');
      console.log('  - Admin: admin@avinashinfra.com / adminpassword');
      console.log('  - Staff: staff@avinashinfra.com / staffpassword');
    }
  } catch (err) {
    console.error('[SUPABASE] Seed error:', err.message);
  }
};
