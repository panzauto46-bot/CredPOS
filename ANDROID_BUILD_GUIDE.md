# CredPOS - Android Build Guide

## Struktur Project

CredPOS adalah aplikasi Point of Sale (POS) yang dibangun dengan:
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Native Wrapper**: Capacitor (untuk Android)

## Prerequisites

1. **Node.js** (versi 18+)
2. **Android Studio** (versi terbaru direkomendasikan)
3. **Android SDK** (API Level 34+ direkomendasikan)
4. **JDK 17** (biasanya sudah termasuk di Android Studio)

## Cara Membuka di Android Studio

### Langkah 1: Install Dependencies & Build
```bash
# Install npm dependencies
npm install

# Build web app dan sync ke Android
npm run android:sync
```

### Langkah 2: Buka di Android Studio
Ada dua cara untuk membuka project Android:

#### Cara 1: Via Command Line
```bash
npm run android:open
```

#### Cara 2: Manual
1. Buka Android Studio
2. Pilih "Open"
3. Navigate ke folder: `CredPOS/android`
4. Klik "Open"

### Langkah 3: Build APK

1. Tunggu Gradle sync selesai (progress bar di bagian bawah Android Studio)
2. Pilih menu **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. APK akan tersimpan di: `android/app/build/outputs/apk/debug/app-debug.apk`

### Langkah 4: Build Release APK (untuk di-publish)

1. Generate signing key (jika belum ada):
   ```bash
   keytool -genkey -v -keystore credpos-release.keystore -alias credpos -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Di Android Studio: **Build > Generate Signed Bundle / APK**
3. Pilih APK
4. Pilih keystore file dan masukkan credentials
5. Pilih "release" build variant
6. APK release akan tersimpan di: `android/app/release/app-release.apk`

## NPM Scripts

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Jalankan app di browser (development) |
| `npm run build` | Build web app ke folder `dist` |
| `npm run android:sync` | Build web dan sync ke Android project |
| `npm run android:open` | Buka Android Studio |
| `npm run android:build` | Build + sync + buka Android Studio |

## Workflow Development

Setiap kali ada perubahan kode:
1. Edit kode React/TypeScript seperti biasa
2. Jalankan `npm run android:sync`
3. Di Android Studio, klik Run (▶️) untuk test di emulator/device

## Konfigurasi App

File konfigurasi utama:
- `capacitor.config.ts` - Konfigurasi Capacitor (App ID, nama, dll)
- `android/app/build.gradle` - Konfigurasi build Android
- `android/app/src/main/res/values/` - Resources (strings, colors, styles)

### Mengubah Package Name
1. Edit `appId` di `capacitor.config.ts`
2. Jalankan `npm run android:sync`

### Mengubah App Name
1. Edit `appName` di `capacitor.config.ts`
2. Atau edit `android/app/src/main/res/values/strings.xml`

### Mengubah App Icon
1. Gunakan Android Studio: **Right-click res > New > Image Asset**
2. Atau replace file di folder `android/app/src/main/res/mipmap-*`

## Troubleshooting

### Gradle sync gagal
- Pastikan Android SDK sudah terinstall
- Cek koneksi internet
- Di Android Studio: **File > Invalidate Caches / Restart**

### App tidak muncul perubahan terbaru
- Jalankan `npm run android:sync` 
- Clean build: Di Android Studio **Build > Clean Project**

### Error saat build
- Pastikan JDK 17 terinstall
- Update Gradle wrapper jika diminta

## Info Package

- **Package Name**: `com.credpos.app`
- **App Name**: CredPOS
- **Min SDK**: 23 (Android 6.0)
- **Target SDK**: 35 (Android 15)
