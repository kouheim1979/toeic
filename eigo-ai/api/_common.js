export const TEXT_MODEL = 'openai/gpt-5.6-sol';
export const TRANSCRIPTION_MODEL = 'openai/whisper-1';
export const SPEECH_MODEL = 'openai/tts-1';
const DEFAULT_ORIGINS=new Set(['https://kouheim1979.github.io','http://localhost:8000','http://127.0.0.1:8000','http://localhost:3000','http://127.0.0.1:3000']);
function configuredOrigins(){const extra=String(process.env.ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);return new Set([...DEFAULT_ORIGINS,...extra]);}
export function applyCors(req,res){const origin=String(req.headers.origin||'');const allowed=configuredOrigins();if(origin&&allowed.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-User-ID');res.setHeader('Access-Control-Max-Age','86400');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return !origin||allowed.has(origin);}
export function preflight(req,res){const ok=applyCors(req,res);if(!ok){res.status(403).json({error:'Origin is not allowed'});return true;}if(req.method==='OPTIONS'){res.status(204).end();return true;}return false;}
export function requirePost(req,res){if(req.method!=='POST'){res.setHeader('Allow','POST,OPTIONS');res.status(405).json({error:'Method not allowed'});return false;}return true;}
export function cleanText(value,max=1000){if(typeof value!=='string')return '';return value.replace(/\u0000/g,'').trim().slice(0,max);}
export function safeUserId(req){return cleanText(req.headers['x-user-id'],80).replace(/[^a-zA-Z0-9_.:-]/g,'')||'anonymous';}
export function parseJsonText(text){const raw=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/i,'');const first=raw.indexOf('{'),last=raw.lastIndexOf('}');if(first<0||last<=first)throw new Error('Model did not return JSON');return JSON.parse(raw.slice(first,last+1));}
export function modelError(res,error){console.error(error);const status=Number(error?.statusCode||error?.status||500);if(status===429)return res.status(429).json({error:'AIの利用上限に達しました。少し時間をおいて再試行してください。'});return res.status(502).json({error:'AIサービスに接続できませんでした。時間をおいて再試行してください。'});}
