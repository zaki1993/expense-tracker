# Expense Tracker (Android)

An offline-first personal finance app for **Android only**, built with Expo, React Native and TypeScript. Google Sheets is the remote store; versioned local JSON files hold the transaction cache, durable pending-operation queue and sync metadata. There is no backend or local database.

## Features currently implemented

- Monthly dashboard and recent transactions.
- Create, edit and delete expense, income and transfer transactions.
- Durable JSON cache and pending-operation log. Changes are queued before the save operation returns; temporary-file/backup recovery is used after interrupted writes.
- Google OAuth authorization-code + PKCE flow, credentials stored with Expo SecureStore, access-token refresh and local credential removal/revocation.
- Google Sheets API v4 spreadsheet creation, worksheet/header validation, transaction reads and writes.
- Automatic sync attempts at startup, when connectivity returns, when the app resumes, after a transaction changes, and on manual request.
- Stable transaction IDs, remote reconciliation after uncertain create requests, retry backoff, partial-failure preservation and basic revision-conflict detection.
- Transaction history with edit/delete, reports that exclude transfers and deleted rows, CSV export/share, and primary currency selection (EUR, BGN, USD, GBP).

## Android development setup

Requirements: Node.js 22, npm, Android SDK/platform tools, and a compatible JDK (JDK 17 for the generated Android Gradle project).

```sh
npm install
npm run typecheck
npm run lint
npm test
npx expo prebuild --platform android --non-interactive
npx expo run:android
```

The project is configured for Android package `com.zaki1993.expensetracker`. When the Android OAuth client ID is configured, the app derives the Google native redirect scheme from that client ID; without it, the development fallback scheme is `expensetracker`. iOS is not a supported or verified target.

## Google Cloud OAuth setup

1. Create/select a Google Cloud project and enable **Google Sheets API**.
2. Configure the OAuth consent screen. Add your Google account as a test user while the app is in Testing.
3. Create an OAuth client for **Android** using package name `com.zaki1993.expensetracker` and the SHA-1 fingerprint of the signing certificate used by the installed app. Debug and release certificates have different SHA-1 fingerprints. For local debug builds, obtain it from the Android debug keystore (typically `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`).
4. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`. This is a public client identifier, not a secret. Never add client secrets, access tokens or refresh tokens to source control.
5. Rebuild after changing environment/config values: `npx expo prebuild --platform android --clean`, then build/install the app again.
6. Open Settings, connect the Google account, then create a dedicated test spreadsheet or enter its spreadsheet ID. Test with a disposable spreadsheet before using personal financial data.

**Integration limitation:** the OAuth and Sheets API paths are implemented, but they have not been end-to-end verified against a real Google Cloud project and a real Android device in this environment. The redirect URI uses the Google native Android pattern `com.googleusercontent.apps.<client-id-prefix>:/oauthredirect` and is derived from the configured Android client ID. Confirm the exact URI shown in Settings during device testing; if Google rejects the client/redirect combination, resolve the Google Cloud package/SHA-1/client configuration rather than bypassing validation. No credentials are included in the repository.

## Spreadsheet schema and synchronization

The app uses tabs named `Transactions`, `Categories`, `Budgets` and `Settings`. Transactions use stable `transaction_id` values. Existing non-empty headers are checked before writes; mismatched headers stop synchronization instead of silently replacing existing data.

Each operation is durably queued before the UI reports a successful local save. Synchronization processes operations individually and removes an operation only after a confirmed write or reconciliation with the same ID and timestamp. Failed operations remain queued for retry. This is best-effort idempotency, not a strict exactly-once guarantee: Google Sheets has no atomic compare-and-swap for row updates, and concurrent edits from other clients can still race.

Sync is attempted while the app is active, when network connectivity changes, and when the app resumes. Android may suspend the app in the background; open the app or use **Sync now** for dependable progress. Expired/revoked authorization requires reconnecting the Google account.

## Offline restart and recovery test

Use a dedicated test spreadsheet and a debug build:

1. Connect the test Google account once and create/select the test spreadsheet.
2. Enable airplane mode and ensure Wi-Fi/mobile data remain off.
3. Create an expense and confirm it appears in transaction history while the UI indicates sync is pending/offline.
4. Force-stop the app from Android Settings (or `adb shell am force-stop com.zaki1993.expensetracker`) and relaunch it.
5. Confirm the expense is still visible after restart.
6. Restore connectivity, reopen the app and tap **Sync now** if needed.
7. Confirm exactly one row with that transaction ID exists in the test spreadsheet. Repeat with editing and deleting.
8. To test failure paths, revoke app access in the Google Account security settings, attempt sync, confirm the queue remains, reconnect the account and retry. Simulate flaky network/HTTP failures and verify failed operations remain queued.
9. For interrupted-write recovery, terminate the process while a local write is in progress in a controlled test build, then restart and verify the primary/backup recovery behavior.

This procedure is provided for reproducible device verification; it has **not** been run end-to-end here because no Google OAuth credentials, test spreadsheet, emulator or physical Android device was available.

## Local data and security

JSON files live under the app's private document directory: `transactions-cache.json`, `pending-operations.json` and `sync-metadata.json`. Writes use a temporary file and backup recovery; if both primary and backup are invalid, the app reports an error rather than silently dropping the queue. OAuth tokens use Expo SecureStore. Transaction cache and queued financial data are **not encrypted at the application layer** in this version; they rely on Android app-private storage and device-level protections. Do not use on a rooted/shared device with sensitive data until at-rest encryption has been reviewed. Uninstalling or clearing app data can delete unsynchronized changes.

## Verification and artifacts

GitHub Actions on pushes and pull requests runs TypeScript checks, lint, Jest tests, attempts compatible non-breaking dependency security fixes, produces an npm audit report, runs Android prebuild, builds release AAB/APK artifacts, reports exact sizes and uploads the generated artifacts. Audit findings are reported as warnings rather than blocking the build so the Android build result remains observable; review the audit artifact before distribution. The latest observed audit before compatible fixes reported 40 findings (23 high) in the resolved dependency tree, including Expo/Metro/Jest tooling and a node-forge advisory for which the advisory database reported no patched version. These are unresolved supply-chain findings, not evidence that each vulnerable code path is reachable in the shipped app. CI artifacts use the generated debug signing configuration and are for testing/sideloading, **not production-signed Play Store releases**. A production release requires a protected upload key/signing configuration and a signed release build.

The automated tests cover money parsing, report aggregation, CSV escaping, JSON restart/backup recovery, offline create/edit/delete, and sync reconciliation/partial failures. CI build success does not itself prove installation, runtime behavior, OAuth login, or a real Sheets round trip.

## Known gaps / release blockers

- Full category CRUD/archive and budget editing screens are not complete; sheet tabs/schema are reserved.
- Complete English/Bulgarian localization, user-selectable theme, and a dedicated conflict-resolution UI are not complete.
- Local JSON transaction data is not encrypted at the application layer.
- Real Google OAuth/refresh/revocation and Google Sheets end-to-end behavior require verification with configured credentials and an Android device.
- No device startup/save latency benchmark has been measured yet.
- CI artifacts are not production-signed. Configure and protect an Android upload key before distribution.
