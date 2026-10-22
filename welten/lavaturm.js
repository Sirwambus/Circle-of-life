/* =====================================================================
   WELT – Lavaturm: Kletter nach oben, die Lava steigt hinter dir her.
   ===================================================================== */
function makeLavaturm(next, level = 0) {
  // Je Level: höherer Turm, schmalere Stufen, schnellere Lava.
  const T = 20, C = 32, R = [72, 84, 96, 108, 120, 128, 136, 144, 152, 160][level], LH = R * T, LAVA = [24, 29, 33, 36, 38, 40, 42, 44, 46, 48][level];
  const WMIN = [4, 3, 3, 3, 2, 2, 2, 2, 2, 2][level], WVAR = [3, 3, 2, 2, 2, 2, 2, 2, 1, 1][level];
  const g = [...Array(R)].map(() => Array(C).fill(0));
  const fill = (x0, x1, y0, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = 1; };
  fill(0, C - 1, R - 2, R - 1);
  // Stufen alle 3 Reihen. Jede neue Stufe liegt seitlich versetzt (1–3 Felder Lücke) und
  // überlappt nie die darunter, sonst stößt man beim Springen mit dem Kopf an.
  const rnd = rng(66 + level), plats = [];
  let px = 12, w = 5, row = R - 5, dir = 1;
  fill(px, px + w - 1, row, row); plats.push({ x: px, w, row });
  while (row - 3 > 3) {
    const nw = WMIN + Math.floor(rnd() * WVAR), gap = 1 + Math.floor(rnd() * 3);
    if (rnd() < 0.3) dir *= -1;
    let nx = dir > 0 ? px + w + gap : px - gap - nw;
    if (nx < 1 || nx + nw > C - 1) { dir *= -1; nx = dir > 0 ? px + w + gap : px - gap - nw; }
    px = nx; w = nw; row -= 3;
    fill(px, px + w - 1, row, row); plats.push({ x: px, w, row });
  }
  const topP = plats[plats.length - 1]; // oberste Stufe trägt die Tür
  const door = { x: (topP.x + topP.w / 2) * T - 14, y: topP.row * T - 50, w: 28, h: 50 };
  const start = { x: 300, y: (R - 2) * T - 18 };
  const p = { ...start, w: 14, h: 18, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, face: 1, run: 0 };
  let lava = LH + 220, rising = false, camY = LH - H, t = 0, flash = 0;
  const embers = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 20 + Math.random() * 40 }));
  const solidAt = (cx, cy) => cx < 0 || cx >= C ? true : cy < 0 || cy >= R ? false : g[cy][cx] === 1;
  function die() { died(); flash = 0.5; Object.assign(p, { ...start, vx: 0, vy: 0 }); lava = LH + 220; rising = false; }
  const self = {
    done: false, p, plats,
    door: () => ({ ...door, y: door.y - camY }),
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      if (keys.left || keys.right || pressed.up || pressed.action) rising = true;
      platformPhysics(p, dt, T, solidAt, pressed.up || pressed.action, keys.up || keys.action);
      if (rising) lava -= (LAVA + (LH - lava) * 0.012) * dt;
      if (p.y + p.h > lava + 6) return die();
      camY += (clamp(p.y - 230, 0, LH - H) - camY) * Math.min(1, dt * 6);
      for (const e of embers) { e.y -= e.v * dt; e.x += Math.sin(t * 2 + e.y) * 0.3; if (e.y < 0) { e.y = H; e.x = Math.random() * W; } }
      if (overlap(p, door)) self.done = true;
    },
    draw(c) {
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#120806'); bg.addColorStop(1, '#2a0f08');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(255,120,60,0.06)'; c.lineWidth = 1;
      for (let x = 0; x < W; x += 36) for (let y = -((camY * 0.4) % 42); y < H; y += 42) { c.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI * 2; c.lineTo(x + 18 + Math.cos(a) * 18, y + Math.sin(a) * 18); } c.stroke(); }
      c.save(); c.translate(0, -Math.round(camY));
      const r0 = Math.max(0, Math.floor(camY / T)), r1 = Math.min(R - 1, r0 + 21);
      for (let y = r0; y <= r1; y++) for (let x = 0; x < C; x++) {
        if (!g[y][x]) continue;
        c.fillStyle = '#3a2a26'; c.fillRect(x * T, y * T, T, T);
        c.fillStyle = '#4c3933'; c.fillRect(x * T, y * T, T, 4);
        if ((x * 5 + y) % 3 === 0) { c.strokeStyle = '#ff6a1f'; c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + x); c.beginPath(); c.moveTo(x * T + 4, y * T + 8); c.lineTo(x * T + 10, y * T + 13); c.lineTo(x * T + 16, y * T + 10); c.stroke(); c.globalAlpha = 1; }
      }
      paintDoor(c, door, { frame: '#1a0f0c', panel: '#7a3a22', knob: '#ffb01f', light: next, glow: '#ff6a1f', open: doorOpenness(p, door, 80) });
      const px = Math.round(p.x), py = Math.round(p.y);
      c.fillStyle = '#e9e3d5'; c.fillRect(px, py + 2, 14, 14); c.fillStyle = '#5a6b7a'; c.fillRect(px, py, 14, 5);
      c.fillStyle = '#1a1a1a'; c.fillRect(p.face > 0 ? px + 9 : px + 2, py + 7, 3, 3);
      c.fillStyle = '#3a2a26'; c.fillRect(px + 2, py + 16, 4, 2); c.fillRect(px + 8, py + 16, 4, 2);
      // Lava
      const lg = c.createLinearGradient(0, lava, 0, lava + 120); lg.addColorStop(0, '#ffb01f'); lg.addColorStop(0.4, '#ff4d1a'); lg.addColorStop(1, '#8a1208');
      c.fillStyle = lg; c.beginPath(); c.moveTo(0, lava + 400);
      for (let x = 0; x <= W; x += 16) c.lineTo(x, lava + Math.sin(x * 0.04 + t * 3) * 5);
      c.lineTo(W, lava + 400); c.fill();
      c.fillStyle = 'rgba(255,220,120,0.8)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc((i * 117 + t * 20) % W, lava + 14 + (i % 3) * 10, 3 + (t * 3 + i) % 3, 0, 7); c.fill(); }
      c.restore();
      c.fillStyle = 'rgba(255,170,80,0.8)'; for (const e of embers) c.fillRect(e.x, e.y, 2, 2);
      const heat = clamp(1 - (lava - (p.y + p.h)) / 220, 0, 1);
      c.fillStyle = `rgba(255,60,20,${heat * 0.25})`; c.fillRect(0, 0, W, H);
      label(c, `Höhe ${Math.round((LH - p.y) / T)} / ${R - topP.row}`, 14, 24, '#ffcf9e');
      if (!rising) label(c, 'Sobald du dich bewegst, steigt die Lava', W / 2, 60, '#ffcf9e', 'center');
      flashOverlay(c, flash, '255,120,40');
    }
  };
  return self;
}
