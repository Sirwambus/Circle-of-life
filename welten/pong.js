/* =====================================================================
   WELT – Pong: Neonduell gegen den Computer. ↑ ↓ bewegt den linken Schläger. Wer zuerst genug Punkte hat,
   gewinnt. Trifft der Ball den Schlägerrand, fliegt er steiler. Ab Level 5 wird er mit jedem Treffer schneller,
   ab Level 7 bekommt er Drall, wenn sich der Schläger beim Treffen bewegt.
   ===================================================================== */
function makePong(next, level = 0) {
  const NEED = [3, 3, 3, 4, 4, 4, 5, 5, 5, 5][level];
  const PH = [92, 86, 80, 74, 70, 66, 62, 58, 55, 52][level];                   // Schlägerhöhe Spieler
  const BS = [260, 272, 284, 296, 306, 316, 326, 336, 346, 356][level];          // Ballgeschwindigkeit
  const CPU = [95, 110, 125, 140, 155, 168, 180, 192, 204, 215][level];         // Höchsttempo Gegner
  const ERR = [1.15, 1.1, 1.05, 1.0, 0.97, 0.94, 0.91, 0.88, 0.85, 0.82][level];   // Zielfehler Gegner (1 = Schlägerrand)
  const ACC = [0, 0, 0, 0, 6, 8, 9, 10, 11, 12][level], SPIN = [0, 0, 0, 0, 0, 0, 0.8, 0.95, 1.1, 1.3][level];
  const TOP = 46, BOT = 376, PX = 34, CX = 606, PW = 10, CPH = 70, PSPD = 380, R = 7;
  const finale = makeFinale(next);
  let py, cy, pv, ball, serveT, sc, cs, failT, msg, msgT, t = 0, flash = 0, cpuErr = 0, trail = [], winT = -1;
  function serve(dir) { ball = { x: W / 2, y: (TOP + BOT) / 2, vx: 0, vy: 0, sp: BS, spin: 0, dir }; serveT = 1.1; trail = []; }
  function reset() { py = cy = (TOP + BOT) / 2; pv = 0; sc = 0; cs = 0; failT = -1; msg = ''; msgT = 0; winT = -1; serve(-1); }
  reset();
  function say(m) { msg = m; msgT = 1.2; }
  function launch() { const a = (Math.random() * 2 - 1) * 0.45; ball.vx = Math.cos(a) * ball.sp * ball.dir; ball.vy = Math.sin(a) * ball.sp; }
  function bounce(padY, h, dir, vel) {
    const off = clamp((ball.y - padY) / (h / 2 + R), -1, 1), a = off * 1.0;
    ball.sp = Math.min(ball.sp + ACC, BS * 1.4);
    ball.vx = Math.cos(a) * ball.sp * dir; ball.vy = Math.sin(a) * ball.sp;
    ball.spin = SPIN ? clamp(vel, -PSPD, PSPD) * SPIN : 0;
    cpuErr = (Math.random() * 2 - 1) * ERR * (CPH / 2 + R);
    Klang.tone(dir > 0 ? 440 : 330, 0.06);
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, fail: failT >= 0, py, cy, ph: PH, ball: { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, spin: ball.spin }, serving: serveT > 0 }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; flash = Math.max(0, flash - dt * 2);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failT >= 0) { failT += dt; if ((failT > 0.8 && pressed.action) || failT > 4) { died(); reset(); } return; }
      if (winT >= 0) { winT += dt; if (winT > 0.8) finale.start(); return; }
      const oy = py;
      py = clamp(py + ((keys.down ? 1 : 0) - (keys.up ? 1 : 0)) * PSPD * dt, TOP + PH / 2, BOT - PH / 2);
      pv = (py - oy) / dt;
      // Gegner: folgt der Ballhöhe, wenn der Ball auf ihn zukommt (mit kleinem Zielfehler), sonst zurück zur Mitte
      const want = ball.vx > 0 ? ball.y + cpuErr : (TOP + BOT) / 2;
      const ocy = cy; cy += clamp(want - cy, -CPU * dt, CPU * dt); cy = clamp(cy, TOP + CPH / 2, BOT - CPH / 2);
      const cv = (cy - ocy) / dt;
      if (serveT > 0) { serveT -= dt; if (serveT <= 0) launch(); return; }
      ball.vy += ball.spin * dt; ball.spin *= Math.pow(0.5, dt);
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.y < TOP + R) { ball.y = TOP + R; ball.vy = Math.abs(ball.vy); ball.spin = 0; }
      if (ball.y > BOT - R) { ball.y = BOT - R; ball.vy = -Math.abs(ball.vy); ball.spin = 0; }
      trail.push({ x: ball.x, y: ball.y }); if (trail.length > 12) trail.shift();
      if (ball.vx < 0 && ball.x - R < PX + PW / 2 && ball.x > PX - PW && Math.abs(ball.y - py) < PH / 2 + R) { ball.x = PX + PW / 2 + R; bounce(py, PH, 1, pv); }
      if (ball.vx > 0 && ball.x + R > CX - PW / 2 && ball.x < CX + PW && Math.abs(ball.y - cy) < CPH / 2 + R) { ball.x = CX - PW / 2 - R; bounce(cy, CPH, -1, cv); }
      if (ball.x < -20) { cs++; flash = 1; Klang.tone(130, 0.3); if (cs >= NEED) { failT = 0; return; } say('Punkt für den Gegner'); serve(1); }
      else if (ball.x > W + 20) { sc++; Klang.tone(700, 0.25); if (sc >= NEED) { winT = 0; say('Gewonnen!'); return; } say('Punkt!'); serve(-1); }
    },
    draw(c) {
      c.fillStyle = '#05010d'; c.fillRect(0, 0, W, H);
      // Synthwave-Gitter
      c.strokeStyle = 'rgba(255,63,164,0.12)'; c.lineWidth = 1;
      for (let x = 0; x <= W; x += 32) { c.beginPath(); c.moveTo(x, TOP); c.lineTo(x, BOT); c.stroke(); }
      for (let y = TOP; y <= BOT; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.strokeStyle = '#ff3fa4'; c.lineWidth = 3; c.shadowColor = '#ff3fa4'; c.shadowBlur = 14;
      c.beginPath(); c.moveTo(0, TOP); c.lineTo(W, TOP); c.moveTo(0, BOT); c.lineTo(W, BOT); c.stroke();
      c.setLineDash([10, 12]); c.lineWidth = 2; c.globalAlpha = 0.5; c.beginPath(); c.moveTo(W / 2, TOP); c.lineTo(W / 2, BOT); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
      label(c, String(sc), W / 2 - 60, 100, 'rgba(0,240,255,0.35)', 'center', 48);
      label(c, String(cs), W / 2 + 60, 100, 'rgba(255,63,164,0.35)', 'center', 48);
      c.shadowColor = '#00f0ff'; c.fillStyle = '#00f0ff'; c.fillRect(PX - PW / 2, py - PH / 2, PW, PH);
      c.shadowColor = '#ff3fa4'; c.fillStyle = '#ff3fa4'; c.fillRect(CX - PW / 2, cy - CPH / 2, PW, CPH);
      trail.forEach((p, i) => { c.fillStyle = `rgba(255,240,160,${i / trail.length * 0.3})`; c.beginPath(); c.arc(p.x, p.y, R * i / trail.length, 0, 7); c.fill(); });
      c.shadowColor = '#fff0a0'; c.fillStyle = Math.abs(ball.spin) > 40 ? '#ffb03f' : '#fff6d0';
      if (serveT <= 0 || Math.floor(serveT * 6) % 2 === 0) { c.beginPath(); c.arc(ball.x, ball.y, R, 0, 7); c.fill(); }
      c.shadowBlur = 0;
      if (flash > 0) { c.fillStyle = `rgba(255,63,164,${flash * 0.15})`; c.fillRect(0, 0, W, H); }
      label(c, `Du ${sc} : ${cs} Gegner · bis ${NEED}`, 16, 28, '#bff9ff');
      if (failT >= 0) label(c, `Der Gegner hat ${NEED} Punkte. Leertaste: Revanche`, W / 2, 396, '#ffb0d6', 'center', 13);
      else if (msgT > 0) label(c, msg, W / 2, 396, '#ffffff', 'center', 13);
      else label(c, '↑ ↓ Schläger · Schlägerrand = steiler Ball', W / 2, 396, '#9a8cc4', 'center');
      finale.draw(c, '#bff9ff', '#2a0b45');
    }
  };
  return self;
}
