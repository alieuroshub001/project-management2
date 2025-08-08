import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

// For server components
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  return createClient<Database>(supabaseUrl, supabaseKey);
};

// For client components
export const createBrowserClient = () => {
  return createClientComponentClient<Database>();
};