/* =====================================================================
   WELT – Zielscheibe: Schwebende Lichtscheiben im Kristallgewölbe. Pfeile bewegen das Fadenkreuz (länger halten =
   schneller), Leertaste schießt. Später kleinere, schnellere, kurvende Ziele, ein Zeitlimit und Lotusblüten,
   die man nicht treffen darf.
   ===================================================================== */
function makeZielscheibe(next, level = 0) {
  const NEED = [10, 12, 13, 14, 15, 16, 17, 18, 19, 20][level];
  const RAD = [30, 27, 24, 22, 20, 19, 18, 17, 16, 15][level], SPD = [40, 55, 70, 85, 95, 105, 115, 125, 135, 145][level];
  const COUNT = [2, 2, 2, 3, 3, 3, 3, 3, 3, 3][level], TIME = [0, 0, 52, 48, 46, 44, 42, 40, 38, 36][level];
  const WOB = [0, 0, 0, 0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2][level], FRIEND = [0, 0, 0, 0, 0, 0.25, 0.25, 0.3, 0.3, 0.35][level];
  const LIFE = [0, 0, 0, 0, 0, 0, 0, 3.6, 3.1, 2.7][level], X0 = 30, X1 = 610, Y0 = 60, Y1 = 360;
  const finale = makeFinale(next);
  let cx, cy, holdT, targets, hits, left, cool, failT, msg, msgT, t = 0, fx = [], uid = 0, flash = 0;
  function spawn(friend) {
    let x, y; do { x = X0 + 40 + Math.random() * (X1 - X0 - 80); y = Y0 + 40 + Math.random() * (Y1 - Y0 - 80); } while (Math.hypot(x - cx, y - cy) < 90);
    const a = Math.random() * Math.PI * 2;
    return { id: uid++, x, y, a, sp: SPD * (0.8 + Math.random() * 0.4), r: friend ? RAD + 4 : RAD, friend, ph: Math.random() * 7, age: 0, life: LIFE ? LIFE * (0.85 + Math.random() * 0.3) : 0 };
  }
  function fill() {
    while (targets.filter(o => !o.friend).length < COUNT) targets.push(spawn(false));
    if (FRIEND && !targets.some(o => o.friend) && Math.random() < FRIEND * 0.05) targets.push(spawn(true));
  }
  function reset() { cx = W / 2; cy = H / 2 + 10; holdT = 0; targets = []; hits = 0; left = TIME; cool = 0; failT = -1; msg = ''; msgT = 0; fx = []; fill(); }
  reset();
  function say(m) { msg = m; msgT = 1.2; }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, fail: failT >= 0, cx, cy, cool, targets: targets.map(o => ({ id: o.id, x: o.x, y: o.y, vx: Math.cos(o.a) * o.sp, vy: Math.sin(o.a) * o.sp, r: o.r, friend: o.friend })) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; cool -= dt; flash = Math.max(0, flash - dt * 2);
      fx = fx.filter(f => (f.t += dt) < 0.4);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failT >= 0) { failT += dt; if ((failT > 0.8 && pressed.action) || failT > 4) { died(); reset(); } return; }
      if (TIME) { left -= dt; if (left <= 0) { left = 0; failT = 0; return; } }
      const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), ay = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      holdT = ax || ay ? holdT + dt : 0;
      const v = 110 + 230 * Math.min(1, holdT / 0.35), n = ax && ay ? Math.SQRT1_2 : 1;
      cx = clamp(cx + ax * v * n * dt, X0, X1); cy = clamp(cy + ay * v * n * dt, Y0, Y1);
      for (const o of targets) {
        o.age += dt;
        if (WOB) o.a += WOB * Math.sin(o.ph + t * 1.6) * dt;
        o.x += Math.cos(o.a) * o.sp * dt; o.y += Math.sin(o.a) * o.sp * dt;
        if (o.x < X0 + o.r || o.x > X1 - o.r) { o.x = clamp(o.x, X0 + o.r, X1 - o.r); o.a = Math.PI - o.a; }
        if (o.y < Y0 + o.r || o.y > Y1 - o.r) { o.y = clamp(o.y, Y0 + o.r, Y1 - o.r); o.a = -o.a; }
        if (o.life && o.age > o.life) o.gone = true;
        if (o.friend && o.age > 6) o.gone = true;
      }
      if (pressed.action && cool <= 0) {
        cool = 0.3; fx.push({ x: cx, y: cy, t: 0 }); Klang.tone(900, 0.04);
        let best = null; for (const o of targets) { const d = Math.hypot(o.x - cx, o.y - cy); if (d < o.r && (!best || d < best.d)) best = { o, d }; }
        if (best) {
          best.o.gone = true;
          if (best.o.friend) { flash = 1; Klang.tone(140, 0.3); if (TIME) { left = Math.max(0.1, left - 5); say('Nicht die Lotusblüte! −5 s'); } else say('Nicht die Lotusblüte!'); }
          else { hits++; Klang.tone(600 + hits * 20, 0.12); say(best.d < best.o.r * 0.35 ? 'Mitte!' : 'Treffer'); if (hits >= NEED) { finale.start(); return; } }
        }
      }
      targets = targets.filter(o => !o.gone);
      fill();
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 420); bg.addColorStop(0, '#0d2a3a'); bg.addColorStop(1, '#03060f');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // Kristallgewölbe
      c.strokeStyle = 'rgba(120,220,255,0.08)'; c.lineWidth = 1;
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t * 0.03; c.beginPath(); c.moveTo(W / 2, H / 2); c.lineTo(W / 2 + Math.cos(a) * 500, H / 2 + Math.sin(a) * 500); c.stroke(); }
      for (let r = 60; r < 420; r += 60) { c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2 + r * 0.01; c.lineTo(W / 2 + Math.cos(a) * r, H / 2 + Math.sin(a) * r); } c.stroke(); }
      c.strokeStyle = 'rgba(255,63,164,0.25)'; c.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
      for (const o of targets) {
        const fade = o.life ? clamp((o.life - o.age) / 0.6, 0.25, 1) : 1;
        c.globalAlpha = Math.min(1, o.age / 0.25) * fade;
        if (o.friend) {
          for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + t * 0.5; c.fillStyle = k % 2 ? '#8dffb0' : '#c8ffe0'; c.beginPath(); c.ellipse(o.x + Math.cos(a) * o.r * 0.5, o.y + Math.sin(a) * o.r * 0.5, o.r * 0.55, o.r * 0.22, a, 0, 7); c.fill(); }
          c.fillStyle = '#ffe14d'; c.beginPath(); c.arc(o.x, o.y, o.r * 0.25, 0, 7); c.fill();
        } else {
          const cols = ['#ff3fa4', '#ffffff', '#ff3fa4', '#ffe14d'];
          c.shadowColor = '#ff3fa4'; c.shadowBlur = 14;
          for (let k = 0; k < 4; k++) { c.fillStyle = cols[k]; c.beginPath(); c.arc(o.x, o.y, o.r * (1 - k * 0.25), 0, 7); c.fill(); }
          c.shadowBlur = 0;
        }
        c.globalAlpha = 1;
      }
      for (const f of fx) { c.strokeStyle = `rgba(255,255,255,${1 - f.t / 0.4})`; c.lineWidth = 2; c.beginPath(); c.arc(f.x, f.y, 6 + f.t * 60, 0, 7); c.stroke(); }
      // Fadenkreuz
      c.strokeStyle = cool > 0 ? 'rgba(160,240,255,0.5)' : '#a0f0ff'; c.lineWidth = 2;
      c.beginPath(); c.arc(cx, cy, 14, 0, 7); c.moveTo(cx - 24, cy); c.lineTo(cx - 6, cy); c.moveTo(cx + 6, cy); c.lineTo(cx + 24, cy);
      c.moveTo(cx, cy - 24); c.lineTo(cx, cy - 6); c.moveTo(cx, cy + 6); c.lineTo(cx, cy + 24); c.stroke();
      c.fillStyle = '#ffffff'; c.fillRect(cx - 1, cy - 1, 2, 2);
      if (flash > 0) { c.fillStyle = `rgba(140,255,180,${flash * 0.15})`; c.fillRect(0, 0, W, H); }
      label(c, `Treffer ${hits} / ${NEED}`, 16, 26, '#c8f4ff');
      if (TIME) label(c, `Zeit ${Math.ceil(left)} s`, W - 16, 26, left < 10 ? '#ff7ab8' : '#c8f4ff', 'right', 14);
      if (failT >= 0) label(c, 'Die Zeit ist um! Leertaste: noch einmal', W / 2, 386, '#ffb0d6', 'center', 14);
      else if (msgT > 0) label(c, msg, W / 2, 386, '#ffffff', 'center', 14);
      else label(c, FRIEND ? 'Pfeile zielen · Leertaste schießt · grüne Lotusblüten verschonen' : 'Pfeile zielen (halten = schneller) · Leertaste schießt', W / 2, 386, '#8fbfd0', 'center');
      finale.draw(c, '#c8f4ff', '#0d2a3a');
    }
  };
  return self;
}
