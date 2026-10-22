/* =====================================================================
   WELT – Kran: Fahr die Laufkatze mit ← →, die Kiste pendelt am Seil. Mit der Leertaste
   fällt sie auf die leuchtende Säule. Am Lager links hängt die nächste Kiste.
   ===================================================================== */
function makeKran(next, level = 0) {
  // Je Level: mehr Ziele, schmalere Säulen, längeres Seil, weniger Dämpfung, Wind; ab Level 6 schwimmende Boote als Ziel.
  const NT = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5][level], PW = [96, 86, 76, 68, 62, 56, 52, 48, 45, 42][level], L = [70, 80, 90, 100, 110, 118, 126, 134, 142, 150][level];
  const DAMP = [1.6, 1.4, 1.2, 1.0, 0.85, 0.7, 0.6, 0.5, 0.45, 0.4][level], WIND = [0, 0, 0, 0, 8, 14, 20, 26, 30, 34][level], NB = [0, 0, 0, 0, 0, 0, 1, 1, 2, 2][level];
  const BAMP = [0, 0, 0, 0, 0, 0, 55, 65, 70, 80][level], BSP = [0, 0, 0, 0, 0, 0, 0.55, 0.65, 0.7, 0.8][level];
  const RAIL = 46, G = 400, VT = 150, ACC = 280, DEPOT = 70, WATER = 350, CW = 26, CH = 22, R = rng(57 + level * 11);
  const windDir = R() < 0.5 ? -1 : 1;
  // Ziele: feste Säulen und Boote
  const targets = [], NP = NT - NB;
  for (let i = 0; i < NP; i++) {
    const span = (NB ? 330 : 400) / NP, x = 200 + span * (i + 0.5) + (R() - 0.5) * span * 0.3;
    targets.push({ x, x0: x, top: Math.max(RAIL + L + 40, 250 + R() * 80), w: PW, boat: false });
  }
  for (let i = 0; i < NB; i++) { const c = NB === 1 ? 470 : 380 + i * 150; targets.push({ x: c, x0: c, top: WATER - 14, w: PW + 10, boat: true, ph: R() * 6, amp: Math.min(BAMP, NB === 2 ? 65 : BAMP) }); }
  const order = targets.map((_, i) => i); for (let k = order.length - 1; k > 0; k--) { const m = Math.floor(R() * (k + 1)); [order[k], order[m]] = [order[m], order[k]]; }
  const city = Array.from({ length: 22 }, (_, i) => ({ x: i * 31, h: 30 + R() * 70, w: 22 + R() * 14 }));
  const fin = makeFinale(next);
  let tx, vx, th, om, hold, fall, idx, t = 0, wind = 0, msg = '', msgT = 0, splash = [], stacked = [];
  function reset() { tx = DEPOT; vx = 0; th = 0; om = 0; hold = true; fall = null; idx = 0; stacked = []; }
  reset();
  const boatX = (b, tt) => b.x0 + Math.sin(tt * BSP + b.ph) * b.amp;
  const hookPos = () => ({ x: tx + L * Math.sin(th), y: RAIL + L * Math.cos(th) });
  const say = m => { msg = m; msgT = 1.6; };
  const self = {
    done: false, door: () => fin.rect,
    test: () => ({ tx, vx, th, om, hold, falling: !!fall, finale: fin.active, L, G, wind, depot: DEPOT, target: idx < NT ? (() => { const g = targets[order[idx]]; return { x: g.x, top: g.top, w: g.w, boat: g.boat, x0: g.x0, amp: g.amp, ph: g.ph, bsp: BSP }; })() : null, t }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      for (const b of targets) if (b.boat) b.x = boatX(b, t);
      for (const p of splash) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt; }
      splash = splash.filter(p => p.life > 0);
      if (fin.active) { if (fin.update(dt)) self.done = true; return; }
      wind = WIND * windDir * (0.8 + 0.3 * Math.sin(t * 0.9));
      const inp = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      const ov = vx; vx += clamp(inp * VT - vx, -ACC * dt, ACC * dt); tx += vx * dt;
      if (tx < 30 || tx > W - 30) { tx = clamp(tx, 30, W - 30); vx = 0; }
      const a = (vx - ov) / dt;
      if (hold) { // Pendel
        om += ((-G * Math.sin(th) - a * Math.cos(th) + wind * Math.cos(th)) / L - DAMP * om) * dt;
        th += om * dt;
        if (pressed.action) {
          const h = hookPos();
          fall = { x: h.x, y: h.y + CH / 2, vx: vx + L * om * Math.cos(th), vy: -L * om * Math.sin(th) };
          hold = false; Klang.tone(300, 0.08);
        }
      } else if (Math.abs(tx - DEPOT) < 18 && Math.abs(vx) < 50 && !fall) { hold = true; th = 0; om = 0; Klang.tone(520, 0.08); }
      if (fall) {
        const py = fall.y;
        fall.vx += wind * dt; fall.vy += G * dt; fall.x += fall.vx * dt; fall.y += fall.vy * dt;
        const bottom = fall.y + CH / 2;
        for (const [k, g] of targets.entries()) {
          if (py + CH / 2 > g.top || bottom < g.top || Math.abs(fall.x - g.x) > g.w / 2 + CW / 2) continue;
          if (Math.abs(fall.x - g.x) <= g.w / 2 && k === order[idx]) {
            stacked.push({ k, dx: fall.x - g.x }); fall = null; idx++; Klang.tone(660 + idx * 60, 0.15);
            say(idx >= NT ? 'Alle Kisten abgeliefert!' : 'Treffer!');
            if (idx >= NT) fin.start();
          } else { say(k === order[idx] ? 'Gekippt! Die Kiste rutscht von der Kante.' : 'Falsche Säule!'); fall.vx = (fall.x < g.x ? -60 : 60); fall.y = g.top - CH / 2 - 1; fall.vy = -40; fall.tip = true; }
          break;
        }
        if (fall && fall.y > WATER) {
          for (let i = 0; i < 14; i++) splash.push({ x: fall.x, y: WATER, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 120, life: 0.8 });
          if (msgT < 1.2) say('Platsch! Ab zum Lager, neue Kiste holen.');
          died(); fall = null; Klang.tone(120, 0.25);
        }
      }
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, WATER); sky.addColorStop(0, '#2a1846'); sky.addColorStop(0.55, '#a8456a'); sky.addColorStop(1, '#f2a65a');
      c.fillStyle = sky; c.fillRect(0, 0, W, WATER);
      c.fillStyle = '#ffd9a0'; c.beginPath(); c.arc(480, WATER - 10, 40, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(40,20,50,0.55)'; for (const b of city) c.fillRect(b.x, WATER - b.h, b.w, b.h);
      // Wasser
      const sea = c.createLinearGradient(0, WATER, 0, H); sea.addColorStop(0, '#3a2a5a'); sea.addColorStop(1, '#120a24');
      c.fillStyle = sea; c.fillRect(0, WATER, W, H - WATER);
      c.strokeStyle = 'rgba(255,200,140,0.35)'; c.lineWidth = 1;
      for (let y = WATER + 6; y < H; y += 9) { c.beginPath(); for (let x = 0; x <= W; x += 16) c.lineTo(x, y + Math.sin(x * 0.05 + t * 2 + y) * 1.5); c.stroke(); }
      // Kai mit Lager
      c.fillStyle = '#3b2a3a'; c.fillRect(0, 330, 140, H - 330); c.fillStyle = '#5a4250'; c.fillRect(0, 330, 140, 5);
      for (let i = 0; i < 3; i++) for (let j = 0; j <= i % 2; j++) { c.fillStyle = '#b5713a'; c.fillRect(16 + i * 34, 330 - CH * (j + 1), CW, CH); c.strokeStyle = '#6a3a18'; c.strokeRect(16.5 + i * 34, 330.5 - CH * (j + 1), CW - 1, CH - 1); }
      // Ziele
      const crate = (x, y, col) => { c.fillStyle = col; c.fillRect(x - CW / 2, y - CH / 2, CW, CH); c.strokeStyle = '#4a2a10'; c.lineWidth = 2; c.strokeRect(x - CW / 2 + 1, y - CH / 2 + 1, CW - 2, CH - 2); c.beginPath(); c.moveTo(x - CW / 2 + 2, y - CH / 2 + 2); c.lineTo(x + CW / 2 - 2, y + CH / 2 - 2); c.stroke(); };
      for (const [k, g] of targets.entries()) {
        const act = !fin.active && k === order[idx], done = stacked.find(s => s.k === k);
        if (g.boat) {
          c.fillStyle = '#2a1a2a'; c.beginPath(); c.moveTo(g.x - g.w / 2 - 10, g.top); c.lineTo(g.x + g.w / 2 + 10, g.top); c.lineTo(g.x + g.w / 2 - 4, WATER + 10); c.lineTo(g.x - g.w / 2 + 4, WATER + 10); c.fill();
        } else { c.fillStyle = '#2a1a2a'; c.fillRect(g.x - 8, g.top, 16, WATER - g.top + 20); }
        c.fillStyle = act ? next : done ? '#8a7a6a' : '#5a4a5a'; c.fillRect(g.x - g.w / 2, g.top - 4, g.w, 6);
        if (act) { c.save(); c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 5); c.fillStyle = next; c.fillRect(g.x - g.w / 2, g.top - 40, g.w, 36); c.restore(); }
        const n = order.indexOf(k) + 1; if (!done) label(c, String(n), g.x, g.top + 18, act ? next : '#c8b8c8', 'center');
        if (done) crate(g.x + done.dx, g.top - 4 - CH / 2, '#d08a44');
      }
      // Kran
      c.fillStyle = '#e0b030'; c.fillRect(0, RAIL - 8, W, 6);
      c.strokeStyle = '#e0b030'; c.lineWidth = 1.5; c.beginPath();
      for (let x = 0; x < W; x += 20) { c.moveTo(x, RAIL - 8); c.lineTo(x + 10, RAIL - 18); c.lineTo(x + 20, RAIL - 8); } c.moveTo(0, RAIL - 18); c.lineTo(W, RAIL - 18); c.stroke();
      c.fillStyle = '#3a3040'; c.fillRect(tx - 14, RAIL - 4, 28, 10);
      const h = hookPos();
      c.strokeStyle = '#1a1420'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(tx, RAIL + 4); c.lineTo(h.x, h.y); c.stroke();
      if (hold) { c.save(); c.translate(h.x, h.y); c.rotate(-th); crate(0, CH / 2, '#d08a44'); c.restore(); }
      else { c.strokeStyle = '#1a1420'; c.lineWidth = 2; c.beginPath(); c.arc(h.x, h.y + 4, 4, 0, Math.PI); c.stroke(); }
      if (fall) crate(fall.x, fall.y, '#d08a44');
      for (const p of splash) { c.fillStyle = `rgba(220,200,255,${p.life})`; c.fillRect(p.x, p.y, 2, 2); }
      label(c, `Kiste ${Math.min(idx + 1, NT)} / ${NT}`, 16, 74, '#ffe8c8');
      if (WIND) label(c, windDir > 0 ? 'Wind →' : '← Wind', W - 16, 74, '#ffe8c8', 'right');
      label(c, msgT > 0 ? msg : hold ? '← → fahren · Leertaste: Kiste fallen lassen' : 'Zum Lager links, dort hängt die nächste Kiste', W / 2, H - 14, '#ffe8c8', 'center');
      fin.draw(c, '#3a3040', '#e0b030');
    }
  };
  return self;
}
