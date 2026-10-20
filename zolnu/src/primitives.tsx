import React from 'react';
import { Text } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { C, s } from './theme';
import { translateNode, usePreferences } from './preferences';
export type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({ name, color = C.text, size = 22 }: { name: IconName; color?: string; size?: number }) { return <Feather name={name} color={color} size={size} />; }
export function Txt({ children, style, translate=true, ...props }: any) { const pref=usePreferences(); return <Text {...props} style={[s.text, style, pref.language==='en'&&{writingDirection:'ltr',textAlign:style?.textAlign==='center'?'center':'left'}]}>{translate?translateNode(children):children}</Text>; }
