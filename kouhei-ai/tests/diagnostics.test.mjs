import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const source=html.match(/<script id="kouhei-diagnostics">([\s\S]*?)<\/script>/)[1];
const context=vm.createContext({setTimeout,clearTimeout,Uint32Array});
vm.runInContext(source,context);
const D=vm.runInContext('KouheiDiagnostics',context);

test('journal preserves the last unfinished step across a page restart',()=>{
  let value;
  const storage={getItem:()=>value,setItem:(_,v)=>{value=v;}};
  const first=D.journal(storage);first.start('model-start');first.step('model-reload');
  const next=D.journal(storage);
  assert.equal(next.snapshot().previous.code,'model-reload');
  next.start('diagnostic-start');next.end('diagnostic-passed');
  assert.equal(JSON.parse(value).active,null);
  for(let i=0;i<100;i++)next.record('test-event');
  assert.equal(next.snapshot().events.length,60);
});

test('missing GPU finishes without importing a model or runtime',async()=>{
  const result=await D.probeGPU(undefined);
  assert.equal(result.ok,false);
  assert.equal(result.reason,'gpu-unavailable');
});

function fakeGPU(fail=false){
  const buffers=[];let destroyed=false;
  const device={
    createBuffer:options=>{const b={...options,destroyed:false,destroy(){this.destroyed=true;},mapAsync:async()=>{},getMappedRange:()=>new Uint32Array([2,4,6,8]).buffer,unmap(){}};buffers.push(b);return b;},
    queue:{writeBuffer(){},submit(){}},createShaderModule:()=>({}),
    createComputePipelineAsync:async()=>{if(fail)throw new Error('shader failure');return {getBindGroupLayout:()=>({})};},
    createBindGroup:()=>({}),
    createCommandEncoder:()=>({beginComputePass:()=>({setPipeline(){},setBindGroup(){},dispatchWorkgroups(){},end(){}}),copyBufferToBuffer(){},finish(){return {};}}),
    destroy(){destroyed=true;},
  };
  return {gpu:{requestAdapter:async()=>({features:new Set(['shader-f16']),limits:{maxBufferSize:1024,maxStorageBufferBindingSize:512},requestDevice:async()=>device})},buffers,isDestroyed:()=>destroyed};
}

test('small compute probe uses only two 16-byte buffers and frees them on success',async()=>{
  const f=fakeGPU(),stages=[];
  const result=await D.probeGPU(f.gpu,s=>stages.push(s));
  assert.equal(result.ok,true);
  assert.deepEqual(f.buffers.map(b=>b.size),[16,16]);
  assert.ok(f.buffers.every(b=>b.destroyed));assert.ok(f.isDestroyed());
  assert.equal(stages.at(-1),'gpu-passed');
});

test('GPU resources are also destroyed if shader initialization fails',async()=>{
  const f=fakeGPU(true);
  await assert.rejects(D.probeGPU(f.gpu),/shader failure/);
  assert.ok(f.buffers.every(b=>b.destroyed));assert.ok(f.isDestroyed());
});

test('timeout returns promptly if adapter lookup hangs',async()=>{
  await assert.rejects(D.probeGPU({requestAdapter:()=>new Promise(()=>{})},()=>{},10),/GPU_TIMEOUT/);
});
