import { supabase } from "@/integrations/supabase/client";

export { supabase };

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
