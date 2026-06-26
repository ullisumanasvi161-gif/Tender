import { testConnection, seedDefaultUsers } from './supabase.js';

// Replaces the old MongoDB connectDB.
// Now tests Supabase connection and seeds default users if needed.
const connectDB = async () => {
  await testConnection();
  await seedDefaultUsers();
};

export default connectDB;
