import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { completeOAuth } from '../../authProviders';
import { Button, Txt } from '../../components';
import { C, s } from '../../theme';
export default function Callback(){const {code,error_description}=useLocalSearchParams<{code?:string;error_description?:string}>();const [error,setError]=useState('');useEffect(()=>{if(error_description)return;if(code)void completeOAuth(code).then(()=>router.replace('/')).catch(e=>setError(e.message));else router.replace('/');},[code,error_description]);return <View style={[s.root,{padding:28,justifyContent:'center'}]}>{(error||error_description)?<><Txt>{error||error_description}</Txt><Button label="العودة" onPress={()=>router.replace('/')}/></>:<ActivityIndicator color={C.purple}/>}</View>;}
