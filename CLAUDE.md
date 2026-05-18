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

## Planned Supabase Schema

Tables to be created via migrations:

| Table | Key columns |
|---|---|
| `profiles` | extends `auth.users`; `role` (`owner` \| `instructor` \| `client`), `display_name`, `preferred_language` |
| `classes` | `title`, `description`, `instructor_id`, `scheduled_at`, `duration_minutes`, `max_capacity`, `location` |
| `bookings` | `class_id`, `client_id`, `status` (`confirmed` \| `waitlist` \| `cancelled`), `attended` (bool) |
| `payments` | `booking_id`, `client_id`, `method` (`cash` \| `waived` \| `pending` \| `paid`), `green_invoice_id`, `amount`, `created_at` |

---

## Internationalization

- **Bilingual: Hebrew + English**
- Hebrew is RTL — all UI components must support RTL layout switching
- User's preferred language is stored in `profiles.preferred_language`
- Use `expo-localization` + a translations file (e.g., `i18n-js` or `i18next`)

---

## Git Workflow

Every feature section is developed on its own branch. Never commit directly to `master`.

```
git checkout -b feature/<section-name>   # start a new section
# ... develop, commit incrementally ...
# user approves → merge to master
```

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

**Native (iOS/Android):** `app/_layout.tsx` → Stack navigator → `app/index.tsx`  
File-based routing via expo-router; add screens as `app/<name>.tsx`.

**Web:** `index.html` → `src/main.tsx` → React DOM (`src/app/App.tsx`)  
The web entry is a standalone React DOM app, separate from the Expo Router native flow.  
Note: `src/app/App.tsx` and `src/styles/index.css` do not exist yet — to be created when web work begins.

### Key config

- `app.json` — Expo config: platforms, icons, splash screen, enabled experiments
- `tsconfig.json` — Strict TypeScript; path alias `@/*` maps to repo root
- React Compiler and typed routes are experimentally enabled (`app.json` → `experiments`)
- New Architecture is enabled (`newArchEnabled: true`)

### Notable dependencies

**Current:**
- `expo-router` — file-based routing for native
- `react-native-reanimated` + `react-native-gesture-handler` — animations and gestures
- `@expo/vector-icons` + `expo-symbols` — icons
- `react-native-web` — renders RN components on web (web output mode: `static`)

**Planned:**
- `@supabase/supabase-js` — Supabase client
- `expo-localization` + i18n library — bilingual Hebrew/English support
- `expo-notifications` — push notifications for payment flow
- Green Invoice API calls via native `fetch`
