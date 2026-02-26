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

No test framework is configured yet.

## Architecture

**Domain:** Medical patient management system with role-based access (DISTRICT_DOCTOR, SURGEON, PATIENT, ADMIN). Manages patient records, surgery scheduling, and notifications.

**Routing:** Expo Router file-based routing in `/app`. Two route groups: `/(auth)` for login/register, `/(tabs)` for main app with bottom tabs. Protected routes via `useProtectedRoute` hook in root layout auto-redirects based on auth state.

**Authentication:** JWT-based auth with refresh tokens. Tokens stored in SecureStore (iOS/Android) or localStorage (web) via `/lib/token-storage.ts`. API client (`/lib/api.ts`) handles automatic token refresh on 401 responses. Auth state managed via `AuthProvider` context in `/contexts/auth-context.tsx`.

**State Management:**
- Server state: React Query (@tanstack/react-query) with 5min stale time, configured in `/lib/query-client.ts`
- Auth state: React Context (`AuthProvider` in `/contexts/auth-context.tsx`)
- Toast notifications: Custom context (`ToastProvider` in `/contexts/toast-context.tsx`) with Reanimated animations
- Accessibility mode: React Context (`AccessibilityProvider` in `/contexts/accessibility-context.tsx`)
- Network state: Monitored via `@react-native-community/netinfo` in `useOfflineSync` hook

**API Layer:** Centralized in `/lib/api.ts` with `apiFetch()` helper. Domain modules in `/lib` (auth, patients, notifications, districts, surgeries, checklists, comments, iol, media, print, sync) encapsulate API calls and TypeScript types. Base URL: `https://api.beercut.tech`

**Offline Support:** Offline-first architecture with mutation queue in `/lib/offline-queue.ts`. Failed requests are queued in AsyncStorage and auto-synced when connection restores via `/lib/sync.ts`. Network status monitored via `@react-native-community/netinfo`. `useOfflineSync` hook manages sync state and triggers invalidation after successful sync.

**Push Notifications:** Expo Notifications configured in `/lib/push-notifications.ts`. Token registration on auth, notification handlers for foreground/background, deep linking to patient details. `usePushNotifications` hook in root layout handles registration and navigation. Badge count management on iOS.

**Accessibility:** High contrast mode via `AccessibilityProvider` context. Three theme variants: light, dark, highContrast (defined in `/constants/theme.ts`). Font scaling multiplier (2.0x) for visually impaired users. Accessibility state persisted in SecureStore/localStorage.

**Theming:** Light/dark mode via `useColorScheme()` hook. Colors defined in `/constants/theme.ts`. Theme-aware components (`ThemedText`, `ThemedView`) accept optional `lightColor`/`darkColor` props.

**Platform-specific code:** Uses file extensions (`.ios.tsx`, `.web.ts`) for platform variants. Icons use SF Symbols on iOS, MaterialIcons on Android/Web. Haptic feedback is iOS-only.

**Path alias:** `@/*` maps to project root (configured in tsconfig.json).

**Media Uploads:** File uploads use native `fetch()` with FormData (not `apiFetch`) in `/lib/media.ts`. Supports images/documents with thumbnails, categories, and metadata. Returns signed URLs for downloads. Used for patient photos, medical documents, and attachments.

**Domain Features:**
- **IOL Calculator** (`/lib/iol.ts`): Calculates intraocular lens power using SRKT, Haigis, or Hoffer Q formulas. Stores calculation history per patient.
- **Checklists** (`/lib/checklists.ts`): Pre-surgery checklist system with status tracking (PENDING, IN_PROGRESS, COMPLETED, REJECTED, EXPIRED). Progress calculation for required vs optional items.
- **Comments** (`/lib/comments.ts`): Threaded comment system with urgent flag and read status. Used for doctor-patient communication.
- **Print/PDF** (`/lib/print.ts`): Generates PDF documents (routing sheets, checklist reports) via backend. Returns Blob for download/sharing.

**Component Structure:**
- UI primitives in `/components/ui/` (Button, Input, Card, Modal, Select, StatusBadge, ActionSheet, TabView, ProgressBar, FloatingTabBar, OfflineIndicator)
- Domain components in `/components/patient/` (PatientCard, PatientHeader, PassportDataSection, IOLCalculatorForm, ChecklistItem, CommentThread)
- Theme-aware base components: `ThemedText`, `ThemedView` with `lightColor`/`darkColor` props
- Platform-specific variants use file extensions (`.ios.tsx`, `.web.ts`)

**Custom Hooks Pattern:** Domain logic encapsulated in hooks (`/hooks/`): `usePatientDetail`, `useComments`, `useChecklist`, `useIOLCalculator`, `useMediaUpload`, `usePDFDownload`, `useModeration`, `useOfflineSync`, `usePushNotifications`. All use React Query for server state.

**Provider Hierarchy (root layout):** QueryClientProvider → AccessibilityProvider → AuthProvider → ThemeProvider → ToastProvider → RootNavigator. Auth and accessibility must load before rendering routes.

## Key Conventions

- TypeScript strict mode is enabled
- ESLint uses `eslint-config-expo` flat config
- Typed routes enabled (`experiments.typedRoutes` in app.json)
- React Native Reanimated for animations
- Role-based UI: Use `hasRole()` from `useAuth()` to conditionally render features
- Tab visibility controlled via `href: null` in tab options based on user role
- File uploads must use native `fetch()` with FormData, not `apiFetch()`
- Offline mutations queued in AsyncStorage, synced on reconnection
