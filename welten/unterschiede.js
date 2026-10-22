/* =====================================================================
   WELT – Unterschiede: Zwei Gemälde eines nächtlichen Zaubergartens hängen nebeneinander. Finde alle
   Unterschiede, bevor die Sanduhr abläuft. Pfeiltasten führen die Lupe, Leertaste markiert.
   Fehlklicks kosten Zeit. Später: mehr Dinge, kleinere und feinere Unterschiede.
   ===================================================================== */
function makeUnterschiede(next, level = 0) {
  const ITEMS = [9, 11, 13, 15, 17, 19, 21, 23, 25, 27][level], DIFFS = [3, 4, 4, 5, 5, 6, 6, 7, 7, 8][level];
  const TIME = [60, 60, 60, 60, 65, 65, 70, 70, 75, 75][level], PEN = 4;
  const SMIN = [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.6, 0.55][level], SMAX = [1.35, 1.3, 1.25, 1.2, 1.15, 1.1, 1.05, 1.0, 1.0, 0.95][level];
  const KINDS = ['fehlt', 'farbe', 'form', 'groesse', 'versetzt'].slice(0, [2, 3, 3, 4, 4, 4, 5, 5, 5, 5][level]);
  const FINE = level >= 6; // feinere Unterschiede
  const PAL = ['#ff5a6e', '#ffa040', '#ffe66b', '#7dff8a', '#4fd8ff', '#9a7bff', '#ff8be0', '#f4f4ff'];
  const PW = 296, PH = 300, PX = [16, 328], PY = 62, GROUND = 160;
  const SKY = ['stern', 'vogel'], LAND = ['baum', 'haus', 'blume', 'pilz', 'stein', 'laterne'];
  const finale = makeFinale(next);
  let items, diffs, cur, timeLeft, failed, flash, flashCol, lock, t = 0, msg = '', msgT = 0;
  const ri = n => Math.floor(Math.random() * n), rand = (a, b) => a + Math.random() * (b - a);
  const tall = it => ({ baum: 30, haus: 18, blume: 16, pilz: 9, stein: 5, laterne: 26, stern: 0, vogel: 0 })[it.type];
  function build() {
    items = [];
    let guard = 0;
    while (items.length < ITEMS && guard++ < 5000) {
      const sky = items.length < Math.round(ITEMS * 0.3), s = rand(SMIN, SMAX);
      const type = sky ? SKY[ri(2)] : LAND[ri(LAND.length)];
      const x = rand(26, PW - 26), y = sky ? rand(24, GROUND - 40) : rand(GROUND + 30, PH - 14);
      const it = { type, x, y, s, col: ri(PAL.length), v: false };
      const hy = y - tall(it) * s;
      if (items.some(o => Math.hypot(o.x - x, (o.y - tall(o) * o.s) - hy) < 30 * (s + o.s) / 2 + 12)) continue;
      items.push(it);
    }
    items.sort((a, b) => a.y - b.y);
    // Unterschiede: jede Art möglichst gleich oft, auf verschiedene Dinge verteilt
    const pool = items.map((_, i) => i).sort(() => Math.random() - 0.5);
    diffs = [];
    for (let k = 0; k < DIFFS; k++) {
      const it = items[pool[k]], kind = KINDS[k % KINDS.length], side = ri(2), d = { i: pool[k], kind, side, found: false };
      if (kind === 'farbe') { const off = FINE ? (ri(2) ? 1 : -1) : 2 + ri(PAL.length - 3); d.col = (it.col + off + PAL.length) % PAL.length; }
      if (kind === 'groesse') d.s = it.s * (FINE ? (ri(2) ? 0.72 : 1.32) : (ri(2) ? 0.55 : 1.55));
      if (kind === 'versetzt') { const a = rand(0, Math.PI * 2), r = FINE ? 13 : 20; d.dx = Math.cos(a) * r; d.dy = Math.sin(a) * r * 0.6; }
      diffs.push(d);
    }
  }
  // Ding so, wie es in Panel p erscheint (oder null, wenn es dort fehlt)
  function itemIn(i, p) {
    const it = items[i], d = diffs.find(q => q.i === i);
    if (!d || d.side !== p) return it;
    if (d.kind === 'fehlt') return null;
    const o = { ...it };
    if (d.kind === 'farbe') o.col = d.col;
    if (d.kind === 'form') o.v = !it.v;
    if (d.kind === 'groesse') o.s = d.s;
    if (d.kind === 'versetzt') { o.x += d.dx; o.y += d.dy; }
    return o;
  }
  const hitOf = d => { const it = items[d.i], s = Math.max(it.s, d.s || 0); return { x: it.x + (d.dx || 0) / 2, y: it.y - tall(it) * it.s * 0.6 + (d.dy || 0) / 2, r: Math.max(20, 24 * s) + (d.dx ? 8 : 0) }; };
  function reset() { build(); cur = { x: PW / 2, y: PH / 2 }; timeLeft = TIME; failed = false; flash = 0; lock = 0; }
  reset();
  function drawItem(c, it) {
    const col = PAL[it.col];
    c.save(); c.translate(it.x, it.y); c.scale(it.s, it.s);
    switch (it.type) {
      case 'stern': {
        const n = it.v ? 4 : 5; c.fillStyle = col; c.beginPath();
        for (let k = 0; k <= n * 2; k++) { const a = -Math.PI / 2 + k * Math.PI / n, r = k % 2 ? 4 : 10; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.fill(); break;
      }
      case 'vogel': {
        c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath();
        const w = it.v ? 7 : -7; c.moveTo(-12, w); c.quadraticCurveTo(-6, -w * 0.3, 0, 2); c.quadraticCurveTo(6, -w * 0.3, 12, w); c.stroke(); break;
      }
      case 'baum': {
        c.fillStyle = '#5a3b26'; c.fillRect(-3, -18, 6, 18);
        c.fillStyle = col; c.beginPath();
        if (it.v) { c.moveTo(0, -50); c.lineTo(15, -14); c.lineTo(-15, -14); c.closePath(); } else c.arc(0, -32, 15, 0, 7);
        c.fill(); break;
      }
      case 'haus': {
        c.fillStyle = col; c.fillRect(-14, -22, 28, 22);
        c.fillStyle = '#3a2440'; c.beginPath(); c.moveTo(-18, -22); c.lineTo(0, -38); c.lineTo(18, -22); c.closePath(); c.fill();
        c.fillStyle = it.v ? '#1b1230' : '#fff3a0'; c.fillRect(-6, -16, 12, 9);
        c.fillStyle = '#3a2440'; c.fillRect(-1, -16, 2, 9); break;
      }
      case 'blume': {
        c.strokeStyle = '#4fae5a'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -16); c.stroke();
        const n = it.v ? 8 : 5; c.fillStyle = col;
        for (let k = 0; k < n; k++) { const a = k * Math.PI * 2 / n; c.beginPath(); c.ellipse(Math.cos(a) * 6, -16 + Math.sin(a) * 6, 4.5, 3, a, 0, 7); c.fill(); }
        c.fillStyle = '#fff3a0'; c.beginPath(); c.arc(0, -16, 3, 0, 7); c.fill(); break;
      }
      case 'pilz': {
        c.fillStyle = '#efe2cc'; c.fillRect(-3, -9, 6, 9);
        c.fillStyle = col; c.beginPath(); c.arc(0, -9, 11, Math.PI, 0); c.closePath(); c.fill();
        if (!it.v) { c.fillStyle = '#ffffff'; for (const [dx, dy] of [[-5, -13], [2, -16], [6, -11]]) { c.beginPath(); c.arc(dx, dy, 1.8, 0, 7); c.fill(); } }
        break;
      }
      case 'stein': {
        c.fillStyle = col; c.beginPath(); c.ellipse(0, -5, 13, 7, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(3, -3, 8, 3.5, 0, 0, 7); c.fill();
        if (it.v) { c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-5, -11); c.lineTo(-1, -5); c.lineTo(-4, 0); c.stroke(); }
        break;
      }
      case 'laterne': {
        c.fillStyle = '#2a2235'; c.fillRect(-1.5, -36, 3, 36);
        c.fillStyle = it.v ? '#3a3448' : col; c.fillRect(-6, -48, 12, 13);
        if (!it.v) { c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(0, -41, 13, 0, 7); c.fill(); }
        c.fillStyle = '#2a2235'; c.fillRect(-8, -50, 16, 3); break;
      }
    }
    c.restore();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, cur, diffs: diffs.map(d => ({ ...hitOf(d), found: d.found })) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; flash = Math.max(0, flash - dt * 3); lock -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { lock -= dt; if (lock <= 0 && pressed.action) { died(); reset(); } return; }
      const sp = 230 * dt;
      cur.x = clamp(cur.x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * sp, 4, PW - 4);
      cur.y = clamp(cur.y + ((keys.down ? 1 : 0) - (keys.up ? 1 : 0)) * sp, 4, PH - 4);
      timeLeft -= dt;
      if (timeLeft <= 0) { failed = true; lock = 0.6; return; }
      if (pressed.action && lock <= 0) {
        const d = diffs.find(q => !q.found && (h => Math.hypot(h.x - cur.x, h.y - cur.y) < h.r)(hitOf(q)));
        if (d) { d.found = true; flash = 1; flashCol = '#7dffb0'; Klang.tone(620 + 40 * diffs.filter(q => q.found).length, 0.2); if (diffs.every(q => q.found)) finale.start(); }
        else { timeLeft -= PEN; flash = 1; flashCol = '#ff4d6d'; lock = 0.35; msg = `Kein Unterschied – minus ${PEN} Sekunden`; msgT = 1.2; Klang.tone(150, 0.25); }
      }
    },
    draw(c) {
      // Museumswand
      c.fillStyle = '#20141a'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < W; i += 32) { c.fillStyle = i % 64 ? '#25171e' : '#22151b'; c.fillRect(i, 0, 32, H); }
      for (let p = 0; p < 2; p++) {
        const ox = PX[p], oy = PY;
        c.fillStyle = '#b8892f'; c.fillRect(ox - 8, oy - 8, PW + 16, PH + 16);
        c.fillStyle = '#7a5518'; c.fillRect(ox - 3, oy - 3, PW + 6, PH + 6);
        c.save(); c.beginPath(); c.rect(ox, oy, PW, PH); c.clip(); c.translate(ox, oy);
        const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#120a35'); g.addColorStop(1, '#3b2a6e');
        c.fillStyle = g; c.fillRect(0, 0, PW, GROUND);
        c.fillStyle = '#f6efc8'; c.beginPath(); c.arc(PW - 40, 34, 16, 0, 7); c.fill();
        c.fillStyle = '#1d2b3a'; c.beginPath(); c.moveTo(0, GROUND); c.quadraticCurveTo(PW * 0.3, GROUND - 26, PW * 0.6, GROUND - 6); c.quadraticCurveTo(PW * 0.85, GROUND - 22, PW, GROUND - 4); c.lineTo(PW, PH); c.lineTo(0, PH); c.fill();
        c.fillStyle = '#1a3a2c'; c.fillRect(0, GROUND, PW, PH - GROUND);
        c.fillStyle = '#21473a'; c.beginPath(); c.ellipse(PW / 2, PH + 20, PW * 0.7, 80, 0, 0, 7); c.fill();
        for (let i = 0; i < items.length; i++) { const it = itemIn(i, p); if (it) drawItem(c, it); }
        for (const d of diffs) if (d.found) { const h = hitOf(d); c.strokeStyle = '#7dffb0'; c.lineWidth = 2.5; c.beginPath(); c.arc(h.x, h.y, h.r, 0, 7); c.stroke(); }
        // Lupe
        c.strokeStyle = failed ? 'rgba(255,255,255,0.3)' : '#ffffff'; c.lineWidth = 2;
        c.beginPath(); c.arc(cur.x, cur.y, 11, 0, 7); c.stroke();
        c.beginPath(); c.moveTo(cur.x + 8, cur.y + 8); c.lineTo(cur.x + 16, cur.y + 16); c.stroke();
        c.restore();
      }
      const found = diffs.filter(d => d.found).length;
      label(c, `Unterschiede ${found} / ${DIFFS}`, 16, 30, '#f2d9a6');
      label(c, `${Math.ceil(Math.max(0, timeLeft))} s`, W - 16, 30, timeLeft < 10 ? '#ff6b7a' : '#f2d9a6', 'right', 14);
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, 42, W - 32, 4);
      c.fillStyle = timeLeft < 10 ? '#ff4d6d' : '#d9a441'; c.fillRect(16, 42, (W - 32) * clamp(timeLeft / TIME, 0, 1), 4);
      if (msgT > 0) label(c, msg, W / 2, 390, '#ff9db0', 'center', 12);
      else label(c, 'Pfeiltasten: Lupe bewegen · Leertaste: Unterschied markieren', W / 2, 390, '#c9b48e', 'center', 12);
      if (flash > 0) { c.fillStyle = flashCol; c.globalAlpha = flash * 0.1; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      if (failed) { c.fillStyle = 'rgba(32,20,26,0.92)'; c.fillRect(0, 160, W, 80); label(c, `Zeit abgelaufen – ${found} von ${DIFFS} gefunden. Leertaste: neuer Versuch`, W / 2, 205, '#ff9db0', 'center', 13); }
      finale.draw(c, '#f2d9a6', '#3a2440');
    }
  };
  return self;
}
