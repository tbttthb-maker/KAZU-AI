import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { completeOAuth } from '../../authProviders';
import { requireBackend } from '../../backend';
import { authFailure } from '../../authFlow';
import { Button, Txt } from '../../components';
import { usePreferences } from '../../preferences';
import { C, s } from '../../theme';
export default function Callback(){
 const {code,token_hash,type,error_description,error_code}=useLocalSearchParams<{code?:string;token_hash?:string;type?:string;error_description?:string;error_code?:string}>();const [error,setError]=useState('');const pref=usePreferences();
 useEffect(()=>{if(error_description||error_code)return;let live=true;void(async()=>{try{if(code)await completeOAuth(code);else if(token_hash&&(type==='signup'||type==='email')){const r=await requireBackend().auth.verifyOtp({token_hash,type});if(r.error)throw r.error;}else throw new Error(pref.language==='en'?'The confirmation link is incomplete. Return to sign in and request a new confirmation.':'رابط التأكيد ناقص. ارجع للتسجيل وافتح شاشة تأكيد البريد.');if(live)router.replace('/');}catch(e){if(live)setError(authFailure(e).message);}})();return()=>{live=false;};},[code,token_hash,type,error_description,error_code,pref.language]);
 const failure=error||(error_code?authFailure({code:error_code,message:error_description}).message:error_description);
 return <View style={[s.root,{padding:28,justifyContent:'center'}]}>{failure?<><Txt style={{lineHeight:25}}>{failure}</Txt><Button label="العودة" onPress={()=>router.replace('/')}/></>:<ActivityIndicator color={C.purple}/>}</View>;
}
