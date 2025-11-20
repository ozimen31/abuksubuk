import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the user's IP address from the request
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim() 
      || req.headers.get('x-real-ip')
      || 'unknown';

    console.log('Client IP:', clientIP);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from the JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Invalid user token');
    }

    const { type } = await req.json();

    // Check if this is a signup or login
    if (type === 'signup') {
      // Update registration IP
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          registration_ip: clientIP,
          last_login_ip: clientIP,
          last_login_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error on signup:', updateError);
        throw updateError;
      }

      console.log('Signup IP tracked for user:', user.id);
    } else {
      // Update last login IP and time
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          last_login_ip: clientIP,
          last_login_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Update error on login:', updateError);
        throw updateError;
      }

      console.log('Login IP tracked for user:', user.id);
    }

    return new Response(
      JSON.stringify({ success: true, ip: clientIP }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});