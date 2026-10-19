import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { Asset } from 'expo-asset';
import { DEMO_ID, Profile, Post, SocialState, edge, initialState, toggle, validatePost, validateUsername, hydrateDemo, applyDemoLike, Frame } from './model';
import { deleteRemotePost, loadRemote, remoteToggle, requireBackend, supabase, uploadPost, uploadProfileImage } from './backend';

export type Media = { uri: string; kind: 'image' | 'video'; mimeType?: string };
const STORE = 'zolnu-demo-v1';
export function useSocial() {
  const [state, setState] = useState<SocialState>(initialState); const [uid, setUid] = useState(DEMO_ID);
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [message, setMessage] = useState(''); const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const online = uid !== DEMO_ID;
  function tell(m: string) { setMessage(m); clearTimeout(timer.current); timer.current = setTimeout(() => setMessage(''), 4500); }
  async function run(action: () => Promise<void>) { if (busyRef.current) return false; busyRef.current = true; setBusy(true); try { await action(); return true; } catch (e) { tell(e instanceof Error ? e.message : (e as any)?.message || 'تعذّر إكمال العملية. جرّب مرة ثانية.'); return false; } finally { busyRef.current = false; setBusy(false); } }
  useEffect(() => { let live = true; (async () => { try { const saved = await AsyncStorage.getItem(STORE); if (saved && live) { const data = JSON.parse(saved); if (Array.isArray(data.posts) && Array.isArray(data.profiles)) setState(hydrateDemo(data)); } } catch { if (live) tell('تعذّر تحميل البيانات المحفوظة.'); } finally { if (live) setReady(true); } })(); return () => { live = false; clearTimeout(timer.current); }; }, []);
  useEffect(() => { if (ready && !online) AsyncStorage.setItem(STORE, JSON.stringify(state)).catch(() => tell('تعذّر حفظ التغييرات؛ تأكد من مساحة الجهاز.')); }, [state, ready, online]);
  useEffect(() => { if (!ready || !supabase) return; let live = true; let generation = 0;
    async function restore(id?: string) { const token = ++generation; try { const next = id ? await loadRemote(id) : hydrateDemo(JSON.parse(await AsyncStorage.getItem(STORE) || '{}')); if (live && token === generation) { setState(next); setUid(id || DEMO_ID); } } catch { if (live) tell('تعذّر تحميل الحساب. تحقق من اتصال السيرفر وأعد تسجيل الدخول.'); } }
    supabase.auth.getSession().then(({ data }) => { if (data.session) void restore(data.session.user.id); });
    const { data } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(() => void restore(session?.user.id), 0); });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, [ready]);
  async function refresh() { if (online) setState(await loadRemote(uid)); }
  async function changeEdge(table: 'likes' | 'saves' | 'follows', id: string) { return run(async () => { const k = edge(uid, id); if (online) { await remoteToggle(table, uid, id, state[table].includes(k)); if (table === 'likes') { await refresh(); return; } } setState(p => table === 'likes' ? applyDemoLike(p, uid, id) : ({ ...p, [table]: toggle(p[table], k) })); }); }
  async function pick(): Promise<Media | undefined> { let media: Media | undefined; await run(async () => { const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: .8, videoMaxDuration: 60 }); if (!r.canceled) { const a = r.assets[0]; if (a.fileSize && a.fileSize > 25 * 1024 * 1024) throw new Error('اختار ملف أقل من ٢٥ ميگابايت.'); if (a.duration && a.duration > 60000) throw new Error('مدة الفيديو القصوى دقيقة واحدة.'); media = { uri: a.uri, kind: a.type === 'video' ? 'video' : 'image', mimeType: a.mimeType }; } }); return media; }
  async function publish(caption: string, media?: Media, campaignHours?: number) { return run(async () => { validatePost(caption, media?.uri); let campaignFailed=false; if (online) { const postId = await uploadPost(uid, caption, media); if (campaignHours && state.profiles.find(p => p.id === uid)?.badge === 'company') { const r = await requireBackend().rpc('start_verification_campaign', { p_post_id: postId, p_hours: campaignHours }); if (r.error) campaignFailed=true; } await refresh(); } else { let uri = media?.uri || '';
    if (media && Platform.OS !== 'web') { const dir = new Directory(Paths.document, 'zolnu'); dir.create({ idempotent: true, intermediates: true }); const file = new File(dir, `${Date.now()}.${media.kind === 'video' ? 'mp4' : 'jpg'}`); new File(media.uri).copy(file); uri = file.uri; }
    if (media && Platform.OS === 'web' && media.kind === 'image') { const blob = await (await fetch(uri)).blob(); if (blob.size > 3 * 1024 * 1024) throw new Error('بالتجربة على المتصفح، اختار صورة أقل من ٣ ميگابايت.'); uri = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); }); }
    const post: Post = { id: `local-${Date.now()}`, userId: uid, caption: caption.trim(), uri, kind: media?.kind || 'image', createdAt: new Date().toISOString() }; setState(p => ({ ...p, posts: [post, ...p.posts] })); } tell(campaignFailed ? 'نُشر المنشور، لكن تعذّر بدء الحملة. فعّلها من لوحة الشركة.' : online ? 'تم نشر لحظتك.' : 'انضاف منشورك للتجربة على جهازك.'); }); }
  async function addComment(postId: string, body: string) { return run(async () => { body = body.trim(); if (!body || body.length > 500) throw new Error('اكتب تعليق من حرف إلى ٥٠٠ حرف.'); if (online) { const { error } = await requireBackend().from('comments').insert({ user_id: uid, post_id: postId, body }); if (error) throw error; await refresh(); } else setState(p => ({ ...p, comments: [...p.comments, { id: String(Date.now()), userId: uid, postId, body, createdAt: new Date().toISOString() }] })); }); }
  async function pickProfileImage(slot: 'avatar' | 'banner') {
    let result: string | undefined;
    await run(async () => { const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: slot === 'avatar', preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible, aspect: slot === 'avatar' ? [1, 1] : [3, 1], quality: .8 }); if (picked.canceled) return; const asset = picked.assets[0]; if (asset.fileSize && asset.fileSize > 3 * 1024 * 1024) throw new Error('اختار صورة أقل من ٣ ميگابايت.'); result = asset.uri; });
    return result;
  }
  async function editProfile(fields: Pick<Profile, 'name' | 'username' | 'bio'> & { frame?: Frame; avatarUri?: string; bannerUri?: string }) { return run(async () => {
    if (!validateUsername(fields.username)) throw new Error('اسم المستخدم: ٣–٢٤ حرف إنجليزي أو رقم أو نقطة أو شرطة سفلية.');
    if (!fields.name.trim()) throw new Error('اكتب اسمك.');
    const current = state.profiles.find(p => p.id === uid)!;
    if (fields.frame === 'founder' && !current.badge) throw new Error('إطار المؤسس ينفتح بعد الحصول على شارة المؤسس.');
    fields = { ...fields, name: fields.name.trim(), username: fields.username.toLowerCase() };
    if (fields.username === 'zolnu' && current.badge !== 'company') throw new Error('اسم الشركة محجوز.');
    const updates: Record<string, unknown> = { name: fields.name, username: fields.username, bio: fields.bio, frame: fields.frame || 'none' };
    const pendingPaths: string[] = [];
    for (const slot of ['avatar', 'banner'] as const) {
      const key = slot === 'avatar' ? 'avatarUri' : 'bannerUri'; const next = fields[key];
      if (!next || next === current[key]) continue;
      if (online) { const path = await uploadProfileImage(uid, next, slot); pendingPaths.push(path); updates[`${slot}_path`] = path; }
      else if (Platform.OS !== 'web') { const dir = new Directory(Paths.document, 'zolnu'); dir.create({ idempotent: true, intermediates: true }); const file = new File(dir, `${slot}-${Date.now()}.jpg`); new File(next).copy(file); fields[key] = file.uri; }
      else { const blob = await (await fetch(next)).blob(); if (blob.size > 3 * 1024 * 1024) throw new Error('اختار صورة أقل من ٣ ميگابايت.'); fields[key] = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); }); }
    }
    if (online) { const r = await requireBackend().from('profiles').update(updates).eq('id', uid); if (r.error) { if (pendingPaths.length) await requireBackend().storage.from('media').remove(pendingPaths); throw r.error; } await refresh(); }
    else setState(p => ({ ...p, profiles: p.profiles.map(u => u.id === uid ? { ...u, ...fields } : u) }));
    tell('تم حفظ ملفك وإطاره وصورته.');
  }); }
  async function startCampaign(postId: string, hours = 48) { return run(async () => {
    if (online) { const r = await requireBackend().rpc('start_verification_campaign', { p_post_id: postId, p_hours: hours }); if (r.error) throw r.error; await refresh(); }
    else setState(p => ({ ...p, campaigns: [...p.campaigns.filter(c => c.postId !== postId), { id: 'launch-demo', postId, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + hours * 3600000).toISOString(), active: true }] }));
    tell(online ? 'بدأت حملة شارة المؤسس.' : 'بدأت الحملة التجريبية على جهازك.');
  }); }
  async function stopCampaign(id: string) { return run(async () => {
    if (online) { const r = await requireBackend().rpc('stop_verification_campaign', { p_campaign_id: id }); if (r.error) throw r.error; await refresh(); }
    else setState(p => ({ ...p, campaigns: p.campaigns.map(c => c.id === id ? { ...c, active: false } : c) }));
    tell('انتهى منح الشارات الجديدة. الشارات الممنوحة باقية.');
  }); }
  async function auth(email: string, password: string, signup: boolean) { return run(async () => { if (!email.trim() || password.length < 8) throw new Error('اكتب البريد وكلمة مرور من ٨ أحرف على الأقل.'); const db = requireBackend(); const r = signup ? await db.auth.signUp({ email: email.trim(), password }) : await db.auth.signInWithPassword({ email: email.trim(), password }); if (r.error) throw r.error; tell(signup && !r.data.session ? 'أكد حسابك من بريدك الإلكتروني، وبعدين سجّل الدخول.' : 'أهلًا بيك في زولنو.'); }); }
  async function moderate(post: Post, block: boolean) { return run(async () => { if (online) { const { error } = await requireBackend().from(block ? 'blocks' : 'reports').upsert(block ? { user_id: uid, target_id: post.userId } : { user_id: uid, post_id: post.id, reason: 'بلاغ من التطبيق' }, { onConflict: block ? 'user_id,target_id' : 'user_id,post_id' }); if (error) throw error; } setState(p => block ? { ...p, blocked: Array.from(new Set([...p.blocked, edge(uid, post.userId)])) } : { ...p, reports: Array.from(new Set([...p.reports, post.id])) }); tell(block ? 'تم حظر الحساب وإخفاء منشوراته.' : online ? 'تم تسجيل البلاغ للمراجعة بلوحة الإدارة.' : 'تم حفظ البلاغ محليًا ضمن التجربة.'); }); }
  async function remove(post: Post) { return run(async () => { if (post.userId !== uid) throw new Error('تگدر تحذف منشوراتك فقط.'); if (online) await deleteRemotePost(post); else if (Platform.OS !== 'web' && post.uri.startsWith(Paths.document.uri)) { const file = new File(post.uri); if (file.exists) file.delete(); } setState(p => ({ ...p, posts: p.posts.filter(x => x.id !== post.id), comments: p.comments.filter(c => c.postId !== post.id), likes: p.likes.filter(k => !k.endsWith(`|${post.id}`)), saves: p.saves.filter(k => !k.endsWith(`|${post.id}`)) })); tell('تم حذف المنشور.'); }); }
  async function unblock() { return run(async () => { if (online) { const { error } = await requireBackend().from('blocks').delete().eq('user_id', uid); if (error) throw error; } setState(p => ({ ...p, blocked: p.blocked.filter(k => !k.startsWith(`${uid}|`)) })); tell('تم إلغاء حظر الحسابات.'); }); }
  async function logout() { return run(async () => { const { error } = await requireBackend().auth.signOut(); if (error) throw error; }); }
  async function deleteAccount() { return run(async () => { const { error } = await requireBackend().functions.invoke('delete-account', { body: {} }); if (error) throw error; await requireBackend().auth.signOut(); tell('تم حذف الحساب وبياناته.'); }); }
  async function addDemoVideo() { if (online) return tell('ارفع فيديو من جهازك؛ المثال متاح بوضع التجربة فقط.'); await run(async () => { const asset = await Asset.fromModule(require('../assets/demo.mp4')).downloadAsync(); setState(p => ({ ...p, posts: [{ id: 'demo-video', userId: 'noor', caption: 'عالم صغير يتحرك بخيالك.\nفيديو توضيحي أصلي لاختبار التشغيل والصوت.', kind: 'video', uri: asset.localUri || asset.uri, createdAt: new Date().toISOString() }, ...p.posts.filter(x => x.id !== 'demo-video')] })); }); }
  return { state, uid, ready, online, busy, message, tell, run, refresh, changeEdge, pick, publish, addComment, editProfile, pickProfileImage, startCampaign, stopCampaign, auth, moderate, remove, unblock, logout, deleteAccount, addDemoVideo, configured: !!supabase };
}
