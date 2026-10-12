/* Pattern Pocket 1.2 / Small Wins. Presentation only; v1 engine stays byte-identical.
   Reads existing progress, never changes scores, scheduling, or stored learner data. */
'use strict';
(async () => {
  const HASH = 'e9564ac3085ad4165f8d8064d1f73831f248f61cd2ca86a5fba2a69b440b538d';
  const root = document.getElementById('app-root');
  const $ = (s, parent = document) => parent.querySelector(s);
  const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const symbols = {
    play:'<path d="m9 5 11 7-11 7Z"/>', arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    sound:'<path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    star:'<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3L2.8 9.7l6.4-.9Z"/>',
    check:'<path d="m5 12 4 4L19 6"/>', leaf:'<path d="M5 19C-1 7 12 3 21 3c0 12-4 19-16 16Zm0 0L16 8"/>',
    flag:'<path d="M5 22V3c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>', bolt:'<path d="m14 2-9 12h6l-1 8 9-12h-6Z"/>',
    chat:'<path d="M4 4h16v13h-9l-6 4v-4H4Z"/><path d="M8 8h8m-8 5h5"/>',
    headphones:'<path d="M4 13v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/>',
    shuffle:'<path d="M3 6h3l12 12h3m-5-5 5 5-5 4M3 18h3l5-5m2-2 5-5h3m-5-4 5 4-5 4"/>',
    crown:'<path d="m3 7 5 4 4-7 4 7 5-4-2 13H5Z"/>',
  };
  const ico = name => `<svg class="win-icon" viewBox="0 0 24 24" aria-hidden="true">${symbols[name] || symbols.star}</svg>`;
  const achievements = [
    {n:1,title:'はじめの一歩',icon:'leaf'}, {n:5,title:'5つのひきだし',icon:'chat'},
    {n:10,title:'10型に挑戦',icon:'bolt'}, {n:25,title:'25型に挑戦',icon:'star'},
    {n:50,title:'50型に挑戦',icon:'flag'}, {n:80,title:'80型を一周！',icon:'crown'},
  ];
  function snapshot() {
    try {
      const raw = localStorage.getItem('patternPocket.v1');
      const s = raw ? JSON.parse(raw) : {schema:1, progress:{}, events:[], settings:{dailyGoal:10}};
      if (s.schema !== 1 || !s.progress || !Array.isArray(s.events)) return null;
      const Core = window.PatternPocket.Core;
      const builtins = window.PatternPocket.getPatterns().filter(p => p.source !== 'custom');
      const learned = builtins.filter(p => Number(s.progress[p.id]?.reviews) > 0).length;
      const activity = {};
      s.events.forEach(e => { if (e && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) activity[e.date] = (activity[e.date] || 0) + 1; });
      return { learned, total:builtins.length, goal:[5,10,15,20].includes(Number(s.settings?.dailyGoal)) ? Number(s.settings.dailyGoal) : 10,
        today:Core.day(), count:activity[Core.day()] || 0, activity, streak:Core.streak(activity), Core };
    } catch (_) { return null; }
  }
  function mascot() {
    // A CSS speech-pocket companion, not an imported illustration or a third-party mascot.
    return '<div class="pocket-pal" aria-hidden="true"><span class="pal-spark spark-one">✦</span><span class="pal-spark spark-two">+</span><div class="pal-back"></div><div class="pal-body"><i class="pal-eye left"></i><i class="pal-eye right"></i><i class="pal-smile"></i><span class="pal-cheek"></span></div><div class="pal-bubble">Hello!</div><span class="pal-dot"></span></div>';
  }
  function goalPanel(s) {
    const panel = document.createElement('section'); panel.className = 'goal-card';
    if (!s) { panel.innerHTML = `<h2>ひとつずつ、で大丈夫。</h2>${mascot()}<p class="muted small">保存を利用できないため、達成状況は表示できません。練習は続けられます。</p>`; return panel; }
    const pct = Math.min(100, s.count / s.goal * 100);
    const days = Array.from({length:7},(_,i) => s.Core.addDays(s.today,i-6));
    panel.innerHTML = `<div class="goal-heading"><h2>今日の小さな目標</h2><button class="goal-setting" data-action="settings" aria-label="1日の目標を設定する">${s.goal}問</button></div>
      <div class="goal-main"><div class="goal-ring" style="--goal:${pct}%" role="img" aria-label="今日の目標${s.goal}問中${s.count}問を回答"><div><strong>${s.count}<small>/${s.goal}</small></strong><span>問 チャレンジ</span></div></div><div class="goal-message"><span class="goal-symbol">${ico(s.count >= s.goal ? 'star' : 'flag')}</span><strong>${s.count >= s.goal ? '目標クリア！' : s.count ? 'いい調子！' : 'まずは1問から。'}</strong><p>${s.count >= s.goal ? '今日の積み重ねができました。' : s.count ? `あと${s.goal - s.count}問で今日の目標です。` : '完璧じゃなくて、<br>続けられるペースで。'}</p></div></div>
      <div class="week-heading"><span>最近7日間のチャレンジ</span><strong>${s.streak ? s.streak + '日 継続中' : '今日からスタート'}</strong></div><div class="practice-week">${days.map(d=>`<div class="week-day ${s.activity[d] ? 'practiced' : ''} ${d===s.today ? 'is-today' : ''}"><span>${['日','月','火','水','木','金','土'][new Date(d+'T12:00:00').getDay()]}</span><div aria-label="${esc(d)}、${s.activity[d] || 0}問">${s.activity[d] ? ico('check') : '<i></i>'}</div></div>`).join('')}</div><p class="week-note">1問取り組んだ日にも、チェックがつきます。</p>`;
    return panel;
  }
  function badgePanel(s) {
    const section = document.createElement('section'); section.className = 'milestone-card';
    if (!s) { section.innerHTML = '<h2>あなたの達成バッジ</h2><p class="small muted">保存を利用できる環境で、練習した型に応じた達成状況を確認できます。</p>'; return section; }
    const next = achievements.find(a=>s.learned<a.n);
    section.innerHTML = `<div class="milestone-head"><div><span class="section-kicker">少しずつ、コレクション。</span><h2>あなたの「やってみた！」</h2></div><button data-action="progress" class="milestone-link">${s.learned}<small> / ${s.total}型</small>${ico('arrow')}</button></div><div class="badge-trail">${achievements.map(a=>`<div class="achievement ${s.learned>=a.n ? 'earned' : ''} ${next===a ? 'up-next' : ''}"><span class="achievement-medal">${ico(a.icon)}${s.learned>=a.n ? '<b>✓</b>' : ''}</span><strong>${esc(a.title)}</strong><span>${s.learned>=a.n ? '達成！' : a.n+'型で達成'}</span></div>`).join('')}</div><p class="badge-next">${ico(next ? 'flag' : 'check')}${next ? `次のバッジまで、あと<strong>${next.n-s.learned}型</strong>。` : '80の型をひと通り練習しました。復習でもう一度！'}<span>※バッジは練習した内蔵パターン数に基づきます。習得度の判定ではありません。</span></p>`;
    return section;
  }
  function home(view) {
    const grid = $('.home-grid',view); if (!grid || grid.dataset.wins) return;
    grid.dataset.wins = 'true';
    const s = snapshot();
    const heading = $('.page-head',view);
    if (heading) heading.innerHTML = '<div><span class="welcome-label">YOUR DAILY ENGLISH</span><h1>今日も、ひとこと。</h1><p>短くても、言い直しても、大丈夫。</p></div><span class="hello-wave" aria-hidden="true">✦</span>';
    const hero = $('.hero',grid), today = $('.today-card',grid);
    if (!hero || !today) return;
    const cta = $('[data-action="start-today"], [data-action="resume"]',hero);
    if (!cta) return;
    const continuing = cta.dataset.action === 'resume';
    const instruction = $('.hero-foot .small',hero)?.textContent || '1つの型・9ステップ';
    const phrase = $('.today-pattern',today), meaning = $('.daily-meaning',today), audio = $('[data-action="speak-base"]',today), detail = $('[data-action="detail"]',today);
    cta.className = 'btn primary mission-start';
    cta.innerHTML = `${ico('play')}<span>${continuing ? '続きからチャレンジ' : 'さっそく練習する'}</span>${ico('arrow')}`;
    hero.innerHTML = `<div class="mission-label"><span>${ico('bolt')} ${continuing ? '途中から、また一歩。' : '今日のチャレンジ'}</span><span>${esc(instruction)}</span></div><div class="mission-intro"><div><h2>「言えた！」を、<br>ひとつ増やそう。</h2><p>聞いて、まねして、自分の言葉に。</p></div>${mascot()}</div><div class="mission-phrase"><div class="phrase-copy"><span class="phrase-label">${continuing ? '練習中のパターン' : '今日のパターン'}</span></div></div><div class="mission-action"></div><div class="mission-method" aria-label="5段階の練習"><span>聞く</span><i>›</i><span>入れ替える</span><i>›</i><span>自分のこと</span><i>›</i><span>会話</span><i>›</i><span>まぜる</span></div>`;
    if (phrase) { phrase.setAttribute('lang','en'); $('.phrase-copy',hero).append(phrase); }
    if (meaning) $('.phrase-copy',hero).append(meaning);
    if (audio) { audio.className='phrase-audio'; audio.innerHTML=ico('sound')+'<span>聞く</span>'; $('.mission-phrase',hero).append(audio); }
    $('.mission-action',hero).append(cta);
    if (detail) { detail.className='mission-detail'; detail.innerHTML='この型を見てみる'; $('.mission-action',hero).append(detail); }
    today.replaceWith(goalPanel(s));
    $('.stats-row',view)?.remove();
    const oldSplit = $('.split-grid',view);
    if (oldSplit) { oldSplit.classList.add('review-only'); oldSplit.children[1]?.remove(); }
    const titles = $$('.section-title h2',view);
    if (titles[0]) titles[0].textContent = '気分に合わせて、もうひと練習';
    const sub = $('.section-title p',view); if (sub) sub.textContent = '聞くだけの日も、話してみる日も。';
    $$('.practice-grid .mode-card',view).forEach((card,i)=>{
      const tags = ['LISTEN','REMIX','TALK'];
      const tag=document.createElement('span');tag.className='mode-tag';tag.textContent=tags[i] || '';card.prepend(tag);
    });
    const notice=$('.notice',view);
    const badges=badgePanel(s);
    if (oldSplit) oldSplit.before(badges); else view.append(badges);
    if (notice) { const details=document.createElement('details');details.className='material-note';details.innerHTML='<summary>教材と自己評価について</summary>';notice.replaceWith(details);details.append(notice); }
  }
  function lesson(view) {
    const track=$('.step-track',view); if (!track || $('.lesson-cheer',view)) return;
    const completed=$$('.done',track).length, total=track.children.length;
    track.setAttribute('role','progressbar'); track.setAttribute('aria-valuemin','0'); track.setAttribute('aria-valuemax',String(total)); track.setAttribute('aria-valuenow',String(completed));
    const cheer=document.createElement('div');cheer.className='lesson-cheer';
    cheer.innerHTML=`<span>${ico(completed >= total-1 ? 'flag' : 'bolt')} ${completed===0 ? 'ひとつずつ、いこう。' : completed >= total-1 ? 'いよいよラスト！' : completed >= total/2 ? '折り返しを過ぎました！' : 'その調子、次のひとことへ。'}</span><strong>${completed}<small> / ${total} 完了</small></strong>`;
    track.before(cheer);
  }
  function result(view) {
    const hero=$('.success-hero',view); if (!hero || hero.dataset.wins) return;
    hero.dataset.wins='true';hero.classList.add('win-celebration');
    const title=$('h1',hero); if(title)title.textContent='今日の練習、クリア！';
    const subtitle=$('p',hero);if(subtitle)subtitle.textContent='最後まで取り組みました。おつかれさま！';
    const label=$('.eyebrow',hero);if(label)label.textContent='NICE PRACTICE!';
    const mark=$('.success-mark',hero);if(mark)mark.innerHTML=ico('star');
    const confetti=document.createElement('div');confetti.className='win-confetti';confetti.setAttribute('aria-hidden','true');
    for(let i=0;i<14;i++){const c=document.createElement('i');c.style.setProperty('--i',String(i));confetti.append(c);}hero.prepend(confetti);
    const s=snapshot();const card=$('.study-wrap > .card',view);if(card)card.after(badgePanel(s));
  }
  let observer;
  function enhance() {
    const view=$('#view');if(!view)return;
    observer?.disconnect();
    try {
      const screen=$('.home-grid',view)?'home':(location.hash||'#home').slice(1).split('/')[0];
      document.body.dataset.screen=screen;
      if(screen==='home')home(view);
      if(screen==='lesson')lesson(view);
      if(screen==='result')result(view);
      if(screen==='progress'&&!$('.milestone-card',view))$('.page-head',view)?.after(badgePanel(snapshot()));
    } catch (e) { console.warn('Pattern Pocket presentation:',e); }
    finally { observer?.observe(view,{childList:true}); }
  }
  function decorate() {
    const logo='<span class="logo-pocket" aria-hidden="true"><i></i><b></b><em></em></span>';
    $$('.brand-mark').forEach(el=>{el.innerHTML=logo;});
    $$('.brand-name').forEach(el=>{el.innerHTML='Pattern<span class="brand-accent">Pocket</span><span class="brand-sub">小さな「言えた！」を、毎日に。</span>';});
    const labels={home:'ホーム',patterns:'パターン',progress:'学習記録',settings:'設定'};
    $$('[data-nav]').forEach(el=>{const text=$('span',el);if(text)text.textContent=labels[el.dataset.nav]||text.textContent;});
    $('.skip-link')?.addEventListener('click',e=>{e.preventDefault();$('#view')?.focus();});
    $('#view').tabIndex=-1;
    observer=new MutationObserver(enhance);enhance();
    document.body.classList.add('wins-ready');
    window.PatternPocketDesign={version:'1.2.0',name:'Small Wins',engineHash:HASH};
  }
  try {
    if(!crypto?.subtle)throw Error('HTTPSまたはlocalhostで開いてください。');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
    let response;let bytes;
    try { response=await fetch('./engine-v1.html',{signal:controller.signal,credentials:'same-origin'});if(!response.ok)throw Error('教材を取得できませんでした。');bytes=await response.arrayBuffer(); }
    finally {clearTimeout(timer);}
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    if([...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('')!==HASH)throw Error('教材ファイルの整合性を確認できませんでした。');
    const doc=new DOMParser().parseFromString(new TextDecoder().decode(bytes),'text/html');
    const scripts=[...doc.body.querySelectorAll('script')];
    if(!doc.body.querySelector('.shell')||!doc.getElementById('view')||scripts.length!==2)throw Error('教材の構成を確認できませんでした。');
    doc.head.querySelectorAll('style').forEach(source=>{const style=document.createElement('style');style.textContent=source.textContent;document.head.insertBefore(style,document.getElementById('play-theme'));});
    scripts.forEach(script=>script.remove());
    root.replaceChildren(...[...doc.body.children].map(el=>document.importNode(el,true)));root.removeAttribute('aria-busy');
    scripts.forEach(source=>{const script=document.createElement('script');script.textContent=source.textContent;document.body.append(script);});
    if(window.PatternPocket?.patternCount!==80)throw Error('練習を初期化できませんでした。');
    decorate();
  } catch(e) {
    console.error('Pattern Pocket startup:',e);root.removeAttribute('aria-busy');
    const box=document.createElement('section');box.className='boot-screen';
    const message=document.createElement('p');message.textContent='練習を開けませんでした。再読み込みするか、基本版をお使いください。';
    const link=document.createElement('a');link.href='./engine-v1.html';link.textContent='基本版を開く';box.append(message,link);root.replaceChildren(box);
  }
})();
