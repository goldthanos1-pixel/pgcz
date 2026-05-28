// supabase/client.ts
import { createClient } from '@supabase/supabase-js';

// Supabase URL and anon public key should be defined in environment variables.
// In Next.js, you can expose them via NEXT_PUBLIC_ prefix.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper for RPC call to increment points
export async function incrementPoints(userId: string, amount: number, type: string, description = '') {
  const { data, error } = await supabase.rpc('increment_points', {
    target_user_id: userId,
    amount: amount,
    txn_type: type,
    txn_description: description,
  });
  if (error) throw error;
  return data;
}
