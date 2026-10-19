import React, { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Icon, Txt } from './primitives';
import { s } from './theme';
export default function Video({ uri, active, full = false }: { uri: string; active: boolean; full?: boolean }) {
 const [muted, setMuted] = useState(true); const [paused, setPaused] = useState(false); const [failed, setFailed] = useState(false);
 const player = useVideoPlayer(uri, p => { p.loop = true; p.muted = true; });
 useEffect(() => { if (active && !paused) player.play(); else player.pause(); }, [active, paused, player]);
 // eslint-disable-next-line react-hooks/immutability -- Expo exposes a mutable native VideoPlayer handle.
 useEffect(() => { player.muted = muted; }, [muted, player]);
 useEffect(() => { const listener = player.addListener('statusChange', ({ status }) => setFailed(status === 'error')); const app = AppState.addEventListener('change', state => { if (state === 'active' && active && !paused) player.play(); else player.pause(); }); return () => { listener.remove(); app.remove(); }; }, [player, active, paused]);
 return <View style={[s.video, full && { flex: 1, aspectRatio: undefined }]}><VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} fullscreenOptions={{ enable: false }} /><Pressable accessibilityLabel={paused ? 'تشغيل الفيديو' : 'إيقاف الفيديو'} accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={() => setPaused(!paused)} />{paused && <View pointerEvents="none" style={s.play}><Icon name="play" size={38} /></View>}<Pressable accessibilityRole="button" accessibilityLabel={muted ? 'تشغيل الصوت' : 'كتم الصوت'} style={s.sound} onPress={() => setMuted(!muted)}><Icon name={muted ? 'volume-x' : 'volume-2'} size={18} /></Pressable>{failed && <View style={s.videoError}><Txt>تعذّر تشغيل الفيديو. تحقق من اتصالك.</Txt></View>}</View>;
}
