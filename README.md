# Expense Tracker

Offline-first personal expense tracker for Android and iOS using Expo + TypeScript. The target design uses Google Sheets as the remote source of truth and durable local JSON files for the offline snapshot and pending operation queue.

## Current implementation

- Expo Router mobile UI: dashboard, transaction entry, reports, settings.
- Integer minor-unit money representation and basic input validation.
- Local transaction create queue and overlay of pending writes on the cached snapshot.
- Versioned JSON files for cached transactions, pending operations, and sync metadata; serialized writes, temporary files, and recovery copies.
- Google Sheets API v4 schema creation, transaction reads, ID-based append/update.
- A synchronization service with network detection, retry metadata, duplicate-ID detection, and basic revision-conflict preservation.
- Unit tests for money parsing/formatting and report aggregation.

## Known gaps — not production-ready

Google OAuth/token lifecycle is **not integrated into the screens**, so Sheets API calls and synchronization cannot yet be used end-to-end from the app. Automatic foreground/connectivity sync triggers, robust concurrent/idempotent remote writes, a conflict-resolution screen, full editing/deletion UX, category and budget CRUD, CSV export, localization, recurring transactions, encryption, and release/performance verification remain to be implemented. The current sync algorithm is a foundation, not a guarantee of exactly-once remote writes under every network failure. Do not rely on this initial version as the only copy of important financial records.

## Setup

1. Install a current Node.js LTS and npm.
2. Run `npm install`.
3. Enable **Google Sheets API** in a Google Cloud project and configure the OAuth consent screen. Add test users while the consent screen is in testing mode.
4. Create platform OAuth client IDs and configure redirect URIs for the Expo AuthSession flow and app scheme `expensetracker`. Never embed a Google client secret in a mobile app.
5. Run `npm test` and `npm run typecheck`; run `npx expo start` for development. Android/iOS native builds require their respective toolchains (Xcode for iOS).
6. OAuth configuration alone is not sufficient yet: authentication and token refresh must be wired into the app before remote sync can work.

## Spreadsheet schema

Tabs are `Transactions`, `Categories`, `Budgets`, and `Settings`. Column names are defined in `src/services/google-sheets.ts`. Transactions are identified by a stable `transaction_id`; row numbers are used only to locate a row during the current update request. Schema migrations and validation of pre-existing sheets are not yet implemented.

## Offline storage and data safety

The app document directory contains `transactions-cache.json`, `pending-operations.json`, and `sync-metadata.json`. Writes use a versioned envelope, temporary file, and backup copy. The files are **not encrypted** in this version. Uninstalling the app or clearing its data can remove local-only entries. Never clear app data while pending operations exist; preserve a backup/export first.

## Money and reporting rules

Amounts are stored as integer minor units and the initial input parser supports two-decimal currencies. Reports are currency-specific and do not invent exchange rates. Calendar dates use `YYYY-MM-DD`. Transfers are not counted as income or expenses; deleted/tombstoned transactions are excluded from totals.

## Verification status

Source files and tests have been committed to GitHub, but dependencies were not installed and tests, TypeScript checks, Expo builds, Google API integration, device-reboot durability, startup time, memory, and bundle size have **not** been run or verified in this environment.