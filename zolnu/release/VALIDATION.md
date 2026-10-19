# Validation — 2026-10-19

Version 0.3.0: iPhone-only release configuration, Expo SDK 58, Expo Router.

Passed locally:

- TypeScript and ESLint without errors or warnings.
- Ten tests running model behavior and the real SQL migrations in PGlite with minimal Supabase auth/storage stubs.
- Database ownership/RLS, private saves, blocks/cascades, confirmed-email company claim, protected campaign control, permanent founder rewards, private review evidence, denied direct blue-badge insertion, denied unauthorized/self review, independent administrator approval, automatic blue-badge revocation on identity change.
- Chromium UI checks at 390×844: feed/media dimensions, like/comment/search/edit/post/reload/save/delete/block, navigation, bundled video time progression/mute/pause, and no runtime errors.
- White phone interface inspected visually; circular avatars, full-width square media, compact navigation, three-column account/explore grids.

GitHub macOS native build is tracked in Actions on branch `zolnu/iphone`. Only a successful native Xcode build and validated artifact constitute an IPA; source archives and JavaScript exports do not.

Not yet verified:

- Physical iPhone execution, native media permission flow, codecs, signing and device performance.
- Hosted Supabase authentication/email/storage and deployed account-deletion function.
- Real account verification review or an operating moderation team.
- App Store submission/acceptance.

Founder stars are promotional rewards, not identity verification. Blue checks require a separate reviewed server grant. Native artifacts are unsigned before Sideloadly signing.
