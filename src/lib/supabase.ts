import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Direct Supabase client for the frontend.
// We avoid relying on Vite env here to prevent runtime issues when envs are not injected.
const SUPABASE_URL = "https://lhdwmdebrqezcyjnrbnb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZHdtZGVicnFlemN5am5yYm5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNTk0OTcsImV4cCI6MjA3OTczNTQ5N30.-WlCNqOUtKSi47Na7avIO2kXMpmYpA2zWi7tvyn_pQ8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Auth helpers
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Check if user is admin
export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('has_role', { _user_id: userId, _role: 'admin' });
  
  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
  
  return data === true;
};
