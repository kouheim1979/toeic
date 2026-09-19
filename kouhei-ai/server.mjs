// Optional OpenAI gateway. No dependencies. Node.js 22 or newer.
import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const htmlPath = new URL('./index.html', import.meta.url);
const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

function validToken(actual, expected) {
  if (!expected || typeof actual !== 'string') return false;
  const a = Buffer.from(actual), b = Buffer.from(`Bearer ${expected}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createApp({
  apiKey = process.env.OPENAI_API_KEY || '',
  accessToken = process.env.APP_ACCESS_TOKEN || '',
  model = process.env.OPENAI_MODEL || 'gpt-6-astra',
  allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://kouheim1979.github.io,http://127.0.0.1:8787,http://localhost:8787').split(',').map(s => s.trim()).filter(Boolean),
  fetchImpl = fetch,
} = {}) {
  let activeRequests = 0;
  const recentRequests = [];
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Vary', 'Origin');
    const origin = req.headers.origin;
    if (origin && !allowedOrigins.includes(origin)) {
      json(res, 403, { error: 'この接続元は許可されていません。ALLOWED_ORIGINSを確認してください。' });
      return;
    }
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS' && req.url === '/api/chat') {
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '600',
      });
      res.end();
      return;
    }
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      try {
        const html = await readFile(htmlPath);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch { json(res, 500, { error: '画面を読み込めませんでした。' }); }
      return;
    }
    if (req.url !== '/api/chat') { json(res, 404, { error: '接続先が見つかりません。' }); return; }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      json(res, 405, { error: 'POSTで送信してください。' });
      return;
    }
    if (!validToken(req.headers.authorization, accessToken)) {
      json(res, 401, { error: '接続トークンを確認してください。' });
      return;
    }
    if (!apiKey) { json(res, 503, { error: 'サーバーにOPENAI_API_KEYが設定されていません。' }); return; }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
      json(res, 415, { error: 'JSON形式で送信してください。' }); return;
    }
    if (Number(req.headers['content-length']) > 150000) {
      json(res, 413, { error: '入力が大きすぎます。' }); return;
    }
    const now = Date.now();
    while (recentRequests[0] < now - 60000) recentRequests.shift();
    if (activeRequests >= 2 || recentRequests.length >= 12) {
      res.setHeader('Retry-After', '60');
      json(res, 429, { error: '少し待ってから再送してください。' }); return;
    }
    activeRequests++;
    recentRequests.push(now);
    let controller, timeout;
    const onClose = () => { if (!res.writableEnded) controller?.abort(); };
    res.on('close', onClose);
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 150000) { json(res, 413, { error: '入力が大きすぎます。' }); return; }
        chunks.push(chunk);
      }
      let data;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { json(res, 400, { error: 'JSONを読み取れませんでした。' }); return; }
      const messages = data?.messages;
      if (!Array.isArray(messages) || !messages.length || messages.length > 600 ||
          messages.some(m => !m || !['system', 'user', 'assistant'].includes(m.role) || typeof m.content !== 'string') ||
          messages.at(-1).role !== 'user' ||
          messages.reduce((sum, m) => sum + m.content.length, 0) > 20000) {
        json(res, 400, { error: '会話の形式か文字数を確認してください。' }); return;
      }
      controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), 150000);
      const response = await fetchImpl('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, input: messages.map(({ role, content }) => ({ role, content })), max_output_tokens: 2000, store: false }),
        signal: controller.signal,
        redirect: 'error',
      });
      if (!response.ok) {
        json(res, response.status === 429 ? 429 : 502, { error: response.status === 429 ? 'OpenAI APIの利用制限に達しました。残高や上限を確認してください。' : 'OpenAI APIに接続できません。サーバー側のキー・モデル設定を確認してください。' });
        return;
      }
      const result = await response.json();
      const reply = (result.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('\n').trim();
      if (!reply) { json(res, 502, { error: '回答が空でした。入力を短くして再送してください。' }); return; }
      json(res, 200, { reply: reply.slice(0, 30000) });
    } catch (error) {
      if (!res.destroyed && !res.writableEnded) json(res, error.name === 'AbortError' ? 504 : 502, { error: error.name === 'AbortError' ? '応答がタイムアウトしました。' : 'AIへの接続に失敗しました。しばらくして再送してください。' });
    } finally {
      clearTimeout(timeout);
      res.off('close', onClose);
      activeRequests--;
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.env.APP_ACCESS_TOKEN || process.env.APP_ACCESS_TOKEN.length < 24) {
    console.error('APP_ACCESS_TOKENに24文字以上のランダムな接続トークンを設定してください。READMEを参照してください。');
    process.exitCode = 1;
  } else {
    const port = Number(process.env.PORT || 8787);
    const host = process.env.HOST || '127.0.0.1';
    const server = createApp();
    server.headersTimeout = 15000;
    server.requestTimeout = 180000;
    server.listen(port, host, () => console.log(`Kouhei AI: http://${host}:${port} （接続トークンはAPP_ACCESS_TOKENの値）`));
  }
}
