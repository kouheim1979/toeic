import {experimental_generateSpeech as generateSpeech} from 'ai';
import {gateway} from '@ai-sdk/gateway';
import {preflight,requirePost,cleanText,modelError,SPEECH_MODEL} from './_common.js';
const VOICES=new Set(['alloy','ash','ballad','coral','echo','fable','nova','onyx','sage','shimmer']);
export default async function handler(req,res){if(preflight(req,res)||!requirePost(req,res))return;const text=cleanText(req.body?.text,900),voiceRaw=cleanText(req.body?.voice||'alloy',30),voice=VOICES.has(voiceRaw)?voiceRaw:'alloy';if(!text)return res.status(400).json({error:'text が必要です'});try{const speech=await generateSpeech({model:gateway.speechModel(SPEECH_MODEL),text,voice,outputFormat:'mp3',instructions:'Speak clear, friendly English for a language learner. Natural rhythm, not exaggerated.'});const audio=Buffer.from(speech.audio.uint8Array).toString('base64');return res.status(200).json({audio,mediaType:'audio/mpeg'});}catch(error){return modelError(res,error);}}
