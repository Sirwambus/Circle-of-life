/* =====================================================================
   WELT – Wiedersehen: Im Kaleidoskop erscheint ein Mandala nach dem anderen.
   Hast du dieses schon einmal gesehen (←) oder ist es neu (→)? Später werden sie sich immer ähnlicher.
   ===================================================================== */
function makeWiedersehen(next, level = 0) {
  // SIM: Anteil neuer Bilder, die sich nur in einem Merkmal von einem gesehenen unterscheiden
  const LEN = [14, 16, 18, 20, 22, 24, 26, 28, 30, 32][level], LAG = [3, 4, 5, 6, 8, 10, 12, 14, 16, 18][level];
  const SIM = [0, 0, 0.15, 0.25, 0.35, 0.45, 0.5, 0.55, 0.6, 0.65][level], REP = 0.4, LIVES = 3;
  const HUES = [0, 45, 120, 195, 255, 305], CENTERS = ['kreis', 'quadrat', 'dreieck', 'stern'], RINGS = ['punkte', 'linie', 'zacken', 'keine'];
  const finale = makeFinale(next);
  let stream, idx, phase, timer, lives, seenAt, answer, t = 0, msg = '', msgT = 0;
  const key = m => [m.p, m.h, m.c, m.r].join('|');
  const rnd = n => Math.floor(Math.random() * n);
  const randImg = () => ({ p: 3 + rnd(6), h: rnd(HUES.length), c: rnd(CENTERS.length), r: rnd(RINGS.length) });
  function variant(m) { // genau ein Merkmal anders
    const v = { ...m }, f = rnd(4);
    if (f === 0) v.p = 3 + (m.p - 3 + 1 + rnd(5)) % 6; else if (f === 1) v.h = (m.h + 1 + rnd(5)) % 6;
    else if (f === 2) v.c = (m.c + 1 + rnd(3)) % 4; else v.r = (m.r + 1 + rnd(3)) % 4;
    return v;
  }
  function makeStream() {
    const out = [], seen = new Map();
    while (out.length < LEN) {
      const i = out.length, cand = [...seen.keys()].filter(k => i - seen.get(k).last >= 2 && i - seen.get(k).last <= LAG);
      let img, old = false;
      if (i > 1 && cand.length && Math.random() < REP) { img = seen.get(cand[rnd(cand.length)]).img; old = true; }
      else {
        for (let tries = 0; tries < 50; tries++) {
          const base = seen.size && Math.random() < SIM ? [...seen.values()][rnd(seen.size)].img : null;
          img = base ? variant(base) : randImg(); if (!seen.has(key(img))) break;
        }
        if (seen.has(key(img))) continue;
      }
      const k = key(img);
      if (old) seen.get(k).last = i; else seen.set(k, { img, first: i, last: i });
      out.push({ img, old });
    }
    return out;
  }
  function reset() { stream = makeStream(); idx = 0; lives = LIVES; phase = 'pre'; timer = 1.0; answer = null; }
  reset();
  function mandala(c, m, x, y, R, rot) {
    const hue = HUES[m.h];
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = `hsl(${hue},60%,16%)`; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
    for (let i = 0; i < m.p; i++) { // Blütenblätter
      c.save(); c.rotate(i * Math.PI * 2 / m.p);
      c.fillStyle = `hsl(${hue},80%,58%)`; c.beginPath(); c.ellipse(0, -R * 0.5, R * 0.16, R * 0.34, 0, 0, 7); c.fill();
      c.fillStyle = `hsl(${hue},90%,80%)`; c.beginPath(); c.ellipse(0, -R * 0.52, R * 0.06, R * 0.16, 0, 0, 7); c.fill();
      c.restore();
    }
    c.strokeStyle = `hsl(${hue},90%,75%)`; c.fillStyle = `hsl(${hue},90%,75%)`; c.lineWidth = 3;
    const ring = RINGS[m.r];
    if (ring === 'punkte') for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; c.beginPath(); c.arc(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, 4, 0, 7); c.fill(); }
    else if (ring === 'linie') { c.beginPath(); c.arc(0, 0, R * 0.9, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, R * 0.95, 0, 7); c.stroke(); }
    else if (ring === 'zacken') { c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i * Math.PI / 12, rr = i % 2 ? R * 0.84 : R * 0.96; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.stroke(); }
    c.fillStyle = '#fff6e0'; c.beginPath(); const r = R * 0.2, cs = CENTERS[m.c];
    if (cs === 'kreis') c.arc(0, 0, r, 0, 7);
    else if (cs === 'quadrat') c.rect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
    else if (cs === 'dreieck') { c.moveTo(0, -r * 1.1); c.lineTo(r, r * 0.75); c.lineTo(-r, r * 0.75); }
    else for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.5 : r * 1.15; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.fill(); c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, phase, img: phase === 'ask' ? stream[idx].img : null, idx, keyOf: key }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'pre') { timer -= dt; if (timer <= 0) phase = 'ask'; }
      else if (phase === 'ask') {
        const a = pressed.left ? true : pressed.right ? false : null;
        if (a === null) return;
        const ok = a === stream[idx].old; answer = { a, ok };
        if (ok) Klang.tone(a ? 520 : 440, 0.15);
        else { lives--; Klang.tone(150, 0.35); msg = stream[idx].old ? 'Doch – das kam schon einmal!' : 'Nein – das war neu.'; msgT = 1.1; }
        phase = 'fb'; timer = ok ? 0.35 : 1.2;
      } else if (phase === 'fb') {
        timer -= dt;
        if (timer <= 0) {
          answer = null;
          if (lives <= 0) { msg = 'Keine Versuche mehr. Von vorn.'; msgT = 1.6; phase = 'over'; timer = 1.6; return; }
          idx++; if (idx >= LEN) { finale.start(); return; } phase = 'ask';
        }
      } else if (phase === 'over') { timer -= dt; if (timer <= 0) { died(); reset(); } }
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, 180, 10, W / 2, 200, 420); bg.addColorStop(0, '#1c1040'); bg.addColorStop(1, '#05030f'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) { // Kaleidoskop-Strahlen
        const a = i * Math.PI / 6 + t * 0.04; c.fillStyle = i % 2 ? 'rgba(155,107,255,0.05)' : 'rgba(255,107,200,0.04)';
        c.beginPath(); c.moveTo(W / 2, 180); c.arc(W / 2, 180, 460, a, a + Math.PI / 6); c.fill();
      }
      c.strokeStyle = 'rgba(220,200,255,0.5)'; c.lineWidth = 6; c.beginPath(); c.arc(W / 2, 180, 112, 0, 7); c.stroke();
      if ((phase === 'ask' || phase === 'fb') && idx < LEN) mandala(c, stream[idx].img, W / 2, 180, 104, 0);
      if (answer) {
        c.strokeStyle = answer.ok ? '#5aff9a' : '#ff5a6a'; c.lineWidth = 6; c.beginPath(); c.arc(W / 2, 180, 118, 0, 7); c.stroke();
      }
      // Antwort-Schilder
      for (const [x, txt, side] of [[150, '← schon gesehen', true], [W - 150, 'neu →', false]]) {
        const lit = answer && answer.a === side;
        c.fillStyle = lit ? (answer.ok ? 'rgba(90,255,154,0.35)' : 'rgba(255,90,106,0.35)') : 'rgba(255,255,255,0.07)';
        c.beginPath(); c.roundRect(x - 90, 318, 180, 36, 18); c.fill();
        label(c, txt, x, 341, '#efe6ff', 'center', 14);
      }
      // Fortschritt
      const bw = 300; c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(W / 2 - bw / 2, 300, bw, 4);
      c.fillStyle = '#c9a8ff'; c.fillRect(W / 2 - bw / 2, 300, bw * idx / LEN, 4);
      label(c, `Bild ${Math.min(idx + 1, LEN)} / ${LEN}`, 16, 26, '#efe6ff');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff8aa8', 'right', 16);
      const hint = finale.active ? '' : phase === 'pre' ? 'Gleich geht es los …' : 'Schon einmal gesehen oder neu?';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 16, '#efe6ff', 'center', 13);
      finale.draw(c, '#efe6ff', '#1c1040');
    }
  };
  return self;
}
