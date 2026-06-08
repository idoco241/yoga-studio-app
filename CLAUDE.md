# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**RSYoga** is a mobile-first yoga studio management app (Expo 54, iOS/Android primary, Web secondary).

Core capabilities:
- Class scheduling and management
- Client registration and profile management
- Lesson booking with waitlist support
- Post-lesson payment handling via push notification flow

---

## User Roles

| Role | Description | Key Permissions |
|---|---|---|
| **Owner (Admin)** | Studio owner | Full access to all scheduling, all client data, all payment management via Green Invoice |
| **Instructor** | Second teacher | Manage ALL lesson scheduling, view all clients & bookings, mark attendance, view payment status — no Green Invoice access, paid separately outside the app |
| **Client** | Studio member | Book classes, view own schedule, manage own profile, pay in-app when requested |

---

## Features

### Class Scheduling
Create, edit, and cancel classes; support for recurring schedules; assign instructor per class.

### Client Management
Client profiles, membership status, booking history, attendance records.

### Booking / Registration
Clients book into classes; capacity limits; waitlist; attendance marking by instructor.

### Payments (Phase 1 — post-lesson flow)
1. When a lesson ends, the lesson's instructor receives a **push notification** that opens the app
2. Instructor reviews the participant list and for each client selects:
   - **Cash** — mark as paid in cash
   - **No payment needed** — waive (complimentary, pass, etc.)
   - **Send payment request** — client receives a push notification with an in-app payment link
3. Clients who receive a payment request pay **in-app** via credit card, Apple Pay, Google Pay, or Bit — powered by the Green Invoice API
4. In-app payment is only available for **owner-taught lessons** — the instructor is not connected to Green Invoice and is compensated separately

---

## Backend Architecture

### Dual-server setup

**Supabase** (primary backend)
- Authentication with row-level security (RLS) enforced per role
- All application data (classes, bookings, payments, profiles)
- Real-time subscriptions (live class updates)
- Push notification triggers

**Green Invoice / Morning API** (`https://www.greeninvoice.co.il/api-docs/`)
- Invoices and receipts
- In-app payment processing: credit card, Apple Pay, Google Pay, Bit
- Owner-only integration — instructor has no access to this API

---

## Supabase Schema

All 4 tables are live on the remote project (`bohzzvltnzciqlfwmaiq`). Applied via migrations:

| Migration | What it does |
|---|---|
| `0001_initial_schema.sql` | Enums, `role_grants`, `profiles`, `classes`, `bookings`, `payments` + `handle_new_user` trigger |
| `0002_rls_policies.sql` | RLS enabled + `current_user_role()` helper + per-role policies on all tables |
| `0003_seed_owner_and_instructor.sql` | Pre-seeds `idocohen241@gmail.com` (owner) + `shai12697@gmail.com` (instructor) in `role_grants` |
| `0004_security_hardening.sql` | Fixes `search_path` on both DB functions; revokes EXECUTE from PUBLIC |
| `0004_seed_sample_classes.sql` | Adds `category` column to `classes`; seeds 11 dev classes spread over next 7 days |

| Table | Key columns |
|---|---|
| `profiles` | extends `auth.users`; `role` (`owner` \| `instructor` \| `client`), `display_name`, `preferred_language` |
| `classes` | `title`, `description`, `instructor_id`, `scheduled_at`, `duration_minutes`, `max_capacity`, `location` |
| `bookings` | `class_id`, `client_id`, `status` (`confirmed` \| `waitlist` \| `cancelled`), `attended` (bool) |
| `payments` | `booking_id`, `client_id`, `method` (`cash` \| `waived` \| `pending` \| `paid`), `green_invoice_id`, `amount`, `created_at` |

Role assignment: new sign-ups default to `client`. Pre-seeded roles are stored in `public.role_grants (email, role)` and applied automatically by the `handle_new_user` trigger on first sign-up.

---

## Internationalization

- **Bilingual: Hebrew + English**
- Hebrew is RTL — all UI components must support RTL layout switching
- User's preferred language is stored in `profiles.preferred_language`
- Use `expo-localization` + a translations file (e.g., `i18n-js` or `i18next`)

---

## Git Workflow

### Rules
- **Never commit or push directly to `master`.**
- Every section of work gets its own branch.
- Commit incrementally as work progresses — don't batch everything into one commit.
- Keep commit messages short (one subject line).
- Only merge to `master` after explicit user approval.
- Only push to `origin/master` after the user confirms the merge.

### Branch lifecycle

```bash
# 1. Start work on a new section
git checkout master
git pull origin master                  # sync before branching
git checkout -b feature/<section-name>

# 2. Develop — commit as you go
git add <files>
git commit -m "feat: <short description>"

# 3. User reviews → approves merge
git checkout master
git pull origin master                  # catch any remote changes first
git merge --no-ff feature/<section-name>

# 4. Push to origin only after user confirms
git push origin master

# 5. Clean up the feature branch
git branch -d feature/<section-name>
git push origin --delete feature/<section-name>
```

### Branch naming
| Prefix | Use |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `docs/` | Documentation-only changes |
| `chore/` | Dependency updates, config, tooling |

### What not to do
- Do not `git push --force` to `master` or `origin/master` under any circumstances.
- Do not amend commits that have already been pushed to origin.
- Do not skip hooks (`--no-verify`).

---

## Commands

```bash
npx expo start          # Start dev server (choose platform interactively)
npm run android         # Launch Android emulator
npm run ios             # Launch iOS simulator
npm run web             # Launch web version
npm run lint            # Run ESLint
npm run reset-project   # Reset app/ to blank slate (moves current code to app-example/)
```

---

## Architecture

This is an **Expo 54** cross-platform app. **Mobile (iOS/Android) is the priority target**; web is secondary.

### Two separate entry points

**Native (iOS/Android):** `app/_layout.tsx` → Stack (with `LocaleContext.Provider`) → `app/(tabs)/_layout.tsx` → 4-tab navigator → screens in `app/(tabs)/`.  
Add new screens as `app/(tabs)/<name>.tsx`; add new top-level flows as `app/<name>.tsx`.

**Web:** `index.html` → `src/main.tsx` → React DOM (`src/app/App.tsx`)  
Standalone React DOM entry, separate from the Expo Router native flow. Currently renders a placeholder — build out when web becomes a priority.

### Key config

- `app.json` — Expo config: platforms, icons, splash screen, enabled experiments
- `tsconfig.json` — Strict TypeScript; path alias `@/*` maps to repo root
- React Compiler and typed routes are experimentally enabled (`app.json` → `experiments`)
- New Architecture is enabled (`newArchEnabled: true`)

### Notable dependencies

**Current:**
- `expo-router` — file-based routing for native
- `react-native-reanimated` + `react-native-gesture-handler` — animations and gestures
- `@expo/vector-icons` — Ionicons used throughout the UI
- `expo-image` — SVG logo and botanical rendering
- `expo-font` + `@expo-google-fonts/*` — Cormorant Garamond, Inter, Heebo, Frank Ruhl Libre
- `react-native-web` — renders RN components on web (web output mode: `static`)

**Installed (not in original list):**
- `@supabase/supabase-js` — Supabase client (installed)
- `@react-native-async-storage/async-storage` v2.2.0 — session persistence (v3 is incompatible with Expo Go)

**Planned:**
- `expo-notifications` — push notifications for payment flow
- Green Invoice API calls via native `fetch`

---

## Build Progress

### Completed

| Step | Branch | Status |
|---|---|---|
| 1 — Supabase foundation | `feature/supabase-setup` | Merged to master |
| 2 — Schema + RLS | `feature/supabase-schema` | Merged to master |
| 3 — Auth flow | `feature/auth` | Merged to master |
| 4 — Wire Classes screen | `feature/classes-live` | In progress |

**Step 3 details:** Login (`app/(auth)/login.tsx`) + signup (`app/(auth)/signup.tsx`) screens; `AuthProvider` in `src/lib/auth.tsx`; session-aware redirect in `app/index.tsx`; splash waits for both fonts + auth (`RootLayoutInner` pattern in `app/_layout.tsx`); profile tab wired to real auth data with sign-out.

**Step 4 details (in progress):** `src/hooks/useClasses.ts` queries Supabase by date + category; `app/(tabs)/classes.tsx` rewritten with dynamic 7-day date strip (from today), live data, loading + empty states; mocked `todayClasses`/`tomorrowClasses` removed from `src/data.ts`; hardcoded `weekDates`/`weekSelectedIdx`/`today`/`tomorrow` removed from `src/i18n.ts`. Signup count deferred to Step 5 (requires booking flow for correct RLS-aware count).

### Known gotchas discovered during build

- **Expo Router v6 picks `src/app/` over `app/` if both exist.** Do not create any files under `src/app/`. The web entry is `src/main.tsx` only.
- **AsyncStorage v3 crashes in Expo Go** — always install via `npx expo install @react-native-async-storage/async-storage` to get v2.x.
- **Typed routes**: `expo-env.d.ts` is generated by `expo start`, not at install time. Use `as any` casts on `href` props until then.
- **Network issues in Expo Go**: use `npx expo start --tunnel` (requires `npx expo install @expo/ngrok`).

### Next up — Step 5: Booking flow (`feature/bookings`)

- `app/class/[id].tsx` — class detail screen with "Book this class" button
- Booking action: insert into `bookings`, confirmed if `count < max_capacity`, else `waitlist`
- `src/hooks/useMyBookings.ts` — fetch current user's bookings
- `app/(tabs)/bookings.tsx` — wire to real data
- Cancel: update status to `cancelled`, promote next waitlist entry
- Add signup count to Classes screen (uses confirmed booking count per class)

After that: Step 6 (instructor/owner views) → Step 7 (payments) → Step 8 (i18n polish).
