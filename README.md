
# CineTaste - React Native + Expo App

CineTaste is a mobile application built with React Native and Expo that allows users to discover, track, and manage their favorite movies and TV shows.

## Features

- 🎬 **Discover Movies & TV Shows**: Browse popular, top-rated, now playing, and upcoming content
- 🔍 **Search**: Find any movie or TV show with intelligent search
- 📚 **Watchlist**: Save movies and shows to watch later
- ✅ **Mark as Watched**: Track what you've already seen
- 📱 **Beautiful UI**: Clean, Netflix-inspired design
- 🔐 **Google Authentication**: Secure sign-in with Google
- 📊 **User Profile**: View your stats and preferences

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Expo Image** for optimized image loading
- **Expo Auth Session** for Google OAuth
- **AsyncStorage** for local data persistence
- **Axios** for API calls

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI
- Expo Go app on your mobile device

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd CineTasteApp
npm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```
API_URL=https://cinetaste-254.vercel.app/api
GOOGLE_WEB_CLIENT_ID=your_google_web_client_id_here
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Add your redirect URIs
5. Copy the Web Client ID to your `.env` file

### 4. Running the App

```bash
# Start the development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator  
npx expo start --android

# Scan QR code with Expo Go app for physical device testing
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── MovieCard.tsx
│   ├── SearchBar.tsx
│   ├── LoadingSpinner.tsx
│   ├── WatchlistButton.tsx
│   └── ErrorBoundary.tsx
├── screens/            # App screens
│   ├── HomeScreen.tsx
│   ├── SearchScreen.tsx
│   ├── WatchlistScreen.tsx
│   ├── MovieDetailScreen.tsx
│   ├── ProfileScreen.tsx
│   └── AuthScreen.tsx
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── hooks/             # Custom hooks
│   ├── useMovies.ts
│   └── useWatchlist.ts
├── services/          # API services
│   ├── apiService.ts
│   └── authService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
└── utils/             # Utility functions and constants
    └── constants.ts
```

## API Integration

The app integrates with the CineTaste backend API for:

- **Authentication**: Google OAuth sign-in/out
- **Movies**: Browse categories, search, get details
- **Watchlist**: Add, remove, mark as watched
- **Recently Viewed**: Track viewing history

All API calls are handled through the service layer with proper error handling and loading states.

## Building for Production

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Using Expo Build (Legacy)

```bash
# Build APK for Android
npx expo build:android

# Build IPA for iOS
npx expo build:ios
```

## Development Notes

- **Hot Reloading**: Changes are automatically reflected during development
- **Error Boundaries**: Comprehensive error handling with user-friendly messages
- **Type Safety**: Full TypeScript integration for better development experience
- **Responsive Design**: Optimized for various screen sizes
- **Performance**: Optimized images and lazy loading

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
