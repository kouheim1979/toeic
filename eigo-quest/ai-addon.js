"use strict";
(()=>{
  const CONFIG_KEY="eigo_ai_config_v1";
  const DEFAULT_API="https://eigo-quest-ai-kouheim-3013.vercel.app";
  const baseCfg={apiBase:DEFAULT_API,aiVoice:false,preferNative:false,scenario:"daily",level:"A2-B1"};
  function loadCfg(){try{const x=JSON.parse(localStorage.getItem(CONFIG_KEY)||"{}");return {...baseCfg,...(x&&typeof x==="object"?x:{})};}catch(e){return {...baseCfg};}}
  let cfg=loadCfg();
  const st={status:"unknown",messages:[],busy:false,suggested:"",lastTranscript:"",generated:null,recording:false};
  let rec=null,stream=null,chunks=[],purpose="",recordTimer=null,recognition=null,audio=null,drillFeedback=null;
  const esc=v=>typeof h==="function"?h(v):String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const toast=t=>typeof showToast==="function"?showToast(t):alert(t);
  function saveCfg(){try{localStorage.setItem(CONFIG_KEY,JSON.stringify(cfg));}catch(e){}}
  function base(){return String(cfg.apiBase||"").trim().replace(/\/+$/,"");}
  function uid(){try{const k="eigo_ai_user_id";let v=localStorage.getItem(k);if(!v){v="u_"+crypto.getRandomValues(new Uint32Array(3)).join("_");localStorage.setItem(k,v);}return v;}catch(e){return"anonymous";}}
  async function req(path,body=null,timeout=40000){
    if(!base())throw Error("AIバックエンドURLが未設定です");
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),timeout);
    try{
      const r=await fetch(base()+path,{method:body?"POST":"GET",headers:{...(body?{"Content-Type":"application/json"}:{}),"X-User-ID":uid()},body:body?JSON.stringify(body):undefined,signal:ctl.signal,cache:"no-store"});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||`AI API ${r.status}`);return j;
    }finally{clearTimeout(timer);}
  }
  function statusHtml(){const c=st.status==="online"?"online":"offline",t=st.status==="online"?"● AI接続中":st.status==="checking"?"… 接続確認中":"○ AI未接続";return `<span class="ai-status ${c}">${t}</span>`;}
  async function health(show=true){
    st.status="checking";if(typeof render==="function")render();
    try{await req("/api/health",null,10000);st.status="online";if(show)toast("AIバックエンドに接続しました");if(typeof render==="function")render();return true;}
    catch(e){st.status="offline";if(show)toast(e.message||"AIに接続できません");if(typeof render==="function")render();return false;}
  }
  function settingsCard(){return `<section class="card ai-hero"><div class="section-title"><div><h2>🤖 AI機能</h2><p class="muted small">音声認識・AI先生・AI英会話・AI音声</p></div>${statusHtml()}</div><label class="strong small">AIバックエンドURL</label><input id="aiBaseInput" class="ai-url" inputmode="url" value="${esc(cfg.apiBase)}"><p class="muted small">APIキーはHTMLへ保存しません。Vercel側で管理します。</p><div class="setting"><div><strong>AI音声を使う</strong><div class="muted small">AI返答をクラウド音声で再生。OFFなら端末音声。</div></div><label class="switch"><input id="aiVoiceToggle" type="checkbox" ${cfg.aiVoice?"checked":""}><span class="slider"></span></label></div><div class="setting"><div><strong>端末のライブ音声認識を優先</strong><div class="muted small">OFFなら録音してAI文字起こしを優先。</div></div><label class="switch"><input id="aiNativeToggle" type="checkbox" ${cfg.preferNative?"checked":""}><span class="slider"></span></label></div><div class="toolbar" style="margin-top:12px"><button class="btn ai-purple" data-ai="save-config">保存して接続テスト</button><button class="btn soft" data-ai="open">AIモードを開く</button></div></section>`;}
  function aiHomeButton(){return `<button class="btn ai-purple" data-ai="open">🤖 AI英会話・先生</button>`;}
  function aiPlayCard(){return `<section class="card ai-hero"><div class="ai-title"><span class="ai-orb">AI</span><div><h2>AI英会話・AI先生</h2><p class="muted small">話す → 文字起こし → 文法チェック → 会話を続ける</p></div></div><button class="btn ai-purple" data-ai="open" style="margin-top:12px;width:100%">🎙️ AIモードを開く</button></section>`;}
  function renderAi(){
    const scenarios={daily:"日常会話",travel:"旅行",work:"仕事・会議",restaurant:"レストラン",free:"フリートーク"};
    root.innerHTML=`<section class="card ai-hero"><div class="section-title"><div class="ai-title"><span class="ai-orb">AI</span><div><span class="eyebrow">VOICE COACH</span><h2>しゃべって、直して、また話す。</h2></div></div>${statusHtml()}</div><p class="muted">英語を話すと文字起こしし、AIが会話を続けます。文法・語彙のミスは1つだけ短く直します。</p><div class="chips">${Object.entries(scenarios).map(([k,v])=>`<button class="chip" data-ai="scenario" data-value="${k}" style="${cfg.scenario===k?"background:#ece8ff;border-color:#a78bfa;color:#5b21b6":""}">${v}</button>`).join("")}</div><div class="toolbar" style="margin-top:12px"><button class="btn soft" data-ai="health">接続確認</button><button class="btn soft" data-ai="generate">🧠 苦手からAI問題</button></div></section>
      <section class="card"><div class="section-title"><h2>💬 AI英会話</h2><span class="tag">${esc(cfg.level)}</span></div><div class="ai-chat" id="aiChat">${st.messages.length?st.messages.map((m,i)=>`<div class="ai-bubble ${m.role}"><div class="ai-role">${m.role==="user"?"YOU":"AI COACH"}</div><div>${esc(m.content)}</div>${m.correction?`<div class="ai-note"><strong>✏️ ${esc(m.correction)}</strong><br>${esc(m.explanationJa||"")}</div>`:""}${m.role==="assistant"?`<button class="textbutton" data-ai="speak-message" data-i="${i}">🔊 この返答を聞く</button>`:""}</div>`).join(""):`<div class="empty"><div class="empty-emoji">🎧</div><p>英語で短く話してみよう。マイクでも文字入力でもOKです。</p></div>`}</div>${st.suggested?`<button class="chip" data-ai="suggested">💡 ${esc(st.suggested)}</button>`:""}<div class="ai-compose"><textarea id="aiText" maxlength="600" placeholder="英語を入力するか、マイクで話してください">${esc(st.lastTranscript)}</textarea><button class="ai-mic ${st.recording?"recording":""}" data-ai="mic-chat">${st.recording?"■":"🎙️"}</button></div><div class="toolbar" style="margin-top:10px"><button class="btn ai-purple" data-ai="send" ${st.busy?"disabled":""}>${st.busy?"AIが考え中…":"送信 →"}</button><button class="btn soft" data-ai="clear">会話をリセット</button></div><p class="small muted">AIは文字起こしされた英文の内容・文法を見ます。発音の良し悪しを直接採点するものではありません。</p></section>
      ${st.generated?`<section class="card"><h2>✨ AI追加ドリル</h2><div class="ai-generated"><span class="tag">${esc(st.generated.type)}</span><p class="source-sentence">${esc(st.generated.source)}</p><p><strong>${esc(st.generated.cueJa)}</strong></p><p class="muted">${esc(st.generated.cue)}</p><details><summary>見本を見る</summary><p class="model-sentence">${esc(st.generated.answer)}</p><p>${esc(st.generated.ja)}</p><p class="tip">💡 ${esc(st.generated.tip)}</p></details></div></section>`:""}`;
    requestAnimationFrame(()=>{const c=document.getElementById("aiChat");if(c)c.scrollTop=c.scrollHeight;});
  }
  async function chat(text){
    text=String(text||"").trim();if(!text||st.busy)return;
    st.messages.push({role:"user",content:text});st.lastTranscript="";st.busy=true;renderAi();
    try{const j=await req("/api/chat",{scenario:cfg.scenario,level:cfg.level,messages:st.messages.map(m=>({role:m.role,content:m.content}))});st.messages.push({role:"assistant",content:j.reply||"",correction:j.correction||"",explanationJa:j.explanationJa||""});st.suggested=j.suggestedReply||"";if(cfg.aiVoice&&j.reply)await aiSpeak(j.reply);}
    catch(e){st.messages.push({role:"assistant",content:"Sorry, I couldn't connect to the AI coach.",explanationJa:e.message});}
    finally{st.busy=false;renderAi();}
  }
  async function aiSpeak(text){
    if(!text)return;if(!cfg.aiVoice){speak(text);return;}
    try{const j=await req("/api/tts",{text,voice:"alloy"});if(!j.audio)throw Error("音声データなし");if(audio){audio.pause();audio=null;}audio=new Audio(`data:${j.mediaType||"audio/mpeg"};base64,${j.audio}`);await audio.play();}
    catch(e){toast("AI音声を使えないため端末音声で再生します");speak(text);}
  }
  function blob64(blob){return new Promise((ok,ng)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(",")[1]||"");r.onerror=ng;r.readAsDataURL(blob);});}
  function stopRecord(discard=false){clearTimeout(recordTimer);if(recognition){try{recognition.abort();}catch(e){}recognition=null;}if(rec&&rec.state!=="inactive")try{rec.stop();}catch(e){}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}if(discard){rec=null;chunks=[];purpose="";st.recording=false;}}
  async function nativeRec(why){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return false;stopRecord(true);const r=new SR();recognition=r;purpose=why;r.lang="en-US";r.interimResults=false;r.continuous=false;st.recording=true;render();r.onresult=e=>{const t=[...e.results].map(x=>x[0]?.transcript||"").join(" ").trim();st.recording=false;recognition=null;recognized(why,t);};r.onerror=()=>{st.recording=false;recognition=null;toast("端末の音声認識に失敗しました");render();};r.onend=()=>{if(st.recording){st.recording=false;render();}};try{r.start();return true;}catch(e){recognition=null;st.recording=false;return false;}
  }
  async function mic(why){
    if(st.recording){stopRecord();st.recording=false;render();return;}
    if(cfg.preferNative&&await nativeRec(why))return;
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){if(await nativeRec(why))return;toast("このブラウザでは録音できません");return;}
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];purpose=why;rec=new MediaRecorder(stream);rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onstop=async()=>{const blob=new Blob(chunks,{type:rec?.mimeType||"audio/webm"});stream?.getTracks().forEach(t=>t.stop());stream=null;st.recording=false;render();if(blob.size<500)return;try{toast("AIが文字起こし中…");const b=await blob64(blob);const j=await req("/api/transcribe",{audio:b,mediaType:blob.type||"audio/webm"},45000);recognized(why,j.text||"");}catch(e){toast(e.message||"文字起こしに失敗しました");}};rec.start();st.recording=true;render();recordTimer=setTimeout(()=>{if(rec?.state==="recording")rec.stop();},12000);}
    catch(e){toast("マイクを使えません。マイク許可を確認してください");stopRecord(true);render();}
  }
  function recognized(why,text){text=String(text||"").trim();if(!text){toast("英語を認識できませんでした");return;}if(why==="chat"){st.lastTranscript=text;if(state.screen==="ai")renderAi();chat(text);}else if(why==="drill")evaluateDrill(text);}
  async function evaluateDrill(transcript){const d=rItem();if(!d)return;drillFeedback={loading:true,transcript};renderDrill();try{const j=await req("/api/evaluate",{target:d.answer,transcript,cue:d.cue,source:d.source});drillFeedback=j;}catch(e){drillFeedback={error:e.message,transcript};}renderDrill();}
  function feedbackHtml(){const r=drillFeedback;if(!r)return"";if(r.loading)return`<div class="ai-eval">🤖 AI先生が確認中…</div>`;if(r.error)return`<div class="ai-eval"><strong>⚠️ ${esc(r.error)}</strong><p class="small">認識：${esc(r.transcript||"")}</p></div>`;return `<div class="ai-eval"><div class="grid two"><div class="ai-score">${Number(r.score)||0}</div><div><strong>${r.correct?"✅ 内容・文法はOK":"✏️ もう一歩"}</strong><p class="small">認識：${esc(r.transcript||"")}</p></div></div>${r.praise?`<p><strong>${esc(r.praise)}</strong></p>`:""}${r.corrected?`<p>おすすめ：<strong>${esc(r.corrected)}</strong></p>`:""}${r.explanationJa?`<p>${esc(r.explanationJa)}</p>`:""}${r.grammarPoint?`<p class="tip">💡 ${esc(r.grammarPoint)}</p>`:""}<p class="small muted">音声そのものの発音採点ではなく、文字起こしされた英文の内容・文法評価です。</p></div>`;}
  async function generate(){try{toast("AIが追加ドリルを作成中…");const recent=typeof dueDrills==="function"?dueDrills().slice(0,5).map(d=>d.answer):[];st.generated=await req("/api/generate-drill",{level:cfg.level,focus:"daily spoken English",recentMistakes:recent});state.screen="ai";render();}catch(e){toast(e.message||"AI問題を作れませんでした");}}

  const oldNavSection=navSection;navSection=function(){if(state.screen==="ai")return"play";return oldNavSection();};
  const oldRender=render;render=function(){if(state.screen==="ai"){updateTop();renderAi();return;}oldRender();};
  const oldHome=renderHome;renderHome=function(){oldHome();const cards=[...root.querySelectorAll("section.card")];const c=cards.find(x=>x.querySelector("h2")?.textContent.includes("すぐ遊ぶ"));const grid=c?.querySelector(".grid");if(grid&&!grid.querySelector('[data-ai="open"]'))grid.insertAdjacentHTML("beforeend",aiHomeButton());};
  const oldPlay=renderPlay;renderPlay=function(){oldPlay();root.insertAdjacentHTML("afterbegin",aiPlayCard());};
  const oldSettings=renderSettings;renderSettings=function(){oldSettings();root.insertAdjacentHTML("afterbegin",settingsCard());};
  const oldPrepare=prepareDrill;prepareDrill=function(){drillFeedback=null;oldPrepare();};
  const oldDrill=renderDrill;renderDrill=function(){oldDrill();if(data?.rems?.prefs?.mode!=="speak")return;const z=root.querySelector(".speak-zone");if(!z)return;if(!z.querySelector('[data-ai="judge"]'))z.insertAdjacentHTML("beforeend",`<button class="btn ai-purple ai-judge" data-ai="judge">🤖 AIに聞き取って判定</button><p class="small muted">AIは文字起こしした英文の内容・文法を確認します。</p>`);const old=z.querySelector(".ai-eval");if(old)old.remove();if(drillFeedback)z.insertAdjacentHTML("beforeend",feedbackHtml());};
  const oldCleanup=cleanupPractice;cleanupPractice=function(){oldCleanup();stopRecord(true);};

  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-ai]");if(!b)return;const a=b.dataset.ai;
    if(a==="open"){go("ai");if(st.status==="unknown")health(false);}
    else if(a==="save-config"){cfg.apiBase=(document.getElementById("aiBaseInput")?.value||"").trim().replace(/\/+$/,"");cfg.aiVoice=!!document.getElementById("aiVoiceToggle")?.checked;cfg.preferNative=!!document.getElementById("aiNativeToggle")?.checked;saveCfg();health();}
    else if(a==="health")health();
    else if(a==="scenario"){cfg.scenario=b.dataset.value;saveCfg();renderAi();}
    else if(a==="send")chat(document.getElementById("aiText")?.value||"");
    else if(a==="mic-chat")mic("chat");
    else if(a==="judge")mic("drill");
    else if(a==="clear"){st.messages=[];st.suggested="";st.lastTranscript="";renderAi();}
    else if(a==="suggested"){st.lastTranscript=st.suggested;renderAi();document.getElementById("aiText")?.focus();}
    else if(a==="speak-message"){const m=st.messages[Number(b.dataset.i)];if(m)aiSpeak(m.content);}
    else if(a==="generate")generate();
  });
  document.addEventListener("keydown",e=>{if(state.screen==="ai"&&e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();chat(document.getElementById("aiText")?.value||"");}});
  window.addEventListener("pagehide",()=>stopRecord(true));
  render();
})();
