/* Latent Aurum website (s33).
   The email address below: if you change it, change the fallback address in index.html, contact.html and
   legal.html as well (it is written into the pages so the buttons still work with JavaScript switched off).
   The contact form sends through EmailJS (emailjs.com) using the three EmailJS settings below. They are
   meant to be public. template is the email to info@latentaurum.com; in EmailJS its Auto-Reply tab is
   linked to template_ihk3wns, the "we have your message" email to the visitor, so one send does both.
   While the template ID or the public key is empty, Send opens the visitor's own email app instead. */
window.LA = {
  email: 'info@latentaurum.com',
  emailjs: { service: 'service_nloah9l', template: 'template_vpp6w0m', publicKey: '' }
};

(() => {
  'use strict';
  const LA = window.LA, enc = encodeURIComponent;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conn = navigator.connection || {};
  /* Films are for visitors who have not asked for less motion and are not on a data saver or a slow
     connection. Everyone else gets the finished stills. */
  const motionOK = !reduce && !conn.saveData && !(typeof conn.effectiveType === 'string' && conn.effectiveType !== '4g');

  /* Every contact link opens the visitor's email app with the subject already filled in. */
  $$('[data-mail]').forEach(a => {
    const q = [];
    if (a.dataset.subject) q.push('subject=' + enc(a.dataset.subject));
    if (a.dataset.body) q.push('body=' + enc(a.dataset.body.replace(/\\n/g, '\n')));
    a.href = 'mailto:' + LA.email + (q.length ? '?' + q.join('&') : '');
    if ('showEmail' in a.dataset) a.textContent = LA.email;
  });

  const nav = $('#nav'), hero = $('.hero');
  const themed = $$('[data-nav]');

  /* The menu: the button on the left opens a panel from the left with the links (as on promise.ai).
     Escape, the cross, a click on the dimmed page or on a link closes it. While it is open, Tab stays inside it. */
  const menuBtn = $('#menuBtn'), menu = $('#menu'), scrim = $('#menuScrim');
  if (menuBtn && menu) {
    const closeBtn = $('.menu-close', menu);
    [menuBtn, closeBtn, $('.menu-foot', menu), scrim].forEach(el => { if (el) el.hidden = false; });
    const isOpen = () => root.classList.contains('menu-open');
    const inMenu = () => $$('a[href], button', menu).filter(el => !el.hidden && el.getClientRects().length);
    /* opened from the keyboard, the first link takes the focus; opened with a mouse or a finger, the panel does,
       so nothing is outlined but Tab still starts inside it */
    const setOpen = (open, refocus, byKey) => {
      root.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) setTimeout(() => { const f = inMenu(); (byKey ? (f[1] || f[0]) : menu).focus({ preventScroll: true }); }, 80);
      else if (refocus) menuBtn.focus({ preventScroll: true });
    };
    menuBtn.addEventListener('click', e => setOpen(!isOpen(), true, e.detail === 0));
    if (closeBtn) closeBtn.addEventListener('click', () => setOpen(false, true));
    if (scrim) scrim.addEventListener('click', () => setOpen(false, true));
    $$('.menu-list a', menu).forEach(a => a.addEventListener('click', () => setOpen(false, false)));
    document.addEventListener('keydown', e => {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false, true); return; }
      if (e.key !== 'Tab') return;
      const f = inMenu(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!menu.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    });
  }

  /* LinkedIn in the footer and the menu: once LinkedIn's official logo is saved as assets\images\linkedin-logo.png
     it shows in aurum gold. The script makes a gold copy of it (in a two-colour version, the white letters become
     see-through). Where a browser will not allow that, such as a page opened straight from the computer, the
     stylesheet fills the logo's shape with gold instead. Until the file is there, the link says LinkedIn. */
  const goldLogo = img => {
    const n = Math.max(img.naturalWidth, img.naturalHeight), k = Math.min(1, 256 / n);
    const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h), px = d.data;   /* throws where the browser does not allow it */
    const lum = i => 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
    let solid = 0, dark = 0, darkSum = 0;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 128) continue;
      solid++;
      const L = lum(i), sat = Math.max(px[i], px[i + 1], px[i + 2]) - Math.min(px[i], px[i + 1], px[i + 2]);
      if (L < 190 || sat > 40) { dark++; darkSum += L; }
    }
    const twoTone = solid && dark > solid * 0.25 && dark < solid * 0.97;
    const base = dark ? darkSum / dark : 0;
    for (let i = 0; i < px.length; i += 4) {
      let a = px[i + 3] / 255;
      if (twoTone) a *= 1 - Math.min(1, Math.max(0, (lum(i) - base) / (255 - base)));
      px[i] = px[i + 1] = px[i + 2] = 0; px[i + 3] = Math.round(a * 255);
    }
    g.putImageData(d, 0, 0);
    g.globalCompositeOperation = 'source-in';
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#E4C98F'); grad.addColorStop(0.5, '#CDAC78'); grad.addColorStop(1, '#9C7730');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    return c.toDataURL('image/png');
  };
  $$('.li-logo').forEach(img => {
    const link = img.closest('.li-link');
    const ok = () => {
      if (img.dataset.gold) return;   /* the gold copy has loaded: nothing more to do */
      link.classList.add('has-logo');
      try { const url = goldLogo(img); img.dataset.gold = '1'; img.src = url; img.hidden = false; link.classList.add('has-gold'); }
      catch (e) { /* the stylesheet's gold fill shows instead */ }
    };
    if (img.complete) { if (img.naturalWidth) ok(); } else img.addEventListener('load', ok);
  });

  /* The contact form. With EmailJS set up (see the top of this file), Send delivers the message straight to
     our inbox through EmailJS, under the subject "Website: Collaboration from (their name)", with Reply-To
     set to the visitor, and a thank-you takes the form's place. If it cannot send, the message under the
     button says so and gives our address. Without EmailJS set up, or with JavaScript switched off, Send
     opens the visitor's own email app with the message written out instead. A hidden field that people
     never see catches simple spam robots: if it is filled in, nothing is sent.
     A link to contact.html?topic=collaboration (or query, or opportunity) opens it with that topic chosen. */
  const form = $('#talkForm');
  if (form) {
    const msg = $('#talkMsg'), topic = $('#f-topic'), send = $('#talkSend');
    const ej = LA.emailjs || {};
    const live = !!(ej.service && ej.template && ej.publicKey);
    const want = (new URLSearchParams(location.search).get('topic') || '').toLowerCase();
    if (want) [...topic.options].forEach(o => { if (o.value && o.value.toLowerCase() === want) topic.value = o.value; });
    form.addEventListener('invalid', () => form.classList.add('tried'), true);
    const say = (text, linkHref) => {
      msg.textContent = text;
      if (linkHref) {
        const a = document.createElement('a'); a.href = linkHref; a.textContent = LA.email;
        msg.append(a, '.');
      }
    };
    const thanks = email => {
      const box = document.createElement('div');
      box.className = 'talk-done'; box.tabIndex = -1;
      const h = document.createElement('h2'); h.textContent = 'Thank you.';
      const p = document.createElement('p');
      p.textContent = email ? 'Your message is with us. We will reply to ' + email + '.' : 'Your message is with us.';
      box.append(h, p);
      form.hidden = true; form.after(box);
      box.focus({ preventScroll: true }); box.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    };
    let busy = false;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (busy) return;
      const v = name => ((form.elements[name] && form.elements[name].value) || '').trim();
      const subject = 'Website: ' + v('topic') + ' from ' + v('name');
      const lines = ['Name: ' + v('name'), 'Email: ' + v('email')];
      if (v('organisation')) lines.push('Company: ' + v('organisation'));
      lines.push('About: ' + v('topic'), '', v('message'));
      const mailto = 'mailto:' + LA.email + '?subject=' + enc(subject) + '&body=' + enc(lines.join('\n'));
      if (v('website')) { thanks(); return; }            // the hidden field: a robot filled it in
      if (!live) {
        location.href = mailto;
        say('Your email app should open with your message written out. Press Send there. If nothing opens, write to us at ', 'mailto:' + LA.email + '?subject=' + enc(subject));
        return;
      }
      busy = true; send.disabled = true; say('Sending…');
      try {
        const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_id: ej.service, template_id: ej.template, user_id: ej.publicKey,
            /* the same details under the names EmailJS's ready-made templates use too (title, name, email,
               message, time), so either kind of template fills in */
            template_params: {
              subject, topic: v('topic'), title: v('topic'), name: v('name'), email: v('email'),
              from_name: v('name'), reply_to: v('email'),
              organisation: v('organisation') || '(none given)', message: v('message'),
              time: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'long', timeStyle: 'short' }) + ' (UK time)'
            }
          })
        });
        if (!r.ok) throw r.status;
        thanks(v('email'));
      } catch (status) {
        busy = false; send.disabled = false;
        say(status === 429
          ? 'Too many messages at once. Please wait a minute and press Send again, or write to us at '
          : 'Sorry, your message did not send. Please press Send again, or write to us at ', mailto);
      }
    });
  }

  /* The founders on a phone: a row you swipe. Under it, "1 / 3" says which one you are on, and the arrows
     move one founder along (they fade at either end). On wider screens the three sit side by side and
     this stays hidden. */
  const people = $('#people'), peopleNav = $('.people-nav');
  if (people && peopleNav) {
    const cards = $$(':scope > li', people), cur = $('[data-cur]', peopleNav), btns = $$('.people-btn', peopleNav);
    $('[data-all]', peopleNav).textContent = cards.length;
    const pad = () => parseFloat(getComputedStyle(people).paddingLeft) || 0;
    const spot = c => c.offsetLeft - pad();   /* where the row has to scroll to for this founder to sit first */
    const at = () => {
      let best = 0, d = Infinity;
      cards.forEach((c, k) => { const dd = Math.abs(spot(c) - people.scrollLeft); if (dd < d) { d = dd; best = k; } });
      return best;
    };
    const mark = () => {
      const k = at(), end = people.scrollLeft + people.clientWidth >= people.scrollWidth - 2;
      cur.textContent = end ? cards.length : k + 1;
      btns[0].setAttribute('aria-disabled', String(people.scrollLeft <= 2));
      btns[1].setAttribute('aria-disabled', String(end));
    };
    btns.forEach(b => b.addEventListener('click', () => {
      if (b.getAttribute('aria-disabled') === 'true') return;
      const k = Math.max(0, Math.min(cards.length - 1, at() + (+b.dataset.dir)));
      people.scrollTo({ left: spot(cards[k]), behavior: reduce ? 'auto' : 'smooth' });
    }));
    let t = 0;
    people.addEventListener('scroll', () => { cancelAnimationFrame(t); t = requestAnimationFrame(mark); }, { passive: true });
    addEventListener('resize', mark, { passive: true });
    peopleNav.hidden = false; mark();
  }

  /* The work index. The names scroll past a frame that stays in the middle of the screen. Whichever
     name is nearest the middle is the one that is on: it turns black, its button shows, and its pictures
     and films take turns in the frame. A film plays once, then the next picture comes in. For Stories and
     Music, the line in the list that matches the picture on show is lit. */
  const index = $('.index');
  const names = $$('.index-name'), rows = $$('.index-item'), gos = $$('.index-go .chip');
  const says = $$('.index-say'), line = $('#indexLine');
  const sets = $$('.card-set').map(el => ({ el, items: $$('.card-m', el) }));
  const roomy = matchMedia('(min-height: 520px)');   /* the moving index is only used when there is room for it */
  /* A copy of the names, laid exactly over the real ones and cut to the shape of the frame, so letters crossing
     the pictures read as plain ivory. The real names get a frame-shaped hole, so the two never show at once. */
  const list = $('.index-list'), card = $('.index-card');
  let over = null, overRows = [];
  if (list && card) {
    over = list.cloneNode(true);
    over.classList.add('index-over');
    over.setAttribute('aria-hidden', 'true');
    over.removeAttribute('id');
    $$('.index-say', over).forEach(el => el.remove());
    $$('[id]', over).forEach(el => el.removeAttribute('id'));
    list.after(over);
    overRows = $$('.index-item', over);
  }
  const cutIndex = () => {
    if (!over) return;
    if (!roomy.matches) { list.style.clipPath = ''; return; }
    over.style.top = list.offsetTop + 'px';
    const c = card.getBoundingClientRect(), l = list.getBoundingClientRect();
    const x = c.left - l.left, y = c.top - l.top, w = c.width, h = c.height;
    const px = v => v.toFixed(1) + 'px';
    over.style.clipPath = 'inset(' + px(y) + ' ' + px(l.width - x - w) + ' ' + px(l.height - y - h) + ' ' + px(x) + ')';
    list.style.clipPath = 'polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ' +
      px(x) + ' ' + px(y) + ', ' + px(x) + ' ' + px(y + h) + ', ' + px(x + w) + ' ' + px(y + h) + ', ' + px(x + w) + ' ' + px(y) + ', ' + px(x) + ' ' + px(y) + ')';
  };
  let scrollIdx = 0, peek = null, shown = -1, isLive = false;
  const rot = { set: -1, k: 0, timer: 0 };
  const markSub = sub => $$('li', line).forEach((li, k) => li.classList.toggle('is-cur', sub < 0 || k === sub));
  const stopRot = () => {
    clearTimeout(rot.timer);
    const s = sets[rot.set];
    if (s) s.items.forEach(m => { const v = $('video', m); if (v) { v.onended = null; v.pause(); } });
  };
  const step = (si, k) => {
    const s = sets[si];
    if (!s || !s.items.length) return;
    clearTimeout(rot.timer);
    rot.set = si; rot.k = k = ((k % s.items.length) + s.items.length) % s.items.length;
    s.items.forEach((m, n) => {
      const on = n === k;
      m.classList.toggle('is-on', on);
      if (!on && m.classList.contains('is-playing')) setTimeout(() => { if (!m.classList.contains('is-on')) m.classList.remove('is-playing'); }, 1100);
    });
    const m = s.items[k];
    markSub(m.dataset.sub === undefined ? -1 : +m.dataset.sub);
    if (reduce || !isLive || document.hidden) return;   /* still pictures only, and only while the index has the screen */
    const next = () => { if (rot.set === si && rot.k === k) step(si, k + 1); };
    const v = $('video', m);
    if (v && motionOK) {
      if (!v.getAttribute('src')) v.src = (v.dataset.webm && v.canPlayType('video/webm; codecs="vp9"')) ? v.dataset.webm : v.dataset.mp4;
      try { v.currentTime = 0; } catch (e) {}
      v.onended = next;
      v.play().then(() => m.classList.add('is-playing')).catch(() => {});
      rot.timer = setTimeout(next, 9000);   /* in case a film never reports its end */
    } else {
      rot.timer = setTimeout(next, 3800);
    }
  };
  const show = () => {
    const i = peek === null ? scrollIdx : peek;
    if (i === shown) return;
    shown = i;
    rows.forEach((el, k) => el.classList.toggle('is-on', k === i));
    overRows.forEach((el, k) => el.classList.toggle('is-on', k === i));
    gos.forEach((el, k) => el.classList.toggle('is-on', k === i));
    sets.forEach((s, k) => s.el.classList.toggle('is-on', k === i));
    if (line && says[i]) line.innerHTML = says[i].innerHTML;
    stopRot();
    step(i, 0);
  };
  document.addEventListener('visibilitychange', () => { if (shown >= 0) { stopRot(); step(shown, rot.set === shown ? rot.k : 0); } });
  const toMiddle = (i, how) => {
    const r = names[i].getBoundingClientRect();
    scrollTo({ top: scrollY + r.top + r.height / 2 - innerHeight / 2, behavior: how });
  };
  if (index && names.length) {
    names.forEach((name, i) => {
      name.addEventListener('mouseenter', () => { if (roomy.matches) { peek = i; show(); } });
      name.addEventListener('mouseleave', () => { peek = null; show(); });
      name.addEventListener('click', () => { if (roomy.matches) { peek = null; toMiddle(i, reduce ? 'auto' : 'smooth'); } });
    });
    /* someone tabbing to a button brings its name to the middle with it */
    gos.forEach((go, i) => go.addEventListener('focus', () => { if (roomy.matches && scrollIdx !== i) toMiddle(i, 'auto'); }));
    show();
  }

  /* Rows of words that slide sideways as the page moves (never on their own). */
  const runs = $$('[data-run]').map(box => ({ box, rows: $$('.run-row', box).map((el, k) => ({ el, dir: +el.dataset.dir || 1, base: k ? -38 : -6 })) }));

  const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
  const ease = t => t * t * (3 - 2 * t);

  /* The gold mark under Who we are is tied to the scroll. Going down, each bar is drawn in, then filled with
     gold from the bottom up; going back up takes it out again. With less motion asked for, it is simply there. */
  const markSvg = $('.mark-o');
  const mark = markSvg && !reduce ? { lines: $$('.mark-line rect', markSvg), fills: $$('.mark-fill rect', markSvg) } : null;
  if (mark) root.classList.add('mark-scroll');
  const drawMark = vh => {
    const r = markSvg.getBoundingClientRect();
    const start = vh * 0.92, end = vh * 0.5 - r.height / 2;   /* from just entering at the bottom to the middle of the screen */
    const p = clamp01((start - r.top) / (start - end));
    mark.lines.forEach((el, b) => { el.style.strokeDashoffset = (1 - ease(clamp01((p - b * 0.075) / 0.32))).toFixed(4); });
    mark.fills.forEach((el, b) => { el.style.transform = 'scaleY(' + ease(clamp01((p - 0.56 - b * 0.05) / 0.24)).toFixed(4) + ')'; });
  };

  /* The small film under the big line grows as the page moves: it stays near the top of the screen and widens
     to the full width (or as wide as the screen's height allows), then the page moves on. Scrolling back shrinks it. */
  const reelStage = $('.reel-stage'), reelPin = $('.reel-pin'), reelBox = $('.reel');
  const grow = reelStage && reelPin && reelBox && !reduce ? { w0: 0, w1: 0, d: 0, t: 0 } : null;
  const sizeReel = () => {
    if (!grow) return;
    const vw = root.clientWidth, vh = innerHeight;
    grow.t = (nav ? nav.offsetHeight : 64) + 20;
    grow.w1 = Math.min(vw, (vh - grow.t - 24) * 16 / 9);
    grow.w0 = Math.min(grow.w1, vw <= 760 ? vw * 0.66 : Math.min(470, Math.max(230, vw * 0.3)));
    grow.d = vh * (vw <= 760 ? 0.3 : 0.55);   /* on a phone it has less to grow, so it takes less scrolling and leaves no long gap */
    const h1 = grow.w1 * 9 / 16;
    reelPin.style.height = h1.toFixed(1) + 'px';
    reelStage.style.height = (h1 + grow.d).toFixed(1) + 'px';
  };
  if (grow) { root.classList.add('reel-grow'); sizeReel(); }
  const growReel = vh => {
    const top = reelStage.getBoundingClientRect().top;
    const start = vh * 0.85, end = grow.t - grow.d;
    reelBox.style.width = (grow.w0 + (grow.w1 - grow.w0) * ease(clamp01((start - top) / (start - end)))).toFixed(1) + 'px';
  };

  /* One pass per frame while the page moves. */
  let ticking = false, heroCovered = false, onHeroChange = () => {};
  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    if (nav) {
      const at = nav.offsetHeight / 2;
      let on = 'dark';
      for (const s of themed) { const r = s.getBoundingClientRect(); if (r.top <= at && r.bottom > at) on = s.dataset.nav; }
      if (nav.dataset.on !== on) nav.dataset.on = on;
      nav.classList.toggle('is-moved', y > 24);   /* on phones a soft band of colour appears behind the top bar */
    }
    if (hero) {
      const h = hero.offsetHeight;
      if (!reduce) hero.style.setProperty('--p', Math.min(1, Math.max(0, y / (h * 0.9))).toFixed(4));
      const covered = y > h * 0.96;
      if (covered !== heroCovered) { heroCovered = covered; onHeroChange(); }
    }
    if (index && names.length) {
      const box = index.getBoundingClientRect();
      const live = box.top <= vh * 0.35 && box.bottom >= 190;   /* the index has the screen */
      if (live !== isLive) {
        isLive = live; index.classList.toggle('is-live', live);
        stopRot();
        if (shown >= 0) step(shown, rot.set === shown ? rot.k : 0);   /* pictures take turns only while the index has the screen */
      }
      if (box.bottom > 0 && box.top < vh) {
        cutIndex();
        let best = 0, gap = Infinity;
        names.forEach((n, i) => { const r = n.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - vh / 2); if (d < gap) { gap = d; best = i; } });
        if (best !== scrollIdx) { scrollIdx = best; peek = null; }   /* scrolling always wins over a resting mouse */
        show();
      }
    }
    if (mark) drawMark(vh);
    if (grow) growReel(vh);
    if (!reduce) {
      for (const run of runs) {
        const r = run.box.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) continue;
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        for (const row of run.rows) row.el.style.setProperty('--x', (row.base + row.dir * (p - 0.5) * 30).toFixed(2) + 'vw');
      }
    }
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', () => { sizeReel(); frame(); }, { passive: true });
  frame();

  /* The opening film. The head script decides whether it is allowed and adds "hero-video" to the page.
     The words light up first, then the film comes up behind them. It plays muted and loops: at 19.5 seconds it
     reaches the same picture as the still underneath and fades into it, rests there a moment, then fades back
     in from its first frame (the closed eye), like a blink. It pauses while the page covers it or the tab is hidden.
     Wide screens get the 1080p film, phones the lighter 720p one. */
  const heroV = $('#heroVideo'), heroBtn = $('#heroToggle');
  if (hero && heroV && heroBtn && root.classList.contains('hero-video')) {
    const REST = 19.45, HOLD = 2600;
    let wanted = true, ready = false, waited = false, dead = false, resting = false, rewinding = false, loopT = 0;
    const label = () => {
      heroBtn.textContent = wanted ? 'Pause' : 'Play';
      heroBtn.setAttribute('aria-label', wanted ? 'Pause the opening film' : 'Play the opening film');
      heroBtn.setAttribute('aria-pressed', String(!wanted));
    };
    const sync = () => {
      if (dead || !ready || !waited || resting) return;
      if (wanted && !heroCovered && !document.hidden) {
        heroV.play().catch(err => { if (err && err.name === 'NotAllowedError') fallback(); });
      } else heroV.pause();
    };
    const again = () => { rewinding = true; try { heroV.currentTime = 0; } catch (e) { rewinding = false; resting = false; root.classList.remove('is-rest'); sync(); } };
    const rest = () => {
      if (resting || dead) return;
      resting = true; heroV.pause(); root.classList.add('is-rest');
      clearTimeout(loopT); loopT = setTimeout(again, HOLD);
    };
    const fallback = () => { dead = true; clearTimeout(loopT); heroV.pause(); root.classList.remove('hero-video'); heroBtn.hidden = true; };
    onHeroChange = sync;
    heroBtn.hidden = false; label();
    heroV.addEventListener('canplay', () => { ready = true; sync(); }, { once: true });
    heroV.addEventListener('timeupdate', () => { if (!rewinding && heroV.currentTime >= REST) rest(); });
    heroV.addEventListener('ended', rest);
    heroV.addEventListener('seeked', () => {
      if (!rewinding) return;
      rewinding = false; resting = false; root.classList.remove('is-rest'); sync();
    });
    heroV.addEventListener('error', fallback);
    const big = matchMedia('(min-width: 900px)').matches && heroV.dataset.srcLarge;
    heroV.src = big ? heroV.dataset.srcLarge : heroV.dataset.src;
    setTimeout(() => { waited = true; sync(); }, 2100);
    heroBtn.addEventListener('click', () => { wanted = !wanted; label(); sync(); });
    document.addEventListener('visibilitychange', sync);
  }

  /* Big lines come up and smaller things settle: each once, when it comes into view.
     Without IntersectionObserver everything just shows. */
  const targets = $$('[data-reveal],[data-lines]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
    }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(el => el.classList.add('in'));
  }

  /* The reel in "Who we are". It loops while it is on screen and has its own pause button.
     If it cannot load or play, the still simply stays. */
  if (motionOK && 'IntersectionObserver' in window) {
    $$('[data-reel]').forEach(box => {
      const v = $('video', box), btn = $('.reel-toggle', box);
      if (!v || !btn) return;
      let wanted = true, onScreen = false, loaded = false, dead = false;
      const label = () => {
        btn.textContent = wanted ? 'Pause' : 'Play';
        btn.setAttribute('aria-label', wanted ? 'Pause the film' : 'Play the film');
        btn.setAttribute('aria-pressed', String(!wanted));
      };
      const kill = () => { dead = true; v.pause(); box.classList.remove('is-live'); btn.hidden = true; };
      const sync = () => {
        if (dead) return;
        if (wanted && onScreen && !document.hidden) {
          if (!loaded) {
            loaded = true;
            const large = innerWidth >= 900 && v.dataset.mp4Large;   /* it grows to the full width, so laptops and up get the 1080p reel, phones the 720p one */
            const webm = large ? v.dataset.webmLarge : v.dataset.webm, mp4 = large ? v.dataset.mp4Large : v.dataset.mp4;
            v.src = (webm && v.canPlayType('video/webm; codecs="vp9"')) ? webm : mp4;
          }
          v.play().then(() => box.classList.add('is-live')).catch(err => { if (err && err.name === 'NotAllowedError') kill(); });
        } else v.pause();
      };
      btn.hidden = false; label();
      btn.addEventListener('click', () => { wanted = !wanted; label(); sync(); });
      v.addEventListener('error', kill);
      new IntersectionObserver(es => es.forEach(e => { onScreen = e.isIntersecting; sync(); }), { threshold: 0.2 }).observe(box);
      document.addEventListener('visibilitychange', sync);
    });
  }
})();
