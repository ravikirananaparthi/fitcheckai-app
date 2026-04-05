# FitCheck AI — Frontend (React Native / Expo)

## Project Overview
AI-powered personal fashion assistant mobile app. Built with Expo SDK 54 + React Native 0.81. Uses Expo Router for file-based navigation, React Query for server state, Zustand for local state.

## Key Tech
- **Routing**: Expo Router v6 (file-based, like Next.js App Router)
- **State**: Zustand (local/persistent) + React Query (server/cache)
- **HTTP**: Axios with JWT interceptor (`src/services/api/client.ts`)
- **UI**: FlashList, Reanimated, Moti, Skia, Lottie
- **Storage**: AsyncStorage for tokens + user prefs

## Folder Structure
```
app/
  (tabs)/
    index.tsx          ← Home feed
    ai-stylist.tsx     ← FitCheck upload + results + chat
    wardrobe.tsx        ← Wardrobe grid + outfit builder
    profile.tsx         ← Profile + calendar + persona
  (auth)/              ← Phone OTP screens (Phase D — build last)
  _layout.tsx          ← Root layout + providers

src/
  screens/             ← Screen-level components
  components/          ← Reusable UI components
  services/api/        ← All API service files
    client.ts          ← Axios instance (add new services here)
    fitcheck.service.ts
    wardrobe.service.ts
    outfits.service.ts
    chat.service.ts
    calendar.service.ts
  store/slices/        ← Zustand stores
  hooks/               ← Custom React hooks
  types/               ← TypeScript types
  config/env.ts        ← Backend URL + env vars
```

## Backend URL
Update `src/config/env.ts` when backend URL changes:
```typescript
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
```

## Dev Auth Header
Until Phase D (auth), pass dev user ID header on all API calls:
```typescript
// In client.ts interceptor, add temporarily:
config.headers['x-dev-user-id'] = 'dev-user-001';
```

## Tab Build Order
1. `ai-stylist.tsx` — Phase A (AI Core)
2. `wardrobe.tsx` — Phase B
3. `profile.tsx` — Phase C (calendar, persona)
4. `(auth)/` — Phase D (build last)

## Component Conventions
- Use `FlashList` for all scrollable lists (never FlatList/ScrollView for data lists)
- Use `Reanimated` for animations, never `Animated` from react-native
- Use `expo-image` for all images (not react-native Image)
- Use `@lodev09/react-native-true-sheet` for bottom sheets
- Icons: `lucide-react-native` for UI icons, `@expo/vector-icons` for tab bar

## API Service Pattern
```typescript
// src/services/api/fitcheck.service.ts
export const fitcheckService = {
  analyze: (formData: FormData) =>
    apiClient.post<FitCheckResult>('/fitcheck/analyze', formData),

  getHistory: (cursor?: string) =>
    apiClient.get<CursorPaginated<FitCheck>>('/fitcheck/history', { params: { cursor } }),

  sendChatMessage: (fitCheckId: string, message: string) =>
    apiClient.post<ChatMessage>(`/fitcheck/${fitCheckId}/chat`, { message }),
};
```

## Running Locally
```bash
npx expo start          # Start dev server
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
```
