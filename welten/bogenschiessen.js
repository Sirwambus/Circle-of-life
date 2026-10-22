/* =====================================================================
   WELT – Bogenschießen: ↑ ↓ zielen, Leertaste halten spannt den Bogen, loslassen schießt.
   Triff alle Scheiben, dann erscheint die Tür. Achte auf den Wind. Grafik: Tuschemalerei.
   ===================================================================== */
function makeBogenschiessen(next, level = 0) {
  // Der Wind dreht nur nach einem Treffer. Je Level: mehr und kleinere Scheiben, stärkerer Wind, kürzere Flugbahn-Vorschau; ab Level 5 bewegte Scheiben, ab Level 7 Bambus im Weg.
  const NT = [3, 3, 4, 4, 4, 5, 5, 5, 6, 6][level], TR = [22, 20, 18, 17, 16, 15, 14, 14, 13, 13][level], EXTRA = [4, 4, 4, 4, 4, 5, 5, 5, 6, 6][level];
  const WIND = [0, 0, 15, 25, 35, 45, 55, 62, 70, 78][level], PREV = [1, 0.75, 0.5, 0.35, 0.25, 0.18, 0.12, 0.08, 0.06, 0.05][level];
  const MOVE = [0, 0, 0, 0, 0, 30, 40, 50, 55, 60][level], NMOVE = [0, 0, 0, 0, 0, 2, 2, 3, 4, 5][level];
  const G = 300, V0 = 220, V1 = 380, GROUND = 340, BOW = { x: 64, y: 300 }, R = rng(77 + level * 5);
  const bamboo = level >= 7 ? [{ x: 190 + R() * 40, y: 235 + R() * 25, w: 12 }] : [];
  if (level >= 9) bamboo.push({ x: 330 + R() * 30, y: 265 + R() * 20, w: 12 });
  for (const b of bamboo) b.h = GROUND - b.y;
  // Jede Scheibe muss bei Windstille und bei stärkstem Wind aus beiden Richtungen mit etwas Spielraum treffbar sein.
  const reach = (tx, ty) => [0, WIND, -WIND].every(wd => {
    for (let a = -0.1; a < 1.25; a += 0.05) {
      let run = 0;
      for (let pw = 0; pw <= 1; pw += 0.02) {
        let x = BOW.x, y = BOW.y, v = V0 + V1 * pw, vx = Math.cos(a) * v, vy = -Math.sin(a) * v, hit = false;
        for (let f = 0; f < 240 && y < GROUND && x < tx + TR; f++) {
          vx += wd / 60; vy += G / 60; x += vx / 60; y += vy / 60;
          if (bamboo.some(b => x >= b.x - 3 && x <= b.x + b.w + 3 && y > b.y - 5)) break;
          if (Math.hypot(x - tx, y - ty) < TR - 2) { hit = true; break; }
        }
        run = hit ? run + 1 : 0; if (run >= 4) return true;
      }
    }
    return false;
  });
  const targets = [];
  let tries = 0;
  while (targets.length < NT) {
    tries++;
    const mv = targets.length < NMOVE, hz = mv && level >= 8 && targets.length % 2 === 1;
    const x = 260 + R() * (hz ? 340 - 2 * MOVE : 340) + (hz ? MOVE : 0), y = 80 + R() * (bamboo.length ? 180 : 220);
    if (targets.some(o => Math.hypot(o.x0 - x, o.y0 - y) < 70) || bamboo.some(b => x > b.x - 40 && x < b.x + 140 && y > b.y - 40 - MOVE)) continue;
    if (bamboo.length && tries < 400 && !(mv ? [-1, 0, 1] : [0]).every(k => reach(x, y + k * MOVE * 0.8))) continue;
    targets.push({ x0: x, y0: y, x, y, r: TR, amp: mv ? MOVE * (0.7 + R() * 0.3) : 0, sp: 0.8 + R() * 0.6, ph: R() * 6, horiz: hz, hit: false });
  }
  const door = { x: 594, y: GROUND - 54, w: 30, h: 54 };
  const tpos = (o, tt) => o.horiz ? { x: o.x0 + Math.sin(tt * o.sp + o.ph) * o.amp, y: o.y0 } : { x: o.x0, y: o.y0 + Math.sin(tt * o.sp + o.ph) * o.amp };
  const hills = [0, 1, 2].map(k => Array.from({ length: 17 }, (_, i) => 200 + k * 40 - R() * 60 - Math.sin(i * 0.9 + k) * 20));
  let ang, power, pdir, charging, arrow, arrows, wind, stuck, parts, state, timer, t = 0, msg = '', msgT = 0;
  const newWind = () => { wind = WIND ? WIND * (0.3 + R() * 0.7) * (R() < 0.5 ? -1 : 1) : 0; };
  function reset() {
    ang = 0.35; power = 0; pdir = 1; charging = false; arrow = null; arrows = NT + EXTRA; stuck = []; parts = []; state = 'play'; timer = 0;
    for (const o of targets) o.hit = false; newWind();
  }
  reset();
  const left = () => targets.filter(o => !o.hit).length;
  const say = m => { msg = m; msgT = 1.5; };
  const self = {
    done: false, door: () => door,
    test: () => ({ ang, power, pdir, charging, flying: !!arrow, arrows, wind, state, G, V0, V1, bow: BOW, t, ground: GROUND, bamboo,
      targets: targets.map((o, i) => ({ i, hit: o.hit, r: o.r, pos: tt => tpos(o, tt) })), door: { ...door }, open: left() === 0 }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      for (const o of targets) Object.assign(o, tpos(o, t));
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 200 * dt; p.life -= dt; }
      parts = parts.filter(p => p.life > 0);
      if (state === 'fail') { timer -= dt; if (timer <= 0) { died(); reset(); } return; }
      if (!arrow) {
        ang = clamp(ang + ((keys.up ? 1 : 0) - (keys.down ? 1 : 0)) * 0.7 * dt, -0.2, 1.3);
        if (keys.action) { charging = true; power += pdir * dt / 1.2; if (power > 1) { power = 1; pdir = -1; } if (power < 0) { power = 0; pdir = 1; } }
        else if (charging) {
          charging = false; const v = V0 + V1 * power;
          arrow = { x: BOW.x, y: BOW.y, vx: Math.cos(ang) * v, vy: -Math.sin(ang) * v };
          if (left()) arrows--; power = 0; pdir = 1; Klang.tone(420, 0.06);
        }
        return;
      }
      const ox = arrow.x, oy = arrow.y;
      arrow.vx += wind * dt; arrow.vy += G * dt; arrow.x += arrow.vx * dt; arrow.y += arrow.vy * dt;
      const segHit = (cx, cy, r) => { const dx = arrow.x - ox, dy = arrow.y - oy, l = dx * dx + dy * dy || 1, k = clamp(((cx - ox) * dx + (cy - oy) * dy) / l, 0, 1); return Math.hypot(ox + dx * k - cx, oy + dy * k - cy) < r; };
      let end = null;
      for (const o of targets) if (!o.hit && segHit(o.x, o.y, o.r)) {
        o.hit = true; end = 'hit'; Klang.tone(700 + (NT - left()) * 80, 0.15);
        for (let i = 0; i < 18; i++) { const a = Math.random() * 7, v = 40 + Math.random() * 90; parts.push({ x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.9, col: i % 3 ? '#f3ead8' : '#c8282a' }); }
        say(left() ? 'Treffer!' : 'Alle getroffen! Die Tür ist offen, schieß hinein.');
        break;
      }
      if (!end && left() === 0 && arrow.x >= door.x && arrow.y >= door.y && arrow.y <= door.y + door.h) { self.done = true; return; }
      if (!end) for (const b of bamboo) if (arrow.x >= b.x && ox <= b.x + b.w && arrow.y > b.y) { end = 'stick'; arrow.x = b.x; break; }
      if (!end && arrow.y >= GROUND) { end = 'stick'; arrow.y = GROUND; }
      if (!end && (arrow.x > W + 40 || arrow.x < -40)) end = 'lost';
      if (end) {
        if (end === 'stick') stuck.push({ x: arrow.x, y: arrow.y, a: Math.atan2(arrow.vy, arrow.vx) });
        if (end === 'hit') newWind(); arrow = null;
        if (left() && arrows <= 0) { state = 'fail'; timer = 1.6; say('Keine Pfeile mehr. Noch einmal!'); }
      }
    },
    draw(c) {
      c.fillStyle = '#efe6d2'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#c8282a'; c.beginPath(); c.arc(500, 90, 34, 0, 7); c.fill();
      hills.forEach((hs, k) => { c.fillStyle = `rgba(40,40,48,${0.12 + k * 0.1})`; c.beginPath(); c.moveTo(0, GROUND); hs.forEach((y, i) => c.lineTo(i * 40, y)); c.lineTo(W, GROUND); c.fill(); });
      c.fillStyle = '#2b2b30'; c.fillRect(0, GROUND, W, H - GROUND);
      c.fillStyle = 'rgba(239,230,210,0.15)'; for (let x = 0; x < W; x += 23) c.fillRect(x, GROUND + 6 + (x % 3) * 8, 12, 1);
      for (const b of bamboo) {
        c.fillStyle = '#3d5a3a'; c.fillRect(b.x, b.y, b.w, b.h);
        c.fillStyle = '#2a4028'; for (let y = b.y + 20; y < GROUND; y += 26) c.fillRect(b.x - 1, y, b.w + 2, 3);
        c.strokeStyle = '#3d5a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(b.x + 6, b.y); c.quadraticCurveTo(b.x + 26, b.y - 14, b.x + 34, b.y - 4); c.moveTo(b.x + 6, b.y + 10); c.quadraticCurveTo(b.x - 16, b.y - 6, b.x - 24, b.y + 4); c.stroke();
      }
      // Scheiben
      for (const o of targets) {
        if (o.hit) continue;
        if (o.amp) { c.strokeStyle = 'rgba(43,43,48,0.2)'; c.setLineDash([3, 5]); c.beginPath(); if (o.horiz) { c.moveTo(o.x0 - o.amp, o.y0); c.lineTo(o.x0 + o.amp, o.y0); } else { c.moveTo(o.x0, o.y0 - o.amp); c.lineTo(o.x0, o.y0 + o.amp); } c.stroke(); c.setLineDash([]); }
        else { c.strokeStyle = '#2b2b30'; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x, o.y + o.r); c.lineTo(o.x, GROUND); c.stroke(); }
        [['#2b2b30', 1], ['#f3ead8', 0.8], ['#2b2b30', 0.6], ['#f3ead8', 0.4], ['#c8282a', 0.22]].forEach(([col, k]) => { c.fillStyle = col; c.beginPath(); c.arc(o.x, o.y, o.r * k, 0, 7); c.fill(); });
      }
      const open = left() === 0;
      paintDoor(c, door, { frame: '#2b2b30', panel: open ? '#c8282a' : '#6a5a50', knob: '#efe6d2', light: open ? next : '#4a4040', glow: open ? next : null, open: open ? 0.5 + 0.2 * Math.sin(t * 3) : 0 });
      for (const s of stuck) { c.save(); c.translate(s.x, s.y); c.rotate(s.a); c.strokeStyle = '#2b2b30'; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, 0); c.lineTo(0, 0); c.stroke(); c.fillStyle = '#c8282a'; c.fillRect(-28, -3, 6, 6); c.restore(); }
      for (const p of parts) { c.fillStyle = p.col; c.globalAlpha = clamp(p.life, 0, 1); c.fillRect(p.x, p.y, 3, 3); } c.globalAlpha = 1;
      // Flugbahn-Vorschau
      if (!arrow && PREV > 0 && state === 'play') {
        let x = BOW.x, y = BOW.y, v = V0 + V1 * power, vx = Math.cos(ang) * v, vy = -Math.sin(ang) * v;
        c.fillStyle = 'rgba(200,40,42,0.55)';
        for (let i = 0; i < PREV * 96; i++) { vx += wind / 60; vy += G / 60; x += vx / 60; y += vy / 60; if (y > GROUND) break; if (i % 4 === 3) c.fillRect(x - 1, y - 1, 2.5, 2.5); }
      }
      // Schütze
      c.strokeStyle = '#2b2b30'; c.fillStyle = '#2b2b30'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.arc(BOW.x - 18, 272, 7, 0, 7); c.fill();
      c.beginPath(); c.moveTo(BOW.x - 18, 280); c.lineTo(BOW.x - 20, 315); c.lineTo(BOW.x - 28, GROUND); c.moveTo(BOW.x - 20, 315); c.lineTo(BOW.x - 10, GROUND); c.stroke();
      c.save(); c.translate(BOW.x, BOW.y); c.rotate(-ang);
      const pull = charging ? 8 + power * 14 : 4;
      c.strokeStyle = '#5a2a10'; c.lineWidth = 3; c.beginPath(); c.arc(-4, 0, 26, -1.25, 1.25); c.stroke();
      c.strokeStyle = '#2b2b30'; c.lineWidth = 1; c.beginPath(); c.moveTo(4, -24); c.lineTo(-pull, 0); c.lineTo(4, 24); c.stroke();
      if (!arrow) { c.lineWidth = 2; c.beginPath(); c.moveTo(-pull, 0); c.lineTo(30 - pull, 0); c.stroke(); }
      c.restore();
      c.strokeStyle = '#2b2b30'; c.lineWidth = 3; c.beginPath(); c.moveTo(BOW.x - 18, 284); c.lineTo(BOW.x - 4, BOW.y - 4); c.stroke();
      if (arrow) { c.save(); c.translate(arrow.x, arrow.y); c.rotate(Math.atan2(arrow.vy, arrow.vx)); c.strokeStyle = '#2b2b30'; c.lineWidth = 2; c.beginPath(); c.moveTo(-26, 0); c.lineTo(0, 0); c.stroke(); c.fillStyle = '#c8282a'; c.fillRect(-28, -3, 6, 6); c.restore(); }
      // Anzeigen
      c.fillStyle = 'rgba(43,43,48,0.15)'; c.fillRect(16, H - 40, 120, 10); c.fillStyle = '#c8282a'; c.fillRect(16, H - 40, 120 * power, 10);
      label(c, 'Spannung', 142, H - 31, '#efe6d2');
      label(c, `Scheiben ${NT - left()} / ${NT}   Pfeile ${arrows}`, 16, 26, '#2b2b30');
      label(c, `Winkel ${Math.round(ang * 57.3)}°`, 16, 44, '#2b2b30');
      if (WIND) {
        const fx = W - 70; c.strokeStyle = '#2b2b30'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx, 20); c.lineTo(fx, 60); c.stroke();
        const len = Math.abs(wind) / 78 * 40 + 6; c.fillStyle = '#c8282a'; c.beginPath(); c.moveTo(fx, 22); c.lineTo(fx + Math.sign(wind) * len, 27 + Math.sin(t * 8) * 2); c.lineTo(fx, 32); c.fill();
        label(c, `Wind ${Math.round(Math.abs(wind) / 10)}`, fx, 76, '#2b2b30', 'center');
      }
      label(c, msgT > 0 ? msg : '↑ ↓ zielen · Leertaste halten und loslassen', W / 2, H - 14, '#efe6d2', 'center');
    }
  };
  return self;
}
