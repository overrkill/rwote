// supabase.js — Supabase client configuration

const SUPABASE_URL = 'https://joqxsbboxmkpcizasdbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvcXhzYmJveG1rcGNpemFzZGJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjI2ODgsImV4cCI6MjA5MTQzODY4OH0.AlJh4bvWk_aMxHnWFg4xqZhY3UzbUclcKtLvkBARAQo';

const API_BASE = `${SUPABASE_URL}/functions/v1`;

let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

async function signUp(email, password, name) {
  const client = getSupabaseClient();
  
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || ''
      }
    }
  });
  
  return { data, error };
}

async function signIn(email, password) {
  const client = getSupabaseClient();
  
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password
  });
  
  return { data, error };
}

async function signOut() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  return { error };
}

async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data: { user }, error } = await client.auth.getUser();
  return { user, error };
}

async function getSession() {
  const client = getSupabaseClient();
  const { data: { session }, error } = await client.auth.getSession();
  return { session, error };
}
