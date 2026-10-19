import React from 'react';
import { Text } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { C, s } from './theme';
export type IconName = React.ComponentProps<typeof Feather>['name'];
export function Icon({ name, color = C.text, size = 22 }: { name: IconName; color?: string; size?: number }) { return <Feather name={name} color={color} size={size} />; }
export function Txt({ children, style, ...props }: any) { return <Text {...props} style={[s.text, style]}>{children}</Text>; }
