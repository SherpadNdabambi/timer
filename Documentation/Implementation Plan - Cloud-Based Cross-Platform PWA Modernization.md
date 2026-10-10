# Implementation Plan: Cloud-Based Cross-Platform PWA Modernization for Timer App

## Table of Contents

<details>

   <summary>Contents</summary>

1. [1. Executive Summary](#1-executive-summary)
1. [2. Background](#2-background)
1. [3. Goals and Non-Goals](#3-goals-and-non-goals)
   1. [Goals](#goals)
   1. [Non-Goals](#non-goals)
1. [4. Implementation Details](#4-implementation-details)
   1. [Target Architecture Overview](#target-architecture-overview)
   1. [Key Technical Decisions](#key-technical-decisions)
   1. [Authentication, Timer Reliability, & PWA Lifecycle](#authentication-timer-reliability--pwa-lifecycle)
   1. [Offline Synchronization & Conflict Resolution Protocol](#offline-synchronization--conflict-resolution-protocol)
1. [5. Proposed Changes](#5-proposed-changes)
   1. [Database Schema Migration (MySQL -> PostgreSQL / Supabase)](#database-schema-migration-mysql---postgresql--supabase)
   1. [Database Security & Authorization Matrix](#database-security--authorization-matrix)
      1. [Access Control Matrix](#access-control-matrix)
      1. [Row Level Security Policies](#row-level-security-policies)
1. [6. Procedure](#6-procedure)
   1. [Phase 1: Repository & Modern Frontend Initialization](#phase-1-repository--modern-frontend-initialization)
   1. [Phase 2: Offline Data Access & Sync Engine](#phase-2-offline-data-access--sync-engine)
   1. [Phase 3: Cloud Infrastructure Setup](#phase-3-cloud-infrastructure-setup)
   1. [Phase 4: Data Import Utility & Legacy Migration](#phase-4-data-import-utility--legacy-migration)
   1. [Phase 5: CI/CD Pipeline Setup](#phase-5-cicd-pipeline-setup)
1. [7. Success Criteria](#7-success-criteria)
1. [8. Verification Plan](#8-verification-plan)
   1. [Automated Tests](#automated-tests)
   1. [Manual & E2E Verification](#manual--e2e-verification)
1. [9. Risks and Mitigation](#9-risks-and-mitigation)
1. [10. Rollback Plan](#10-rollback-plan)
1. [11. Estimated Timeline & Phase Deliverables](#11-estimated-timeline--phase-deliverables)

</details>

## 1. Executive Summary

This document details the architecture, implementation roadmap, migration strategy, and operational procedures for transitioning the legacy LAMP/WAMP PHP + MySQL `timer` web application into a production-ready, cloud-native, offline-first Cross-Platform Progressive Web App (PWA).

By transitioning to a serverless cloud backend (Supabase / PostgreSQL) paired with a modern offline-first Progressive Web App (Vite + React + TypeScript), users can run the application seamlessly on Linux, Windows, macOS, Android, and iOS. Local data synchronization (via IndexedDB and Dexie.js) eliminates manual SQL dump export/import workflows to OneDrive and removes the dependency on local LAMP/WAMP stack installations.

## 2. Background

Currently, environment migration and cross-device usage require:

1. Exporting MySQL database dumps from a local LAMP/WAMP stack (`timer_db`).
2. Manual file synchronization/upload to OneDrive.
3. Installing WAMP/LAMP dependencies on new machines.
4. Manually re-importing `schema.sql` and database dumps.

This architecture creates platform lock-in (desktop web browsers only via local web servers), high setup friction, risk of data loss due to manual SQL handling, and zero native mobile app compatibility.

## 3. Goals and Non-Goals

### Goals

- **Cross-Platform Compatibility**: Provide native-like usability on Android, iOS, Windows, macOS, and Linux via an installable Progressive Web Application (PWA).
- **Offline-First Synchronization**: Allow full timer usage (Pomodoro, Stopwatch, Session recording, Settings adjustment) without active internet connectivity. Automatically sync queued data to the cloud when internet connection is restored.
- **Seamless Authentication & Multi-Device Sync**: Enable secure user authentication (Supabase Auth: Email/Password & Google OAuth) with automated cloud backup replacing manual SQL file management.
- **CI/CD Automation**: Implement GitHub Actions automated pipelines for testing, linting, security scanning, and automated deployment to Cloudflare Pages.

### Non-Goals

- Re-implementing a dedicated legacy PHP/MySQL backend on cloud VMs (e.g., AWS EC2 / DigitalOcean Droplets) requiring OS/LAMP stack maintenance.
- Supporting legacy Internet Explorer or pre-ES6 browsers.
- Building complex enterprise team collaboration features in Phase 1 (focus remains on personal productivity & individual session tracking).

## 4. Implementation Details

### Target Architecture Overview

```
+-----------------------------------------------------------------------------+
|                      Client Layer (Cross-Platform PWA)                      |
|   [Android | iOS | Windows | macOS | Linux] - Powered by React/Vite + PWA   |
|                                                                             |
|   +-----------------------+                    +-------------------------+  |
|   |   UI Layer (React)    |                    |  Service Worker & Cache |  |
|   +-----------------------+                    +-------------------------+  |
|               |                                             |               |
|   +---------------------------------------------------------------------+   |
|   |             Offline Local Database (IndexedDB / Dexie.js)           |   |
|   +---------------------------------------------------------------------+   |
+-----------------------------------||----------------------------------------+
                                    || Sync Engine (WebSockets / REST API)
+-----------------------------------\/----------------------------------------+
|                         Cloud Serverless Layer                              |
|   +---------------------------------------------------------------------+   |
|   |                      Supabase (PostgreSQL + RLS)                    |   |
|   +---------------------------------------------------------------------+   |
|   |  - Auth & User Management                                           |   |
|   |  - Task & Session Schema Storage                                    |   |
|   |  - Realtime Conflict Resolution & Sync                              |   |
|   +---------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------+
```

### Key Technical Decisions

1. **Frontend Stack**: Vite + React + TypeScript + PWA plugin (`vite-plugin-pwa`).
2. **Offline Data Engine**: Dexie.js over IndexedDB to handle local CRUD operations and queue sync mutations when offline.
3. **Cloud Backend**: Supabase (Managed PostgreSQL, Row Level Security, Auth, Edge Functions).
4. **CI/CD Pipeline**: GitHub Actions running code linting, type-checking, automated unit/integration tests, and automated deployment to Cloudflare Pages.

### Authentication, Timer Reliability, & PWA Lifecycle

1. **Authentication & Session Lifecycle**:
   - **Providers**: Supabase Auth configured for Email/Password and Google OAuth (PKCE flow).
   - **Protected Routes**: React Router guards verifying active JWT. Unauthenticated requests trigger redirection to `/login` with stored return path.
   - **Session Expiry & Sign-Out**: Automatic silent refresh via Supabase Auth client refresh token loop. On explicit sign-out or refresh token expiration, clear in-memory tokens, purge un-synced sensitive local user data (or flag as dormant), and redirect to login.
   - **OAuth Redirects**: Mobile/Desktop PWA OAuth callback handling via standard web redirect URLs (`/auth/callback`) with PKCE token exchange.

2. **Timer Accuracy, System Sleep, & Clock-Anomaly Limitations**:
   - **Time Base Distinctions**: Timers use wall-clock `Date.now()` as the canonical real-world anchor (e.g. `targetTime = Date.now() + durationMs`) and `performance.now()` as a high-resolution monotonic timer to measure tick deltas without clock-drift while the tab is actively executing.
   - **Behavior During Sleep & Suspension**: `performance.now()` pauses or throttles during OS sleep and tab background suspension on many platforms (e.g., iOS Safari and Android Chrome). Therefore, elapsed time after sleep or backgrounding is recalculated strictly using wall-clock `Date.now()` delta (`remainingMs = targetTime - Date.now()`).
   - **Clock Alteration & Anomaly Detection Limitations**: Comparing `Date.now()` and `performance.now()` provides **best-effort detection**, not a guarantee that every manual clock change or suspension can be caught (since OS and browser timer behavior during sleep varies across platforms). If a clock shift or anomaly is detected (> 5000ms delta), the application gracefully pauses the timer and prompts the user to confirm or adjust remaining duration.

3. **Service Worker Lifecycle & PWA Updates**:
   - **Cache Strategy**: Workbox stale-while-revalidate for static assets (HTML, JS, CSS, sound files) and Cache-First for versioned immutable bundles.
   - **Update Flow**: `vite-plugin-pwa` configured in `prompt` mode. When a new service worker version is deployed, prompt the user with a banner ("New version available. Refresh to update").
   - **Cache Invalidation**: On service worker activation (`skipWaiting` trigger), auto-delete obsolete Workbox cache buckets.

### Offline Synchronization & Conflict Resolution Protocol

1. **Durable Local Mutation Queue**:
   - Every offline write operation (task creation, settings change, session log, deletion) is appended to an IndexedDB `mutation_queue` table with schema: `{ id: UUID, table_name: string, operation: 'INSERT'|'UPDATE'|'DELETE', payload: object, timestamp: number, retry_count: number, error_status: string|null }`.

2. **Race-Safe Deletion & Tombstone Synchronization Protocol**:
   - **Cloud Soft Deletions**: Entities (e.g., `tasks`, `sessions`) use soft deletion (`deleted_at TIMESTAMP WITH TIME ZONE NULL`). In the database, the unique constraint on tasks is scoped to active records (`CREATE UNIQUE INDEX unique_active_user_task_name ON public.tasks (user_id, name) WHERE deleted_at IS NULL`), permitting recreation of a task with an identical name under a new UUID.
   - **Server-Enforced Deletion Integrity (Implementation Requirement)**: When an offline client submits an `UPSERT` mutation for an entity that has `deleted_at IS NOT NULL` in PostgreSQL, the server MUST reject the mutation with an explicit, machine-detectable deleted-record conflict response (e.g., HTTP 409 Conflict with a structured error body identifying the record as tombstoned). The tombstone must not be cleared and the record must not be revived. Upon receiving this conflict response, the client MUST: (a) apply the tombstone locally to its IndexedDB copy of the record, and (b) resolve or remove the corresponding queued mutation from `mutation_queue` so it is not retried. This rejection must remain correct even when a concurrent deletion and upsert arrive at the server simultaneously. The intended enforcement mechanism is a PostgreSQL trigger or Edge Function; however, a simple `deleted_at` check alone does not guarantee correctness under concurrent writes — the selected implementation MUST be explicitly designed and tested for concurrency (e.g., using appropriate PostgreSQL transaction isolation or advisory locking). **This trigger or function is a requirement to implement and test in Stage 1; existing RLS policies alone do not guarantee this behaviour.** A record with an active tombstone cannot be resurrected by a stale upsert under the same `id`.
   - **Tombstone Retention & Stale Device Re-Synchronization**:
     - _90-Day Retention Window_: Tombstones are retained in the database for 90 days. During this window, regular device syncs receive `deleted_at` markers and purge local records.
     - _Determining Stale Status_: The server tracks each device's last successful sync via a server-assigned `last_synced_at` timestamp stored per device (or per user session). When a sync request arrives, the server compares this timestamp against `(NOW() - INTERVAL '90 days')`. If `last_synced_at` predates that threshold, the device is classified as **stale** and its mutation push is refused until resync completes.
     - _Safeguard for Returning Stale Devices (> 90 Days Offline)_: A stale device is forbidden from directly executing queued mutation pushes. The client MUST perform a server-authoritative full snapshot resync: fetch the current active cloud state, compare it against queued mutations, and classify each mutation as one of: **(a) safe to apply** (cloud record exists and is active), **(b) to be discarded** (cloud record does not exist and tombstone has been purged — treat as already-deleted), or **(c) flagged for user review** (cloud record differs in a way that cannot be automatically reconciled). Mutations in category (c) are preserved in the `mutation_queue` with `error_status = 'STALE_CONFLICT'` and surfaced in the sync status UI for explicit user resolution before normal syncing resumes. Under no circumstances does resync apply a mutation that would resurrect a record whose tombstone has been purged.

3. **Retry Mechanism & Backoff**:
   - Synchronization runs automatically on network status `online` event and periodic 30-second heartbeats.
   - Retries use exponential backoff (`Math.min(1000 * 2^retry_count, 60000)`).
   - **Permanent Failure Handling**: If an item reaches 5 retries or returns a non-retryable 4xx error (schema/validation failure), it is flagged in IndexedDB as `error_status = 'PERMANENT_FAILURE'`. A sync status UI bar alerts the user with options to inspect, retry manually, or discard failed mutations.

4. **Idempotency & Partial Synchronization**:
   - All local entities use client-side generated UUIDv4 primary keys.
   - Supabase `UPSERT` queries match on primary key `id`, ensuring retried mutation submissions update existing records rather than duplicating them.
   - **Partial Upload Resume**: Mutations are committed atomically per entity. If connection drops mid-sync, successfully acknowledged mutations are removed from `mutation_queue`, allowing subsequent sync attempts to resume cleanly from the first unacknowledged record.

5. **Conflict Resolution Rules**:
   - **Sessions & Tasks**: Append-only log architecture using client-generated UUIDs; no overwrite conflicts occur for separate sessions.
   - **Settings**: Last-Write-Wins (LWW) policy based on `updated_at` ISO timestamps. If cloud timestamp > local payload timestamp, local settings update to match cloud.

6. **Authorization Failures & Expired Token Handling**:
   - If sync receives HTTP 401/403 (expired session/invalid JWT), halt mutation queue processing immediately. Retain mutations in Dexie `mutation_queue` until the user re-authenticates.

7. **Local-Cloud Reconciliation Protocol**:
   - Reconciliation compares primary key sets (`id`), tombstone status (`deleted_at`), and timestamps (`updated_at`, `created_at`).
   - Active cloud records (`deleted_at IS NULL`) missing locally are pulled down; active local records missing in cloud are pushed; records with `deleted_at` markers enforce tombstones locally.

## 5. Proposed Changes

### Database Schema Migration (MySQL -> PostgreSQL / Supabase)

Translating existing MySQL tables (`user`, `task`, `settings`, `session`) into PostgreSQL with strict Row Level Security (RLS) policies:

```sql
-- User table managed via Supabase Auth (auth.users)
-- Public User Metadata / Profile
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Task Table (Stable Identity, Ownership, & Partial Unique Index for Tombstones)
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);
-- Partial Unique Index allows recreating a deleted task name with a new UUID
CREATE UNIQUE INDEX unique_active_user_task_name ON public.tasks (user_id, name) WHERE deleted_at IS NULL;

-- Settings Table (Explicit Units & Ranges)
CREATE TABLE public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  work_time VARCHAR(10) DEFAULT '25:00' CHECK (work_time ~ '^[0-9]{1,3}:[0-5][0-9]$'),
  short_break_time VARCHAR(10) DEFAULT '05:00' CHECK (short_break_time ~ '^[0-9]{1,3}:[0-5][0-9]$'),
  long_break_time VARCHAR(10) DEFAULT '15:00' CHECK (long_break_time ~ '^[0-9]{1,3}:[0-5][0-9]$'),
  break_reminder BOOLEAN DEFAULT TRUE,
  break_reminder_time VARCHAR(10) DEFAULT '05:00',
  pause_reminder BOOLEAN DEFAULT TRUE,
  pause_time_limit VARCHAR(10) DEFAULT '05:00',
  play_tick_sound BOOLEAN DEFAULT FALSE,
  timer_mode VARCHAR(50) DEFAULT 'pomodoro' CHECK (timer_mode IN ('pomodoro', 'short_break', 'long_break', 'stopwatch')),
  volume FLOAT DEFAULT 0.5 CHECK (volume >= 0.0 AND volume <= 1.0), -- Converted from legacy 0-100 scale to 0.0-1.0
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Session Table (Preserved Timestamp Semantics & Elapsed Duration)
CREATE TABLE public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date_started DATE NOT NULL,
  date_stopped DATE NOT NULL,
  time_started TIME NOT NULL,
  time_stopped TIME NOT NULL,
  time_worked INTERVAL NOT NULL, -- Computed duration
  started_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Timezone-aware timestamp for multi-device sync
  stopped_at TIMESTAMP WITH TIME ZONE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('pomodoro', 'short_break', 'long_break', 'stopwatch')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Indexes for performance
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_sessions_user_task ON public.sessions(user_id, task_id);
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
```

### Database Security & Authorization Matrix

#### Access Control Matrix

| Table      | SELECT | INSERT | UPDATE | DELETE      | Policy Rule                                                   |
| :--------- | :----- | :----- | :----- | :---------- | :------------------------------------------------------------ |
| `profiles` | Owner  | Owner  | Owner  | Unsupported | `auth.uid() = id` (Account deletion managed via Auth service) |
| `tasks`    | Owner  | Owner  | Owner  | Owner       | `auth.uid() = user_id`                                        |
| `settings` | Owner  | Owner  | Owner  | Owner       | `auth.uid() = user_id`                                        |
| `sessions` | Owner  | Owner  | Owner  | Owner       | `auth.uid() = user_id AND task_id belongs to auth.uid()`      |

#### Row Level Security Policies

```sql
-- Profiles Policies (Profile deletion unsupported via direct DB client; managed by Supabase Auth cascade)
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Tasks Policies
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Settings Policies
CREATE POLICY "settings_select" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "settings_insert" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update" ON public.settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sessions Policies (Validates task ownership cross-reference)
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
);
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM public.tasks WHERE id = task_id AND user_id = auth.uid())
);
CREATE POLICY "sessions_delete" ON public.sessions FOR DELETE USING (auth.uid() = user_id);
```

> [!IMPORTANT]
> **Key Security Enforcements**:
>
> 1. **Anon Key Usage Only**: Frontend client code MUST only instantiate Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The `service_role` key MUST NEVER be embedded in browser code, client bundles, or repository variables.
> 2. **Cross-Reference Task Validation**: Session insertion policy enforces that `task_id` belongs to `auth.uid()`, preventing malicious cross-user task assignment.

## 6. Procedure

### Phase 1: Repository & Modern Frontend Initialization

1. Initialize modern frontend folder structure within repository (`src/`, `public/`, `tests/`).
2. Setup Vite + React + TypeScript + TailwindCSS / CSS Modules.
3. Configure `vite-plugin-pwa` with web app manifest, offline fallback HTML, and service worker caching strategies.

### Phase 2: Offline Data Access & Sync Engine

1. Integrate IndexedDB abstraction using Dexie.js with Dexie `mutation_queue` table.
2. Implement offline sync worker with exponential backoff retries, UUID idempotency, and network listener hooks.

### Phase 3: Cloud Infrastructure Setup

1. Provision Supabase project.
2. Apply PostgreSQL migration scripts and Row Level Security rules.
3. Setup Authentication flows (Email/Password, Google OAuth).

### Phase 4: Data Import Utility & Legacy Migration

1. **Safe Legacy Account & Identity Separation**:
   - **Data Import vs. Account Authorization Separation**: Staging historical database records is fully decoupled from granting live account access. Legacy records are assigned newly generated UUID primary keys mapped to legacy user IDs. Placeholder tags or modified email addresses are administrative tracking metadata and MUST NEVER be treated as evidence of ownership or used to grant authentication access.
   - **Missing, Invalid, or Duplicate Emails Rule**:
     - _Missing/Invalid/Duplicate Emails_: Records with missing, invalid, or duplicate email addresses remain strictly **unclaimed** and locked in cloud database staging.
     - _One-Time Auditable Account-Claiming Protocol_: Unclaimed historical data can only be linked to an active Supabase Auth user through a one-time, auditable claiming workflow. Ownership verification requires:
       1. Verification of legacy username and password (subject to verifying that the legacy password hash format matches supported PHP `password_verify` / password-hash standards in a secure verification function).
       2. Issuance of a claim token that is **time-limited** (expires after a short window, e.g., 15 minutes), **single-use** (invalidated immediately upon first successful claim or upon expiry), **cryptographically bound** to the specific `legacy_user_id` being claimed and to the authenticated `supabase_auth_uid` making the request, and **replay-protected** (the server MUST reject any second presentation of the same token, including concurrent requests).
       3. The account-claim operation (writing the `legacy_user_id → supabase_auth_uid` mapping and its audit record) MUST be handled idempotently and safely: if the claim request fails partway through, repeating the request with the same valid token must either complete the claim or return an error — it must never produce an incorrect or duplicate account linking. A token that has already been used to complete a successful claim MUST be refused on any subsequent request.
   - **Stable Identifier Mapping**: The migration tool maintains an explicit lookup table: `legacy_user_id -> supabase_auth_uid` and `legacy_task_id -> new_task_uuid`. Imported `tasks`, `settings`, and `sessions` map foreign keys through these stable tables to guarantee 100% relational integrity.

2. **Parser & Data Mapping**:
   - Legacy `user` -> Supabase Auth `auth.users` + `public.profiles`.
   - Legacy `task` -> `public.tasks` (maps legacy `id` to new UUID, preserving `name`).
   - Legacy `settings` -> `public.settings` (converts `volume` 0–100 scale to 0.0–1.0 float scale).
   - Legacy `session` -> `public.sessions` (maps legacy `task_id` foreign keys to new task UUIDs; constructs ISO `started_at` / `stopped_at` timestamps from legacy date/time fields).

3. **Migration Execution Safeguards**:
   - **Pre-Migration Backup**: Export full SQL dump of legacy database prior to conversion; verify backup checksum.
   - **Dry-Run Mode**: CLI tool runs parsing and schema validation without writing to cloud database, producing audit log of malformed/skipped records.
   - **Idempotent Import**: Import scripts use fixed seed UUID generation or lookup maps to enable safe re-execution.
   - **Reconciliation & Reporting**: Report total record counts per table before/after migration; verify zero orphaned session records.

### Phase 5: CI/CD Pipeline Setup

Create `.github/workflows/ci-cd.yml` utilizing Cloudflare Pages as the target provider:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  deployments: write

concurrency:
  group: deployment-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build

  deploy-staging:
    needs: build-and-test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Preview to Cloudflare Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npx wrangler pages deploy dist --project-name=timer-app --branch=${{ github.head_ref }}

  deploy-production:
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    # Production Approval Gate: Managed via GitHub Environment Protection Rules on 'production' environment
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run build
      - name: Deploy Production to Cloudflare Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: npx wrangler pages deploy dist --project-name=timer-app --branch=main
      - name: Post-Deployment Smoke Check (Prerequisite Script — Requirement, Not Yet Implemented)
        run: |
          # -----------------------------------------------------------------------
          # DOCUMENTED REQUIREMENT — not an implemented, tested workflow.
          # All scripts, commands, and webhook integrations below are design
          # specifications to be implemented and validated in Phase 5.
          # -----------------------------------------------------------------------
          #
          # Step 1 — Smoke Check: scripts/smoke-check.js verifies the live
          #   production URL returns HTTP 200. This script is a Phase 5 prerequisite.
          #
          # Step 2 — Alert (independent of rollback): On smoke-check failure, the
          #   pipeline dispatches a webhook notification to PagerDuty/Slack BEFORE
          #   attempting rollback, so operators are informed even if rollback itself
          #   fails. Alert delivery failure MUST NOT prevent the rollback attempt
          #   from running; these are independent steps.
          #
          # Step 3 — Automated Rollback Attempt: Pipeline invokes the Wrangler
          #   rollback command listed below.
          #   Rollback failure MUST NOT prevent the pipeline from reporting a
          #   non-zero exit code and providing the operator recovery path in Step 4.
          #   NOTE: The exact flag syntax (`--project-name`, deployment selection
          #   behaviour) MUST be validated against the installed Wrangler version
          #   during Phase 5 setup before this command is used in production.
          #
          # Step 4 — Operator Recovery Path: If the automated rollback step fails
          #   or cannot be validated:
          #   a. The CI job exits with code 1.
          #   b. Operators manually roll back via the Cloudflare Pages Console.
          #   c. After automated or manual recovery, operators MUST verify the active
          #      production deployment by running an HTTP health check against the
          #      live URL and confirming HTTP 200 before closing the incident.
          #
          # Smoke check → alert → rollback (commands below are unverified requirements;
          # the shell expression below is illustrative only — the implemented script
          # must ensure alert failure does not suppress rollback, and rollback failure
          # does not suppress the non-zero exit code):
          node scripts/smoke-check.js https://timer-app.pages.dev \
            || (node scripts/notify-webhook.js "Smoke check failed — rollback starting" \
               ; npx wrangler pages deployment rollback --project-name=timer-app \
               || exit 1)
```

> [!NOTE]
> **Pipeline Prerequisites**: `npm run lint`, `npm run typecheck`, `npm run test`, `scripts/smoke-check.js`, `scripts/notify-webhook.js`, and alerting Webhook secrets are Phase 1 & Phase 5 project setup prerequisites to be implemented alongside the modern frontend structure. The smoke-check and rollback commands in the YAML above are **documented requirements**; they are not implemented, executed, or verified against any specific Wrangler version.

## 7. Success Criteria

- **Zero LAMP/WAMP Dependency**: Complete elimination of local Apache/Nginx/MySQL configuration on client devices.
- **Seamless Cross-Platform Access**: App runs and can be installed as PWA on Android, iOS, Windows, macOS, and Linux browsers.
- **100% Offline Capability**: Timers start, stop, pause, and log sessions continuously without internet connectivity.
- **Measurable Eventual Sync Objective**:
  - **Measurement Test Window**: Active browser session with desktop/mobile client connected to stable network (latency < 250ms, bandwidth > 1Mbps).
  - **Target Condition**: Queued offline mutation payloads transmit and receive cloud acknowledgment within 5 seconds of network status `online` event firing.
  - **Scope Limitation**: Target applies under standard active browser conditions; does NOT constitute an unconditional guarantee during OS-level background tab throttling, device sleep, or intermittent network drops.
- **Automated CI/CD**: Merging code to `main` executes tests and deploys the latest version automatically via Cloudflare Pages deployment pipeline.

## 8. Verification Plan

### Automated Tests

- **Unit & Logic Tests**: Vitest covering timer calculations, clock skew protection, format converters, and data parsers.
- **RLS & Authorization Tests**: Automated integration tests verifying user A cannot access or mutate user B's tasks, settings, or sessions.
- **Sync & Conflict Tests**: Mocked network tests checking Dexie `mutation_queue` backoff, idempotency duplicate prevention, and LWW settings merging.
- **Migration & Reconciliation Tests**: Automated validation scripts testing SQL dump parser output, key mappings, and record count checks.

### Manual & E2E Verification

- **PWA & Accessibility (a11y)**: Lighthouse PWA audit compliance and automated axe-core accessibility checks (aria labels, keyboard focus states).
- **Network Throttling & Offline Test**: Set network to Offline in DevTools, execute Pomodoro cycle, toggle online, verify DB entries appear in Supabase console.
- **Cross-Browser & Sleep Test**: Verify timer continuity across Chrome, Firefox, Safari (iOS), and Edge when device sleeps or tab backgrounds.

## 9. Risks and Mitigation

| Risk                                                                                 | Mitigation                                                                                  |
| :----------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **Data Conflict During Sync**: Concurrent edits across devices offline.              | Append-Only logs for sessions with client-side UUIDs; LWW for settings with ISO timestamps. |
| **Browser Storage Quota Limits**: Browser clearing IndexedDB under storage pressure. | Request `navigator.storage.persist()` permission upon initial application setup.            |
| **Audio Playback Restrictions**: Mobile browsers blocking timer notification sound.  | Initialize Web Audio API AudioContext during user's first explicit click on "Start Timer".  |
| **Silent Deployment Failures**: Broken release breaking client PWA cache.            | Cloudflare Pages atomic deployments; automated post-deployment HTTP smoke checks.           |

## 10. Rollback Plan

- Keep legacy PHP app and MySQL schema functional in repository root during transition phase.
- Legacy SQL dump import process remains available as a secondary backup method.
- **Deployment Rollback**: Instant single-click deployment target rollback via Cloudflare Pages dashboard.
- **Database Point-in-Time Recovery**: Supabase automated daily backups and WAL point-in-time recovery for database state.

## 11. Estimated Timeline & Phase Deliverables

> [!NOTE]
> The 18-day timeline represents a provisional estimate based on a single lead developer. Each phase contains strict acceptance gates.

| Stage       | Tasks & Deliverables                                                              | Acceptance Exit Gate                            | Duration    |
| :---------- | :-------------------------------------------------------------------------------- | :---------------------------------------------- | :---------- |
| **Stage 1** | Plan approval, cloud project setup (Supabase), PostgreSQL schema & RLS rules      | RLS authorization test suite passing            | 2 Days      |
| **Stage 2** | PWA project initialization, UI component migration, Offline IndexedDB integration | Offline timer continuity & PWA install verified | 5 Days      |
| **Stage 3** | Authentication & Cloud Sync Engine implementation                                 | Retry & idempotency sync test suite passing     | 4 Days      |
| **Stage 4** | Legacy SQL dump parser tool & data import execution                               | Migration reconciliation count match 100%       | 2 Days      |
| **Stage 5** | CI/CD GitHub Actions setup & initial staging deployment                           | Cloudflare Pages automated deploy verified      | 2 Days      |
| **Stage 6** | E2E testing, mobile/offline verification, documentation finalization              | All E2E & Lighthouse audit gates passing        | 3 Days      |
| **Total**   |                                                                                   |                                                 | **18 Days** |
