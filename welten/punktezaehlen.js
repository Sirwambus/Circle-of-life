/* =====================================================================
   WELT – Punktezählen: Im Fernrohr blitzen kurz goldene Sterne auf. Wie viele waren es?
   Jede Pfeiltaste wählt eine der vier Zahlen. Ab Level 7 funkeln blaue Sterne dazwischen, die nicht zählen.
   ===================================================================== */
function makePunktezaehlen(next, level = 0) {
  const MIN = [2, 3, 3, 4, 4, 5, 3, 4, 5, 5][level], MAX = [5, 6, 7, 8, 8, 9, 7, 8, 9, 10][level];
  const SHOW = [1.5, 1.3, 1.2, 1.1, 1, 0.95, 1.2, 1.1, 1.05, 1][level], ANS = [6, 5.5, 5, 4.5, 4.5, 4, 4.5, 4, 4, 3.5][level];
  const NEED = [6, 6, 7, 7, 8, 8, 8, 9, 9, 10][level], BLUE = level >= 6 ? [2, 5] : null, LIVES = 3;
  const finale = makeFinale(next);
  const KEYS = ['up', 'right', 'down', 'left'], POS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] }, SYM = { up: '↑', right: '→', down: '↓', left: '←' };
  const CX = W / 2, CY = 210, RAD = 150;
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const bg = Array.from({ length: 120 }, () => ({ x: Math.random() * W, y: Math.random() * H, a: Math.random() }));
  let round, score, lives, phase, timer, failed, failT, fb, t = 0, id = 0;
  // Sterne in kleinen Grüppchen (1–3) verteilen, mit Mindestabstand
  function scatter(n, blue) {
    const out = [], ok = (x, y) => Math.hypot(x - CX, y - CY) < RAD - 22 && out.every(o => Math.hypot(o.x - x, o.y - y) > 26);
    let left = n;
    while (left > 0) {
      const g = Math.min(left, ri(1, 3)); let gx, gy, tries = 0;
      do { gx = CX + (Math.random() * 2 - 1) * RAD; gy = CY + (Math.random() * 2 - 1) * RAD; tries++; } while (!ok(gx, gy) && tries < 200);
      out.push({ x: gx, y: gy, blue: false }); left--;
      for (let k = 1; k < g; k++) {
        let x, y, tr = 0; do { const a = Math.random() * 7; x = gx + Math.cos(a) * 30; y = gy + Math.sin(a) * 30; tr++; } while (!ok(x, y) && tr < 40);
        if (tr < 40) { out.push({ x, y, blue: false }); left--; }
      }
    }
    for (let k = 0; k < blue; k++) { let x, y, tr = 0; do { x = CX + (Math.random() * 2 - 1) * RAD; y = CY + (Math.random() * 2 - 1) * RAD; tr++; } while (!ok(x, y) && tr < 200); out.push({ x, y, blue: true }); }
    return out.map(s => ({ ...s, rot: Math.random() * 7, sz: 7 + Math.random() * 3 }));
  }
  function newRound() {
    const n = ri(MIN, MAX), start = Math.max(1, n - ri(0, 3)), opts = [0, 1, 2, 3].map(k => start + k);
    for (let i = 3; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    round = { n, stars: scatter(n, BLUE ? ri(BLUE[0], BLUE[1]) : 0), opts, answer: KEYS[opts.indexOf(n)], id: ++id };
    phase = 'ready'; timer = 0.8;
  }
  function reset() { score = 0; lives = LIVES; failed = false; fb = null; newRound(); }
  reset();
  function star(c, x, y, r, rot, col) {
    c.fillStyle = col; c.beginPath();
    for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath(); c.fill();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, phase, answer: round.answer, id: round.id, n: round.n, stars: round.stars }), // für Testprogramme
    update(dt) {
      t += dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { failT += dt; if (failT > 0.6 && pressed.action) { died(); reset(); } return; }
      timer -= dt;
      if (phase === 'ready') { if (timer <= 0) { phase = 'show'; timer = SHOW; Klang.tone(520, 0.1); } }
      else if (phase === 'show') { if (timer <= 0) { phase = 'ask'; timer = ANS; } }
      else if (phase === 'ask') {
        const k = KEYS.find(d => pressed[d]);
        if (k || timer <= 0) {
          const ok = k === round.answer; fb = { ok, why: k ? 'Falsch' : 'Zu langsam', pick: k };
          if (ok) score++; else lives--;
          Klang.tone(ok ? 700 : 130, 0.15); phase = 'fb'; timer = ok ? 0.6 : 1.4;
        }
      } else if (phase === 'fb' && timer <= 0) {
        if (score >= NEED) finale.start(); else if (lives <= 0) { failed = true; failT = 0; } else newRound();
      }
    },
    draw(c) {
      c.fillStyle = '#070a1e'; c.fillRect(0, 0, W, H);
      const neb = c.createRadialGradient(140, 90, 10, 140, 90, 260); neb.addColorStop(0, 'rgba(150,60,170,0.35)'); neb.addColorStop(1, 'rgba(150,60,170,0)');
      c.fillStyle = neb; c.fillRect(0, 0, W, H);
      for (const s of bg) { c.fillStyle = `rgba(200,210,255,${0.2 + 0.3 * Math.abs(Math.sin(t + s.a * 9))})`; c.fillRect(s.x, s.y, 1.5, 1.5); }
      // Fernrohr-Ausschnitt
      c.fillStyle = '#02030c'; c.beginPath(); c.arc(CX, CY, RAD + 6, 0, 7); c.fill();
      c.strokeStyle = '#a88a4a'; c.lineWidth = 6; c.stroke();
      c.strokeStyle = 'rgba(168,138,74,0.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(CX - RAD, CY); c.lineTo(CX + RAD, CY); c.moveTo(CX, CY - RAD); c.lineTo(CX, CY + RAD); c.stroke();
      if (phase === 'show') {
        const a = clamp(Math.min(SHOW - timer, timer) * 12, 0, 1);
        c.globalAlpha = a;
        for (const s of round.stars) { c.save(); c.shadowColor = s.blue ? '#6aa8ff' : '#ffd86a'; c.shadowBlur = 14; star(c, s.x, s.y, s.sz, s.rot, s.blue ? '#7ab4ff' : '#ffe080'); c.restore(); }
        c.globalAlpha = 1;
      }
      if (phase === 'ready') label(c, 'Achtung …', CX, CY + 6, '#a88a4a', 'center', 16);
      if (phase === 'ask' || phase === 'fb') {
        for (let i = 0; i < 4; i++) {
          const k = KEYS[i], [dx, dy] = POS[k], x = CX + dx * 96, y = CY + dy * 86;
          const hl = phase === 'fb' && (k === round.answer ? '#7dffa0' : k === fb.pick ? '#ff7a7a' : null);
          c.fillStyle = hl ? hl : 'rgba(168,138,74,0.18)'; c.beginPath(); c.arc(x, y, 30, 0, 7); c.fill();
          c.strokeStyle = '#d8b870'; c.lineWidth = 2; c.stroke();
          label(c, String(round.opts[i]), x, y + 9, hl ? '#070a1e' : '#fff0c8', 'center', 24);
          label(c, SYM[k], x + dx * 46 + (dy ? 0 : 0), y + dy * 46 + 5 + (dx ? 0 : 0), '#a88a4a', 'center', 13);
        }
        if (phase === 'ask') { c.strokeStyle = '#ffe080'; c.lineWidth = 3; c.beginPath(); c.arc(CX, CY, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(timer / ANS, 0, 1)); c.stroke(); }
        if (phase === 'fb') label(c, fb.ok ? '✓' : String(round.n), CX, CY + 9, fb.ok ? '#7dffa0' : '#ff9a9a', 'center', 24);
      }
      label(c, `Richtig ${score} / ${NEED}`, 16, 26, '#e8dcb8');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff8a6a', 'right', 16);
      label(c, BLUE ? 'Zähl nur die GOLDENEN Sterne!' : 'Wie viele Sterne blitzen auf?', W / 2, 26, BLUE ? '#ffe080' : '#c8c0e8', 'center', 13);
      if (phase === 'fb' && !fb.ok) label(c, `${fb.why}! Es waren ${round.n}.`, W / 2, 388, '#ff9a9a', 'center', 14);
      if (failed) { c.fillStyle = 'rgba(7,10,30,0.92)'; c.fillRect(0, 170, W, 80); label(c, `Keine Leben mehr: ${score} von ${NEED}. Leertaste: neuer Versuch`, W / 2, 215, '#ffb0a0', 'center', 14); }
      finale.draw(c, '#e8dcb8', '#1a1a3a');
    }
  };
  return self;
}
