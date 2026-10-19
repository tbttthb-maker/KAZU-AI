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
  return { profiles: profileSeed.map(p => ({ ...p })), posts: [
    { id: 'launch-demo', userId: COMPANY_DEMO_ID, caption: 'إنت من البدايات. ✦\nحط لايك لهذا المنشور أثناء الحملة واحصل على شارة مؤسس دائمة لحسابك. العرض محدود، والشارة تبقى بعد نهايته.\nهذه محاكاة للحملة، محفوظة على جهازك.', uri: '', kind: 'image', art: 2, createdAt: new Date().toISOString() },
    { id: 'p1', userId: 'lina', caption: 'أحيانًا، كل اللي نحتاجه نغيّر زاوية النظر. ✦\n#فن #ألوان #زولنو', uri: '', kind: 'image', art: 0, createdAt: '2026-10-19T10:00:00Z' },
    { id: 'p2', userId: 'omar', caption: 'على حافة الهدوء.\n#تصميم #لحظات', uri: '', kind: 'image', art: 1, createdAt: '2026-10-19T09:00:00Z' },
    { id: 'p3', userId: 'noor', caption: 'عالم صغير، خيال ما إله حدود.\n#إبداع #فضاء', uri: '', kind: 'image', art: 2, createdAt: '2026-10-19T08:00:00Z' },
  ], likes: [], follows: [], saves: [], comments: [], blocked: [], reports: [], campaigns: [{ id: 'launch-demo', postId: 'launch-demo', startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 48 * 3600000).toISOString(), active: true }] };
}
export function hydrateDemo(data: Partial<SocialState>): SocialState {
 const seed = initialState();
 return { ...seed, ...data, profiles: [...(data.profiles || seed.profiles), ...seed.profiles.filter(u => !(data.profiles || seed.profiles).some(p => p.id === u.id))], posts: data.posts ? [...data.posts, ...seed.posts.filter(p => p.id === 'launch-demo' && !data.posts!.some(x => x.id === p.id))] : seed.posts, campaigns: data.campaigns || seed.campaigns };
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
