import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { type, data } = body

    console.log('Webhook received:', type)

    switch (type) {
      case 'checkout.session.completed': {
        const customerId = data?.object?.customer
        const email = data?.object?.customer_details?.email

        if (customerId) {
          const { error } = await supabaseClient
            .from('profiles')
            .update({ 
              subscription_status: 'paid',
              stripe_customer_id: customerId
            })
            .eq('stripe_customer_id', customerId)

          if (error) console.error('Error updating profile:', error)
        }
        break
      }

      case 'customer.subscription.updated': {
        const customerId = data?.object?.customer
        const status = data?.object?.status // active, canceled, past_due, etc.

        let subscriptionStatus = 'paid'
        if (status === 'canceled' || status === 'unpaid') {
          subscriptionStatus = 'expired'
        }

        const { error } = await supabaseClient
          .from('profiles')
          .update({ subscription_status: subscriptionStatus })
          .eq('stripe_customer_id', customerId)

        if (error) console.error('Error updating subscription:', error)
        break
      }

      case 'customer.subscription.deleted': {
        const customerId = data?.object?.customer

        const { error } = await supabaseClient
          .from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('stripe_customer_id', customerId)

        if (error) console.error('Error deleting subscription:', error)
        break
      }

      default:
        console.log('Unhandled webhook type:', type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
