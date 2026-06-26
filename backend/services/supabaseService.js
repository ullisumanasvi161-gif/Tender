import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

let supabaseClient = null;
const bucketName = 'tender-documents';

if (isSupabaseConfigured) {
  try {
    console.log('[SUPABASE STORAGE] Initializing Supabase client with URL:', supabaseUrl);
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        transport: ws,
      },
    });

    // Proactively check/create private storage bucket named: "tender-documents"
    const ensureBucketExists = async () => {
      try {
        const { data: buckets, error: getBucketsError } = await supabaseClient.storage.listBuckets();
        if (getBucketsError) {
          console.error('[SUPABASE STORAGE] Failed to list buckets:', getBucketsError.message);
          return;
        }

        const bucketExists = buckets.some(b => b.name === bucketName);
        if (!bucketExists) {
          console.log(`[SUPABASE STORAGE] Bucket "${bucketName}" not found. Creating private bucket...`);
          const { error: createError } = await supabaseClient.storage.createBucket(bucketName, {
            public: false,
          });
          if (createError) {
            console.error('[SUPABASE STORAGE] Error creating storage bucket:', createError.message);
          } else {
            console.log(`[SUPABASE STORAGE] Bucket "${bucketName}" created successfully.`);
          }
        } else {
          console.log(`[SUPABASE STORAGE] Verified storage bucket "${bucketName}" exists.`);
        }
      } catch (err) {
        console.error('[SUPABASE STORAGE] Storage bucket guarantee failed:', err.message);
      }
    };

    ensureBucketExists();
  } catch (err) {
    console.error('[SUPABASE STORAGE] Initialization failed:', err.message);
  }
} else {
  console.warn('[SUPABASE STORAGE] Environment variables missing. Running in local mock file upload mode.');
}

// Storage helpers
export const uploadToSupabase = async (filePathInBucket, fileBuffer, fileType) => {
  if (!supabaseClient) throw new Error('Supabase client is not configured.');

  const { data, error } = await supabaseClient.storage
    .from(bucketName)
    .upload(filePathInBucket, fileBuffer, {
      contentType: fileType,
      upsert: true,
    });

  if (error) throw error;
  return data;
};

export const deleteFromSupabase = async (filePathInBucket) => {
  if (!supabaseClient) throw new Error('Supabase client is not configured.');

  const { data, error } = await supabaseClient.storage
    .from(bucketName)
    .remove([filePathInBucket]);

  if (error) throw error;
  return data;
};

export const generateSignedUrl = async (filePathInBucket, expirySeconds = 3600, download = false) => {
  if (!supabaseClient) throw new Error('Supabase client is not configured.');

  const options = download ? { download: true } : {};
  const { data, error } = await supabaseClient.storage
    .from(bucketName)
    .createSignedUrl(filePathInBucket, expirySeconds, options);

  if (error) throw error;
  return data.signedUrl;
};

export { supabaseClient as supabase };
