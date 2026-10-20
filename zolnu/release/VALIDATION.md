# ZOLNU 0.4.0 validation

## Verified

- TypeScript and ESLint checks.
- 12 tests, including real Postgres-compatible PGlite migrations and authorization checks: profile ownership, private saves, blocks, cascade deletion, confirmed company ownership, permanent founder reward, independent blue-verification review, identity-change revocation, DM participants and forged senders, immutable message bodies, recipient read receipts, nobody/followers policies, bidirectional DM blocks, private notifications, removal of demo posts while retaining personal posts.
- Hosted Supabase migration applied successfully. Live transaction exercised sender read, third-party message/notification isolation, rejected forged sender, generated recipient notification, recipient receipt update, and the nobody policy. Transaction rolled back; zero fixture users remained.
- Earlier live Auth/Storage/verification acceptance suite passed 22 checks and cleaned all synthetic accounts and files. Its temporary endpoint was replaced with an authenticated 410 tombstone.
- Supabase security advisor: zero findings after messages/notifications migration.
- Mobile browser interaction QA at 390×844: clean empty feed; country picker; publish/like/comment; persisted language/theme/focus/compact; messages and notifications navigation; profile edit; frame application; reload; no horizontal overflow or browser runtime errors.
- Google/Apple/phone readiness checked through live Auth settings: disabled. Email enabled, signup enabled, email confirmation required. No actual OAuth or SMS delivery claimed.

## Native build

The GitHub workflow runs npm ci, TypeScript, lint and tests, then Expo prebuild, CocoaPods and Xcode Release arm64 for iPhoneOS. It packages Payload/ZOLNU.app into an unsigned IPA and checks iPhone-only UIDeviceFamily and JS bundle. Build metadata and SHA-256 accompany the artifact.

A successful native archive is not a physical-device acceptance test. Sideloadly must sign it before installation. iOS minimum 16.4; Android/iPad not targeted. No App Store submission has occurred.

## Material limitations

- Public signup email needs custom SMTP; default Supabase SMTP restricts recipients/rate. Apple, Google and phone need external account credentials and redirect configuration.
- No live broadcasting, push notifications, communities, actual coin payments, or end-to-end encrypted messaging. Free cosmetics do not charge users.
- Inbox refreshes every eight seconds while open; recent message list capped at 500, notifications at 200. Feed/profiles retain current API pagination limits. More scaling work is required before a large public launch.
- Public media bucket means published media is accessible by URL. Blocking does not revoke already shared public URLs.
- Existing SDK toolchain audit reported 26 transitive advisories (19 high, 7 moderate) in the earlier lockfile; no forced SDK downgrades were applied. This is not a public-production security certification.

## Final native result

GitHub run 39367620359 succeeded for commit `84becba9fec76283470300e224acb4f8457116a1`. The downloaded IPA was inspected as a Mach-O arm64 iPhoneOS build, version 0.4.0/build 6, UIDeviceFamily [1], minimum iOS 16.4, with a JS bundle and the hosted service configuration. Size: 12131738 bytes. SHA-256: `62879a59806f1f77fcbab8c3685f412a28554cba57ffe449fb398f9b95317ab2`. Outer artifact and nested IPA hashes matched the published metadata. It is unsigned and has not been tested on a physical iPhone.
