/* =====================================================================
   WELT – Zählwerk: Der Herbstwind trägt Blätter, Vögel, Falter, Laternen und Samen durch den
   Abendhimmel. Zähle nur die angesagte Art und wähle danach die richtige Zahl mit den Pfeiltasten.
   Später: mehr und schnellere Dinge, ähnlich aussehende Doppelgänger und zwei Arten zugleich.
   ===================================================================== */
function makeZaehlwerk(next, level = 0) {
  const NKIND = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5][level], N = [8, 10, 12, 14, 16, 18, 18, 20, 22, 24][level];
  const TMIN = [3, 3, 4, 4, 5, 5, 6, 3, 3, 4][level], TMAX = [5, 6, 7, 8, 9, 10, 10, 6, 7, 7][level];
  const SPAWNW = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5][level], SPEED = [110, 120, 130, 140, 150, 160, 170, 175, 185, 195][level];
  const GAP = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.6, 0.55, 0.5][level];
  const MIXDIR = level >= 3, LOOK = level >= 4, DUAL = level >= 7, ROUNDS = level < 2 ? 2 : 3, LIVES = 3;
  const KIND = [
    { shape: 'blatt', col: '#ff9a3c', name: 'orange Blätter' }, { shape: 'vogel', col: '#241a30', name: 'Vögel' },
    { shape: 'falter', col: '#ff7ad9', name: 'rosa Falter' }, { shape: 'laterne', col: '#ffd25a', name: 'Laternen' },
    { shape: 'samen', col: '#ffffff', name: 'Pusteblumen-Samen' }
  ];
  const TWIN = { blatt: { shape: 'blatt', col: '#9ad04a', name: 'grüne Blätter' }, falter: { shape: 'falter', col: '#5ad1ff', name: 'blaue Falter' } };
  const KEYS = ['left', 'up', 'right', 'down'], ARROW = { left: '←', up: '↑', right: '→', down: '↓' };
  const finale = makeFinale(next);
  let kinds, targets, objs, sched, phase, timer, flyT, opts, ask, roundI, lives, failed, chosen, t = 0, msg = '', msgT = 0, ok = false;
  const ri = n => Math.floor(Math.random() * n), rand = (a, b) => a + Math.random() * (b - a);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // n Startzeiten im Fenster mit Mindestabstand
  function times(n, gap) {
    for (let tries = 0; tries < 200; tries++) {
      const a = Array.from({ length: n }, () => rand(0.4, SPAWNW)).sort((x, y) => x - y);
      if (a.every((v, i) => i === 0 || v - a[i - 1] >= gap)) return a;
    }
    return Array.from({ length: n }, (_, i) => 0.4 + i * (SPAWNW - 0.4) / Math.max(1, n - 1));
  }
  function newRound() {
    const base = shuffle(KIND.slice());
    kinds = base.slice(0, NKIND);
    if (LOOK) { // Doppelgänger der ersten Zielart einmischen
      const ti = kinds.findIndex(k => TWIN[k.shape]); const tk = ti >= 0 ? kinds[ti] : KIND[0];
      if (ti < 0) kinds[0] = tk; else if (ti > 0) { kinds.splice(ti, 1); kinds.unshift(tk); }
      kinds[kinds.length - 1] = TWIN[tk.shape];
    }
    targets = DUAL ? [kinds[0], kinds[1]] : [kinds[0]];
    sched = []; let used = 0;
    for (const k of targets) { const n = TMIN + ri(TMAX - TMIN + 1); k.count = n; used += n; for (const tt of times(n, GAP)) sched.push({ t: tt, k }); }
    const others = kinds.filter(k => !targets.includes(k));
    for (let i = used; i < Math.max(N, used + 3); i++) sched.push({ t: rand(0.4, SPAWNW), k: others[i % others.length] });
    sched.sort((a, b) => a.t - b.t);
    objs = []; phase = 'brief'; timer = DUAL ? 3 : 2.4; flyT = 0; chosen = null;
    ask = targets[ri(targets.length)];
    const c = ask.count, cand = shuffle([c - 2, c - 1, c + 1, c + 2, c + 3].filter(v => v >= 1)).slice(0, 3);
    opts = shuffle([c, ...cand]);
  }
  function spawn(k) {
    let o;
    if (k.shape === 'laterne') o = { x: rand(60, W - 60), y: H + 20, vx: rand(-20, 20), vy: -SPEED * 0.6 };
    else {
      const l = Math.random() < 0.5, diag = MIXDIR && Math.random() < 0.5;
      o = { x: l ? -24 : W + 24, y: rand(70, 330), vx: (l ? 1 : -1) * SPEED * rand(0.85, 1.15), vy: diag ? rand(-0.35, 0.35) * SPEED : 0 };
      if (o.y < 140 && o.vy < 0) o.vy = -o.vy; if (o.y > 270 && o.vy > 0) o.vy = -o.vy;
    }
    o.k = k; o.ph = rand(0, 7); objs.push(o);
  }
  function reset() { roundI = 0; lives = LIVES; failed = false; newRound(); }
  reset();
  function drawKind(c, k, x, y, s, ph) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = k.col; c.strokeStyle = k.col;
    if (k.shape === 'blatt') {
      c.rotate(Math.sin(t * 3 + ph) * 0.8); c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(11, -4, 0, 12); c.quadraticCurveTo(-11, -4, 0, -12); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -10); c.lineTo(0, 14); c.stroke();
    } else if (k.shape === 'vogel') {
      const f = Math.sin(t * 12 + ph) * 7; c.lineWidth = 3; c.beginPath(); c.moveTo(-13, -f); c.quadraticCurveTo(-6, -2, 0, 2); c.quadraticCurveTo(6, -2, 13, -f); c.stroke();
    } else if (k.shape === 'falter') {
      const f = 0.55 + 0.45 * Math.abs(Math.sin(t * 9 + ph));
      c.beginPath(); c.ellipse(-6 * f, -4, 7 * f, 6, -0.4, 0, 7); c.ellipse(6 * f, -4, 7 * f, 6, 0.4, 0, 7); c.fill();
      c.beginPath(); c.ellipse(-4 * f, 5, 4 * f, 4, 0.3, 0, 7); c.ellipse(4 * f, 5, 4 * f, 4, -0.3, 0, 7); c.fill();
      c.fillStyle = '#2a1830'; c.fillRect(-1, -8, 2, 15);
    } else if (k.shape === 'laterne') {
      c.globalAlpha = 0.25; c.beginPath(); c.arc(0, 0, 18, 0, 7); c.fill(); c.globalAlpha = 1;
      c.beginPath(); c.moveTo(-7, -10); c.lineTo(7, -10); c.lineTo(5, 10); c.lineTo(-5, 10); c.closePath(); c.fill();
      c.fillStyle = '#fff6cc'; c.fillRect(-2, 4, 4, 4);
    } else {
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 12); c.stroke();
      for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); c.stroke(); }
    }
    c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, phase, answer: KEYS[opts.indexOf(ask.count)], objs: objs.length }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { timer -= dt; if (timer <= 0 && pressed.action) { died(); reset(); } return; }
      if (phase === 'brief') { timer -= dt; if (timer <= 0) { phase = 'fly'; flyT = 0; } }
      else if (phase === 'fly') {
        flyT += dt;
        while (sched.length && sched[0].t <= flyT) spawn(sched.shift().k);
        for (const o of objs) { o.x += o.vx * dt; o.y += (o.vy + Math.sin(t * 2 + o.ph) * 18) * dt; }
        objs = objs.filter(o => o.x > -40 && o.x < W + 40 && o.y > -40 && o.y < H + 40);
        if (!sched.length && !objs.length) { phase = 'ask'; Klang.tone(440, 0.15); }
      } else if (phase === 'ask') {
        const k = KEYS.find(q => pressed[q]);
        if (k) {
          chosen = KEYS.indexOf(k); ok = opts[chosen] === ask.count; phase = 'reveal'; timer = 1.8;
          if (ok) { msg = 'Richtig gezählt!'; Klang.tone(660, 0.3); } else { lives--; msg = `Es waren ${ask.count}.`; Klang.tone(150, 0.4); }
          msgT = 1.8;
        }
      } else if (phase === 'reveal') {
        timer -= dt;
        if (timer <= 0) {
          if (ok) { roundI++; if (roundI >= ROUNDS) { finale.start(); return; } newRound(); }
          else if (lives <= 0) { failed = true; timer = 0.5; } else newRound();
        }
      }
    },
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2b1d4a'); g.addColorStop(0.55, '#a8476a'); g.addColorStop(1, '#f2a35a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,220,160,0.5)'; c.beginPath(); c.arc(470, 330, 46, 0, 7); c.fill();
      c.fillStyle = '#3a1f2e'; c.beginPath(); c.moveTo(0, 360);
      for (let x = 0; x <= W; x += 40) c.lineTo(x, 352 + Math.sin(x * 0.02) * 10 + Math.sin(x * 0.07) * 4);
      c.lineTo(W, H); c.lineTo(0, H); c.fill();
      for (const o of objs) drawKind(c, o.k, o.x, o.y, 1.15, o.ph);
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS}`, 16, 26, '#ffe6c8');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff9aa8', 'right', 16);
      const tag = (k, x, y) => { drawKind(c, k, x, y - 5, 1.1, 0); label(c, k.name, x + 18, y, '#fff3e0', 'left', 14); };
      if (phase === 'brief') {
        c.fillStyle = 'rgba(30,18,46,0.6)'; c.fillRect(W / 2 - 200, 150, 400, DUAL ? 110 : 80);
        label(c, DUAL ? 'Zähle beide Arten:' : 'Zähle nur:', W / 2, 180, '#ffe6c8', 'center', 14);
        targets.forEach((k, i) => tag(k, W / 2 - 90, 212 + i * 30));
      } else if (phase === 'fly') {
        targets.forEach((k, i) => { drawKind(c, k, 24 + i * 34, 48, 0.8, 0); });
        label(c, 'Zählen …', W / 2, 26, '#ffe6c8', 'center', 13);
      } else {
        c.fillStyle = 'rgba(30,18,46,0.75)'; c.fillRect(W / 2 - 220, 92, 440, 236);
        label(c, 'Wie viele waren es?', W / 2, 124, '#ffe6c8', 'center', 15);
        tag(ask, W / 2 - 80, 156);
        const P = { left: [W / 2 - 110, 250], up: [W / 2, 205], right: [W / 2 + 110, 250], down: [W / 2, 295] };
        KEYS.forEach((k, i) => {
          const [x, y] = P[k], rev = phase === 'reveal', right = opts[i] === ask.count;
          c.fillStyle = rev && right ? '#2f8f5a' : rev && i === chosen ? '#9a2d44' : 'rgba(255,230,200,0.12)';
          c.beginPath(); c.arc(x, y, 24, 0, 7); c.fill();
          c.strokeStyle = '#ffe6c8'; c.lineWidth = 1.5; c.stroke();
          label(c, String(opts[i]), x, y + 7, '#fff3e0', 'center', 20);
          label(c, ARROW[k], x + (k === 'left' ? -40 : k === 'right' ? 40 : 0), y + (k === 'up' ? -30 : k === 'down' ? 40 : 5), '#ffd2a0', 'center', 13);
        });
        if (msgT > 0) label(c, msg, W / 2, 352, ok ? '#c8ffd8' : '#ffd0d8', 'center', 14);
      }
      if (failed) { c.fillStyle = 'rgba(30,18,46,0.92)'; c.fillRect(0, 160, W, 80); label(c, 'Alle Versuche verbraucht. Leertaste: neuer Versuch', W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#ffe6c8', '#2b1d4a');
    }
  };
  return self;
}
