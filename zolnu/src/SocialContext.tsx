import React, { createContext, useContext } from 'react';
import { useSocial } from './useSocial';
const SocialContext = createContext<ReturnType<typeof useSocial> | null>(null);
export function SocialProvider({ children }: { children: React.ReactNode }) { const social=useSocial(); return <SocialContext.Provider value={social}>{children}</SocialContext.Provider>; }
export function useSocialContext() { const social=useContext(SocialContext); if(!social) throw new Error('Missing social provider'); return social; }
