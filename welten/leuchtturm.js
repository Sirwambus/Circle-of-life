/* =====================================================================
   WELT – Leuchtturm: Nacht und Nebel über dem Meer. Dreh den Lichtkegel mit ← → und such die Schiffe.
   Erst wenn eines ganz im Licht steht, erkennst du es – dann Leertaste: Signal geben.
   Verpasste Schiffe kosten ein Leben. Ab Level 5 treiben Eisberge im Nebel – nicht anfunken!
   Später: schmalerer Kegel, kürzere Zeit, treibende Schiffe.
   ===================================================================== */
function makeLeuchtturm(next, level = 0) {
  const NEED = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14][level], LIFE = [16, 15, 14, 13, 12, 11.5, 11, 10.5, 10, 9.5][level];
  const SPAWN = [3.2, 3.0, 2.8, 2.6, 2.4, 2.2, 2.0, 1.9, 1.8, 1.7][level], BW = [0.3, 0.28, 0.26, 0.24, 0.22, 0.2, 0.19, 0.18, 0.17, 0.16][level];
  const ICE = [0, 0, 0, 0, 0.25, 0.3, 0.33, 0.36, 0.4, 0.42][level], DRIFT = [0, 0, 0, 0, 0, 0, 14, 18, 22, 26][level];
  const HINT = level <= 2, MAXON = level < 4 ? 4 : 6, REVEAL = 0.45, ROT = 1.5, LIVES = 3;
  const LX = W / 2, LY = 384, LO = LY - 40, RANGE = 380, AMIN = -Math.PI + 0.22, AMAX = -0.22;
  const finale = makeFinale(next);
  let objs, theta, score, lives, failed, timer, spawnT, cool, nextId, waves, fb, fbOk, t = 0, msg = '', msgT = 0;
  const rand = (a, b) => a + Math.random() * (b - a);
  const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  function reset() { objs = []; theta = -Math.PI / 2; score = 0; lives = LIVES; failed = false; spawnT = 1.2; cool = 0; nextId = 1; fb = 0; waves = 0; }
  reset();
  function spawn() {
    const live = objs.filter(o => !o.gone);
    if (live.length >= MAXON) return;
    const shipsLeft = NEED - score - live.filter(o => !o.ice && !o.marked).length;
    for (let tries = 0; tries < 30; tries++) {
      const a = rand(AMIN + 0.05, AMAX - 0.05), d = rand(130, 345), x = LX + Math.cos(a) * d, y = LO + Math.sin(a) * d;
      if (y < 84 || x < 24 || x > W - 24) continue;
      if (live.some(o => Math.hypot(o.x - x, o.y - y) < 70)) continue;
      const ice = Math.random() < ICE || shipsLeft <= 0;
      objs.push({ id: nextId++, x, y, vx: ice ? 0 : (Math.random() < 0.5 ? -1 : 1) * DRIFT, ice, lit: 0, life: ice ? LIFE * 1.2 : LIFE, marked: false, gone: false, fade: 1, ph: rand(0, 7) });
      return;
    }
  }
  const angOf = o => Math.atan2(o.y - LO, o.x - LX);
  const inBeam = o => angDiff(angOf(o), theta) < BW && Math.hypot(o.x - LX, o.y - LO) < RANGE;
  function lose(text) { lives--; msg = text; msgT = 1.6; fb = 1; fbOk = false; Klang.tone(150, 0.35); if (lives <= 0) { failed = true; timer = 0.6; } }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, theta, cool, objs: objs.filter(o => !o.gone).map(o => ({ id: o.id, a: angOf(o), lit: o.lit, ice: o.lit >= 1 ? o.ice : null, marked: o.marked, beam: inBeam(o) })), amin: AMIN, amax: AMAX }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; fb = Math.max(0, fb - dt * 2); waves += dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { timer -= dt; if (timer <= 0 && pressed.action) { died(); reset(); } return; }
      theta = clamp(theta + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * ROT * dt, AMIN, AMAX);
      cool -= dt; spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = SPAWN * rand(0.8, 1.2); }
      for (const o of objs) {
        if (o.gone) continue;
        if (o.marked) { o.fade -= dt * 0.8; o.y -= 12 * dt; if (o.fade <= 0) o.gone = true; continue; }
        o.x += o.vx * dt; if (o.x < 30 || o.x > W - 30) o.vx = -o.vx;
        o.lit = inBeam(o) ? Math.min(1, o.lit + dt / REVEAL) : Math.max(0, o.lit - dt * 0.6);
        o.life -= dt;
        if (o.life <= 0) { o.gone = true; if (!o.ice) { lose('Ein Schiff ist im Nebel verschwunden!'); if (failed) return; } }
      }
      objs = objs.filter(o => !o.gone);
      if (pressed.action && cool <= 0) {
        const cand = objs.filter(o => !o.marked && o.lit >= 1 && inBeam(o)).sort((a, b) => angDiff(angOf(a), theta) - angDiff(angOf(b), theta))[0];
        if (!cand) { cool = 1.2; msg = 'Kein Schiff im Licht – das Signal lädt nach.'; msgT = 1.2; Klang.tone(220, 0.1); }
        else if (cand.ice) { cand.marked = true; lose('Das war ein Eisberg!'); }
        else { cand.marked = true; score++; fb = 1; fbOk = true; Klang.tone(560 + score * 15, 0.25); if (score >= NEED) finale.start(); }
      }
    },
    draw(c) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1020'); g.addColorStop(1, '#13233a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(120,160,200,0.08)'; c.lineWidth = 1;
      for (let i = 0; i < 16; i++) { const y = 60 + i * 21; c.beginPath(); for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x * 0.03 + waves * 1.2 + i) * 3); c.stroke(); }
      // Lichtkegel
      const bg = c.createRadialGradient(LX, LO, 10, LX, LO, RANGE); bg.addColorStop(0, 'rgba(255,236,170,0.55)'); bg.addColorStop(1, 'rgba(255,236,170,0.04)');
      c.fillStyle = bg; c.beginPath(); c.moveTo(LX, LO); c.arc(LX, LO, RANGE, theta - BW, theta + BW); c.closePath(); c.fill();
      // Dinge im Nebel
      for (const o of objs) {
        const a = o.marked ? o.fade : o.lit;
        if (HINT && !o.ice && !o.marked) { const b = 0.18 + 0.12 * Math.sin(t * 3 + o.ph); c.fillStyle = `rgba(255,200,120,${b})`; c.beginPath(); c.arc(o.x, o.y - 14, 3, 0, 7); c.fill(); }
        if (a <= 0.02) continue;
        c.save(); c.globalAlpha = a; c.translate(o.x, o.y);
        const known = o.lit >= 1 || o.marked;
        if (!known) { // nur ein grauer Umriss
          c.fillStyle = '#8a95a8'; c.beginPath(); c.moveTo(-16, 0); c.lineTo(-8, -18); c.lineTo(8, -16); c.lineTo(16, 0); c.closePath(); c.fill();
        } else if (o.ice) {
          c.fillStyle = '#d8f1ff'; c.beginPath(); c.moveTo(-18, 2); c.lineTo(-10, -14); c.lineTo(-3, -9); c.lineTo(4, -22); c.lineTo(12, -8); c.lineTo(18, 2); c.closePath(); c.fill();
          c.fillStyle = '#8fc7e8'; c.beginPath(); c.moveTo(4, -22); c.lineTo(12, -8); c.lineTo(18, 2); c.lineTo(6, 2); c.closePath(); c.fill();
        } else {
          c.fillStyle = '#6b3d22'; c.beginPath(); c.moveTo(-18, -4); c.lineTo(18, -4); c.lineTo(12, 3); c.lineTo(-12, 3); c.closePath(); c.fill();
          c.fillStyle = '#3a2a1f'; c.fillRect(-1, -26, 2, 22);
          c.fillStyle = '#f3ead6'; c.beginPath(); c.moveTo(1, -25); c.lineTo(13, -7); c.lineTo(1, -7); c.closePath(); c.fill();
          c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(-10, -7, 2.2, 0, 7); c.arc(10, -7, 2.2, 0, 7); c.fill();
          if (o.marked) { c.strokeStyle = '#7dffb0'; c.lineWidth = 2; c.beginPath(); c.arc(0, -10, 24 + (1 - o.fade) * 20, 0, 7); c.stroke(); }
        }
        c.restore();
      }
      // Nebelschwaden
      for (let i = 0; i < 7; i++) {
        const x = ((i * 137 + t * (8 + i * 2)) % (W + 300)) - 150, y = 80 + i * 42;
        const fg = c.createRadialGradient(x, y, 10, x, y, 150); fg.addColorStop(0, 'rgba(150,170,195,0.13)'); fg.addColorStop(1, 'rgba(150,170,195,0)');
        c.fillStyle = fg; c.fillRect(x - 150, y - 150, 300, 300);
      }
      // Leuchtturm
      c.fillStyle = '#1b1e28'; c.beginPath(); c.ellipse(LX, LY + 10, 60, 18, 0, 0, 7); c.fill();
      c.fillStyle = '#e9e4da'; c.beginPath(); c.moveTo(LX - 14, LY + 6); c.lineTo(LX - 9, LY - 34); c.lineTo(LX + 9, LY - 34); c.lineTo(LX + 14, LY + 6); c.closePath(); c.fill();
      c.fillStyle = '#c0392b'; c.fillRect(LX - 12, LY - 14, 24, 7); c.fillRect(LX - 10, LY - 30, 20, 6);
      c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(LX, LY - 40, 7, 0, 7); c.fill();
      c.fillStyle = '#2a2d38'; c.beginPath(); c.moveTo(LX - 10, LY - 46); c.lineTo(LX, LY - 56); c.lineTo(LX + 10, LY - 46); c.fill();
      if (fb > 0) flashOverlay(c, fb * 0.08, fbOk ? '125,255,176' : '255,77,109');
      label(c, `Schiffe ${score} / ${NEED}`, 16, 26, '#e8dcb5');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff8a9a', 'right', 16);
      if (cool > 0) { c.fillStyle = 'rgba(255,236,170,0.5)'; c.fillRect(16, 34, 80 * clamp(cool / 1.2, 0, 1), 3); }
      if (msgT > 0) label(c, msg, W / 2, 50, fbOk && fb > 0 ? '#c8ffd8' : '#ffc0c8', 'center', 13);
      else label(c, ICE ? '← → Licht drehen · Leertaste: Schiff anfunken (keine Eisberge!)' : '← → Licht drehen · Leertaste: Schiff im Licht anfunken', W / 2, 50, '#a9b4c8', 'center', 12);
      if (failed) { c.fillStyle = 'rgba(10,16,32,0.92)'; c.fillRect(0, 160, W, 80); label(c, 'Die Nacht ist verloren. Leertaste: neuer Versuch', W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#e8dcb5', '#13233a');
    }
  };
  return self;
}
