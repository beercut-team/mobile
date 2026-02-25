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

**Routing:** Expo Router file-based routing in `/app`. Tab navigation via `/(tabs)` route group with bottom tabs. Modal screens use `presentation: 'modal'` in the Stack navigator.

**Theming:** Light/dark mode via `useColorScheme()` hook. Colors defined in `/constants/theme.ts`. Theme-aware components (`ThemedText`, `ThemedView`) accept optional `lightColor`/`darkColor` props.

**Platform-specific code:** Uses file extensions (`.ios.tsx`, `.web.ts`) for platform variants. Icons use SF Symbols on iOS, MaterialIcons on Android/Web. Haptic feedback is iOS-only.

**Path alias:** `@/*` maps to project root (configured in tsconfig.json).

## Key Conventions

- TypeScript strict mode is enabled
- ESLint uses `eslint-config-expo` flat config
- Typed routes enabled (`experiments.typedRoutes` in app.json)
- React Native Reanimated for animations
