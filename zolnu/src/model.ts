export type Frame = 'none' | 'aurora' | 'solar' | 'neon' | 'founder';
export type Profile = { id: string; username: string; name: string; bio: string; color: string; avatarUri?: string; bannerUri?: string; bannerArt?: number; frame?: Frame; badge?: 'company' | 'founder'; verifiedAt?: string; identityVerifiedAt?: string };
export type Campaign = { id: string; postId: string; startsAt: string; endsAt: string; active: boolean };
export type Post = { id: string; userId: string; caption: string; uri: string; kind: 'image' | 'video'; createdAt: string; art?: number };
export type Comment = { id: string; postId: string; userId: string; body: string; createdAt: string };
export type SocialState = { profiles: Profile[]; posts: Post[]; likes: string[]; follows: string[]; saves: string[]; comments: Comment[]; blocked: string[]; reports: string[]; campaigns: Campaign[] };
export const DEMO_ID = 'me';
export const COMPANY_DEMO_ID = 'zolnu-company';
export const profileSeed: Profile[] = [
  { id: 'me', username: 'you', name: 'صانع اللحظة', bio: 'مساحة صغيرة لأشياء تستحق المشاركة.', color: '#c4b5fd' },
  { id: 'lina', username: 'lina.creates', name: 'لينا', bio: 'أجمع الألوان واللحظات.', color: '#ffc6a8' },
  { id: 'omar', username: 'omar.frames', name: 'عمر', bio: 'كل مشهد يحچي حكاية.', color: '#b6d9cb' },
  { id: 'noor', username: 'noor.studio', name: 'نور', bio: 'شوية خيال، وهواية فضول.', color: '#f1d690' },
  { id: COMPANY_DEMO_ID, username: 'zolnu', name: 'ZOLNU', bio: 'حساب الشركة الرسمي · كل لحظة، إلها مكان. هذا عرض تجريبي للحساب.', color: '#c4b5fd', badge: 'company', frame: 'solar', bannerArt: 2 },
];
export function initialState(): SocialState {
  return { profiles: profileSeed.filter(p=>p.id==='me').map(p => ({ ...p })), posts: [], likes: [], follows: [], saves: [], comments: [], blocked: [], reports: [], campaigns: [] };
}
export function hydrateDemo(data: Partial<SocialState>): SocialState {
 const seed = initialState();
 const oldIds = new Set(['launch-demo','p1','p2','p3','demo-video']);
 return { ...seed, ...data, profiles: data.profiles || seed.profiles, posts: (data.posts || []).filter(p=>!oldIds.has(p.id)), campaigns: (data.campaigns || []).filter(c=>!oldIds.has(c.postId)), likes: (data.likes || []).filter(k=>!oldIds.has(k.split('|')[1])), comments: (data.comments || []).filter(c=>!oldIds.has(c.postId)), saves: (data.saves || []).filter(k=>!oldIds.has(k.split('|')[1])) };
}
export function campaignActive(campaign: Campaign, now = Date.now()) { return campaign.active && Date.parse(campaign.startsAt) <= now && now < Date.parse(campaign.endsAt); }
export function applyDemoLike(state: SocialState, uid: string, postId: string, now = Date.now()): SocialState {
 const k = edge(uid, postId); const adding = !state.likes.includes(k); const post = state.posts.find(p => p.id === postId);
 const earns = adding && state.profiles.some(p => p.id === post?.userId && p.badge === 'company') && state.campaigns.some(c => c.postId === postId && campaignActive(c, now));
 return { ...state, likes: toggle(state.likes, k), profiles: earns ? state.profiles.map(p => p.id === uid && !p.badge ? { ...p, badge: 'founder', verifiedAt: new Date(now).toISOString() } : p) : state.profiles };
}
export const edge = (a: string, b: string) => `${a}|${b}`;
export function toggle(items: string[], value: string) { return items.includes(value) ? items.filter(x => x !== value) : [...items, value]; }
export function visiblePosts(s: SocialState, uid: string, following: boolean, query = '') {
  const q = query.trim().toLowerCase();
  return s.posts.filter(p => !s.blocked.includes(edge(uid, p.userId)) && (!following || s.follows.includes(edge(uid, p.userId))) && (!q || `${p.caption} ${s.profiles.find(u => u.id === p.userId)?.username ?? ''} ${s.profiles.find(u => u.id === p.userId)?.name ?? ''}`.toLowerCase().includes(q)));
}
export function validatePost(caption: string, uri?: string) {
  if (!caption.trim() && !uri) throw new Error('اختار صورة أو فيديو، أو اكتب منشور.');
  if (caption.length > 2200) throw new Error('الحد الأقصى ٢٢٠٠ حرف.');
}
export function validateUsername(name: string) { return /^[a-zA-Z0-9_][a-zA-Z0-9_.]{2,23}$/.test(name); }
