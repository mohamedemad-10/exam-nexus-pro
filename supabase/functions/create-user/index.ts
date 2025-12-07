import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a unique 8-character alphanumeric ID
function generateUserId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0, O, 1, I
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization")?.split(" ")[1];
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { password, full_name, phone, class: userClass } = await req.json();

    if (!password || !full_name) {
      return new Response(JSON.stringify({ error: "Password and full name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique user_id for login
    let userId = generateUserId();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (!existing) break;
      userId = generateUserId();
      attempts++;
    }

    // Create a fake email using the user_id for Supabase Auth
    const fakeEmail = `${userId.toLowerCase()}@exampro.local`;

    // Create user with generated email
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, user_id: userId },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with user_id, phone, and class
    if (userData.user) {
      await supabaseAdmin
        .from("profiles")
        .update({ phone, full_name, user_id: userId, class: userClass || null })
        .eq("id", userData.user.id);
    }

    console.log("User created successfully:", userData.user?.id, "with login ID:", userId);

    return new Response(JSON.stringify({ success: true, user: userData.user, loginId: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in create-user function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
