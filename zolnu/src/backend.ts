import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { File } from 'expo-file-system';
import type { SocialState, Post } from './model';
import { edge } from './model';
import { SERVICE_URL, SERVICE_PUBLISHABLE_KEY } from './service-config';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || SERVICE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || SERVICE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key, { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;
if (Platform.OS !== 'web' && supabase) AppState.addEventListener('change', state => state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh());
export function requireBackend() { if (!supabase) throw new Error('يحتاج إعداد السيرفر أولًا.'); return supabase; }
export async function loadRemote(uid: string): Promise<SocialState> {
  const db = requireBackend();
  const claimed = await db.rpc('claim_company_account');
  if (claimed.error) throw new Error('تعذّر تحميل ميزات الحساب. تأكد من تنفيذ ترقيات السيرفر.');
  const results = await Promise.all([
    db.from('profiles').select('*').limit(200), db.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('likes').select('*').limit(10000), db.from('follows').select('*').limit(10000),
    db.from('saves').select('*').eq('user_id', uid), db.from('comments').select('*').order('created_at').limit(2000),
    db.from('blocks').select('*').eq('user_id', uid), db.from('reports').select('post_id').eq('user_id', uid),
    db.from('company_accounts').select('*'), db.from('verification_grants').select('*').limit(10000), db.from('verification_campaigns').select('*').limit(200), db.from('account_verifications').select('*').eq('active',true),
  ]);
  for (const result of results) if (result.error) throw new Error(result.error.message);
  const [users, posts, likes, follows, saves, comments, blocks, reports, companies, grants, campaigns, verified] = results.map(x => x.data || []);
  const mediaUrl = (path: string | null) => path ? db.storage.from('media').getPublicUrl(path).data.publicUrl : undefined;
  return { profiles: users.map((u: any) => ({ id: u.id, username: u.username, name: u.name, bio: u.bio, color: u.color, frame: u.frame, identityVerifiedAt: verified.find((v: any) => v.user_id === u.id)?.verified_at, avatarUri: mediaUrl(u.avatar_path), bannerUri: mediaUrl(u.banner_path), badge: companies.some((c: any) => c.user_id === u.id) ? 'company' : grants.some((g: any) => g.user_id === u.id) ? 'founder' : undefined, verifiedAt: grants.find((g: any) => g.user_id === u.id)?.awarded_at })), posts: posts.map((p: any) => ({ id: p.id, userId: p.user_id, caption: p.caption, uri: mediaUrl(p.storage_path) || '', kind: p.kind, createdAt: p.created_at })), likes: likes.map((l: any) => edge(l.user_id, l.post_id)), follows: follows.map((f: any) => edge(f.user_id, f.target_id)), saves: saves.map((s: any) => edge(s.user_id, s.post_id)), comments: comments.map((c: any) => ({ id: c.id, userId: c.user_id, postId: c.post_id, body: c.body, createdAt: c.created_at })), blocked: blocks.map((b: any) => edge(b.user_id, b.target_id)), reports: reports.map((r: any) => r.post_id), campaigns: campaigns.map((c: any) => ({ id: c.id, postId: c.post_id, startsAt: c.starts_at, endsAt: c.ends_at, active: c.active })) };
}
export async function remoteToggle(table: 'likes' | 'saves' | 'follows', uid: string, target: string, remove: boolean) {
  const db = requireBackend(); const field = table === 'follows' ? 'target_id' : 'post_id';
  const result = remove ? await db.from(table).delete().eq('user_id', uid).eq(field, target) : await db.from(table).insert({ user_id: uid, [field]: target });
  if (result.error) throw new Error(result.error.message);
}
export async function uploadPost(uid: string, caption: string, asset?: { uri: string; kind: 'image' | 'video'; mimeType?: string }): Promise<string> {
  const db = requireBackend(); let media_url: string | null = null; let storagePath: string | null = null;
  if (asset) {
    const bytes = Platform.OS === 'web' ? await (await fetch(asset.uri)).arrayBuffer() : await new File(asset.uri).arrayBuffer();
    if (bytes.byteLength > 25 * 1024 * 1024) throw new Error('الحد الأقصى للملف ٢٥ ميگابايت.');
    const ext = asset.kind === 'video' ? 'mp4' : 'jpg'; storagePath = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await db.storage.from('media').upload(storagePath, bytes, { contentType: asset.mimeType || (asset.kind === 'video' ? 'video/mp4' : 'image/jpeg'), upsert: false });
    if (error) throw new Error(error.message);
    media_url = db.storage.from('media').getPublicUrl(storagePath).data.publicUrl;
  }
  const { data, error } = await db.from('posts').insert({ user_id: uid, caption: caption.trim(), media_url, storage_path: storagePath, kind: asset?.kind ?? 'image' }).select('id').single();
  if (error) { if (storagePath) await db.storage.from('media').remove([storagePath]); throw new Error(error.message); }
  return data.id;
}
export async function uploadProfileImage(uid: string, uri: string, slot: 'avatar' | 'banner') {
 const db = requireBackend(); const bytes = Platform.OS === 'web' ? await (await fetch(uri)).arrayBuffer() : await new File(uri).arrayBuffer();
 if (bytes.byteLength > 3 * 1024 * 1024) throw new Error('صورة الحساب أو الغلاف بحد أقصى ٣ ميگابايت.');
 const path = `${uid}/${slot}-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
 const uploaded = await db.storage.from('media').upload(path, bytes, { contentType: 'image/jpeg' });
 if (uploaded.error) throw new Error(uploaded.error.message);
 return path;
}
export async function deleteRemotePost(post: Post) {
  const db = requireBackend();
  const { data, error } = await db.from('posts').select('storage_path').eq('id', post.id).single();
  if (error) throw new Error(error.message);
  const removed = await db.from('posts').delete().eq('id', post.id); if (removed.error) throw new Error(removed.error.message);
  if (data?.storage_path) { const result = await db.storage.from('media').remove([data.storage_path]); if (result.error) throw new Error('حُذف المنشور، لكن تعذّر حذف ملفه من التخزين. راجع لوحة الإدارة.'); }
}
