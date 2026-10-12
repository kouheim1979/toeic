/* Pattern Pocket Kids, five Showa-style companions: local UI only. */
(() => {
  'use strict';
  const friends=[
    {id:'sora',name:'ソラ',role:'チャレンジ隊長',color:'#dff1ff',msg:['さあ、英語の音を聞こう！','どの意味か、選んでみよう！','元気に声に出してみよう！','自分だけの文を作ってみよう！']},
    {id:'mika',name:'ミカ',role:'聞いてまねする名人',color:'#ffe6e7',msg:['ゆっくり聞いてみよう♪','ひとつずつ確かめようね。','聞こえた音をまねしてみよう。','キミの言葉で言ってみて♪']},
    {id:'pochi',name:'ポチ',role:'まちがいも味方',color:'#fff0cd',msg:['何回聞いてもだいじょうぶ！','あせらずに考えよう！','ゆっくりでいいよ。','まちがえても、また挑戦しよう！']},
    {id:'luke',name:'ルーク',role:'意味を見つける先生',color:'#e7f4dc',msg:['英語の音がヒントになるよ。','英文の意味をよく考えよう。','英語の語順のまま声に出そう。','この型で別の文を考えてみよう。']},
    {id:'pen',name:'ペン',role:'コツコツ応援団',color:'#eee7ff',msg:['今日もひとつずつ、進もう！','あわてずに選ぼう♪','声に出すと、もっと覚えられるよ。','できたら星をゲット！']},
  ];
  const byId=Object.fromEntries(friends.map(c=>[c.id,c]));
  const key='patternPocket.kids.character.v1',src=id=>'./characters/'+id+'.webp';
  const $=s=>document.querySelector(s);
  const lesson=$('main > .panel'),hero=$('.hero'),exercise=$('#exercise'),feedback=$('#feedback');
  if(!lesson||!hero||!exercise||!feedback)return;
  let selected='sora';
  try{const v=localStorage.getItem(key);if(v&&byId[v])selected=v;}catch{}
  const picture=document.createElement('img');picture.className='kids-hero-character';picture.width=132;picture.height=157;picture.alt='相棒のキャラクター';picture.decoding='async';
  const old=$('.hero .mascot');if(old)old.replaceWith(picture);
  const coach=document.createElement('div');coach.className='kids-coach';
  const coachImg=document.createElement('img');coachImg.width=83;coachImg.height=108;coachImg.alt='';
  const info=document.createElement('div'),name=document.createElement('b'),line=document.createElement('p'),switcher=document.createElement('button');
  line.setAttribute('aria-live','polite');switcher.type='button';switcher.textContent='なかまをえらぶ ↓';
  info.append(name,line,switcher);coach.append(coachImg,info);$('.panel .selector')?.before(coach);
  const gallery=document.createElement('section');gallery.className='panel kids-gallery';gallery.id='kids-gallery';
  const title=document.createElement('h2');title.textContent='🌟 5人のなかまから、相棒をえらぼう';
  const subtitle=document.createElement('p');subtitle.textContent='タップすると、練習中の声かけが変わるよ。';
  const grid=document.createElement('div');grid.className='kids-gallery-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','キャラクターを選ぶ');
  const buttons=new Map();
  for(const f of friends){
    const button=document.createElement('button');button.className='kids-buddy';button.type='button';
    button.style.setProperty('--buddy-bg',f.color);
    button.setAttribute('aria-label',f.name+'（'+f.role+'）を相棒にする');
    const img=document.createElement('img');img.src=src(f.id);img.alt=f.name;img.width=134;img.height=168;img.loading='lazy';
    const label=document.createElement('strong');label.textContent=f.name;
    const sub=document.createElement('small');sub.textContent=f.role;
    button.append(img,label,sub);button.addEventListener('click',()=>choose(f.id));
    buttons.set(f.id,button);grid.append(button);
  }
  gallery.append(title,subtitle,grid);lesson.after(gallery);
  switcher.addEventListener('click',()=>gallery.scrollIntoView({behavior:'smooth',block:'start'}));
  const extra=document.createElement('div');extra.className='kids-feedback-character';extra.hidden=true;
  const extraImg=document.createElement('img'),extraLabel=document.createElement('span');extra.append(extraImg,extraLabel);
  feedback.before(extra);
  function step(){return Math.max(0,Math.min(3,[...document.querySelectorAll('.dots i.on')].length-1));}
  function choose(id){if(!byId[id])return;selected=id;try{localStorage.setItem(key,id);}catch{}refresh();}
  function refresh(){
    const f=byId[selected],n=step();
    picture.src=src(selected);picture.alt=f.name+'のイラスト';
    coachImg.src=src(selected);coachImg.alt=f.name;
    coach.style.setProperty('--buddy-bg',f.color);
    name.textContent='きょうの相棒：'+f.name;
    line.textContent=f.msg[n];
    for(const p of friends)buttons.get(p.id).setAttribute('aria-pressed',String(p.id===selected));
    if(n===3){
      const meaning=$('#exercise .meaning'),opt=$('#pattern')?.selectedOptions?.[0]?.textContent||'';
      const q=opt.includes('?');
      const t=q?'この型で、友だちに聞く質問を1つ作ってみよう。':'この型で、自分のオリジナルの文を1つ作ってみよう。';
      if(meaning&&meaning.textContent!==t)meaning.textContent=t;
    }
  }
  function refreshFeedback(){
    if(feedback.classList.contains('hidden')||!feedback.textContent.trim()){extra.hidden=true;return;}
    const text=feedback.textContent;
    const id=/もういちど|ヒント|えらんでね/.test(text)?'pochi':/せいかい/.test(text)?'luke':/クリア|ゲット/.test(text)?'pen':selected;
    extraImg.src=src(id);extraImg.alt=byId[id].name;
    extra.style.setProperty('--buddy-bg',byId[id].color);
    extraLabel.textContent=byId[id].name+'からのメッセージ';
    extra.hidden=false;
  }
  refresh();refreshFeedback();
  new MutationObserver(refresh).observe(exercise,{childList:true});
  new MutationObserver(refreshFeedback).observe(feedback,{childList:true,characterData:true,attributes:true,attributeFilter:['class']});
  window.PatternPocketKidsCharacters=Object.freeze({version:'1.3.0',count:5,selected:()=>selected});
})();
