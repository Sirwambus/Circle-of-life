/* =====================================================================
   WELT – Froschweg: Über die Straße, dann auf Baumstämmen über den Fluss zur Tür.
   ===================================================================== */
function makeFroschweg(next, level = 0) {
  // Je Level schnellere Spuren; in Level 3 sind die Baumstämme kürzer.
  const SP = [1, 1.3, 1.55, 1.75, 1.95, 2.1, 2.25, 2.4, 2.55, 2.7][level];
  const S = 40, DOORCOL = 7;
  // Zeile -> Spur. type log: man muss draufstehen. type car: nicht berühren.
  const LANES = {
    1: { type: 'log', speed: 55, len: 3, gap: 3 }, 2: { type: 'log', speed: -75, len: 2, gap: 3 }, 3: { type: 'log', speed: 45, len: 4, gap: 3 },
    5: { type: 'car', speed: -95, len: 1, gap: 4 }, 6: { type: 'car', speed: 130, len: 1, gap: 5 },
    7: { type: 'car', speed: -65, len: 2, gap: 4 }, 8: { type: 'car', speed: 85, len: 1, gap: 3 }
  };
  for (const k in LANES) { const L = LANES[k]; L.speed *= SP; if (level >= 2 && L.type === 'log') { L.len = Math.max(2, L.len - 1); L.gap += 1; } }
  const CARCOL = ['#ff5a5f', '#ffb400', '#3fa7ff', '#9b6bff'];
  const f = { x: 300, row: 9, hop: 0 };
  let t = 0, flash = 0, best = 9;
  const rep = makeRepeater(0.2, 0.16);
  // Alle Objekte einer Spur als [x, breite]
  function objects(row) {
    const L = LANES[row], period = (L.len + L.gap) * S, off = ((t * L.speed) % period + period) % period, out = [];
    for (let x = off - period; x < W + period; x += period) out.push([x, L.len * S]);
    return out;
  }
  function die() { died(); flash = 0.4; f.x = 300; f.row = 9; }
  const self = {
    done: false,
    door: () => ({ x: DOORCOL * S + 4, y: 2, w: S - 8, h: S - 4 }),
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt); f.hop = Math.max(0, f.hop - dt);
      const d = rep(dt);
      if (d) {
        if (d[1] === -1 && f.row === 1) {
          if (Math.abs(f.x + S / 2 - (DOORCOL * S + S / 2)) < 26) { f.row = 0; f.x = DOORCOL * S; self.done = true; return; }
        } else { f.row = clamp(f.row + d[1], 1, 9); f.x = clamp(f.x + d[0] * S, 0, W - S); f.hop = 0.12; }
        best = Math.min(best, f.row);
      }
      const L = LANES[f.row];
      if (!L) return;
      const fx0 = f.x + 8, fx1 = f.x + S - 8;
      if (L.type === 'car') { for (const [x, w] of objects(f.row)) if (fx1 > x + 4 && fx0 < x + w - 4) return die(); }
      else {
        const mid = f.x + S / 2;
        if (!objects(f.row).some(([x, w]) => mid > x && mid < x + w)) return die();
        f.x += L.speed * dt;
        if (f.x < -10 || f.x > W - S + 10) return die();
      }
    },
    draw(c) {
      c.fillStyle = '#4c9a3a'; c.fillRect(0, 0, W, S);
      for (let x = 0; x < W; x += S) if (x / S !== DOORCOL) { c.fillStyle = '#2f6e2a'; c.beginPath(); c.roundRect(x + 2, 4, S - 4, S - 6, 10); c.fill(); }
      c.fillStyle = '#2b78c2'; c.fillRect(0, S, W, S * 3);
      c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2;
      for (let i = 0; i < 18; i++) { const y = S + 10 + (i % 3) * S, x = ((i * 83 + t * 30) % (W + 40)) - 20; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14, y); c.stroke(); }
      c.fillStyle = '#78c850'; c.fillRect(0, S * 4, W, S); c.fillRect(0, S * 9, W, S);
      c.fillStyle = '#5aa83c'; for (let x = 6; x < W; x += 22) { c.fillRect(x, S * 4 + 10 + (x % 3) * 6, 3, 6); c.fillRect(x + 9, S * 9 + 12 + (x % 4) * 4, 3, 6); }
      c.fillStyle = '#3b3f4a'; c.fillRect(0, S * 5, W, S * 4);
      c.fillStyle = '#e8e8e8'; for (let r = 6; r <= 8; r++) for (let x = 0; x < W; x += 40) c.fillRect(x + 8, r * S - 1, 20, 2);
      for (const row in LANES) {
        const L = LANES[row], y = row * S;
        for (const [x, w] of objects(+row)) {
          if (L.type === 'log') {
            c.fillStyle = '#8b5a2b'; c.beginPath(); c.roundRect(x + 2, y + 6, w - 4, S - 12, 12); c.fill();
            c.fillStyle = '#a8743c'; c.fillRect(x + 10, y + 10, w - 20, 4);
            c.fillStyle = '#c99a5b'; c.beginPath(); c.ellipse(x + w - 10, y + S / 2, 6, 12, 0, 0, 7); c.fill();
          } else {
            const col = CARCOL[row % 4], dir = Math.sign(L.speed);
            c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 5, y + 10, w - 6, S - 14);
            c.fillStyle = col; c.beginPath(); c.roundRect(x + 2, y + 6, w - 4, S - 14, 8); c.fill();
            c.fillStyle = '#d7f0ff'; c.fillRect(dir > 0 ? x + w - 16 : x + 8, y + 10, 8, S - 22);
            c.fillStyle = '#fff6a8'; c.fillRect(dir > 0 ? x + w - 4 : x + 2, y + 9, 2, 4); c.fillRect(dir > 0 ? x + w - 4 : x + 2, y + S - 15, 2, 4);
          }
        }
      }
      const dr = self.door();
      paintDoor(c, dr, { frame: '#5a3b1e', panel: '#c27b3a', knob: '#ffe9a0', light: next, open: f.row === 1 ? 0.7 : 0.15 });
      // Frosch
      const fx = f.x + S / 2, fy = f.row * S + S / 2 - Math.sin(f.hop / 0.12 * Math.PI) * 6;
      c.fillStyle = '#2f9e44'; c.beginPath(); c.ellipse(fx, fy + 2, 13, 11, 0, 0, 7); c.fill();
      c.fillStyle = '#69db7c'; c.beginPath(); c.ellipse(fx, fy + 4, 8, 6, 0, 0, 7); c.fill();
      c.fillStyle = '#2f9e44'; c.fillRect(fx - 16, fy + 6, 6, 6); c.fillRect(fx + 10, fy + 6, 6, 6);
      c.fillStyle = '#fff'; c.beginPath(); c.arc(fx - 6, fy - 8, 4.5, 0, 7); c.arc(fx + 6, fy - 8, 4.5, 0, 7); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(fx - 6, fy - 9, 2, 0, 7); c.arc(fx + 6, fy - 9, 2, 0, 7); c.fill();
      flashOverlay(c, flash);
    }
  };
  return self;
}
