import React from 'react';
import { t } from './preferences';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, IconName, Txt } from './primitives';
import { Frame, Profile } from './model';
import { C, s } from './theme';
export { Icon, IconName, Txt } from './primitives';
export { default as Video } from './Video';
export const art = [require('../assets/dunes.png'), require('../assets/orbit.png'), require('../assets/bloom.png')];
export function Brand({ small = false }: { small?: boolean }) { return <Text style={small ? s.brandSmall : s.brand}>zolnu</Text>; }
export function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) { return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[s.button, secondary && s.secondary, disabled && { opacity: .45 }]}><Txt style={{ color: secondary ? C.text : C.bg==='#ffffff'?'#fff':'#07121b', fontWeight: '700', textAlign: 'center' }}>{label}</Txt></Pressable>; }
export const FRAMES: { id: Frame; label: string; colors: [string, string, ...string[]] }[] = [
 { id: 'none', label: 'بدون إطار', colors: ['transparent','transparent'] },
 { id: 'aurora', label: 'أورورا', colors: ['#8bf5d5','#af8dff','#faafd7'] },
 { id: 'solar', label: 'شمسي', colors: ['#ffcf68','#fa936b','#ffe6a3'] },
 { id: 'neon', label: 'نيون', colors: ['#58c4ff','#a665ff','#e888f9'] },
 { id: 'founder', label: 'المؤسس', colors: ['#b6dbff','#797bff','#d7cbff'] },
];
export function Avatar({ user, size = 42, onPress }: { user?: Profile; size?: number; onPress?: () => void }) {
 const frame = FRAMES.find(f => f.id === user?.frame) || FRAMES[0]; const inset = frame.id === 'none' ? 0 : Math.max(3, size * .06);
 const content=<LinearGradient colors={frame.colors} start={{x:0,y:0}} end={{x:1,y:1}} style={{ width: size, height: size, padding: inset, borderRadius: size / 2 }}><View style={{ flex: 1, width:'100%', borderRadius: size / 2, overflow:'hidden', backgroundColor: user?.color ?? C.purple, alignItems:'center',justifyContent:'center', borderWidth: inset ? 2 : 0, borderColor: C.bg }}>{user?.avatarUri ? <Image source={{uri:user.avatarUri}} style={{width:'100%',height:'100%'}} /> : <Text style={{color:'#24202c',fontWeight:'800',fontSize:size*.36}}>{user?.name.slice(0,1)||'Z'}</Text>}</View>{frame.id === 'founder' && <View style={{position:'absolute',bottom:-3,right:-2,backgroundColor:'#8178e7',padding:3,borderRadius:20}}><Icon name="star" size={size*.19} /></View>}{user?.identityVerifiedAt && <View style={{position:'absolute',bottom:-2,left:-2,backgroundColor:C.bg,borderRadius:30,padding:1}}><VerifiedSeal size={Math.max(18,size*.28)}/></View>}</LinearGradient>;
 return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={user?.name || t('الملف الشخصي')} onPress={onPress}>{content}</Pressable> : <View accessibilityRole="image" accessibilityLabel={user?.name || 'الصورة الشخصية'}>{content}</View>;
}
export function VerifiedSeal({size=20}:{size?:number}) { return <View accessibilityRole="image" accessibilityLabel={t("حساب موثّق بعد مراجعة الملكية")} style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}><View style={{position:'absolute',width:size*.55,height:size*.55,borderRadius:size,backgroundColor:'#fff'}}/><MaterialIcons name="verified" size={size} color="#169bfa"/></View>; }
export function Badge({ user, size = 15 }: { user?: Profile; size?: number }) { return <View style={{flexDirection:'row',gap:4,alignItems:'center'}}>{user?.identityVerifiedAt&&<VerifiedSeal size={size+6}/>}{user?.badge==='founder'&&<View accessibilityLabel={t("شارة مؤسس دائمة")}><Icon name="star" color="#d6b46b" size={size}/></View>}</View>; }
export function UserName({ user, large = false }: { user?: Profile; large?: boolean }) { return <View style={{flexDirection:'row-reverse',alignItems:'center',gap:7,flexWrap:'wrap'}}><Txt translate={false} style={[s.name,large&&{fontSize:23}]}>{user?.name||'مستخدم'}</Txt><Badge user={user} size={large?17:10}/></View>; }
export function Empty({ title, body, icon = 'inbox' }: { title: string; body: string; icon?: IconName }) { return <View style={s.empty}><View style={s.emptyIcon}><Icon name={icon} color={C.purple} size={30} /></View><Txt style={s.emptyTitle}>{title}</Txt><Txt style={s.emptyText}>{body}</Txt></View>; }
export function MediaImage({ uri, artIndex, style }: { uri: string; artIndex?: number; style?: any }) { return <View style={[style || s.postImage, { overflow: 'hidden' }]}><Image accessibilityLabel={t("صورة المنشور")} source={artIndex !== undefined ? art[artIndex] : { uri }} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /></View>; }
