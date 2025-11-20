import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Yetkilendirme gerekli' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Geçersiz kullanıcı' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { key_code } = await req.json();

    if (!key_code) {
      return new Response(
        JSON.stringify({ error: 'Key kodu gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Redeeming key:', { key_code, user_id: user.id });

    // Check if key exists and is valid
    const { data: keyData, error: keyError } = await supabaseClient
      .from('balance_keys')
      .select('*')
      .eq('key_code', key_code)
      .single();

    if (keyError || !keyData) {
      console.error('Key not found:', keyError);
      return new Response(
        JSON.stringify({ error: 'Geçersiz key kodu' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if key is already used
    if (keyData.used) {
      return new Response(
        JSON.stringify({ error: 'Bu key daha önce kullanılmış' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if key is expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Bu key\'in süresi dolmuş' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark key as used
    const { error: updateKeyError } = await supabaseClient
      .from('balance_keys')
      .update({
        used: true,
        used_by: user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', keyData.id);

    if (updateKeyError) {
      console.error('Error updating key:', updateKeyError);
      return new Response(
        JSON.stringify({ error: 'Key güncellenirken hata oluştu' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user balance
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profil bilgisi alınamadı' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = profile?.balance || 0;
    const newBalance = parseFloat(currentBalance.toString()) + parseFloat(keyData.amount.toString());

    const { error: balanceError } = await supabaseClient
      .from('profiles')
      .update({ balance: newBalance })
      .eq('user_id', user.id);

    if (balanceError) {
      console.error('Error updating balance:', balanceError);
      return new Response(
        JSON.stringify({ error: 'Bakiye güncellenirken hata oluştu' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Balance updated successfully:', { user_id: user.id, amount: keyData.amount, new_balance: newBalance });

    return new Response(
      JSON.stringify({ 
        success: true, 
        amount: keyData.amount,
        new_balance: newBalance,
        message: `${keyData.amount} TL bakiye hesabınıza eklendi!`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in redeem-balance-key function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Key kullanılırken hata oluştu: ' + errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});