import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
// Exercise the actual startup functions with a simulated runtime, without a GPU or download.
const source = html.slice(html.indexOf('async function getRuntime()'), html.indexOf('function showEngineError(')).replace('import(url)', 'importRuntime(url)');
function fixture({ reload = async () => {}, importFailure = false, safe = false } = {}) {
  const elements = new Map(), instances = [], imports = [];
  const context = vm.createContext({
    setTimeout, clearTimeout, console,
    window: { isSecureContext: true },
    navigator: { gpu: { requestAdapter: async () => ({ features: new Set(['shader-f16']) }) } },
    $: id => {
      if (!elements.has(id)) elements.set(id, { textContent: '', hidden: false, value: 0, close() { this.closed = true; } });
      return elements.get(id);
    },
    importRuntime: async url => {
      imports.push(url);
      if (importFailure && imports.length === 1) throw new Error('test CDN unavailable');
      return { MLCEngine: class {
        constructor() { this.chat = { completions: { create() {} } }; this.unloads = 0; instances.push(this); }
        reload(...args) { this.reloadArguments = args; return reload(); }
        async unload() { this.unloads++; }
      } };
    },
  });
  vm.runInContext(`
    const trace={start(){},end(){},step(){},snapshot(){return {};}};const RUNTIMES=['primary','fallback'];const SAFE_LOCAL=${safe};const RECOVERY_MESSAGE='端末内AIを停止しています';
    let runtimePromise=null,engine=null,loadedModel='',loadVersion=0,loading=false;
    const state={model:'Qwen3-0.6B-q4f16_1-MLC'};
    const guard=()=>!loading,renderEngine=()=>{},toast=()=>{};
    const showEngineError=e=>{$('engineError').textContent=e.message;$('engineError').hidden=false;};
    ${source}
  `, context);
  return { run: code => vm.runInContext(code, context), elements, instances, imports };
}

test('startup creates the main-window engine and becomes ready only after reload completes', async () => {
  const f = fixture();
  await f.run('loadModel()');
  assert.equal(f.instances.length, 1);
  assert.equal(f.instances[0].reloadArguments[0], 'Qwen3-0.6B-q4f16_1-MLC');
  assert.equal(f.run('loadedModel'), 'Qwen3-0.6B-q4f16_1-MLC');
  assert.equal(f.run('loading'), false);
  assert.equal(f.elements.get('engineDialog').closed, true);
});

test('runtime diagnostic can recover from a failed CDN without loading model weights', async () => {
  const f = fixture({ importFailure: true });
  await f.run('checkRuntime()');
  assert.deepEqual(f.imports, ['primary', 'fallback']);
  assert.equal(f.instances[0].reloadArguments, undefined);
  assert.equal(f.instances[0].unloads, 1);
  assert.match(f.elements.get('gpuStatus').textContent, /取得・初期化：成功/);
  assert.equal(f.run('loadedModel'), '');
});

test('failed model reload releases the engine and reports the actual failing stage', async () => {
  const f = fixture({ reload: async () => { throw new Error('test model fetch failed'); } });
  await f.run('loadModel()');
  assert.equal(f.run('engine'), null);
  assert.equal(f.run('loading'), false);
  assert.equal(f.instances[0].unloads, 1);
  assert.match(f.elements.get('engineError').textContent, /モデルの読み込みで停止しました。test model fetch failed/);
});

test('cancelling a pending reload cannot later mark the cancelled model ready', async () => {
  let started, finish;
  const didStart = new Promise(resolve => { started = resolve; });
  const pending = new Promise(resolve => { finish = resolve; });
  const f = fixture({ reload: () => { started(); return pending; } });
  const load = f.run('loadModel()');
  await didStart;
  await f.run('unload()');
  finish();
  await load;
  assert.equal(f.run('loadedModel'), '');
  assert.equal(f.run('engine'), null);
  assert.equal(f.run('loading'), false);
  assert.ok(f.instances[0].unloads >= 1);
  assert.equal(f.elements.has('engineDialog'), false);
});

 test('recovery mode does not import, initialize or load the local AI runtime', async () => {
  const f = fixture({safe:true});
  await f.run('loadModel()');
  await f.run('checkRuntime()');
  assert.equal(f.imports.length,0);
  assert.equal(f.instances.length,0);
  assert.equal(f.run('loading'),false);
  assert.match(f.elements.get('engineError').textContent,/端末内AIを停止/);
});
