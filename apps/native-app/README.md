# Rwote Native App

Kotlin Android app with Jetpack Compose.

## Dependencies (Updated Apr 2025)

| Library | Version |
|---------|----------|
| Kotlin | 2.0.21 |
| AGP | 8.7.0 |
| Gradle | 8.11 |
| Compose BOM | 2025.04.00 |
| Compose Compiler | 1.5.14 |
| lifecycle | 2.8.7 |
| coroutines | 1.9.0 |

## Features
- Login/Sign up (Supabase auth)
- Add & fetch notes  
- Share intent to add notes from other apps

## Build
```bash
cd apps/native-app
./gradlew assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`

## Install
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```