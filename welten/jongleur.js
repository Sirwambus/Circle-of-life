/* =====================================================================
   WELT – Jongleur: Im Nachtzirkus Leuchtbälle in der Luft halten. ← wirft mit der linken, → mit der rechten
   Hand (Leertaste: die Hand, die schon länger hält). Jede Hand trägt nur einen Ball – landet ein zweiter,
   fällt er herunter. Zu langes Halten lässt den Ball ebenfalls fallen, und wer mit leerer Hand wirft, macht die Hand kurz zu.
   ===================================================================== */
function makeJongleur(next, level = 0) {
  const BALLS = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5][level];
  const AIR = [1.3, 1.15, 1.5, 1.4, 1.3, 1.6, 1.5, 1.42, 1.75, 1.65][level];      // Flugzeit eines Wurfs
  const VAR = [0, 0.1, 0.05, 0.12, 0.18, 0.1, 0.15, 0.2, 0.12, 0.18][level];      // Unregelmäßigkeit der Würfe
  const HOLD = [2.5, 2.2, 2.0, 1.8, 1.6, 1.5, 1.4, 1.3, 1.25, 1.2][level];
  const NEED = [20, 24, 28, 32, 36, 40, 44, 48, 52, 56][level], MINGAP = 0.5, LIVES = 3, G = 560;
  const HX = [228, 412], HY = 318, COLS = ['#ff3fa4', '#3ff0ff', '#ffe14d', '#8dff6b', '#c58bff'];
  const finale = makeFinale(next);
  let balls, hands, busy, catches, lives, failT, msg, msgT, t = 0, flash = 0;
  function reset() {
    balls = Array.from({ length: BALLS }, (_, i) => ({ id: i, st: 'wait', wait: 0.6 + i * 0.85, to: i % 2, from: 0, t: 0, a: 1, hold: 0, x: HX[i % 2], y: -30, vx: 0, vy: 0 }));
    hands = [null, null]; busy = [0, 0]; catches = 0; lives = LIVES; failT = -1; msg = ''; msgT = 0;
  }
  reset();
  function say(m) { msg = m; msgT = 1.2; }
  // Flugzeit so wählen, dass an der Zielhand zwei Ankünfte mindestens MINGAP auseinanderliegen
  function pickAir(to, base, spread) {
    const arr = balls.filter(b => (b.st === 'air' || b.st === 'in') && b.to === to).map(b => b.a - b.t);
    const cands = []; for (let k = 0; k < 9; k++) cands.push(base * (1 - spread + 2 * spread * k / 8));
    const gap = a => arr.reduce((m, r) => Math.min(m, Math.abs(a - r)), 9);
    const ok = cands.filter(a => gap(a) >= MINGAP);
    if (ok.length) return ok[Math.floor(Math.random() * ok.length)];
    let best = cands[0]; for (const a of cands) if (gap(a) > gap(best)) best = a;
    for (let a = base * (1 + spread); a < base * 1.8; a += 0.05) if (gap(a) >= MINGAP) return a;
    return best;
  }
  function drop(b, m) { b.st = 'fall'; b.vx = (b.x < W / 2 ? -1 : 1) * 60; b.vy = -80; lives--; flash = 1; say(m); Klang.tone(130, 0.3); if (lives <= 0) failT = 0; }
  function arrive(b) {
    const h = b.to;
    if (hands[h]) { drop(b, 'Zwei Bälle in einer Hand!'); return; }
    if (busy[h] > 0) { drop(b, 'Die Hand war zu!'); return; }
    hands[h] = b; b.st = 'hold'; b.hold = 0; b.x = HX[h]; b.y = HY; catches++;
    Klang.tone(300 + b.id * 70, 0.08);
    if (catches >= NEED) finale.start();
  }
  function toss(h) {
    const b = hands[h]; if (!b) { busy[h] = 0.35; return; }   // Fehlgriff: Hand kurz geschlossen
    hands[h] = null; b.st = 'air'; b.from = h; b.to = 1 - h; b.t = 0; b.a = pickAir(b.to, AIR, VAR);
  }
  function enter(b) { b.st = 'in'; b.t = 0; b.to = hands[0] && !hands[1] ? 1 : hands[1] && !hands[0] ? 0 : Math.floor(Math.random() * 2); b.a = pickAir(b.to, 1.1, 0.3); }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, fail: failT >= 0, hold: hands.map(b => b ? b.hold : -1), holdMax: HOLD, balls: balls.map(b => ({ st: b.st, to: b.to, left: b.a - b.t })) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; flash = Math.max(0, flash - dt * 2);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failT >= 0) { failT += dt; if ((failT > 0.8 && pressed.action) || failT > 4) { died(); reset(); } return; }
      if (pressed.left) toss(0);
      if (pressed.right) toss(1);
      busy[0] -= dt; busy[1] -= dt;
      if (pressed.action && !hands[0] && !hands[1]) { toss(0); toss(1); }
      else if (pressed.action) toss(!hands[1] || (hands[0] && hands[0].hold >= hands[1].hold) ? 0 : 1);
      for (const b of balls) {
        if (b.st === 'wait') { b.wait -= dt; if (b.wait <= 0) enter(b); }
        else if (b.st === 'air') {
          b.t += dt; const s = Math.min(1, b.t / b.a), peak = Math.min(285, G * b.a * b.a / 8);
          b.x = HX[b.from] + (HX[b.to] - HX[b.from]) * s; b.y = HY - peak * 4 * s * (1 - s);
          if (b.t >= b.a) arrive(b);
        } else if (b.st === 'in') {
          b.t += dt; const s = Math.min(1, b.t / b.a); b.x = HX[b.to]; b.y = -30 + (HY + 30) * s * s;
          if (b.t >= b.a) arrive(b);
        } else if (b.st === 'hold') {
          b.hold += dt; if (b.hold > HOLD) { hands[b.to] = null; drop(b, 'Zu lange gehalten!'); }
        } else if (b.st === 'fall') {
          b.vy += 900 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y > H + 30) { b.st = 'wait'; b.wait = 0.9; }
        }
        if (failT >= 0 || finale.active) return;
      }
    },
    draw(c) {
      // Zirkuszelt mit drehenden Streifen
      c.fillStyle = '#12051f'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, -40);
      for (let i = 0; i < 24; i++) {
        c.fillStyle = i % 2 ? 'rgba(255,63,164,0.13)' : 'rgba(80,30,140,0.25)';
        const a = i / 24 * Math.PI * 2 + t * 0.05;
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 700, a, a + Math.PI / 12); c.fill();
      }
      c.restore();
      const sp = c.createRadialGradient(W / 2, 300, 10, W / 2, 300, 260); sp.addColorStop(0, 'rgba(255,240,200,0.22)'); sp.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = sp; c.fillRect(0, 0, W, H);
      // Manege
      c.fillStyle = '#3a0f2e'; c.beginPath(); c.ellipse(W / 2, 372, 300, 34, 0, 0, 7); c.fill();
      c.strokeStyle = '#ffe14d'; c.lineWidth = 3; c.beginPath(); c.ellipse(W / 2, 372, 300, 34, 0, 0, 7); c.stroke();
      // Jongleur
      const cx = W / 2;
      c.fillStyle = '#2b1550'; c.fillRect(cx - 22, 292, 44, 72);
      c.fillStyle = '#ff3fa4'; c.beginPath(); c.moveTo(cx - 26, 292); c.lineTo(cx + 26, 292); c.lineTo(cx, 330); c.fill();
      c.fillStyle = '#ffd9b8'; c.beginPath(); c.arc(cx, 274, 15, 0, 7); c.fill();
      c.fillStyle = '#3ff0ff'; c.beginPath(); c.moveTo(cx - 16, 264); c.lineTo(cx, 236); c.lineTo(cx + 16, 264); c.fill();
      c.strokeStyle = '#ffd9b8'; c.lineWidth = 6; c.lineCap = 'round';
      for (let h = 0; h < 2; h++) {
        const bob = hands[h] ? 0 : -4, shut = busy[h] > 0;
        c.beginPath(); c.moveTo(cx + (h ? 20 : -20), 300); c.quadraticCurveTo(cx + (h ? 60 : -60), 330, HX[h], HY + 8 + bob); c.stroke();
        c.fillStyle = shut ? '#ff8a8a' : '#ffd9b8'; c.beginPath(); c.ellipse(HX[h], HY + 10 + bob, shut ? 9 : 16, shut ? 9 : 7, 0, 0, 7); c.fill();
        label(c, h ? '→' : '←', HX[h], HY + 40, 'rgba(255,240,200,0.6)', 'center', 16);
      }
      for (const b of balls) {
        if (b.st === 'wait') continue;
        const col = COLS[b.id % COLS.length];
        if (b.st === 'hold') {
          const f = b.hold / HOLD;
          c.strokeStyle = f > 0.6 ? '#ff4d5e' : 'rgba(255,255,255,0.6)'; c.lineWidth = 3;
          c.beginPath(); c.arc(b.x, b.y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - f)); c.stroke();
        }
        c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 16; c.beginPath(); c.arc(b.x, b.y, 10, 0, 7); c.fill(); c.shadowBlur = 0;
        c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(b.x - 3, b.y - 3, 3, 0, 7); c.fill();
      }
      if (flash > 0) { c.fillStyle = `rgba(255,60,90,${flash * 0.15})`; c.fillRect(0, 0, W, H); }
      label(c, `Gefangen ${catches} / ${NEED} · ${BALLS} Bälle`, 16, 26, '#ffe9c4');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff3fa4', 'right', 16);
      if (failT >= 0) label(c, 'Alles heruntergefallen! Leertaste: noch einmal', W / 2, 52, '#ffb0d6', 'center', 14);
      else if (msgT > 0) label(c, msg, W / 2, 52, '#ffffff', 'center', 14);
      else label(c, '← linke Hand · → rechte Hand · nur werfen, wenn die Hand einen Ball hat', W / 2, 52, '#c9a8e0', 'center');
      finale.draw(c, '#ffe9c4', '#3a0f2e');
    }
  };
  return self;
}
