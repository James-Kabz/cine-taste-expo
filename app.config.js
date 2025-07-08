
import 'dotenv/config';

export default {
  expo: {
    name: "CineTaste",
    slug: "cinetaste-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.cinetaste.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      package: "com.cinetaste.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: process.env.API_URL || "https://cinetaste-254.vercel.app/api",
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    },
    scheme: "cinetaste",
    plugins: [
      [
        "expo-status-bar",
        {
          style: "light"
        }
      ]
    ]
  }
};
