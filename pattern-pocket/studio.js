/* Pattern Pocket / Speaking Room 1.1.0.
 * The v1 teaching engine is immutable. Its verified, same-origin HTML bundle
 * supplies the existing markup and scripts; this layer changes presentation only.
 * Never pass learner input, a query parameter, or an external URL to this loader.
 */
'use strict';
(async () => {
  const ENGINE_HASH = 'e9564ac3085ad4165f8d8064d1f73831f248f61cd2ca86a5fba2a69b440b538d';
  const root = document.getElementById('app-root');
  const mark = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 12h17v27H12zm23 10h17v27H35z" fill="none" stroke="currentColor" stroke-width="3"/><path d="m15 47 9-9m15 18 9-9" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="49" cy="12" r="5" fill="#b5432e"/></svg>';
  let observer;
  const bars = () => {
    const wave = document.createElement('span');
    wave.className = 'studio-wave';
    wave.setAttribute('aria-hidden', 'true');
    [12,20,10,28,38,24,14,32,44,26,16,36,23,42,30,15,25,39,20,12,28,18,35,24,14,22,10].forEach(height => {
      const bar = document.createElement('i');
      bar.style.setProperty('--bar', height + 'px');
      wave.append(bar);
    });
    return wave;
  };
  function enhanceView() {
    const view = document.getElementById('view');
    observer?.disconnect();
    const home = view.querySelector('.home-grid');
    document.body.dataset.screen = home ? 'home' : location.hash.slice(1).split('/')[0] || 'home';
    if (home && !home.dataset.studio) {
      home.dataset.studio = 'true';
      const heading = view.querySelector('.page-head h1');
      const hero = home.querySelector('.hero');
      const eyebrow = hero.querySelector('.eyebrow');
      eyebrow.textContent = 'A LITTLE PRACTICE. YOUR OWN VOICE.';
      if (heading) {
        heading.innerHTML = 'そのひとことに、<br><em>あなたの声を。</em>';
        hero.querySelector('h2').replaceWith(heading);
        const pageHead = view.querySelector('.page-head');
        pageHead.innerHTML = '<span class="room-label">THE SPEAKING ROOM</span><span class="edition-label">ORIGINAL 80 / VOL. 01</span>';
      }
      hero.querySelector('p').innerHTML = '聞くだけで、終わらせない。<br>ひとつの型を、今日のあなたの言葉に。';
      const steps = document.createElement('ol');
      steps.className = 'studio-method';
      steps.setAttribute('aria-label', '5段階の練習');
      ['聞く', '入れ替える', '自分のこと', '会話する', '型をまぜる'].forEach((text, i) => {
        const item = document.createElement('li');
        const num = document.createElement('span');
        num.textContent = String(i + 1).padStart(2, '0');
        item.append(num, document.createTextNode(text));
        steps.append(item);
      });
      hero.append(steps);
      const track = home.querySelector('.today-card');
      track.querySelector('.eyebrow').textContent = "TODAY'S TRACK";
      const tag = track.querySelector('.tiny-badge.green');
      const trackNumber = document.createElement('span');
      trackNumber.className = 'track-number';
      trackNumber.textContent = tag?.textContent.replace('#', '') || '01';
      trackNumber.setAttribute('aria-hidden', 'true');
      track.prepend(trackNumber);
      const play = track.querySelector('.today-audio button');
      const playText = document.createElement('span');
      playText.className = 'track-play-label';
      playText.textContent = '例文を聞く';
      play.append(playText, bars());
      track.querySelector('.today-pattern').setAttribute('lang', 'en');
      const titles = view.querySelectorAll('.section-title h2');
      ['練習のチャンネル', 'もう一度、声に出す', '声にしたパターン'].forEach((text, i) => {
        if (titles[i]) { titles[i].textContent = text; titles[i].dataset.section = String(i + 1).padStart(2, '0'); }
      });
      const intro = view.querySelector('.section-title p');
      if (intro) intro.textContent = '今やりたい練習を、ひとつ選ぶ。';
      view.querySelectorAll('.mode-card').forEach((card, i) => {
        const label = document.createElement('span');
        label.className = 'channel-label';
        label.textContent = ['CH.01 / LISTEN', 'CH.02 / REMIX', 'CH.03 / CONVERSATION'][i];
        card.prepend(label);
      });
    }
    const pageTitle = view.querySelector('.page-head h1');
    if (!home && pageTitle && !pageTitle.dataset.studio) {
      pageTitle.dataset.studio = 'true';
      const labels = { patterns: 'THE PATTERN INDEX', progress: 'YOUR PRACTICE LOG', settings: 'ROOM SETTINGS', conversation: 'CONVERSATION SESSIONS', custom: 'YOUR OWN MATERIAL' };
      const title = labels[document.body.dataset.screen];
      if (title) {
        const label = document.createElement('p');
        label.className = 'studio-page-label';
        label.textContent = title;
        pageTitle.before(label);
      }
    }
    if (!view.querySelector('.studio-footer')) {
      const footer = document.createElement('footer');
      footer.className = 'studio-footer';
      footer.innerHTML = '<span>Pattern Pocket<span class="footer-dot"> / </span>THE SPEAKING ROOM</span><span>あなたの声で、少しずつ。</span>';
      view.append(footer);
    }
    observer?.observe(view, { childList: true });
  }
  function decorateShell() {
    document.querySelectorAll('.brand-mark').forEach(el => { el.innerHTML = mark; });
    document.querySelectorAll('.brand-name').forEach(el => {
      el.innerHTML = 'Pattern <em>Pocket.</em><span class="brand-sub">YOUR PERSONAL SPEAKING ROOM</span>';
    });
    document.querySelectorAll('.sidebar .nav-btn').forEach((button, i) => {
      const number = document.createElement('span');
      number.className = 'nav-index';
      number.textContent = String(i + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      button.prepend(number);
    });
    const topbar = document.querySelector('.topbar');
    const tagline = document.createElement('span');
    tagline.className = 'studio-top-note';
    tagline.textContent = '英語は、あなたの声で完成する。';
    topbar.prepend(tagline);
    document.getElementById('view').tabIndex = -1;
    observer = new MutationObserver(enhanceView);
    enhanceView();
    document.body.classList.add('studio-ready');
    window.PatternPocketDesign = { version: '1.1.0', name: 'The Speaking Room', engineHash: ENGINE_HASH };
  }
  try {
    if (!window.crypto?.subtle) throw new Error('HTTPSまたはlocalhostで開いてください。');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try { response = await fetch('./engine-v1.html', { signal: controller.signal, credentials: 'same-origin' }); }
    finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error('教材の読み込みに失敗しました。');
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
    if (hash !== ENGINE_HASH) throw new Error('教材ファイルの整合性を確認できませんでした。');
    // Only the pinned, byte-verified project source is parsed and executed.
    const doc = new DOMParser().parseFromString(new TextDecoder().decode(bytes), 'text/html');
    const styles = [...doc.head.querySelectorAll('style')];
    const scripts = [...doc.body.querySelectorAll('script')];
    const shell = doc.body.querySelector('.shell');
    if (!shell || scripts.length !== 2 || !doc.getElementById('view')) throw new Error('教材の構成を確認できませんでした。');
    styles.forEach(source => {
      const style = document.createElement('style');
      style.textContent = source.textContent;
      document.head.insertBefore(style, document.getElementById('studio-theme'));
    });
    scripts.forEach(source => source.remove());
    root.replaceChildren(...[...doc.body.children].map(el => document.importNode(el, true)));
    root.removeAttribute('aria-busy');
    scripts.forEach(source => {
      const script = document.createElement('script');
      script.textContent = source.textContent;
      document.body.append(script);
    });
    if (!window.PatternPocket || window.PatternPocket.patternCount !== 80) throw new Error('練習の初期化に失敗しました。');
    decorateShell();
  } catch (error) {
    console.error('Pattern Pocket startup:', error);
    root.removeAttribute('aria-busy');
    const status = document.getElementById('boot-status');
    if (status) {
      status.textContent = '練習室を開けませんでした。';
      document.getElementById('boot-recovery').hidden = false;
    } else {
      root.replaceChildren();
      const box = document.createElement('section');
      box.className = 'boot-screen';
      const p = document.createElement('p');
      p.textContent = '画面を読み込めませんでした。再読み込みするか、基本版をお使いください。';
      const link = document.createElement('a');
      link.href = './engine-v1.html';
      link.textContent = '基本版を開く';
      box.append(p, link);
      root.append(box);
    }
  }
})();
