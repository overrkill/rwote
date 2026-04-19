import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function decodeJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload;
  } catch {
    return null;
  }
}

function toISOString(value: any): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') {
    if (value.includes('T') || value.includes('-')) {
      return new Date(value).toISOString();
    }
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
    return new Date().toISOString();
  }
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'No authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const payload = decodeJWT(token)
    
    if (!payload || !payload.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    const userId = payload.sub

    const body = await req.json()
    const { note } = body

    if (!note) {
      return new Response(
        JSON.stringify({ error: 'No note provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    const noteId = note.id || note.local_id

    let tagsArray: string[] = [];
    if (note.tags) {
      if (Array.isArray(note.tags)) {
        tagsArray = note.tags;
      } else if (typeof note.tags === 'string') {
        tagsArray = note.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
      }
    }

    const noteData = {
      id: noteId,
      user_id: userId,
      title: note.title || 'Untitled',
      content: note.content || '',
      tags: tagsArray,
      pinned: note.pinned || false,
      created_at: note.created_at ? toISOString(note.created_at) : new Date().toISOString(),
      updated_at: toISOString(note.updated_at)
    }

    const { data, error } = await supabaseClient
      .from('notes_v2')
      .upsert(noteData, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, note: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})