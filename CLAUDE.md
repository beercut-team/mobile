# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native mobile app built with Expo SDK 54, using Expo Router for file-based routing. Targets iOS, Android, and Web from a single codebase. Uses React 19 with New Architecture and React Compiler enabled.

## Common Commands

- `npm start` — Start Expo dev server
- `npm run ios` — Start on iOS simulator
- `npm run android` — Start on Android emulator
- `npm run web` — Start web version
- `npm run lint` — Run ESLint (via `expo lint`)
- `node scripts/reset-project.js` — Reset app to blank slate
- `npm run seed <EMAIL> <PASSWORD>` — Seed all test data (logs in, creates 5 patients, comments, IOL calcs)
- `npm run seed:patients <TOKEN>` — Seed test patients only (requires auth token)
- `npm run seed:comments <TOKEN>` — Seed test comments
- `npm run seed:iol <TOKEN>` — Seed IOL calculations
- `npm run seed:statuses <TOKEN>` — Update patient statuses

No test framework is configured yet.

## Architecture

**Domain:** Medical patient management system with role-based access (DISTRICT_DOCTOR, SURGEON, PATIENT, ADMIN). Manages patient records, surgery scheduling, and notifications. Patient workflow: NEW → PREPARATION → REVIEW_NEEDED → APPROVED → SURGERY_SCHEDULED → COMPLETED/REJECTED. District doctors create patients, surgeons review and approve, patients can view their own records via access code.

**Routing:** Expo Router file-based routing in `/app`. Two route groups: `/(auth)` for login/register, `/(tabs)` for main app with bottom tabs. Patient detail route at `app/(tabs)/patients/[id].tsx` (hidden from tab bar via `href: null`). Protected routes via `useProtectedRoute` hook in root layout auto-redirects based on auth state.

**Authentication:** JWT-based auth with refresh tokens. Tokens stored in SecureStore (iOS/Android) or localStorage (web) via `/lib/token-storage.ts`. API client (`/lib/api.ts`) handles automatic token refresh on 401 responses using singleton refresh promise to prevent race conditions. Auth state managed via `AuthProvider` context in `/contexts/auth-context.tsx`. Login/register flows in `app/(auth)/`, protected routes redirect unauthenticated users to login.

**State Management:**
- Server state: React Query (@tanstack/react-query) with 5min stale time, configured in `/lib/query-client.ts`
- Auth state: React Context (`AuthProvider` in `/contexts/auth-context.tsx`)
- Toast notifications: Custom context (`ToastProvider` in `/contexts/toast-context.tsx`) with Reanimated animations
- Accessibility mode: React Context (`AccessibilityProvider` in `/contexts/accessibility-context.tsx`)
- Network state: Monitored via `@react-native-community/netinfo` in `useOfflineSync` hook

**API Layer:** Centralized in `/lib/api.ts` with `apiFetch()` helper that handles auth headers and automatic token refresh on 401. Domain modules in `/lib` (auth, patients, notifications, districts, surgeries, checklists, comments, iol, media, print, sync) encapsulate API calls and TypeScript types. Base URL: `https://api.beercut.tech`. IMPORTANT: File uploads (`/lib/media.ts`) and PDF downloads (`/lib/print.ts`) use native `fetch()` with manual auth headers, NOT `apiFetch()`.

**Offline Support:** Offline-first architecture with mutation queue in `/lib/offline-queue.ts`. Failed requests queued via `addToQueue()` in AsyncStorage (web: localStorage) and auto-synced when connection restores via `/lib/sync.ts`. Network status monitored via `@react-native-community/netinfo`. `useOfflineSync` hook manages sync state and triggers invalidation after successful sync.

**Push Notifications:** Expo Notifications configured in `/lib/push-notifications.ts`. Token registration on auth, notification handlers for foreground/background, deep linking to patient details via `router.push()`. `usePushNotifications` hook in root layout handles registration and navigation. Badge count management on iOS. Notifications include patient_id in data payload for navigation.

**Accessibility:** High contrast mode via `AccessibilityProvider` context. Three theme variants: light, dark, highContrast (defined in `/constants/theme.ts`). Font scaling multiplier (2.0x) for visually impaired users. Accessibility state persisted in SecureStore/localStorage.

**Theming:** Light/dark mode via `useColorScheme()` hook. Colors defined in `/constants/theme.ts`. Theme-aware components (`ThemedText`, `ThemedView`) accept optional `lightColor`/`darkColor` props.

**Platform-specific code:** Uses file extensions (`.ios.tsx`, `.web.ts`) for platform variants. Icons use SF Symbols (via `expo-symbols`) on iOS, MaterialIcons on Android/Web with mapping in `icon-symbol.tsx`. Haptic feedback via `expo-haptics` is iOS-only (wrapped in Platform checks).

**Path alias:** `@/*` maps to project root (configured in tsconfig.json).

**Media Uploads:** File uploads use native `fetch()` with FormData (not `apiFetch`) in `/lib/media.ts`. Supports images (via `expo-image-picker`) and documents (via `expo-document-picker`) with thumbnails, categories, and metadata. Returns signed URLs for downloads. `useMediaUpload` hook provides `upload()` and `deleteMedia()` functions. UI components: `FileUpload`, `ImageGallery`, `MediaViewer` in `/components/ui/`.

**Domain Features:**
- **IOL Calculator** (`/lib/iol.ts`): Calculates intraocular lens power using SRKT, Haigis, or Hoffer Q formulas. Requires axial length, keratometry values, optional ACD and target refraction. Stores calculation history per patient with warnings for out-of-range values.
- **Checklists** (`/lib/checklists.ts`): Pre-surgery checklist system with status tracking (PENDING, IN_PROGRESS, COMPLETED, REJECTED, EXPIRED). Progress calculation for required vs optional items. Items can be updated by doctors and reviewed by surgeons.
- **Comments** (`/lib/comments.ts`): Threaded comment system with urgent flag and read status. Used for doctor-patient communication. Unread count tracked per user.
- **Print/PDF** (`/lib/print.ts`): Generates PDF documents (routing sheets, checklist reports) via backend. Returns Blob for download/sharing. Platform-specific download handlers in `/utils/pdf-download.ts` (web: creates download link, mobile: saves to FileSystem and uses Sharing API).
- **Districts** (`/lib/districts.ts`): Geographic organization of patients. District doctors are assigned to specific districts.
- **Surgeries** (`/lib/surgeries.ts`): Surgery scheduling and management. Links to patients with surgery dates.

**Component Structure:**
- UI primitives in `/components/ui/` (Button, Input, Card, Modal, Select, StatusBadge, ActionSheet, TabView, ProgressBar, FloatingTabBar, OfflineIndicator)
- Domain components in `/components/patient/` (PatientCard, PatientHeader, PassportDataSection, IOLCalculatorForm, ChecklistItem, CommentThread)
- Theme-aware base components: `ThemedText`, `ThemedView` with `lightColor`/`darkColor` props
- Platform-specific variants use file extensions (`.ios.tsx`, `.web.ts`)
- TabView component used for organizing multi-section screens (see patient detail screen for reference)
- ActionSheet pattern for contextual menus (used for PDF downloads, status changes, etc.)
- FloatingTabBar is custom implementation with blur effect and animations (not default Expo Router tab bar)

**Custom Hooks Pattern:** Domain logic encapsulated in hooks (`/hooks/`): `usePatientDetail`, `useComments`, `useChecklist`, `useIOLCalculator`, `useMediaUpload`, `usePDFDownload`, `useModeration`, `useOfflineSync`, `usePushNotifications`. All use React Query for server state with mutations returning `{ mutate, isLoading, error }` and queries returning `{ data, isLoading, error }`.

**Provider Hierarchy (root layout):** QueryClientProvider → AccessibilityProvider → AuthProvider → ThemeProvider → ToastProvider → RootNavigator. Auth and accessibility providers show loading spinner while checking stored tokens/settings before rendering routes. `useProtectedRoute` hook in RootNavigator handles auth-based redirects.

## Key Conventions

- TypeScript strict mode is enabled
- ESLint uses `eslint-config-expo` flat config
- Typed routes enabled (`experiments.typedRoutes` in app.json)
- React Native Reanimated for animations
- Role-based UI: Use `hasRole(...roles)` from `useAuth()` to conditionally render features (accepts multiple roles)
- Tab visibility controlled via `href: null` in tab options based on user role (see `app/(tabs)/_layout.tsx` for examples: patients tab hidden for PATIENT role, moderation tab hidden for non-SURGEON/ADMIN)
- File uploads must use native `fetch()` with FormData, not `apiFetch()`
- Offline mutations queued in AsyncStorage, synced on reconnection
- Use `useAccessibilityFontSize()` hook for responsive sizing values (multiplies by 2.0x in accessibility mode)
- Toast notifications via `useToast()` hook from ToastProvider for user feedback (animated with Reanimated)
- Error handling pattern: show ActivityIndicator while loading, display error message with retry button on failure
- Phone number formatting: use `/lib/phone-mask.ts` for consistent phone input masking
- All user-facing text is in Russian (UI labels, error messages, etc.)
