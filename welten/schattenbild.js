/* =====================================================================
   WELT – Schattenbild: Im Schattentheater erscheint kurz eine bunte Figur aus Steinen.
   Danach fallen vier Schatten auf den Schirm – welcher gehört genau zu dieser Figur (gleich liegend)?
   ===================================================================== */
function makeSchattenbild(next, level = 0) {
  // Ablenker: erst ganz andere Formen, dann versetzte Steine, ab Level 6 gespiegelt, ab Level 8 auch gedreht
  const NC = [4, 5, 5, 6, 6, 7, 7, 8, 8, 9][level], SHOWT = [2.6, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6][level];
  const KIND = [['neu'], ['neu', 'zwei'], ['zwei'], ['zwei', 'eins'], ['eins'], ['eins', 'spiegel'], ['eins', 'spiegel'], ['eins', 'spiegel', 'dreh'], ['eins', 'spiegel', 'dreh'], ['eins', 'spiegel', 'dreh']][level];
  const G = NC <= 5 ? 3 : 4, ROUNDS = [5, 5, 5, 5, 6, 6, 6, 7, 7, 7][level], LIVES = 3, OPTS = 4;
  const finale = makeFinale(next);
  let shape, opts, right, phase, timer, cur, roundI, lives, picked, hue, t = 0, msg = '', msgT = 0;
  const norm = s => { const mx = Math.min(...s.map(p => p[0])), my = Math.min(...s.map(p => p[1])); return s.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); };
  const key = s => norm(s).map(p => p.join(',')).join(';');
  const has = (s, x, y) => s.some(p => p[0] === x && p[1] === y);
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function connected(s) {
    const seen = [s[0]], st = [s[0]];
    while (st.length) { const [x, y] = st.pop(); for (const [dx, dy] of N4) { const q = s.find(p => p[0] === x + dx && p[1] === y + dy); if (q && !seen.includes(q)) { seen.push(q); st.push(q); } } }
    return seen.length === s.length;
  }
  function grow(n) {
    const s = [[Math.floor(Math.random() * G), Math.floor(Math.random() * G)]];
    while (s.length < n) {
      const [x, y] = s[Math.floor(Math.random() * s.length)], [dx, dy] = N4[Math.floor(Math.random() * 4)];
      if (x + dx >= 0 && y + dy >= 0 && x + dx < G && y + dy < G && !has(s, x + dx, y + dy)) s.push([x + dx, y + dy]);
    }
    return norm(s);
  }
  function moveCells(s, k) {
    for (let tries = 0; tries < 200; tries++) {
      let r = s.map(p => p.slice());
      for (let j = 0; j < k; j++) {
        r.splice(Math.floor(Math.random() * r.length), 1);
        const cand = []; for (const [x, y] of r) for (const [dx, dy] of N4) if (!has(r, x + dx, y + dy)) cand.push([x + dx, y + dy]);
        r.push(cand[Math.floor(Math.random() * cand.length)]);
      }
      r = norm(r);
      const w = Math.max(...r.map(p => p[0])), h = Math.max(...r.map(p => p[1]));
      if (connected(r) && w < G + 1 && h < G + 1 && key(r) !== key(s)) return r;
    }
    return null;
  }
  const mirror = s => norm(s.map(([x, y]) => [-x, y]));
  const rot = (s, k) => { let r = s; for (let i = 0; i < k; i++) r = r.map(([x, y]) => [-y, x]); return norm(r); };
  function newRound() {
    for (;;) {
      shape = grow(NC);
      const keys = new Set([key(shape)]), out = [];
      for (let tries = 0; tries < 60 && out.length < OPTS - 1; tries++) {
        const k = KIND[Math.floor(Math.random() * KIND.length)];
        const d = k === 'neu' ? grow(NC) : k === 'zwei' ? moveCells(shape, 2) : k === 'eins' ? moveCells(shape, 1) : k === 'spiegel' ? mirror(shape) : rot(shape, 1 + Math.floor(Math.random() * 3));
        if (d && !keys.has(key(d))) { keys.add(key(d)); out.push(d); }
      }
      if (out.length < OPTS - 1) continue;
      right = Math.floor(Math.random() * OPTS); out.splice(right, 0, shape); opts = out; break;
    }
    hue = Math.floor(Math.random() * 360); phase = 'show'; timer = SHOWT + 0.5; cur = 0; picked = -1;
  }
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  reset();
  function drawShape(c, s, cx, cy, cs, mode) {
    const w = Math.max(...s.map(p => p[0])) + 1, h = Math.max(...s.map(p => p[1])) + 1, x0 = cx - w * cs / 2, y0 = cy - h * cs / 2;
    for (const [x, y] of s) {
      const px = x0 + x * cs, py = y0 + y * cs;
      if (mode === 'bunt') {
        c.fillStyle = `hsl(${(hue + (x + y) * 25) % 360},70%,55%)`; c.fillRect(px + 1, py + 1, cs - 2, cs - 2);
        c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(px + 1, py + 1, cs - 2, 4);
        c.strokeStyle = 'rgba(60,20,0,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.arc(px + cs / 2, py + cs / 2, cs * 0.18, 0, 7); c.stroke();
      } else { c.fillStyle = mode; c.fillRect(px - 0.5, py - 0.5, cs + 1, cs + 1); }
    }
  }
  const optX = i => W / 2 + (i - (OPTS - 1) / 2) * 138;
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, phase, shape: phase === 'show' ? shape : null, opts, cur, keyOf: key }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') { timer -= dt; if (timer <= 0) { phase = 'dark'; timer = 0.5; } }
      else if (phase === 'dark') { timer -= dt; if (timer <= 0) phase = 'pick'; }
      else if (phase === 'pick') {
        if (pressed.left) cur = (cur + OPTS - 1) % OPTS; if (pressed.right) cur = (cur + 1) % OPTS;
        if (pressed.action) {
          picked = cur;
          if (cur === right) { roundI++; Klang.tone(600, 0.4); if (roundI >= ROUNDS) { finale.start(); return; } msg = 'Richtig!'; msgT = 1.0; phase = 'wait'; timer = 1.0; }
          else { lives--; msg = lives > 0 ? 'Falsch – das war die Figur.' : 'Keine Versuche mehr. Von vorn.'; msgT = 2.2; phase = 'reveal'; timer = 2.4; Klang.tone(150, 0.4); }
        }
      } else { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      c.fillStyle = '#1a0d06'; c.fillRect(0, 0, W, H);
      // Theatervorhang und Schirm
      const sg = c.createRadialGradient(W / 2, 210, 30, W / 2, 210, 330); sg.addColorStop(0, '#ffd99a'); sg.addColorStop(0.7, '#e89a4a'); sg.addColorStop(1, '#a8541e');
      c.fillStyle = sg; c.fillRect(40, 44, W - 80, 316);
      c.strokeStyle = 'rgba(120,50,10,0.18)'; c.lineWidth = 1; for (let x = 60; x < W - 40; x += 28) { c.beginPath(); c.moveTo(x, 44); c.lineTo(x, 360); c.stroke(); }
      for (const side of [0, 1]) for (let i = 0; i < 4; i++) {
        const x = side ? W - 40 + i * 10 : i * 10; c.fillStyle = i % 2 ? '#7a1020' : '#9a1a2a'; c.fillRect(x, 0, 10, H);
      }
      c.fillStyle = '#7a1020'; c.fillRect(0, 0, W, 44); for (let x = 0; x < W; x += 32) { c.fillStyle = '#9a1a2a'; c.beginPath(); c.arc(x + 16, 44, 16, 0, Math.PI); c.fill(); }
      c.fillStyle = '#3a1c0a'; c.fillRect(0, 360, W, 40);
      if (phase === 'show' && timer < SHOWT) {
        c.save(); c.shadowColor = 'rgba(60,20,0,0.5)'; c.shadowBlur = 12; drawShape(c, shape, W / 2, 200, 40, 'bunt'); c.restore();
      } else if (phase !== 'show' && phase !== 'dark') {
        opts.forEach((s, i) => {
          const x = optX(i), sel = phase === 'pick' && i === cur;
          c.fillStyle = sel ? 'rgba(255,250,230,0.45)' : 'rgba(255,240,210,0.18)'; c.beginPath(); c.roundRect(x - 64, 130, 128, 150, 10); c.fill();
          drawShape(c, s, x, 205, 24, '#1c0b04');
          if (sel) { c.strokeStyle = '#3a1406'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 64, 130, 128, 150, 10); c.stroke(); }
          if (phase === 'reveal' && i === right) { c.strokeStyle = '#2a8a3a'; c.lineWidth = 5; c.beginPath(); c.roundRect(x - 66, 128, 132, 154, 12); c.stroke(); }
          if (phase === 'reveal' && i === picked) { c.strokeStyle = '#c0202a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 30, 300); c.lineTo(x + 30, 300); c.stroke(); }
        });
      }
      label(c, `Figur ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${NC} Steine`, 16, 28, '#ffe2b8');
      label(c, '♥'.repeat(lives), W - 16, 28, '#ffb0a0', 'right', 16);
      const hint = finale.active ? '' : phase === 'show' ? 'Merk dir die Figur …' : phase === 'pick' ? 'Welcher Schatten passt genau? ← → wählen, Leertaste' : '';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 14, '#ffe2b8', 'center');
      finale.draw(c, '#ffe2b8', '#7a1020');
    }
  };
  return self;
}
