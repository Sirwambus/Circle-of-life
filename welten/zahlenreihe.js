/* =====================================================================
   WELT – Zahlenreihe: Erkenne die Regel hinter der Zahlenfolge und wähle die nächste Zahl.
   Die vier Antworten liegen auf den Pfeiltasten ↑ → ↓ ←.
   ===================================================================== */
function makeZahlenreihe(next, level = 0) {
  const ROUNDS = level < 5 ? 5 : 6, LIVES = 3, K = level < 3 ? 5 : 6;
  const FAM = [['ar'], ['ar', 'ar', 'geo'], ['ar', 'geo', 'zig'], ['alt', 'd2', 'geo', 'zig'], ['d2', 'fib', 'sq', 'alt'],
    ['fib', 'sq', 'cube', 'mix', 'dgeo'], ['mix', 'lin', 'tri', 'dgeo', 'alt2'], ['prime', 'sqc', 'lin', 'mul', 'd2n'],
    ['trib', 'mix', 'alt2', 'd3', 'lin', 'dfib'], ['trib', 'd3', 'alt2', 'mul', 'dfib', 'lin', 'primed']][level];
  const finale = makeFinale(next);
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
  const sgn = v => v < 0 ? `− ${-v}` : `+ ${v}`;
  // Erzeugt K+1 Glieder und eine Beschreibung der Regel
  function make(f) {
    const s = []; let rule = '';
    if (f === 'ar') { const d = level === 0 ? ri(1, 5) : pick([-9, -8, -7, -6, -5, -4, -3, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15]), a = d < 0 ? ri(60, 99) : ri(1, 30); for (let i = 0; i <= K; i++) s.push(a + i * d); rule = `immer ${sgn(d)}`; }
    else if (f === 'geo') { if (level >= 3 && Math.random() < 0.4) { const a = pick([3, 5, 7]) * 64; for (let i = 0; i <= K; i++) s.push(a / 2 ** i); rule = 'immer halbieren'; } else { const r = K === 5 ? pick([2, 3]) : 2, a = ri(1, r === 3 ? 3 : 5); for (let i = 0; i <= K; i++) s.push(a * r ** i); rule = `immer × ${r}`; } }
    else if (f === 'zig') { const a = ri(2, 9), u = ri(4, 9), v = ri(1, u - 1); let x = a; for (let i = 0; i <= K; i++) { s.push(x); x += i % 2 ? -v : u; } rule = `abwechselnd + ${u} und − ${v}`; }
    else if (f === 'alt' || f === 'alt2') { // zwei verschachtelte Folgen
      const a = ri(1, 9), d = ri(2, 6), b = ri(20, 40), e = pick([-3, -2, -1, 1, 2, 3]), geo = f === 'alt2' && Math.random() < 0.5, b2 = ri(1, 3);
      for (let i = 0; i <= K; i++) { const k = i >> 1; s.push(i % 2 === 0 ? a + k * d : geo ? b2 * 2 ** (k + 1) : b + k * e); }
      rule = `zwei Folgen im Wechsel: ${sgn(d)} und ${geo ? '× 2' : sgn(e)}`;
    }
    else if (f === 'd2' || f === 'd2n') { const a = ri(1, 20), d0 = f === 'd2n' ? ri(8, 14) : ri(1, 4), dd = f === 'd2n' ? -pick([2, 3]) : ri(1, 3); let x = a, d = d0; for (let i = 0; i <= K; i++) { s.push(x); x += d; d += dd; } rule = `Abstände wachsen jeweils um ${dd}`.replace('wachsen jeweils um -', 'schrumpfen jeweils um '); }
    else if (f === 'fib') { let a = ri(1, 5), b = ri(a, a + 5); for (let i = 0; i <= K; i++) { s.push(a); [a, b] = [b, a + b]; } rule = 'Summe der beiden Zahlen davor'; }
    else if (f === 'trib') { let a = ri(0, 3), b = ri(1, 3), c = ri(2, 5); for (let i = 0; i <= K; i++) { s.push(a); [a, b, c] = [b, c, a + b + c]; } rule = 'Summe der drei Zahlen davor'; }
    else if (f === 'sq') { const n = ri(1, 6); for (let i = 0; i <= K; i++) s.push((n + i) ** 2); rule = 'Quadratzahlen'; }
    else if (f === 'sqc') { const n = ri(1, 5), c = pick([-1, 1, 2, 3]); for (let i = 0; i <= K; i++) s.push((n + i) ** 2 + c); rule = `Quadratzahlen ${sgn(c)}`; }
    else if (f === 'cube') { const n = ri(1, 3); for (let i = 0; i <= K; i++) s.push((n + i) ** 3); rule = 'Kubikzahlen (n · n · n)'; }
    else if (f === 'tri') { const n = ri(1, 5); for (let i = 0; i <= K; i++) s.push((n + i) * (n + i + 1) / 2); rule = 'Abstände 1, 2, 3, … (Dreieckszahlen)'; }
    else if (f === 'mix') { const u = ri(1, 5), v = level >= 8 && Math.random() < 0.5 ? 3 : 2; let x = ri(1, 6); for (let i = 0; i <= K; i++) { s.push(x); x = i % 2 === 0 ? x + u : x * v; } rule = `abwechselnd + ${u} und × ${v}`; }
    else if (f === 'lin') { const [p, q] = pick([[2, 1], [2, -1], [3, -1], [2, 2], [3, -2]]); let x = ri(2, 4); for (let i = 0; i <= K; i++) { s.push(x); x = p * x + q; } rule = `immer × ${p}, dann ${sgn(q)}`; }
    else if (f === 'dgeo') { const a = ri(1, 10), d = ri(1, 3); let x = a, dd = d; for (let i = 0; i <= K; i++) { s.push(x); x += dd; dd *= 2; } rule = 'Abstände verdoppeln sich'; }
    else if (f === 'dfib') { let x = ri(1, 10), d1 = 1, d2 = ri(1, 2); for (let i = 0; i <= K; i++) { s.push(x); x += d1; [d1, d2] = [d2, d1 + d2]; } rule = 'Abstände: Summe der beiden Abstände davor'; }
    else if (f === 'mul') { const a = ri(1, 3), m0 = ri(1, 2); let x = a; for (let i = 0; i <= K; i++) { s.push(x); x *= m0 + i; } rule = `mal ${m0}, mal ${m0 + 1}, mal ${m0 + 2}, …`; }
    else if (f === 'prime' || f === 'primed') { const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]; const o = ri(0, 5); for (let i = 0; i <= K; i++) s.push(f === 'primed' ? P[o + i] * 2 : P[o + i]); rule = f === 'primed' ? 'doppelte Primzahlen' : 'Primzahlen'; }
    else if (f === 'd3') { const a = ri(1, 9), b = ri(1, 3), c = ri(1, 2), e = ri(1, 2); let x = a, d = b, dd = c; for (let i = 0; i <= K; i++) { s.push(x); x += d; d += dd; dd += e; } rule = `Abstände der Abstände wachsen um ${e}`; }
    return { s, rule };
  }
  // Andere naheliegende Regeln, die zur gezeigten Folge passen: liefert deren Vorhersagen (gegen Mehrdeutigkeit)
  function others(a) {
    const n = a.length, out = [], df = b => b.slice(1).map((v, i) => v - b[i]), same = b => b.length >= 2 && b.every(v => v === b[0]);
    let lv = [a]; for (let o = 1; o <= 3; o++) { const d = df(lv[o - 1]); lv.push(d); if (same(d)) { let v = d[0]; for (let k = o - 1; k >= 0; k--) v += lv[k][lv[k].length - 1]; out.push(v); break; } }
    const ev = a.filter((_, i) => i % 2 === 0), od = a.filter((_, i) => i % 2 === 1);
    const sub = b => same(df(b)) ? b[b.length - 1] + df(b)[0] : b.every((v, i) => !i || v === 2 * b[i - 1]) ? 2 * b[b.length - 1] : null;
    if (n >= 6 && sub(ev) !== null && sub(od) !== null) out.push(sub(n % 2 ? od : ev));
    const st = a.slice(1).map((v, i) => [v - a[i], a[i] ? v / a[i] : NaN]), se = st.filter((_, i) => i % 2 === 0), so = st.filter((_, i) => i % 2 === 1);
    const op = b => b.length < 2 ? null : b.every(o => o[0] === b[0][0]) ? x => x + b[0][0] : b.every(o => o[1] === b[0][1]) ? x => x * b[0][1] : null;
    if (op(se) && op(so)) out.push(op(st.length % 2 ? so : se)(a[n - 1]));
    if (a.every((v, i) => i < 2 || v === a[i - 1] + a[i - 2])) out.push(a[n - 1] + a[n - 2]);
    if (a.every((v, i) => i < 3 || v === a[i - 1] + a[i - 2] + a[i - 3])) out.push(a[n - 1] + a[n - 2] + a[n - 3]);
    if (a[1] !== a[0]) { const p = (a[2] - a[1]) / (a[1] - a[0]), q = a[1] - p * a[0]; if (a.every((v, i) => !i || v === p * a[i - 1] + q)) out.push(p * a[n - 1] + q); }
    const d = df(a); if (d.every((v, i) => !i || v === 2 * d[i - 1])) out.push(a[n - 1] + 2 * d[d.length - 1]);
    if (d.every((v, i) => i < 2 || v === d[i - 1] + d[i - 2])) out.push(a[n - 1] + d[d.length - 1] + d[d.length - 2]);
    return out;
  }
  function newRound() {
    let q;
    for (;;) { q = make(pick(FAM)); if (q.s.every(v => Number.isInteger(v) && Math.abs(v) < 10000) && others(q.s.slice(0, K)).every(v => v === q.s[K])) break; }
    const seq = q.s.slice(0, K), ans = q.s[K], last = seq[K - 1], prev = seq[K - 2], alt = others(seq);
    const cand = [ans + 1, ans - 1, ans + 2, ans - 2, last + (last - prev), ans + (last - prev), ans - (last - prev), 2 * last, ans + 10, ans - 10, ans + 3, last + prev];
    const opts = [ans];
    for (const v of cand.sort(() => Math.random() - 0.5)) { if (opts.length >= 4) break; if (!opts.includes(v) && !alt.includes(v) && (v >= 0 || seq.some(x => x < 0))) opts.push(v); }
    opts.sort(() => Math.random() - 0.5);
    cur = { seq, ans, opts, rule: q.rule, chosen: -1 }; phase = 'ask'; showN = 0; showT = 0;
  }
  let cur, phase, roundI, lives, timer = 0, showN, showT, t = 0;
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  reset();
  const DIRK = ['up', 'right', 'down', 'left'], POS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const stars = Array.from({ length: 80 }, (_, i) => ({ x: (i * 211) % W, y: (i * 97) % H, s: (i % 3) + 1 }));
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ seq: cur.seq.slice(), opts: cur.opts.slice(), ans: cur.ans, phase, roundI, lives, fin: finale.active, rule: cur.rule }), // für Testprogramme
    update(dt) {
      t += dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      showT += dt; if (showN < K && showT > 0.12) { showN++; showT = 0; }
      if (phase === 'ask') {
        for (let i = 0; i < 4; i++) if (pressed[DIRK[i]]) {
          cur.chosen = i;
          if (cur.opts[i] === cur.ans) { roundI++; Klang.tone(660, 0.2); phase = 'right'; timer = 1.6; }
          else { lives--; Klang.tone(150, 0.3); phase = 'wrong'; timer = 0; }
          break;
        }
      } else if (phase === 'right') { timer -= dt; if (timer <= 0) { if (roundI >= ROUNDS) finale.start(); else newRound(); } }
      else if (phase === 'wrong') { timer += dt; if (timer > 0.6 && (pressed.action || timer > 4)) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      // Kosmos mit Umlaufbahn
      const bg = c.createRadialGradient(W / 2, 120, 10, W / 2, 200, 460); bg.addColorStop(0, '#13304a'); bg.addColorStop(1, '#05060f');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      for (const s of stars) { c.fillStyle = `rgba(200,230,255,${0.3 + 0.3 * Math.sin(t + s.x)})`; c.fillRect(s.x, s.y, s.s, s.s); }
      c.strokeStyle = 'rgba(120,220,255,0.18)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(W / 2, 128, 300, 46, 0, 0, 7); c.stroke();
      const n = K + 1, sp = Math.min(84, 560 / n);
      for (let i = 0; i < n; i++) {
        const x = W / 2 + (i - (n - 1) / 2) * sp, y = 120 + Math.sin(i / (n - 1) * Math.PI) * 26, q = i === K;
        if (!q && i >= showN) continue;
        const hue = 180 + i * 22;
        const g = c.createRadialGradient(x - 8, y - 8, 2, x, y, 30); g.addColorStop(0, q ? '#ffffff' : `hsl(${hue},80%,78%)`); g.addColorStop(1, q ? 'rgba(255,214,90,0.25)' : `hsl(${hue},60%,30%)`);
        c.fillStyle = g; c.beginPath(); c.arc(x, y, 28, 0, 7); c.fill();
        const txt = q ? (phase === 'ask' ? '?' : String(cur.ans)) : String(cur.seq[i]);
        label(c, txt, x, y + 6, q ? '#2a1a00' : '#071422', 'center', txt.length > 3 ? 14 : 18);
      }
      // Antworten auf den Pfeilen
      const cx = W / 2, cy = 300;
      c.strokeStyle = 'rgba(120,220,255,0.15)'; c.beginPath(); c.arc(cx, cy, 70, 0, 7); c.stroke();
      for (let i = 0; i < 4; i++) {
        const x = cx + POS[i][0] * 108, y = cy + POS[i][1] * 62, v = cur.opts[i];
        let col = 'rgba(40,90,130,0.85)';
        if (phase !== 'ask' && v === cur.ans) col = '#2fbf7a'; else if (phase === 'wrong' && i === cur.chosen) col = '#c8433a';
        c.fillStyle = col; c.beginPath(); c.roundRect(x - 44, y - 21, 88, 42, 21); c.fill();
        label(c, String(v), x, y + 6, '#ffffff', 'center', 17);
        label(c, ['↑', '→', '↓', '←'][i], x + POS[i][0] * 58 + (POS[i][1] ? 56 : 0), y + 5 + (POS[i][1] ? 0 : 0), 'rgba(200,230,255,0.6)', 'center', 13);
      }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS}`, 16, 26, '#bfe6ff');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff7a8a', 'right', 16);
      if (phase === 'ask') label(c, 'Welche Zahl kommt als Nächstes?', W / 2, 198, 'rgba(191,230,255,0.85)', 'center', 13);
      else { label(c, `Regel: ${cur.rule}`, W / 2, 198, phase === 'right' ? '#8dffc4' : '#ffb0a8', 'center', 13); if (phase === 'wrong') label(c, lives > 0 ? 'Leertaste: weiter' : 'Keine Leben mehr. Leertaste: von vorn', W / 2, 26, '#ffffff', 'center', 12); }
      finale.draw(c, '#78dcff', '#13304a');
    }
  };
  return self;
}
