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

    const { amount, user_id, listing_id } = await req.json();

    console.log('Payment request:', { amount, user_id, listing_id });

    if (!amount || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Tutar ve kullanıcı ID gerekli' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Shopier settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('site_settings')
      .select('*')
      .in('key', ['shopier_api_key', 'shopier_api_secret']);

    if (settingsError) {
      console.error('Settings error:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Ayarlar yüklenemedi: ' + settingsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Settings data:', settings);

    const apiKey = settings?.find(s => s.key === 'shopier_api_key')?.value;
    const apiSecret = settings?.find(s => s.key === 'shopier_api_secret')?.value;

    console.log('Shopier credentials:', { 
      hasApiKey: !!apiKey, 
      hasApiSecret: !!apiSecret,
      apiKeyLength: apiKey?.length || 0,
      apiSecretLength: apiSecret?.length || 0
    });

    if (!apiKey || !apiSecret || apiKey.trim() === '' || apiSecret.trim() === '') {
      console.error('Missing Shopier credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Shopier API ayarları eksik veya geçersiz. Lütfen admin panelinden düzgün API key ve secret girin.',
          details: {
            hasKey: !!apiKey,
            hasSecret: !!apiSecret,
            keyEmpty: apiKey?.trim() === '',
            secretEmpty: apiSecret?.trim() === ''
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info for better tracking
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('username, phone')
      .eq('user_id', user_id)
      .single();

    // Shopier API integration - with improved error handling
    const orderIdSuffix = listing_id ? `${listing_id}-${Date.now()}` : `BAL-${Date.now()}`;
    const description = listing_id ? `İlan #${listing_id} ödemesi` : `Bakiye yükleme`;
    
    const shopierPayload = {
      api_key: apiKey.trim(),
      api_secret: apiSecret.trim(),
      order_id: `ORDER-${orderIdSuffix}`,
      amount: parseFloat(amount),
      currency: 'TRY',
      buyer_name: profile?.username || 'Müşteri',
      buyer_email: 'musteri@example.com', // Shopier için gerekli
      buyer_phone: profile?.phone || '5555555555',
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopier-callback`,
      description: description,
    };

    console.log('Sending to Shopier:', { 
      ...shopierPayload, 
      api_key: `${apiKey.substring(0, 4)}***`, 
      api_secret: '***'
    });

    // Try different Shopier endpoints
    const endpoints = [
      'https://www.shopier.com/api/v2/payment/create',
      'https://www.shopier.com/api/payment/create',
      'https://api.shopier.com/payment/create'
    ];

    let shopierResponse;
    let lastError: any;

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        shopierResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(shopierPayload),
        });

        if (shopierResponse.ok) {
          break;
        }
      } catch (e) {
        lastError = e;
        console.error(`Endpoint ${endpoint} failed:`, e);
      }
    }

    if (!shopierResponse) {
      return new Response(
        JSON.stringify({ 
          error: 'Shopier API\'ye bağlanılamadı. Tüm endpoint\'ler başarısız.',
          details: lastError?.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Shopier response status:', shopierResponse.status);
    const responseText = await shopierResponse.text();
    console.log('Shopier raw response:', responseText);
    
    let shopierData;
    try {
      shopierData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Shopier response:', e);
      return new Response(
        JSON.stringify({ 
          error: 'Shopier API yanıtı geçersiz format',
          details: responseText,
          hint: 'API bilgilerinizi kontrol edin. Shopier test modunda olabilir.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Shopier parsed response:', JSON.stringify(shopierData, null, 2));

    // Check various response formats Shopier might return
    const paymentUrl = shopierData.payment_url || 
                      shopierData.data?.payment_url || 
                      shopierData.url ||
                      shopierData.payment_page;
    
    if (shopierResponse.ok && paymentUrl) {
      return new Response(
        JSON.stringify({ payment_url: paymentUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorMsg = shopierData.error || 
                      shopierData.message || 
                      shopierData.data?.message ||
                      shopierData.errors?.[0]?.message ||
                      'Shopier ödeme oluşturulamadı. API bilgilerinizi kontrol edin.';
      
      console.error('Shopier error:', {
        status: shopierResponse.status,
        error: errorMsg,
        fullResponse: shopierData
      });
      
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          details: shopierData,
          status: shopierResponse.status,
          hint: 'Admin panelinden Shopier API key ve secret bilgilerinizi kontrol edin. Test modu için doğru endpoint kullanıldığından emin olun.'
        }),
        { status: shopierResponse.status || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in shopier-payment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Ödeme işlemi başarısız: ' + errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
