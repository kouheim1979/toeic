import {experimental_transcribe as transcribe} from 'ai';
import {gateway} from '@ai-sdk/gateway';
import {preflight, requirePost, cleanText, modelError, TRANSCRIPTION_MODEL} from './_common.js';

function normalizeMediaType(value) {
  const raw = cleanText(value || 'audio/webm', 100).toLowerCase().split(';')[0].trim();
  if (raw === 'video/mp4') return 'audio/mp4';
  if (raw === 'video/webm') return 'audio/webm';
  const allowed = new Set(['audio/webm','audio/mp4','audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg','audio/flac','audio/m4a']);
  return allowed.has(raw) ? raw : 'audio/webm';
}

async function transcribeDirect(audio, mediaType) {
  const key = process.env.AI_GATEWAY_API_KEY;
  if (!key) return null;
  const response = await fetch('https://ai-gateway.vercel.sh/v4/ai/transcription-model', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'ai-model-id': TRANSCRIPTION_MODEL,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({audio, mediaType})
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(body?.error?.message || body?.error || `AI Gateway transcription ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return body;
}

export default async function handler(req, res) {
  if (preflight(req, res) || !requirePost(req, res)) return;
  const audio = typeof req.body?.audio === 'string' ? req.body.audio : '';
  const mediaType = normalizeMediaType(req.body?.mediaType);
  if (!audio) return res.status(400).json({error: 'audio が必要です'});
  if (audio.length > 4_000_000) return res.status(413).json({error: '音声が大きすぎます。短く録音してください。'});
  try {
    const bytes = Buffer.from(audio, 'base64');
    if (!bytes.length || bytes.length > 3_000_000) return res.status(413).json({error: '音声サイズが不正です'});

    const direct = await transcribeDirect(audio, mediaType);
    if (direct) {
      return res.status(200).json({
        text: cleanText(direct.text, 1200),
        language: direct.language || 'en',
        durationInSeconds: direct.durationInSeconds || null,
        mediaType,
        engine: 'gateway-rest'
      });
    }

    const result = await transcribe({
      model: gateway.transcriptionModel(TRANSCRIPTION_MODEL),
      audio: bytes
    });
    return res.status(200).json({
      text: cleanText(result.text, 1200),
      language: result.language || 'en',
      durationInSeconds: result.durationInSeconds || null,
      mediaType,
      engine: 'ai-sdk'
    });
  } catch (error) {
    console.error('transcription failed', {mediaType, message: error?.message, status: error?.status || error?.statusCode});
    return modelError(res, error);
  }
}
