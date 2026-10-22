/* =====================================================================
   WELT – Zuordnung: Unter den Tempelkacheln liegen Zeichen. Sie zeigen sich kurz, dann schließen sich
   die Kacheln. Das Orakel nennt ein Zeichen – wähl die Kachel, unter der es liegt.
   ===================================================================== */
function makeZuordnung(next, level = 0) {
  // Ab Level 5 drehen sich die Kacheln nacheinander um, ab Level 7 gibt es jedes Zeichen in zwei Farben
  const P = [3, 4, 5, 6, 6, 7, 8, 8, 9, 10][level], SHOWT = [3, 3.5, 4, 4.5, 4, 0, 0, 0, 0, 0][level], STEP = [0, 0, 0, 0, 0, 1.1, 1.05, 1.1, 1.05, 1][level];
  const SEQ = level >= 5, SIMILAR = level >= 7, ROUNDS = 3, LIVES = 3;
  const SHAPES = ['sonne', 'mond', 'stern', 'auge', 'welle', 'spirale', 'dreieck', 'kreuz', 'herz', 'blitz', 'baum', 'fisch'];
  const HUES = ['#ffcf5a', '#9ad0ff', '#ff8ad8', '#7dffb0', '#ff8a5a', '#c9a0ff', '#fff27a', '#5ae0e0', '#ff5a7a', '#b8ff5a', '#ffa8a8', '#8ab4ff'];
  const COLS = P <= 4 ? P : P <= 6 ? 3 : P <= 8 ? 4 : 5, ROWS = Math.ceil(P / COLS), TS = 78, GAP = 14;
  const X0 = W / 2 - (COLS * TS + (COLS - 1) * GAP) / 2, Y0 = 135 + (230 - (ROWS * TS + (ROWS - 1) * GAP)) / 2;
  const finale = makeFinale(next);
  let syms, order, qi, open, phase, timer, cur, roundI, lives, wrongAt, t = 0, msg = '', msgT = 0;
  const rep = makeRepeater();
  function newRound() {
    let pool;
    if (SIMILAR) { const sh = SHAPES.slice().sort(() => Math.random() - 0.5).slice(0, Math.ceil(P / 2) + 1); pool = []; for (const s of sh) for (const col of ['#ffcf5a', '#6be6ff']) pool.push({ s, col }); }
    else pool = SHAPES.map((s, i) => ({ s, col: HUES[i] }));
    pool.sort(() => Math.random() - 0.5); syms = pool.slice(0, P);
    order = syms.map((_, i) => i).sort(() => Math.random() - 0.5); qi = 0; open = new Set(); wrongAt = -1;
    phase = 'show'; timer = SEQ ? 0.6 + P * STEP : 0.6 + SHOWT; cur = 0;
  }
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  function advance() {
    qi++; if (qi < P) return;
    roundI++; if (roundI >= ROUNDS) { finale.start(); return; }
    msg = 'Alle Zeichen gefunden!'; msgT = 1.3; phase = 'wait'; timer = 1.3;
  }
  reset();
  const tilePos = i => ({ x: X0 + (i % COLS) * (TS + GAP), y: Y0 + Math.floor(i / COLS) * (TS + GAP) });
  // Welche Kachel ist in der Zeigephase gerade offen?
  function shownNow(i) {
    if (phase !== 'show') return false;
    const el = (SEQ ? 0.6 + P * STEP : 0.6 + SHOWT) - timer;
    if (el < 0.6) return false;
    return SEQ ? Math.floor((el - 0.6) / STEP) === i && (el - 0.6) % STEP < STEP * 0.85 : true;
  }
  function glyph(c, s, x, y, r, col) {
    c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    if (s === 'sonne') { c.arc(x, y, r * 0.38, 0, 7); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.moveTo(x + Math.cos(a) * r * 0.58, y + Math.sin(a) * r * 0.58); c.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); } c.stroke(); }
    else if (s === 'mond') { c.arc(x, y, r * 0.75, 0.927, Math.PI * 2 - 0.927); c.arc(x + r * 0.45, y, r * 0.6, Math.PI * 1.5, Math.PI * 0.5, true); c.closePath(); c.fill(); }
    else if (s === 'stern') { for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.38 : r * 0.9; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.fill(); }
    else if (s === 'auge') { c.moveTo(x - r * 0.9, y); c.quadraticCurveTo(x, y - r * 0.9, x + r * 0.9, y); c.quadraticCurveTo(x, y + r * 0.9, x - r * 0.9, y); c.stroke(); c.beginPath(); c.arc(x, y, r * 0.25, 0, 7); c.fill(); }
    else if (s === 'welle') { for (const o of [-0.35, 0.35]) { c.moveTo(x - r * 0.9, y + r * o); for (let i = 1; i <= 16; i++) c.lineTo(x - r * 0.9 + i * r * 1.8 / 16, y + r * o + Math.sin(i / 16 * Math.PI * 3) * r * 0.22); } c.stroke(); }
    else if (s === 'spirale') { for (let i = 0; i < 60; i++) { const a = i * 0.28, rr = r * 0.05 + i * r * 0.0145; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.stroke(); }
    else if (s === 'dreieck') { c.moveTo(x, y - r * 0.85); c.lineTo(x + r * 0.85, y + r * 0.65); c.lineTo(x - r * 0.85, y + r * 0.65); c.closePath(); c.stroke(); c.beginPath(); c.arc(x, y + r * 0.15, r * 0.16, 0, 7); c.fill(); }
    else if (s === 'kreuz') { c.lineWidth = r * 0.3; c.moveTo(x, y - r * 0.85); c.lineTo(x, y + r * 0.85); c.moveTo(x - r * 0.85, y); c.lineTo(x + r * 0.85, y); c.stroke(); }
    else if (s === 'herz') { c.moveTo(x, y + r * 0.8); c.bezierCurveTo(x - r * 1.2, y - r * 0.1, x - r * 0.5, y - r * 1.0, x, y - r * 0.35); c.bezierCurveTo(x + r * 0.5, y - r * 1.0, x + r * 1.2, y - r * 0.1, x, y + r * 0.8); c.fill(); }
    else if (s === 'blitz') { c.moveTo(x + r * 0.2, y - r * 0.9); c.lineTo(x - r * 0.5, y + r * 0.1); c.lineTo(x, y + r * 0.1); c.lineTo(x - r * 0.2, y + r * 0.9); c.lineTo(x + r * 0.5, y - r * 0.15); c.lineTo(x, y - r * 0.15); c.closePath(); c.fill(); }
    else if (s === 'baum') { c.moveTo(x, y + r * 0.9); c.lineTo(x, y - r * 0.2); c.moveTo(x, y + r * 0.1); c.lineTo(x - r * 0.6, y - r * 0.6); c.moveTo(x, y + r * 0.1); c.lineTo(x + r * 0.6, y - r * 0.6); c.moveTo(x, y - r * 0.2); c.lineTo(x, y - r * 0.9); c.moveTo(x - r * 0.5, y + r * 0.9); c.lineTo(x + r * 0.5, y + r * 0.9); c.stroke(); }
    else if (s === 'fisch') { c.moveTo(x + r * 0.9, y); c.quadraticCurveTo(x + r * 0.1, y - r * 0.8, x - r * 0.55, y + r * 0.45); c.moveTo(x + r * 0.9, y); c.quadraticCurveTo(x + r * 0.1, y + r * 0.8, x - r * 0.55, y - r * 0.45); c.stroke(); }
    c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, phase, syms, ask: phase === 'ask' ? order[qi] : -1, open, cur, cols: COLS, shown: syms.map((_, i) => shownNow(i)) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') { const was = syms.findIndex((_, i) => shownNow(i)); timer -= dt; const now = syms.findIndex((_, i) => shownNow(i)); if (SEQ && now >= 0 && now !== was) Klang.tone(300 + now * 40, 0.3); if (timer <= 0) phase = 'ask'; }
      else if (phase === 'ask') {
        const d = rep(dt);
        if (d) { const x = clamp(cur % COLS + d[0], 0, COLS - 1), y = clamp(Math.floor(cur / COLS) + d[1], 0, ROWS - 1); if (y * COLS + x < P) cur = y * COLS + x; }
        if (pressed.action && !open.has(cur)) {
          const want = order[qi];
          if (cur === want) { open.add(cur); Klang.tone(520 + qi * 30, 0.3); advance(); }
          else { lives--; wrongAt = cur; open.add(want); msg = lives > 0 ? 'Falsch – dort lag es.' : 'Keine Versuche mehr. Von vorn.'; msgT = 1.5; phase = 'wrong'; timer = 1.5; Klang.tone(150, 0.4); }
        }
      } else if (phase === 'wrong') {
        timer -= dt;
        if (timer <= 0) { wrongAt = -1; if (lives <= 0) { died(); reset(); return; } phase = 'ask'; advance(); }
      } else { timer -= dt; if (timer <= 0) newRound(); }
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, 80, 20, W / 2, 200, 420); bg.addColorStop(0, '#1d4a4a'); bg.addColorStop(1, '#061416'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(120,220,200,0.07)'; c.lineWidth = 1;
      for (let y = 0; y < H; y += 32) for (let x = (y / 32) % 2 * 24; x < W; x += 48) c.strokeRect(x, y, 48, 32);
      // Säulen mit Fackeln
      for (const sx of [40, W - 40]) {
        c.fillStyle = '#0f2a2a'; c.fillRect(sx - 14, 60, 28, H - 60); c.fillStyle = '#16403e'; c.fillRect(sx - 18, 56, 36, 10);
        const fl = 1 + Math.sin(t * 11 + sx) * 0.15; c.fillStyle = 'rgba(255,170,60,0.18)'; c.beginPath(); c.arc(sx, 48, 30 * fl, 0, 7); c.fill();
        c.fillStyle = '#ffb347'; c.beginPath(); c.ellipse(sx, 44, 6, 12 * fl, 0, 0, 7); c.fill();
      }
      // Orakel
      c.save(); c.shadowColor = '#7dffe0'; c.shadowBlur = phase === 'ask' ? 24 : 6;
      c.fillStyle = '#0a1c1d'; c.beginPath(); c.arc(W / 2, 78, 36, 0, 7); c.fill(); c.restore();
      c.strokeStyle = 'rgba(125,255,224,0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(W / 2, 78, 36, 0, 7); c.stroke();
      if ((phase === 'ask' || phase === 'wrong') && qi < P) { const s = syms[order[qi]]; glyph(c, s.s, W / 2, 78, 24, s.col); }
      else if (phase === 'show') { c.fillStyle = 'rgba(125,255,224,0.5)'; c.beginPath(); c.arc(W / 2, 78, 6 + Math.sin(t * 4) * 3, 0, 7); c.fill(); }
      syms.forEach((s, i) => {
        const { x, y } = tilePos(i), vis = shownNow(i) || open.has(i);
        c.fillStyle = vis ? '#0d2224' : '#24524f'; c.beginPath(); c.roundRect(x, y, TS, TS, 8); c.fill();
        c.strokeStyle = i === wrongAt ? '#ff5a6a' : (phase === 'wrong' && i === order[qi]) ? '#ffe27a' : 'rgba(160,255,230,0.35)'; c.lineWidth = (i === wrongAt || (phase === 'wrong' && i === order[qi])) ? 4 : 2;
        c.beginPath(); c.roundRect(x + 1, y + 1, TS - 2, TS - 2, 8); c.stroke();
        if (vis) glyph(c, s.s, x + TS / 2, y + TS / 2, 26, s.col);
        else { c.strokeStyle = 'rgba(160,255,230,0.18)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x + TS / 2, y + TS / 2, 16, 0, 7); c.moveTo(x + TS / 2, y + TS / 2 - 24); c.lineTo(x + TS / 2, y + TS / 2 + 24); c.stroke(); }
        if (phase === 'ask' && i === cur) { c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 5, y - 5, TS + 10, TS + 10, 11); c.stroke(); }
      });
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${P} Zeichen`, 16, 26, '#bff5e6');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff8a9a', 'right', 16);
      const hint = finale.active ? '' : phase === 'show' ? (SEQ ? 'Die Kacheln drehen sich nacheinander um …' : 'Merk dir, wo welches Zeichen liegt …') : phase === 'ask' ? `Wo liegt das Zeichen des Orakels? (${qi + 1} / ${P})` : '';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 14, '#bff5e6', 'center');
      finale.draw(c, '#bff5e6', '#0d2224');
    }
  };
  return self;
}
