/* =====================================================================
   WELT – Waage: Alle Waagen sind im Gleichgewicht. Schließ daraus, wie viele Kreise die Formen
   auf der letzten Waage aufwiegen. Die vier Antworten liegen auf den Pfeiltasten ↑ → ↓ ←.
   ===================================================================== */
function makeWaage(next, level = 0) {
  const NS = [2, 3, 3, 3, 4, 4, 4, 5, 5, 5][level], MAXI = [3, 3, 4, 4, 4, 5, 5, 5, 5, 5][level];
  const CHAIN = level < 3, COMBO = level >= 6, ROUNDS = level < 5 ? 3 : 4, LIVES = 3;
  const NAMES = ['Kreis', 'Dreieck', 'Quadrat', 'Stern', 'Raute'], COLS = ['#f5f0e1', '#ff6b5b', '#4fd1a5', '#ffd34d', '#c58bff'];
  const finale = makeFinale(next);
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  // Rang einer Matrix (Gauß-Elimination)
  function rank(rows) {
    const m = rows.map(r => r.slice()); let rk = 0;
    for (let c = 0; c < NS && rk < m.length; c++) {
      let p = rk; while (p < m.length && Math.abs(m[p][c]) < 1e-9) p++;
      if (p === m.length) continue; [m[rk], m[p]] = [m[p], m[rk]];
      for (let r = 0; r < m.length; r++) if (r !== rk) { const f = m[r][c] / m[rk][c]; for (let k = 0; k < NS; k++) m[r][k] -= f * m[rk][k]; }
      rk++;
    }
    return rk;
  }
  // in Reihenfolge lösbar: jede Gleichung bringt genau eine neue Form ins Spiel
  function chainable(eqs) {
    const known = new Set([0]), left = eqs.slice(); let prog = true;
    while (left.length && prog) { prog = false; for (let i = 0; i < left.length; i++) { const u = new Set(); left[i].forEach((v, k) => { if (v && !known.has(k)) u.add(k); }); if (u.size === 1) { known.add([...u][0]); left.splice(i, 1); prog = true; break; } } }
    return known.size === NS;
  }
  function randomSide(w, avoid, sum) { // zufällige Seite mit genau 'sum', ohne Formen aus 'avoid'
    for (let tries = 0; tries < 200; tries++) {
      const cnt = Array(NS).fill(0); let s = 0, n = 0;
      while (s < sum && n < MAXI) { const k = ri(0, NS - 1); if (avoid[k]) continue; if (s + w[k] > sum) { if (w.every((v, j) => avoid[j] || s + v > sum)) break; continue; } cnt[k]++; s += w[k]; n++; }
      if (s === sum) return cnt;
    }
    return null;
  }
  function newPuzzle() {
    for (;;) {
      const w = [1]; while (w.length < NS) { const v = ri(2, NS + (level >= 9 ? 5 : 3)); if (!w.includes(v)) w.push(v); }
      const eqs = [];
      for (let e = 0; e < NS - 1; e++) {
        let eq = null;
        for (let tries = 0; tries < 50 && !eq; tries++) {
          const L = Array(NS).fill(0), nl = ri(1, Math.min(CHAIN ? 2 : 3, MAXI)); for (let i = 0; i < nl; i++) L[ri(1, NS - 1)]++;
          const sum = L.reduce((a, v, k) => a + v * w[k], 0), R = randomSide(w, L.map(v => v > 0), sum);
          if (R) eq = { L, R };
        }
        if (eq) eqs.push(eq);
      }
      if (eqs.length < NS - 1) continue;
      const rows = eqs.map(e => e.L.map((v, k) => v - e.R[k]));
      if (rank(rows) !== NS - 1) continue;
      if (CHAIN && !chainable(rows)) continue;
      if (!CHAIN && chainable(rows) && level >= 5) continue; // ab Level 6 muss man Waagen kombinieren
      // Frage: eine (oder zwei) Formen, nicht direkt ablesbar
      const Q = Array(NS).fill(0);
      if (COMBO) { const ks = [1, 2, 3, 4].slice(0, NS - 1).sort(() => Math.random() - 0.5).slice(0, level >= 8 ? 3 : 2); ks.forEach(k => Q[k]++); if (level < 8 && Math.random() < 0.4) Q[ks[0]]++; }
      else { Q[ri(1, NS - 1)] += level === 0 ? 2 : 1; }
      const ans = Q.reduce((a, v, k) => a + v * w[k], 0);
      if (eqs.some(e => e.L.every((v, k) => v === Q[k]) && e.R.every((v, k) => k === 0 || !v))) continue; // nicht schon eine Waage
      if (ans > (level >= 8 ? 36 : 30)) continue;
      const opts = [ans]; const cand = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 3, ans - 3].sort(() => Math.random() - 0.5);
      for (const v of cand) if (opts.length < 4 && v > 0 && !opts.includes(v)) opts.push(v);
      opts.sort(() => Math.random() - 0.5);
      cur = { w, eqs, Q, ans, opts, chosen: -1 }; phase = 'ask';
      return;
    }
  }
  let cur, phase, roundI, lives, timer = 0, t = 0;
  function reset() { roundI = 0; lives = LIVES; newPuzzle(); }
  reset();
  const DIRK = ['up', 'right', 'down', 'left'], POS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  function shape(c, k, x, y, r) {
    c.fillStyle = COLS[k]; c.beginPath();
    if (k === 0) c.arc(x, y, r, 0, 7);
    else if (k === 1) { c.moveTo(x, y - r * 1.1); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); }
    else if (k === 2) c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
    else if (k === 3) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r * 1.1; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } }
    else { c.moveTo(x, y - r * 1.15); c.lineTo(x + r * 0.8, y); c.lineTo(x, y + r * 1.15); c.lineTo(x - r * 0.8, y); }
    c.fill();
  }
  const items = cnt => { const a = []; cnt.forEach((v, k) => { for (let i = 0; i < v; i++) a.push(k); }); return a; };
  function scale(c, x, y, L, R, q) {
    // Pfosten und Balken
    c.strokeStyle = '#d9b45a'; c.fillStyle = '#d9b45a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x, y + 38); c.stroke(); c.fillRect(x - 20, y + 36, 40, 5);
    c.beginPath(); c.moveTo(x - 112, y - 30); c.lineTo(x + 112, y - 30); c.stroke();
    c.beginPath(); c.moveTo(x - 6, y - 30); c.lineTo(x, y - 40); c.lineTo(x + 6, y - 30); c.fill();
    for (const [s, list] of [[-1, L], [1, R]]) {
      const px = x + s * 100;
      c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, y - 30); c.lineTo(px - 46, y + 8); c.moveTo(px, y - 30); c.lineTo(px + 46, y + 8); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(px - 50, y + 8); c.quadraticCurveTo(px, y + 22, px + 50, y + 8); c.stroke();
      if (list === null) { label(c, '?', px - 14, y + 4, '#ffffff', 'center', 22); shape(c, 0, px + 14, y - 3, 8); label(c, '×', px + 1, y + 1, '#ffe7a8', 'center', 12); continue; }
      const it = items(list), sp = Math.min(19, 92 / Math.max(1, it.length));
      it.forEach((k, i) => shape(c, k, px + (i - (it.length - 1) / 2) * sp, y - 2, 7.5));
    }
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ NS, eqs: cur.eqs.map(e => ({ L: e.L.slice(), R: e.R.slice() })), Q: cur.Q.slice(), ans: cur.ans, opts: cur.opts.slice(), phase, roundI, lives, fin: finale.active }), // für Testprogramme
    update(dt) {
      t += dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'ask') {
        for (let i = 0; i < 4; i++) if (pressed[DIRK[i]]) {
          cur.chosen = i;
          if (cur.opts[i] === cur.ans) { roundI++; phase = 'right'; timer = 1.4; Klang.tone(660, 0.2); }
          else { lives--; phase = 'wrong'; timer = 0; Klang.tone(150, 0.3); }
          break;
        }
      } else if (phase === 'right') { timer -= dt; if (timer <= 0) { if (roundI >= ROUNDS) finale.start(); else newPuzzle(); } }
      else if (phase === 'wrong') { timer += dt; if (timer > 0.6 && (pressed.action || timer > 5)) { if (lives <= 0) { died(); reset(); } else newPuzzle(); } }
    },
    draw(c) {
      // Lapisblaue Halle mit goldenem Fries
      c.fillStyle = '#16245a'; c.fillRect(0, 0, W, H);
      const g = c.createRadialGradient(W / 2, 160, 20, W / 2, 200, 420); g.addColorStop(0, 'rgba(90,120,220,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(217,180,90,0.35)'; for (let x = 8; x < W; x += 24) { c.fillRect(x, 36, 12, 3); c.fillRect(x + 4, H - 8, 12, 3); }
      const n = cur.eqs.length, P = [[165, 96], [475, 96], [165, 206], [475, 206]];
      const at = n === 1 ? [[320, 120]] : n === 2 ? [[165, 120], [475, 120]] : P;
      cur.eqs.forEach((e, i) => scale(c, at[i][0], at[i][1], e.L, e.R));
      // Frage-Waage
      c.fillStyle = 'rgba(10,16,48,0.55)'; c.beginPath(); c.roundRect(28, 268, 300, 118, 12); c.fill();
      scale(c, 178, 330, cur.Q, phase === 'ask' ? null : (() => { const r = Array(NS).fill(0); r[0] = cur.ans; return r; })());
      if (phase !== 'ask') label(c, `= ${cur.ans} Kreise`, 178, 383, phase === 'right' ? '#8dffc4' : '#ffb0a8', 'center', 13);
      // Antworten
      const cx = 492, cy = 326;
      for (let i = 0; i < 4; i++) {
        const x = cx + POS[i][0] * 84, y = cy + POS[i][1] * 40, v = cur.opts[i];
        let col = 'rgba(217,180,90,0.25)';
        if (phase !== 'ask' && v === cur.ans) col = '#2f9f6a'; else if (phase === 'wrong' && i === cur.chosen) col = '#b8443a';
        c.fillStyle = col; c.beginPath(); c.roundRect(x - 36, y - 16, 72, 32, 16); c.fill();
        label(c, String(v), x - 7, y + 6, '#ffffff', 'center', 16); shape(c, 0, x + 17, y, 6);
        label(c, ['↑', '→', '↓', '←'][i], x + (POS[i][0] ? POS[i][0] * 48 : 46), y + 5, 'rgba(255,231,168,0.6)', 'center', 12);
      }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS}`, 16, 26, '#ffe7a8');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff8a7a', 'right', 16);
      label(c, phase === 'ask' ? 'Wie viele Kreise wiegt die linke Seite unten?' : phase === 'wrong' ? (lives > 0 ? 'Leider falsch. Leertaste: weiter' : 'Keine Leben mehr. Leertaste: von vorn') : 'Richtig!', W / 2, 26, phase === 'wrong' ? '#ffb0a8' : '#ffe7a8', 'center', 12);
      finale.draw(c, '#ffd34d', '#16245a');
    }
  };
  return self;
}
