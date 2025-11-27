# 🎬 MyTube - Ad-Free YouTube (Desktop & Android)

**Created by MK Shaon**

A cross-platform YouTube client with built-in ad blocking, progress saving, and more. Available for Windows desktop and Android phones.

## 🌟 Features

- ✅ **Ad Blocking** - Removes all video ads, banner ads, and sponsored content
- ✅ **Hide Shorts** - Optional YouTube Shorts filtering
- ✅ **Progress Saving** - Resume long videos where you left off
- ✅ **Session Keep-Alive** - No "are you still watching" prompts
- ✅ **Full YouTube Experience** - Sign in, comments, playlists, subscriptions all work
- ✅ **Mobile & Desktop** - Works on Windows and Android
- ✅ **No External Browser** - YouTube loads directly inside the app

## 📋 Requirements

- **Node.js** 16+ and npm
- **Java JDK** 11+ (for Android builds)
- **Android SDK** (for Android APK builds)
- **Gradle** (included with Android SDK)

## 💻 Installation on Windows

### 1. Clone the Repository
```bash
git clone https://github.com/mkshaonexe/MyTube.git
cd MyTube
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run in Development Mode
```bash
npm run dev
```

The app will start with Vite dev server and Electron window.

## 🏗️ Building for Windows Desktop

### Build Production Version
```bash
npm run build
npm run electron:build
```

The built executable will be in `dist/` folder.

## 📱 Building for Android

### Prerequisites
1. Install Android SDK and set `ANDROID_HOME` environment variable
2. Ensure Java JDK is installed
3. Configure `local.properties` in `android/` folder:
```properties
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Build Android APK
```bash
npm run android:build
```

The APK will be generated at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Install on Android Device
```bash
# Connect your Android device via USB
npm run android:run
```

Or manually transfer the APK file and install it.

## 🚀 Available Scripts

### Desktop Development
```bash
npm run dev              # Start dev server + Electron
npm run build            # Build web assets
npm run electron:build   # Build Electron app
npm run start            # Run built Electron app
```

### Android Development
```bash
npm run android:init     # Initialize Android platform (first time only)
npm run android:sync     # Sync web assets to Android
npm run android:open     # Open Android Studio
npm run android:run      # Build and run on device
npm run android:build    # Build APK
```

## 🎮 Console Commands (Desktop)

Open DevTools (Ctrl+Shift+I) and use:

```javascript
window.NouTube.hideShorts()       // Hide YouTube Shorts
window.NouTube.showShorts()       // Show YouTube Shorts
window.NouTube.play()             // Play video
window.NouTube.pause()            // Pause video
window.NouTube.seekBy(30)         // Seek forward 30 seconds
```

## 🛠️ Tech Stack

### Desktop
- **Electron** - Desktop app framework
- **React** - UI library
- **Vite** - Build tool
- **TailwindCSS** - Styling

### Android
- **Capacitor** - Cross-platform framework
- **React** - UI library
- **Android WebView** - Native YouTube rendering
- **Java** - Native ad-blocking logic

## 📦 Project Structure

```
MyTube/
├── src/                    # React source code
│   ├── App.tsx            # Desktop app
│   ├── App.mobile.tsx     # Mobile app
│   └── main.tsx           # Entry point
├── electron/              # Electron main process
├── android/               # Android native code
│   └── app/src/main/
│       ├── java/my/tube/com/MainActivity.java
│       └── assets/noutube.js
├── capacitor.config.ts    # Capacitor configuration
└── package.json           # Dependencies
```

## 🔧 Configuration

### App Package Name
- **Desktop**: MyTube
- **Android**: `my.tube.com`

### Capacitor Config
Edit `capacitor.config.ts` to customize:
- App ID
- App name
- Android settings

## 🐛 Troubleshooting

### Android Build Issues
1. **SDK not found**: Set `ANDROID_HOME` environment variable
2. **Gradle error**: Run `./gradlew clean` in `android/` folder
3. **Port already in use**: Change port in `vite.config.ts`

### Desktop Build Issues
1. **Module not found**: Run `npm install` again
2. **Electron not starting**: Check Node.js version (16+)

## 📝 License

MIT License - Feel free to use and modify!

## 👨‍💻 Author

**MK Shaon**
- GitHub: [@mkshaonexe](https://github.com/mkshaonexe)
- MyTube: Ad-free YouTube for everyone
