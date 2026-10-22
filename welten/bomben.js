/* =====================================================================
   WELT – Bomben: Sprenge Kisten frei. Unter einer davon liegt die Tür.
   Sie öffnet sich erst, wenn alle Ballonwesen besiegt sind.
   ===================================================================== */
function makeBomben(next, level = 0) {
  // Je Level: mehr und schnellere Gegner, mehr Kisten.
  const FOES = [[13, 1], [7, 7], [13, 5], [5, 3], [9, 1], [11, 7]].slice(0, [2, 3, 4, 5, 6, 6, 6, 6, 6, 6][level]), STEP = [0.55, 0.45, 0.38, 0.34, 0.3, 0.28, 0.26, 0.24, 0.22, 0.2][level], DENS = [0.55, 0.6, 0.66, 0.7, 0.72, 0.74, 0.76, 0.78, 0.8, 0.8][level];
  const CW = 15, CH = 9, S = 40, OX = 20, OY = 20;
  const hard = (x, y) => x === 0 || y === 0 || x === CW - 1 || y === CH - 1 || (x % 2 === 0 && y % 2 === 0);
  const R = rng(99 + level);
  const DOOR = { x: 13, y: 7 };
  const free = new Set(['1,1', '2,1', '1,2', '1,7', '1,6', '2,7']);
  for (const [fx, fy] of FOES) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) free.add((fx + dx) + ',' + (fy + dy));
  let crates = new Set();
  for (let y = 1; y < CH - 1; y++) for (let x = 1; x < CW - 1; x++) if (!hard(x, y) && !free.has(x + ',' + y) && R() < DENS) crates.add(x + ',' + y);
  crates.add(DOOR.x + ',' + DOOR.y);
  const START = { x: 1, y: 1 };
  let pl = { ...START }, plv = { ...START }, bombs = [], flames = [], t = 0, flash = 0, revealed = false;
  let enemies = FOES.map(([x, y]) => ({ x, y, vx: x, vy: y, d: [0, 1], t: 0, alive: true }));
  const rep = makeRepeater(0.16, 0.14);
  const blocked = (x, y) => hard(x, y) || crates.has(x + ',' + y) || bombs.some(b => b.x === x && b.y === y);
  const inFlame = (x, y) => flames.some(f => f.x === x && f.y === y);
  function explode(b) {
    b.t = -1;
    flames.push({ x: b.x, y: b.y, life: 0.5 });
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 1; k <= 2; k++) {
      const x = b.x + dx * k, y = b.y + dy * k;
      if (hard(x, y)) break;
      flames.push({ x, y, life: 0.5 });
      if (crates.has(x + ',' + y)) { crates.delete(x + ',' + y); if (x === DOOR.x && y === DOOR.y) revealed = true; break; }
      const other = bombs.find(o => o.x === x && o.y === y && o.t > 0); if (other) other.t = 0.05;
    }
  }
  function playerDies() { died(); flash = 0.5; pl = { ...START }; plv = { ...START }; bombs = []; }
  const enemiesLeft = () => enemies.filter(e => e.alive).length;
  const self = {
    done: false,
    door: () => ({ x: OX + DOOR.x * S + 6, y: OY + DOOR.y * S + 2, w: S - 12, h: S - 4 }),
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      const d = rep(dt);
      if (d) {
        const nx = pl.x + d[0], ny = pl.y + d[1];
        const onBomb = bombs.some(b => b.x === nx && b.y === ny);
        if (!hard(nx, ny) && !crates.has(nx + ',' + ny) && !onBomb) pl = { x: nx, y: ny };
      }
      if (pressed.action && !bombs.some(b => b.t > 0) ) bombs.push({ x: pl.x, y: pl.y, t: 2 });
      for (const b of bombs) if (b.t > 0) { b.t -= dt; if (b.t <= 0) explode(b); }
      bombs = bombs.filter(b => b.t > 0);
      for (const f of flames) f.life -= dt;
      flames = flames.filter(f => f.life > 0);
      for (const e of enemies) {
        if (!e.alive) continue;
        e.t -= dt;
        if (e.t <= 0) {
          e.t = STEP;
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !blocked(e.x + dx, e.y + dy));
          if (opts.length) {
            const keep = opts.find(o => o[0] === e.d[0] && o[1] === e.d[1]);
            e.d = keep && R() < 0.7 ? keep : opts[Math.floor(R() * opts.length)];
            e.x += e.d[0]; e.y += e.d[1];
          }
        }
        e.vx += (e.x - e.vx) * Math.min(1, dt * 10); e.vy += (e.y - e.vy) * Math.min(1, dt * 10);
        if (inFlame(e.x, e.y)) e.alive = false;
        if (e.alive && e.x === pl.x && e.y === pl.y) return playerDies();
      }
      if (inFlame(pl.x, pl.y)) return playerDies();
      plv.x += (pl.x - plv.x) * Math.min(1, dt * 18); plv.y += (pl.y - plv.y) * Math.min(1, dt * 18);
      if (revealed && !enemiesLeft() && pl.x === DOOR.x && pl.y === DOOR.y) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#2d5a27'; c.fillRect(0, 0, W, H);
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        const px = OX + x * S, py = OY + y * S;
        if (hard(x, y)) {
          c.fillStyle = '#8a8f98'; c.fillRect(px, py, S, S);
          c.fillStyle = '#b4b9c2'; c.fillRect(px, py, S, 5); c.fillRect(px, py, 5, S);
          c.fillStyle = '#5d626b'; c.fillRect(px, py + S - 5, S, 5); c.fillRect(px + S - 5, py, 5, S);
        } else {
          c.fillStyle = (x + y) % 2 ? '#58a845' : '#4f9a3e'; c.fillRect(px, py, S, S);
          if (x === DOOR.x && y === DOOR.y && revealed) {
            const open = !enemiesLeft();
            paintDoor(c, self.door(), { frame: '#3a2a1a', panel: open ? '#c27b3a' : '#6a4a2a', knob: '#ffe08a', light: open ? next : '#1a1a1a', open: open ? 0.6 : 0 });
          }
          if (crates.has(x + ',' + y)) {
            c.fillStyle = '#b5562b'; c.fillRect(px + 1, py + 1, S - 2, S - 2);
            c.fillStyle = '#d9c3a0'; for (let k = 1; k < 4; k++) c.fillRect(px + 1, py + k * 10, S - 2, 2);
            for (let k = 0; k < 4; k++) c.fillRect(px + (k % 2 ? 10 : 25), py + k * 10 + 1, 2, 9);
          }
        }
      }
      for (const b of bombs) {
        const px = OX + b.x * S + 20, py = OY + b.y * S + 22, s = 1 + Math.sin(t * 14) * 0.06;
        c.fillStyle = '#151515'; c.beginPath(); c.arc(px, py, 13 * s, 0, 7); c.fill();
        c.fillStyle = '#555'; c.beginPath(); c.arc(px - 4, py - 4, 4, 0, 7); c.fill();
        c.fillStyle = Math.floor(t * 20) % 2 ? '#ffdd33' : '#ff7a1a'; c.beginPath(); c.arc(px + 9, py - 12, 3.5, 0, 7); c.fill();
      }
      for (const f of flames) {
        const px = OX + f.x * S, py = OY + f.y * S, k = f.life / 0.5;
        c.fillStyle = `rgba(255,122,26,${k})`; c.fillRect(px + 2, py + 2, S - 4, S - 4);
        c.fillStyle = `rgba(255,230,120,${k})`; c.fillRect(px + 10, py + 10, S - 20, S - 20);
      }
      for (const e of enemies) {
        if (!e.alive) continue;
        const px = OX + e.vx * S + 20, py = OY + e.vy * S + 20 + Math.sin(t * 6 + e.x) * 2;
        c.fillStyle = '#b05cff'; c.beginPath(); c.arc(px, py - 2, 13, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(px - 5, py - 4, 4, 0, 7); c.arc(px + 5, py - 4, 4, 0, 7); c.fill();
        c.fillStyle = '#1a0a2a'; c.beginPath(); c.arc(px - 5, py - 3, 2, 0, 7); c.arc(px + 5, py - 3, 2, 0, 7); c.fill();
      }
      const px = OX + plv.x * S + 20, py = OY + plv.y * S + 20;
      c.fillStyle = '#f2f2f2'; c.beginPath(); c.arc(px, py - 6, 11, 0, 7); c.fill();
      c.fillStyle = '#2b6fd6'; c.fillRect(px - 9, py + 3, 18, 12);
      c.fillStyle = '#ffd1a8'; c.fillRect(px - 7, py - 9, 14, 7);
      c.fillStyle = '#1a1a1a'; c.fillRect(px - 4, py - 7, 2, 4); c.fillRect(px + 2, py - 7, 2, 4);
      c.fillStyle = '#ff5ca8'; c.beginPath(); c.arc(px, py - 18, 4, 0, 7); c.fill();
      label(c, `Gegner ${enemiesLeft()}   ·   Leertaste: Bombe legen`, OX, H - 4, '#e8f5e0');
      if (revealed && enemiesLeft()) label(c, 'Tür gefunden, aber noch verschlossen', W - OX, H - 4, '#ffe08a', 'right');
      flashOverlay(c, flash, '255,122,26');
    }
  };
  return self;
}
