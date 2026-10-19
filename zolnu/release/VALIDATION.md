# Validation — 2026-10-19

Version: 0.2.0 / Expo SDK 58 / Expo Router.

Passed:

- TypeScript: `npm run typecheck`; ESLint: `npm run lint` with no errors or warnings.
- Nine automated tests: feed filtering, Arabic/handle search, state toggles, post validation, username validation, SQL migration/RLS/cascade behavior, permanent founder rewards, state upgrades, and company/campaign authorization.
- The database test runs the actual migration against embedded PostgreSQL (PGlite) with minimal Supabase auth/storage table stubs. It verifies signup profile creation, rejection of forged ownership, rejection of deleting/updating another account's data, private saves, blocking and cascading account-data deletion. It is not a live hosted Supabase integration test.
- Expo production JavaScript/asset export for Web, iOS and Android. These exports are not signed native installation packages.
- Headless Chromium at 1440×1000 and 390×844: feed, like, comment, search, profile editing, publish, persistence after reload, saves, delete, block, mobile navigation and no horizontal overflow.
- Actual playback progression of the bundled video; mute toggle and pause controls.
- Image aspect-ratio assertion and visual inspection of phone/desktop layouts.
- Standalone HTML opened directly with file://: embedded images and video playback worked without a server.
- No browser runtime errors during the successful final UI checks.

Not verified in this session:

- Physical iOS/Android devices, native media-library permission flow, native codecs, performance and screen readers.
- Hosted Supabase authentication, email delivery, cloud storage API and deployed Edge Function account deletion.
- EAS cloud builds, device signing, TestFlight, Google Play tracks or any store submission.
- Public moderation workflow, public support/privacy/deletion URLs and store privacy declarations.

Store publication is not complete. See STORE-AR.md for the setup and testing still needed.

Additional 0.2 checks: verified-email company ownership; denied direct role/grant insertion; denied unauthorized campaign management; founder frame locked before award; grants survive unlike, campaign stop/expiry and campaign-post deletion. IPA workflow YAML and macOS build script syntax checked. Local IPA build refuses Linux explicitly; no native IPA has been produced by these checks.

The final browser checks cover campaign participation, founder-frame lock/unlock, changing avatar/banner and preserving both as local data, keeping the badge after unlike and stopping the campaign, and navigation/reload of the portable preview. Cloud build remains blocked on access to the connected GitHub execution tools; installed-plugin status alone is not evidence that a build ran.
