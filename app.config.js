import 'dotenv/config';

export default {
  expo: {
    name: "HealthMdv1",
    slug: "HealthMdv1",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
       "OPENROUTER_API_KEY": process.env.OPENROUTER_API_KEY || "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",
       "GEMINI_API_KEY": process.env.GEMINI_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    }
  }
};
