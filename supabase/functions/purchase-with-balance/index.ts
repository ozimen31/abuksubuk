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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { listing_id } = await req.json();

    if (!listing_id) {
      throw new Error('listing_id is required');
    }

    console.log('Purchase request:', { user_id: user.id, listing_id });

    // Get listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) {
      throw new Error('İlan bulunamadı');
    }

    // Check if listing is available
    if (listing.status !== 'active') {
      throw new Error('İlan satışta değil');
    }

    if (listing.stock && listing.stock <= 0) {
      throw new Error('Stok tükendi');
    }

    // Can't buy own listing
    if (listing.user_id === user.id) {
      throw new Error('Kendi ilanınızı satın alamazsınız');
    }

    // Get buyer profile
    const { data: buyerProfile, error: buyerError } = await supabaseClient
      .from('profiles')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (buyerError || !buyerProfile) {
      throw new Error('Kullanıcı profili bulunamadı');
    }

    // Check if buyer has enough balance
    if (buyerProfile.balance < listing.price) {
      throw new Error('Yetersiz bakiye');
    }

    // Get commission rate
    const { data: commissionSetting } = await supabaseClient
      .from('site_settings')
      .select('value')
      .eq('key', 'commission_rate')
      .single();

    const commissionRate = commissionSetting?.value ? parseFloat(commissionSetting.value) : 0.10;
    const commission = listing.price * commissionRate;
    const sellerAmount = listing.price - commission;

    console.log('Transaction details:', {
      price: listing.price,
      commission,
      sellerAmount,
      commissionRate,
    });

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Start transaction: Update buyer balance
    const { error: buyerUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: buyerProfile.balance - listing.price })
      .eq('user_id', user.id);

    if (buyerUpdateError) {
      console.error('Buyer balance update error:', buyerUpdateError);
      throw new Error('Bakiye güncellenemedi');
    }

    // Update seller balance
    const { data: sellerProfile, error: sellerFetchError } = await supabaseAdmin
      .from('profiles')
      .select('balance, total_sales')
      .eq('user_id', listing.user_id)
      .single();

    if (sellerFetchError) {
      // Rollback buyer balance
      await supabaseAdmin
        .from('profiles')
        .update({ balance: buyerProfile.balance })
        .eq('user_id', user.id);
      
      throw new Error('Satıcı profili bulunamadı');
    }

    const { error: sellerUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        balance: sellerProfile.balance + sellerAmount,
        total_sales: (sellerProfile.total_sales || 0) + 1
      })
      .eq('user_id', listing.user_id);

    if (sellerUpdateError) {
      // Rollback buyer balance
      await supabaseAdmin
        .from('profiles')
        .update({ balance: buyerProfile.balance })
        .eq('user_id', user.id);
      
      console.error('Seller balance update error:', sellerUpdateError);
      throw new Error('Satıcı bakiyesi güncellenemedi');
    }

    // Create order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: listing.user_id,
        listing_id: listing.id,
        price: listing.price,
        commission: commission,
        status: 'paid',
        payment_method: 'balance',
      })
      .select()
      .single();

    if (orderError) {
      // Rollback balances
      await supabaseAdmin
        .from('profiles')
        .update({ balance: buyerProfile.balance })
        .eq('user_id', user.id);
      
      await supabaseAdmin
        .from('profiles')
        .update({ 
          balance: sellerProfile.balance,
          total_sales: sellerProfile.total_sales
        })
        .eq('user_id', listing.user_id);
      
      console.error('Order creation error:', orderError);
      throw new Error('Sipariş oluşturulamadı');
    }

    // Update listing stock or status
    if (listing.stock && listing.stock > 0) {
      const newStock = listing.stock - 1;
      await supabaseAdmin
        .from('listings')
        .update({
          stock: newStock,
          status: newStock === 0 ? 'sold' : 'active'
        })
        .eq('id', listing.id);
    } else {
      await supabaseAdmin
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', listing.id);
    }

    console.log('Purchase completed successfully:', { order_id: order.id });

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        message: 'Satın alma işlemi başarılı',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Purchase error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Satın alma işlemi başarısız';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});