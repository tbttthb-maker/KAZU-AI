import { t } from './preferences';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Txt } from './primitives';
import { s } from './theme';
export default function Video({ uri, active, full = false }: { uri: string; active: boolean; full?: boolean }) {
 const ref = useRef<HTMLVideoElement>(null); const [muted,setMuted]=useState(true); const [paused,setPaused]=useState(false); const [failed,setFailed]=useState(false);
 useEffect(() => { const v=ref.current; if (!v) return; function update() { if (active && !paused && !document.hidden) void v!.play().catch(() => { if (v!.error) setFailed(true); else setPaused(true); }); else v!.pause(); } update(); document.addEventListener('visibilitychange',update); return () => { document.removeEventListener('visibilitychange',update); v.pause(); }; }, [active,paused,uri]);
 return <View style={[s.video, full && { flex: 1, aspectRatio: undefined }]}><video ref={ref} src={uri} playsInline loop muted={muted} preload="metadata" onError={() => setFailed(true)} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover'}} /><Pressable accessibilityRole="button" accessibilityLabel={t(paused ? 'تشغيل الفيديو' : 'إيقاف الفيديو')} style={StyleSheet.absoluteFill} onPress={() => setPaused(!paused)} />{paused && <View pointerEvents="none" style={s.play}><Icon name="play" color="#fff" size={38} /></View>}<Pressable accessibilityRole="button" accessibilityLabel={t(muted ? 'تشغيل الصوت' : 'كتم الصوت')} style={s.sound} onPress={() => setMuted(!muted)}><Icon name={muted ? 'volume-x' : 'volume-2'} size={18} color="#fff" /></Pressable>{failed && <View style={s.videoError}><Txt>تعذّر تشغيل الفيديو. جرّب ملف MP4 مدعومًا.</Txt></View>}</View>;
}
