import React, { useEffect } from 'react';
import { restorePreferences } from '../preferences';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SocialProvider } from '../SocialContext';
export default function Layout() { useEffect(()=>{void restorePreferences();},[]); return <SafeAreaProvider><SocialProvider><Slot /></SocialProvider></SafeAreaProvider>; }
