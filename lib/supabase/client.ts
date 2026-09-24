import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = 'https://oeexjdkmwconsjyjvpia.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NqK4ipK1jds2eaPln0QvEg_4yyGy2YC';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
