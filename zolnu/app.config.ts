import type { ExpoConfig } from 'expo/config';
if (process.env.ZOLNU_RELEASE === '1') {
 for (const key of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'APP_IDENTIFIER', 'EAS_PROJECT_ID']) {
  if (!process.env[key]) throw new Error(`Production build requires ${key}. See README-AR.md.`);
 }
}
const config: ExpoConfig = {
 name: 'ZOLNU', slug: 'zolnu', version: '0.3.1', platforms: ['ios'], scheme: 'zolnu',
 orientation: 'portrait', userInterfaceStyle: 'light', icon: './assets/icon.png',
 backgroundColor: '#ffffff',
 ios: { supportsTablet: false, bundleIdentifier: process.env.APP_IDENTIFIER || 'dev.zolnu.preview', buildNumber: '4', infoPlist: { ITSAppUsesNonExemptEncryption: false, NSPhotoLibraryUsageDescription: 'زولنو يحتاج الوصول للصور والفيديوهات اللي تختار تنشرها.' } },
 web: { favicon: './assets/favicon.png', name: 'ZOLNU' },
 plugins: [['expo-router', { asyncRoutes: false }], 'expo-asset', 'expo-video', ['expo-image-picker', { photosPermission: 'اختار صورة أو فيديو تشاركه على زولنو.', cameraPermission: false, microphonePermission: false }]],
 extra: process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {},
};
export default config;
