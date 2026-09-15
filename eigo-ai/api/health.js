import {applyCors, TEXT_MODEL, TRANSCRIPTION_MODEL, SPEECH_MODEL} from './_common.js';

export default async function handler(req, res) {
  if (!applyCors(req, res)) return res.status(403).json({error: 'Origin is not allowed'});
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({error: 'Method not allowed'});
  return res.status(200).json({
    ok: true,
    service: 'eigo-quest-ai',
    version: '1.1.0',
    features: ['evaluate', 'chat', 'transcribe', 'tts', 'generate-drill'],
    models: {text: TEXT_MODEL, transcription: TRANSCRIPTION_MODEL, speech: SPEECH_MODEL}
  });
}
