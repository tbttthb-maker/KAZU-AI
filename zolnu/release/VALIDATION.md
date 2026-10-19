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

Native build 1 succeeded on GitHub macOS 26 ARM64 / Xcode 26.6. Downloaded artifact checksum matched GitHub's digest. The IPA ZIP passed integrity checks; its Info.plist reports version 0.3.0, MinimumOSVersion 16.4, UIDeviceFamily [1], supported platform iPhoneOS. Main executable is arm64 Mach-O and main.jsbundle is present. This proves a native device build, not physical-device execution or signing.

Dependency audit: npm audit reports 26 transitive advisories (19 high, 7 moderate) through the SDK/tool dependency graph, including braces, node-forge and uuid. Compatibility-preserving remediation needs review before a public production release. No automatic SDK downgrade or audit --force was applied.

Native build 2 succeeded: https://github.com/tbttthb-maker/KAZU-AI/actions/runs/39329866287 (native commit f061f89b8669c6e548dae099657e2b9fba14936c). It includes the iPhone-only plist assertion and BUILD-INFO.json. Later commits only harden the server migration/tests and update documentation; they do not change the native bundle.
