/* =====================================================================
   WELT – Doppelspur: Geteilte Aufmerksamkeit. Links lenkst du ein Laternenboot mit ← → durch die
   Felsen im Fluss, rechts zeigt der Signalturm Zeichen. Nur beim Zielzeichen Leertaste drücken.
   Halte durch, bis die Fahrt zu Ende ist. Ab Level 5 mischen sich Doppelgänger unter die Zeichen,
   ab Level 7 wechselt unterwegs das Zielzeichen.
   ===================================================================== */
function makeDoppelspur(next, level = 0) {
  const DUR = [30, 35, 40, 45, 50, 50, 55, 55, 60, 60][level], VS = [130, 145, 160, 175, 190, 200, 210, 220, 230, 240][level];
  const ROWGAP = [1.6, 1.5, 1.4, 1.3, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95][level], DOUBLE = [0, 0, 0, 0.15, 0.2, 0.3, 0.35, 0.4, 0.45, 0.5][level];
  const SIGINT = [2.6, 2.4, 2.3, 2.2, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5][level], SHOW = [1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.05, 1.0, 0.95, 0.9][level];
  const LOOK = level >= 4 ? [0, 0, 0, 0, 0.35, 0.4, 0.45, 0.5, 0.5, 0.55][level] : 0, SWITCH = level >= 6, TP = 0.35, LIVES = 3;
  const LANES = [80, 200, 320], BY = 330, RW = 400, SX = 520, SY = 190;
  const SHAPES = ['stern', 'mond', 'raute', 'dreieck', 'ring', 'kreuz'], COLS = ['#ffd25a', '#ff7a6b', '#7ad7ff', '#b98bff', '#8dff9a'];
  const finale = makeFinale(next);
  let lane, bx, rows, rowT, sig, sigT, target, switched, timeLeft, lives, failed, timer, fb, fbOk, scroll, t = 0, msg = '', msgT = 0, announce = 0, gone = 9;
  const ri = n => Math.floor(Math.random() * n), rand = (a, b) => a + Math.random() * (b - a);
  const same = (a, b) => a.shape === b.shape && a.col === b.col;
  function pickTarget() { return { shape: SHAPES[ri(SHAPES.length)], col: COLS[ri(COLS.length)] }; }
  function newSignal() {
    if (Math.random() < TP) return { ...target, isT: true, age: 0, answered: false };
    let s;
    do {
      if (Math.random() < LOOK) s = Math.random() < 0.5 ? { shape: target.shape, col: COLS[ri(COLS.length)] } : { shape: SHAPES[ri(SHAPES.length)], col: target.col };
      else s = { shape: SHAPES[ri(SHAPES.length)], col: COLS[ri(COLS.length)] };
    } while (same(s, target));
    return { ...s, isT: false, age: 0, answered: false };
  }
  function reset() {
    lane = 1; bx = LANES[1]; rows = []; rowT = 1.5; sig = null; sigT = 2; target = pickTarget(); switched = false;
    timeLeft = DUR; lives = LIVES; failed = false; fb = 0; scroll = 0; announce = 2.5;
  }
  reset();
  function lose(text) { lives--; msg = text; msgT = 1.4; fb = 1; fbOk = false; Klang.tone(150, 0.3); if (lives <= 0) { failed = true; timer = 0.6; } }
  function drawSym(c, s, x, y, r) {
    c.fillStyle = s.col; c.strokeStyle = s.col; c.lineWidth = r * 0.28; c.beginPath();
    if (s.shape === 'stern') { for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.fill(); }
    else if (s.shape === 'mond') { c.arc(x, y, r, 0.6, Math.PI * 2 - 0.6, false); c.arc(x + r * 0.55, y, r * 0.75, Math.PI * 2 - 1.1, 1.1, true); c.fill(); }
    else if (s.shape === 'raute') { c.moveTo(x, y - r); c.lineTo(x + r * 0.75, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.75, y); c.closePath(); c.fill(); }
    else if (s.shape === 'dreieck') { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); c.fill(); }
    else if (s.shape === 'ring') { c.arc(x, y, r * 0.8, 0, 7); c.stroke(); }
    else { c.moveTo(x - r * 0.75, y - r * 0.75); c.lineTo(x + r * 0.75, y + r * 0.75); c.moveTo(x + r * 0.75, y - r * 0.75); c.lineTo(x - r * 0.75, y + r * 0.75); c.stroke(); }
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, lane, rows, by: BY, vs: VS, sig: sig && { isT: sig.isT, age: sig.age, answered: sig.answered }, announce }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; fb = Math.max(0, fb - dt * 2); announce -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { timer -= dt; if (timer <= 0 && pressed.action) { died(); reset(); } return; }
      timeLeft -= dt; scroll += VS * dt;
      if (timeLeft <= 0 && !sig) { finale.start(); Klang.tone(700, 0.4); return; }
      // Boot
      if (pressed.left) lane = Math.max(0, lane - 1);
      if (pressed.right) lane = Math.min(2, lane + 1);
      bx += (LANES[lane] - bx) * Math.min(1, dt * 18);
      // Felsen
      rowT -= dt;
      if (rowT <= 0 && timeLeft > 1.5) {
        const free = ri(3), blocked = [0, 1, 2].filter(l => l !== free);
        rows.push({ y: -24, lanes: Math.random() < DOUBLE ? blocked : [blocked[ri(2)]], hit: false });
        rowT = ROWGAP * rand(0.85, 1.15);
      }
      for (const r of rows) {
        r.y += VS * dt;
        if (!r.hit && Math.abs(r.y - BY) < 26 && r.lanes.includes(lane)) { r.hit = true; lose('Gegen einen Felsen!'); if (failed) return; }
      }
      rows = rows.filter(r => r.y < H + 30);
      // Signale
      if (SWITCH && !switched && timeLeft < DUR / 2) { switched = true; let n; do n = pickTarget(); while (same(n, target)); target = n; announce = 2.5; sig = null; sigT = 1.8; msg = 'Neues Zielzeichen!'; msgT = 2; Klang.tone(880, 0.2); }
      if (sig) {
        sig.age += dt;
        if (pressed.action && !sig.answered) {
          sig.answered = true;
          if (sig.isT) { fb = 1; fbOk = true; Klang.tone(660, 0.15); } else lose('Falsches Zeichen!');
          if (failed) return;
        }
        if (sig.age > SHOW + 0.25) { if (sig.isT && !sig.answered) { lose('Zielzeichen verpasst!'); if (failed) return; } sig = null; gone = 0; sigT = SIGINT * rand(0.8, 1.2) - SHOW; }
      } else {
        gone += dt;
        if (pressed.action && gone > 0.5) { lose('Gerade kein Zeichen!'); if (failed) return; }
        sigT -= dt; if (sigT <= 0 && timeLeft > SHOW + 0.5) { sig = newSignal(); }
      }
    },
    draw(c) {
      // Fluss
      c.fillStyle = '#0b2a2e'; c.fillRect(0, 0, RW, H);
      c.fillStyle = '#123d3f'; c.fillRect(20, 0, RW - 40, H);
      c.strokeStyle = 'rgba(160,240,230,0.12)'; c.lineWidth = 2;
      for (let i = 0; i < 12; i++) { const y = (i * 40 + scroll) % (H + 40) - 20; c.beginPath(); c.moveTo(40 + (i * 53) % 300, y); c.lineTo(70 + (i * 53) % 300, y); c.stroke(); }
      c.strokeStyle = 'rgba(160,240,230,0.08)'; c.setLineDash([10, 14]); c.lineDashOffset = -scroll;
      for (const x of [140, 260]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      c.setLineDash([]); c.lineDashOffset = 0;
      for (const r of rows) for (const l of r.lanes) {
        const x = LANES[l];
        c.fillStyle = r.hit ? '#3a4a4a' : '#5b5560'; c.beginPath(); c.moveTo(x - 30, r.y + 14); c.lineTo(x - 20, r.y - 14); c.lineTo(x + 6, r.y - 20); c.lineTo(x + 28, r.y - 4); c.lineTo(x + 26, r.y + 16); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.moveTo(x - 20, r.y - 14); c.lineTo(x + 6, r.y - 20); c.lineTo(x - 2, r.y - 4); c.fill();
      }
      // Boot mit Laterne
      const lg = c.createRadialGradient(bx, BY - 18, 2, bx, BY - 18, 60); lg.addColorStop(0, 'rgba(255,210,120,0.45)'); lg.addColorStop(1, 'rgba(255,210,120,0)');
      c.fillStyle = lg; c.fillRect(bx - 60, BY - 78, 120, 120);
      c.fillStyle = '#8a5a34'; c.beginPath(); c.moveTo(bx - 12, BY + 18); c.lineTo(bx - 14, BY - 6); c.lineTo(bx, BY - 22); c.lineTo(bx + 14, BY - 6); c.lineTo(bx + 12, BY + 18); c.closePath(); c.fill();
      c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(bx, BY - 4, 4, 0, 7); c.fill();
      // Signalturm
      c.fillStyle = '#160f24'; c.fillRect(RW, 0, W - RW, H);
      c.fillStyle = '#21183a'; c.fillRect(RW + 30, 70, W - RW - 60, 240);
      c.strokeStyle = '#6a58a8'; c.lineWidth = 2; c.strokeRect(RW + 30.5, 70.5, W - RW - 61, 240);
      label(c, 'Ziel:', RW + 40, 340, '#c8bfff', 'left', 13);
      c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(RW + 90, 322, 34, 30);
      drawSym(c, target, RW + 107, 337, 11);
      if (announce > 0) { c.strokeStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t * 12)})`; c.lineWidth = 2; c.strokeRect(RW + 87, 319, 40, 36); }
      if (sig && sig.age < SHOW) {
        const k = clamp(sig.age / 0.08, 0, 1);
        drawSym(c, sig, SX, SY, 46 * k);
        if (sig.answered) { c.strokeStyle = sig.isT ? '#7dffb0' : '#ff5a6e'; c.lineWidth = 3; c.strokeRect(RW + 40, 80, W - RW - 80, 220); }
      }
      if (fb > 0) flashOverlay(c, fb * 0.08, fbOk ? '125,255,176' : '255,77,109');
      label(c, `${Math.ceil(Math.max(0, timeLeft))} s`, 16, 26, '#c8f2ea');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff8aa8', 'right', 16);
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, 34, RW - 32, 3); c.fillStyle = '#7ad7ff'; c.fillRect(16, 34, (RW - 32) * clamp(1 - timeLeft / DUR, 0, 1), 3);
      if (msgT > 0) label(c, msg, SX, 52, fbOk && fb > 0 ? '#c8ffd8' : '#ffc0c8', 'center', 12);
      label(c, '← → Boot · Leertaste: Zielzeichen', SX, 386, '#9a8fd0', 'center', 11);
      if (failed) { c.fillStyle = 'rgba(11,20,30,0.92)'; c.fillRect(0, 160, W, 80); label(c, 'Gekentert. Leertaste: neuer Versuch', W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#c8f2ea', '#21183a');
    }
  };
  return self;
}
