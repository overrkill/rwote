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

    // Check subscription status
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    const now = new Date()
    const trialEnded = profile?.trial_ends_at && new Date(profile.trial_ends_at) < now
    const canSync = profile?.subscription_status === 'paid' || 
                    (profile?.subscription_status === 'trial' && !trialEnded)

    if (!canSync) {
      return new Response(
        JSON.stringify({ 
          error: 'Subscription required',
          can_sync: false,
          subscription_status: profile?.subscription_status || 'trial'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { notes: localNotes, last_synced_at } = body

    // Get notes updated since last_synced_at (from server)
    let serverQuery = supabaseClient
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (last_synced_at) {
      serverQuery = serverQuery.gt('updated_at', new Date(last_synced_at).toISOString())
    }

    const { data: serverNotes, error: fetchError } = await serverQuery

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process local notes (upsert to server)
    if (localNotes && Array.isArray(localNotes)) {
      for (const note of localNotes) {
        const noteData = {
          user_id: user.id,
          local_id: note.id?.toString(),
          text: note.text,
          note: note.note || null,
          tag: note.tag || 'uncategorized',
          date: note.date,
          pinned: note.pinned || false,
          updated_at: new Date(note.updated_at || Date.now()).toISOString()
        }

        if (note.deleted) {
          // Soft delete
          const { error } = await supabaseClient
            .from('notes')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('local_id', note.id?.toString())
          
          if (error) console.error('Delete error:', error)
        } else if (note.id) {
          // Check if exists by local_id
          const { data: existing } = await supabaseClient
            .from('notes')
            .select('id, updated_at')
            .eq('user_id', user.id)
            .eq('local_id', note.id?.toString())
            .single()

          if (existing) {
            // Update if local is newer
            const serverTime = new Date(existing.updated_at).getTime()
            const localTime = new Date(note.updated_at || 0).getTime()
            
            if (localTime > serverTime) {
              const { error } = await supabaseClient
                .from('notes')
                .update(noteData)
                .eq('id', existing.id)
              
              if (error) console.error('Update error:', error)
            }
          } else {
            // Insert new
            const { error } = await supabaseClient
              .from('notes')
              .insert(noteData)
            
            if (error) console.error('Insert error:', error)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        notes: serverNotes || [],
        server_time: Date.now(),
        can_sync: true
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
