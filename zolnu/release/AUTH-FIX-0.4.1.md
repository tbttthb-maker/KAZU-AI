# Authentication repair — 0.4.1

## Observed on the hosted project

The designated owner account exists but is not email-confirmed. Auth logs showed successful signup responses, `email_not_confirmed` login failures, two invalid/expired email verification links (`One-time token not found`), and email-send rate limiting. This is not evidence that no account was created.

Google, Apple and SMS providers are not configured. Default Supabase email delivery is not suitable for public signup; custom SMTP and valid redirects remain required. No provider secrets are available to the application.

An attempted secure dashboard sign-in reached Google's device approval. Google then reported that the device rejected the attempt. No further dashboard sign-in attempts were made and no server authentication protections were disabled.

## Application changes

- Signup without a session opens a persistent confirmation screen; it is never treated as signed-in success.
- An unconfirmed login returns to confirmation instead of silently closing the form.
- Pending confirmation remembers only the email, never the password or one-time code, and clears after actual sign-in.
- Users can submit a code or paste the original confirmation link from this project's Auth service. Foreign origins and unsupported link types are rejected.
- Confirmation failures and mail-delivery limits stay visible. Resends have a client cooldown and no automatic resend loop.
- Signup/resend request `zolnu://auth/callback`; the server must allow this redirect. Callback routes handle PKCE codes, token hashes and explicit error codes.
- OAuth availability refreshes when the app returns to foreground, with an explicit refresh action. Unconfigured buttons are clearly labeled.
- Failed OAuth code exchanges may be retried; old deduplication entries are cleared.
- Login accepts existing short passwords; the stronger minimum remains enforced for new signups.

## Validation

17 automated tests passed, including signup/session boundaries, unconfirmed login, rate-limit handling, Arabic OTP digits and foreign-link rejection. TypeScript and lint passed. Additional mobile web UI checks exercise pending signup, persistence, expired confirmation, SMTP throttling and provider readiness with mocked Auth responses; these do not establish real email delivery or real Google/Apple login.

The previous hosted Auth/Storage suite and messaging RLS checks are recorded separately. This repair does not auto-confirm any user's email and does not bypass Google's or Apple's authentication.
