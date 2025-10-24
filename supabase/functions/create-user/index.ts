// Follow this guide to deploy the function:
// https://supabase.com/docs/guides/functions/deploy

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
// FIX: Replaced Deno.serve with an explicit import to resolve TypeScript errors
// in environments where the Deno global types might be outdated. This is a common
// compatibility pattern in Supabase Edge Functions.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// FIX: Add a type declaration for the Deno global. This allows TypeScript to understand
// Deno.env.get() without requiring a full Deno environment setup for type-checking,
// resolving the "Property 'env' does not exist" error.
declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // FIX: Changed the secret name to 'SERVICE_ROLE_KEY' to avoid the Supabase prefix restriction.
    // The user must now set a secret with this exact name in the dashboard.
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY');

    // **IMPROVEMENT**: Updated the check to look for the new secret name.
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Configuração incompleta no servidor: A variável de ambiente 'SERVICE_ROLE_KEY' não está definida para a função. Por favor, configure-a no painel do Supabase em Edge Functions > create-user > Secrets.");
    }
    
    const { email, password, role } = await req.json()

    // Create a Supabase client with the Service Role Key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // 1. Create the user in the auth schema
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Automatically confirm the user's email
    })

    if (authError) {
      // Handle specific errors, e.g., user already exists
      if (authError.message.includes('already exists')) {
          return new Response(JSON.stringify({ error: 'Um usuário com este email já existe.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          })
      }
      throw authError
    }

    const newUser = authData.user;
    if (!newUser) {
      throw new Error("User creation failed, no user returned.")
    }

    // 2. Insert the user's profile with the specified role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.id,
        role: role,
        // full_name and position can be left null to be filled by the user on first login
      })

    if (profileError) {
      // If profile insertion fails, it's best to delete the created auth user
      // to avoid an inconsistent state.
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw profileError;
    }

    return new Response(JSON.stringify({ message: 'User created successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})