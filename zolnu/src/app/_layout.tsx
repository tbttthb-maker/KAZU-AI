import React from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SocialProvider } from '../SocialContext';
export default function Layout() { return <SafeAreaProvider><SocialProvider><Slot /></SocialProvider></SafeAreaProvider>; }
