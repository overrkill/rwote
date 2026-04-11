import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// DUMMY PAYMENT - Replace with actual Stripe integration
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { plan } = body // 'monthly' | 'lifetime'

    // DUMMY PAYMENT SIMULATION
    // In production, this would create a Stripe checkout session
    // For now, we just upgrade the user immediately

    const updateData: Record<string, unknown> = {
      subscription_status: 'paid'
    }

    if (plan === 'lifetime') {
      // For lifetime, set trial_ends_at to 100 years from now
      updateData.trial_ends_at = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
    }

    const { data: profile, error: updateError } = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: plan === 'lifetime' 
          ? 'Lifetime subscription activated!' 
          : 'Monthly subscription activated!',
        subscription_status: 'paid',
        can_sync: true,
        // In production, this would be a Stripe checkout URL
        checkout_url: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
