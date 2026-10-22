/* =====================================================================
   WELT – Slalom: Der Skifahrer saust von allein bergab. Lenk ihn mit ← → durch die Tore.
   Ein verpasstes Tor kostet ein Leben. Ab Level 5 stehen Tannen im Weg, später wird es enger und schneller.
   ===================================================================== */
function makeSlalom(next, level = 0) {
  const NEED = [10, 12, 14, 15, 16, 18, 18, 20, 20, 22][level], SPEED = [120, 130, 140, 150, 160, 170, 178, 186, 194, 200][level];
  const GW = [130, 118, 106, 98, 92, 86, 82, 78, 74, 70][level], GAPY = 190;
  const MAXOFF = [110, 120, 130, 135, 140, 145, 150, 150, 155, 155][level], TREES = level >= 4 ? [0, 0, 0, 0, 0.5, 0.6, 0.7, 0.8, 0.9, 1][level] : 0;
  const SIDE = 300, SY = 110, LIVES = 3;
  const finale = makeFinale(next);
  let sk, gates, trees, made, lives, failed, failT, flash, trail, nextY, lastX, gi, t = 0, msg = '', msgT = 0, flakes;
  flakes = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 2 }));
  function addGate() {
    gi++;
    const cx = gi > NEED ? W / 2 : clamp(lastX + (Math.random() * 2 - 1) * MAXOFF, 90, W - 90);
    gates.push({ y: nextY, cx, i: gi, state: 0, red: gi % 2 === 0, goal: gi === NEED + 1 });
    // Tannen neben dem direkten Weg zwischen zwei Toren
    if (TREES && gi > 1 && gi <= NEED && Math.random() < TREES) {
      const lo = Math.min(lastX, cx) - 70, hi = Math.max(lastX, cx) + 70, opts = [];
      if (lo > 50) opts.push(30 + Math.random() * (lo - 50));
      if (hi < W - 50) opts.push(hi + 20 + Math.random() * (W - 50 - hi));
      if (opts.length) trees.push({ x: opts[Math.floor(Math.random() * opts.length)], y: nextY - GAPY * (0.35 + Math.random() * 0.3), hit: false });
    }
    lastX = cx; nextY += GAPY;
  }
  function reset() {
    sk = { x: W / 2, vx: 0 }; gates = []; trees = []; made = 0; lives = LIVES; failed = false; flash = 0; trail = [];
    nextY = SY + 260; lastX = W / 2; gi = 0;
    while (gates.length < 6) addGate();
  }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => { const gs = gates.filter(g => g.state === 0 && g.y > SY - 2).map(g => ({ cx: g.cx, y: g.y, w: GW })); return { fin: finale.active, failed, x: sk.x, vx: sk.vx, gate: gs[0] || null, gate2: gs[1] || null, trees: trees.map(r => ({ x: r.x, y: r.y })), speed: SPEED }; }, // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt * 2); msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { failT += dt; if (failT > 0.6 && pressed.action) { died(); reset(); } return; }
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      sk.vx += (dir * SIDE - sk.vx) * Math.min(1, dt * (dir ? 10 : 8));
      sk.x = clamp(sk.x + sk.vx * dt, 20, W - 20);
      const dy = SPEED * dt; nextY -= dy;
      for (const g of gates) {
        const y0 = g.y; g.y -= dy;
        if (g.state === 0 && y0 >= SY && g.y < SY) {
          if (g.goal) { finale.start(); Klang.tone(990, 0.3); return; }
          if (Math.abs(sk.x - g.cx) < GW / 2 - 6) { g.state = 1; made++; Klang.tone(520 + made * 12, 0.08); }
          else { g.state = 2; lives--; flash = 1; msg = 'Tor verpasst!'; msgT = 1; Klang.tone(130, 0.2); }
        }
      }
      for (const r of trees) { r.y -= dy; if (!r.hit && Math.abs(r.y - SY) < 12 && Math.abs(r.x - sk.x) < 22) { r.hit = true; lives--; flash = 1; msg = 'Autsch, eine Tanne!'; msgT = 1; Klang.tone(100, 0.25); } }
      for (const p of trail) p.y -= dy;
      trail.push({ x: sk.x, y: SY + 8 }); if (trail.length > 90) trail.shift();
      gates = gates.filter(g => g.y > -60); trees = trees.filter(r => r.y > -60);
      while (gates.length < 6 && gi <= NEED) addGate();
      for (const f of flakes) { f.y -= dy * 0.6; f.x += Math.sin(t + f.r * 3) * 0.3; if (f.y < -5) { f.y = H + 5; f.x = Math.random() * W; } }
      if (lives <= 0) { failed = true; failT = 0; }
    },
    draw(c) {
      const snow = c.createLinearGradient(0, 0, W, H); snow.addColorStop(0, '#f4f8ff'); snow.addColorStop(1, '#cddcf0');
      c.fillStyle = snow; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(120,150,200,0.12)';
      for (let i = 0; i < 6; i++) { const y = ((i * 90 - t * SPEED * 0.9) % 540 + 540) % 540 - 70; c.beginPath(); c.ellipse(100 + (i * 173) % 440, y, 120, 26, 0.2, 0, 7); c.fill(); }
      c.strokeStyle = 'rgba(120,140,190,0.35)'; c.lineWidth = 2; c.beginPath();
      trail.forEach((p, i) => { if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.stroke();
      const tree = (x, y, s) => {
        c.fillStyle = '#6a4a30'; c.fillRect(x - 2.5 * s, y - 2 * s, 5 * s, 8 * s);
        c.fillStyle = '#1f5a3a'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x, y - 34 * s + k * 9 * s); c.lineTo(x + (13 + k * 4) * s, y - 14 * s + k * 9 * s); c.lineTo(x - (13 + k * 4) * s, y - 14 * s + k * 9 * s); c.closePath(); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.moveTo(x, y - 34 * s); c.lineTo(x + 5 * s, y - 27 * s); c.lineTo(x - 5 * s, y - 27 * s); c.fill();
      };
      for (let i = 0; i < 8; i++) { const y = ((i * 60 - t * SPEED) % 480 + 480) % 480 - 40; tree(10 + (i % 2) * 8, y, 0.8); tree(W - 12 - (i % 2) * 8, y + 30, 0.8); }
      for (const r of trees) tree(r.x, r.y + 6, 1);
      for (const g of gates) {
        const col = g.goal ? '#ffb000' : g.red ? '#e83a3a' : '#2a62e8', l = g.cx - GW / 2, rr = g.cx + GW / 2;
        if (g.goal) { c.fillStyle = 'rgba(255,176,0,0.25)'; c.fillRect(l, g.y - 4, GW, 8); label(c, 'ZIEL', g.cx, g.y - 16, '#c07a00', 'center', 13); }
        for (const x of [l, rr]) {
          c.strokeStyle = '#333'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, g.y + 6); c.lineTo(x, g.y - 30); c.stroke();
          c.fillStyle = g.state === 2 ? '#999' : col; c.beginPath(); c.moveTo(x, g.y - 30); c.lineTo(x + (x === l ? 16 : -16), g.y - 24); c.lineTo(x, g.y - 17); c.fill();
        }
        if (g.state === 1) { c.strokeStyle = 'rgba(80,200,120,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(l, g.y); c.lineTo(rr, g.y); c.stroke(); }
      }
      // Skifahrer
      const lean = clamp(sk.vx / SIDE, -1, 1);
      c.save(); c.translate(sk.x, SY); c.rotate(-lean * 0.35);
      c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.moveTo(-6, -4); c.lineTo(-4 + lean * 6, 16); c.moveTo(6, -4); c.lineTo(8 + lean * 6, 16); c.stroke();
      c.fillStyle = '#ff5a2a'; c.fillRect(-7, -16, 14, 16);
      c.fillStyle = '#ffd9b0'; c.beginPath(); c.arc(0, -21, 5, 0, 7); c.fill();
      c.fillStyle = '#2a62e8'; c.beginPath(); c.arc(0, -23, 5, Math.PI, 0); c.fill();
      c.strokeStyle = '#555'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-9, -10); c.lineTo(-14, 10); c.moveTo(9, -10); c.lineTo(14, 10); c.stroke();
      c.restore();
      c.fillStyle = 'rgba(255,255,255,0.9)'; for (const f of flakes) { c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(20,40,80,0.75)'; c.fillRect(0, 0, W, 38);
      label(c, `Tore ${made} / ${NEED}`, 16, 25, '#ffffff');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff7a7a', 'right', 16);
      label(c, TREES ? '← → lenken · durch die Tore, an Tannen vorbei' : '← → lenken · durch die Tore', W / 2, 25, '#cfe0ff', 'center');
      if (msgT > 0) label(c, msg, W / 2, 380, '#c02a2a', 'center', 15);
      flashOverlay(c, flash * 0.3, '255,80,80');
      if (failed) { c.fillStyle = 'rgba(20,40,80,0.9)'; c.fillRect(0, 160, W, 80); label(c, `Gestürzt nach ${made} Toren. Leertaste: neue Abfahrt`, W / 2, 205, '#ffd0d0', 'center', 14); }
      finale.draw(c, '#cfe0ff', '#2a62e8');
    }
  };
  return self;
}
