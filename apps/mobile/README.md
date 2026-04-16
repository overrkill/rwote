# Rwote Mobile App

A React Native mobile app built with Expo SDK 55 for the Rwote notes/insights app.

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Create `.env` file with:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### 3. Generate Native Projects

```bash
pnpm expo prebuild
```

This creates the `android/` and `ios/` directories.

### 4. Android Setup

#### Get SHA-1 Fingerprint

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### Google Cloud Console

1. Create an **Android OAuth client**:
   - Package name: `com.rwote.app`
   - SHA-1 fingerprint: (from above command)

2. Create a **Web OAuth client**:
   - Get the client ID for `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

#### Supabase Dashboard

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google sign-in
3. Add your **Web Client ID**
4. Enable "Skip nonce check"

#### Add Google Play Services

In `android/app/build.gradle`:

```groovy
dependencies {
    // ... existing deps
    implementation 'com.google.android.gms:play-services-auth:21.2.0'
}
```

### 5. Build & Run

```bash
# Development build
pnpm expo run:android

# Or build APK directly
cd android && ./gradlew assembleDebug
```

## Native Modules

### Google Sign-In (`modules/google-sign-in/`)

Custom Expo module for native Google Sign-In using the Google Play Services Auth SDK.

**Features:**
- Native Google Sign-In popup
- Returns ID token for Supabase authentication
- Supports sign out and session check

**API:**

```typescript
import GoogleSignIn from '../../modules/google-sign-in';

// Configure with your Google Web Client ID
await GoogleSignIn.configure('web-client-id');

// Sign in - opens native Google dialog
const result = await GoogleSignIn.signIn();
// Returns: { idToken, accessToken, email, displayName, id }

// Check if user is signed in
const isSignedIn = await GoogleSignIn.isSignedIn();

// Sign out
await GoogleSignIn.signOut();
```

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
├── modules/
│   └── google-sign-in/    # Native Google Sign-In module
├── src/
│   ├── app/               # Route components
│   ├── components/        # UI components
│   ├── stores/            # Zustand stores
│   └── lib/               # Utilities
└── android/               # Generated native project
```

## Development

```bash
# Start Metro bundler
pnpm expo start

# Lint
pnpm lint
```
