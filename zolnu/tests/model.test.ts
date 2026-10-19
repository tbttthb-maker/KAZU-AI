import test from 'node:test';
import assert from 'node:assert/strict';
import { edge, initialState, toggle, validatePost, validateUsername, visiblePosts, applyDemoLike, hydrateDemo } from '../src/model';
test('following feed and blocks compose without leaking blocked authors', () => {
 const s = initialState(); s.follows = [edge('me','lina')];
 assert.deepEqual(visiblePosts(s,'me',true).map(p => p.id), ['p1']);
 s.blocked = [edge('me','lina')]; assert.equal(visiblePosts(s,'me',true).length,0);
 assert.equal(visiblePosts(s,'me',false).length,3);
});
test('search works with Arabic, case-insensitive handles and whitespace', () => {
 const s = initialState(); assert.equal(visiblePosts(s,'me',false,'  LINA.CREATES ').length,1);
 assert.equal(visiblePosts(s,'me',false,'فضاء')[0].id,'p3');
 assert.equal(visiblePosts(s,'me',false,'does not exist').length,0);
});
test('social toggles undo cleanly and never mutate previous state', () => {
 const a: string[] = []; const b = toggle(a,edge('me','p1')); assert.equal(a.length,0); assert.equal(b.length,1);
 assert.deepEqual(toggle(b,edge('me','p1')),[]);
});
test('posts reject whitespace-only and oversized captions but allow media-only', () => {
 assert.throws(() => validatePost('   ')); assert.throws(() => validatePost('x'.repeat(2201)));
 assert.doesNotThrow(() => validatePost('', 'file://photo.jpg')); assert.doesNotThrow(() => validatePost('نص'));
});
test('username constraints match server format after lowercase normalization', () => {
 assert.equal(validateUsername('ab'),false); assert.equal(validateUsername('a b'),false);
 assert.equal(validateUsername('Nail_05'),true); assert.equal(validateUsername('a'.repeat(25)),false);
 assert.equal(validateUsername('u_' + 'a'.repeat(22)),true);
});

test('limited campaign awards a permanent founder badge, even after unlike and expiry', () => {
 const s=initialState();const now=Date.now();s.campaigns[0].startsAt=new Date(now-1000).toISOString();s.campaigns[0].endsAt=new Date(now+1000).toISOString();
 const rewarded=applyDemoLike(s,'me','launch-demo',now);assert.equal(rewarded.profiles.find(p=>p.id==='me')?.badge,'founder');
 const unliked=applyDemoLike(rewarded,'me','launch-demo',now+2000);assert.equal(unliked.profiles.find(p=>p.id==='me')?.badge,'founder');assert.equal(unliked.likes.length,0);
 assert.equal(applyDemoLike(s,'me','launch-demo',now+2000).profiles.find(p=>p.id==='me')?.badge,undefined);
 s.campaigns[0].active=false;assert.equal(applyDemoLike(s,'me','launch-demo',now).profiles.find(p=>p.id==='me')?.badge,undefined);
});
test('demo upgrades preserve custom profile data and existing permanent grants', () => {
 const s=initialState();s.profiles[0].name='custom';s.profiles[0].badge='founder';s.campaigns[0].active=false;
 const loaded=hydrateDemo(s);assert.equal(loaded.profiles[0].name,'custom');assert.equal(loaded.profiles[0].badge,'founder');assert.equal(loaded.campaigns[0].active,false);
});
