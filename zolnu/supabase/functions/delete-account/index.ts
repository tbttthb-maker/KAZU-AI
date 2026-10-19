import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
Deno.serve(async req => {
 const respond = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
 if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
 if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });
 try {
  const url = Deno.env.get('SUPABASE_URL')!;
  const authorization = req.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) return respond(401, { error: 'Sign in first' });
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error } = await admin.auth.getUser(authorization.slice(7));
  if (error || !user) return respond(401, { error: 'Invalid session' });
  // All app uploads use exactly one directory level: <verified user id>/<filename>.
  // Delete files first: a failed attempt remains authenticated and can be retried.
  for (;;) {
   const { data, error: listError } = await admin.storage.from('media').list(user.id, { limit: 100 });
   if (listError) throw listError;
   if (!data?.length) break;
   const { error: removeError } = await admin.storage.from('media').remove(data.map(f => `${user.id}/${f.name}`));
   if (removeError) throw removeError;
  }
  const deleted = await admin.auth.admin.deleteUser(user.id);
  if (deleted.error) throw deleted.error; // FK cascades remove profile, posts and social data.
  return respond(200, { deleted: true });
 } catch { return respond(500, { error: 'Account deletion could not finish. Please retry or contact support.' }); }
});
