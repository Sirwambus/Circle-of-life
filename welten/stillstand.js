/* =====================================================================
   WELT – Stillstand: Die Zeit läuft nur, wenn du dich bewegst. Weich den roten Geschossen aus.
   ===================================================================== */
function makeStillstand(next, level = 0) {
  // Je Level: mehr Geschütze, schnellere Geschosse, kürzere Nachladezeit.
  const BSP = [150, 170, 185, 195, 205, 212, 220, 228, 236, 245][level], RELOAD = [1.5, 1.25, 1.05, 0.95, 0.85, 0.8, 0.75, 0.7, 0.66, 0.62][level];
  const B = 16;
  const walls = [
    { x: 0, y: 0, w: W, h: B }, { x: 0, y: H - B, w: W, h: B }, { x: 0, y: 0, w: B, h: H }, { x: W - B, y: 0, w: B, h: H },
    { x: 150, y: B, w: 20, h: 240 }, { x: 300, y: 144, w: 20, h: H - 144 - B }, { x: 450, y: B, w: 20, h: 240 },
    { x: 220, y: 120, w: 40, h: 20 }, { x: 370, y: 270, w: 40, h: 20 }
  ];
  const turrets = [[230, 40], [380, 362], [540, 40], [560, 360], [90, 40], [230, 362], [380, 40], [604, 110], [604, 290], [300, 60], [520, 200]].slice(0, [5, 7, 9, 10, 11, 11, 11, 11, 11, 11][level]).map(([x, y], i) => ({ x, y, cd: 0.6 + i * 0.35 }));
  const door = { x: 584, y: 170, w: 32, h: 60 };
  const start = { x: 44, y: 344 };
  const p = { ...start, w: 18, h: 18 };
  let bullets = [], ts = 0.05, t = 0, flash = 0, gt = 0;
  function die() { died(); flash = 0.5; Object.assign(p, start); bullets = []; turrets.forEach((tu, i) => tu.cd = 0.6 + i * 0.35); }
  const self = {
    done: false, door: () => door,
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0); const l = Math.hypot(dx, dy) || 1;
      const moving = dx || dy;
      ts += ((moving ? 1 : 0.05) - ts) * Math.min(1, dt * 12);
      const sdt = dt * ts; gt += sdt;
      moveAndCollide(p, dx / l * 120 * dt, dy / l * 120 * dt, walls);
      const pc = center(p);
      for (const tu of turrets) {
        tu.cd -= sdt;
        if (tu.cd <= 0 && lineOfSight(tu.x, tu.y, pc.x, pc.y, walls.slice(4))) {
          tu.cd = RELOAD; const a = Math.atan2(pc.y - tu.y, pc.x - tu.x);
          bullets.push({ x: tu.x, y: tu.y, vx: Math.cos(a) * BSP, vy: Math.sin(a) * BSP, trail: [] });
        } else if (tu.cd <= 0) tu.cd = 0.3;
      }
      for (const b of bullets) {
        b.trail.push([b.x, b.y]); if (b.trail.length > 8) b.trail.shift();
        b.x += b.vx * sdt; b.y += b.vy * sdt;
        if (walls.some(s => b.x > s.x && b.x < s.x + s.w && b.y > s.y && b.y < s.y + s.h)) b.dead = true;
        if (Math.hypot(b.x - pc.x, b.y - pc.y) < 10) return die();
      }
      bullets = bullets.filter(b => !b.dead);
      if (overlap(p, door)) self.done = true;
    },
    draw(c) {
      c.fillStyle = '#f2f2f0'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(0,0,0,0.06)'; for (const s of walls) c.fillRect(s.x + 8, s.y + 8, s.w, s.h);
      for (const s of walls) { c.fillStyle = '#d9d9d6'; c.fillRect(s.x, s.y, s.w, s.h); c.fillStyle = '#e8e8e5'; c.fillRect(s.x, s.y, s.w, Math.min(6, s.h)); }
      paintDoor(c, door, { frame: '#bdbdb8', panel: '#ffffff', knob: '#ff2a2a', light: next, open: doorOpenness(p, door, 90) });
      for (const tu of turrets) {
        c.save(); c.translate(tu.x, tu.y); c.rotate(gt * 0.8);
        c.fillStyle = '#ff2a2a'; c.beginPath(); c.moveTo(0, -12); c.lineTo(11, 7); c.lineTo(-11, 7); c.fill();
        c.fillStyle = '#ff8a8a'; c.beginPath(); c.moveTo(0, -12); c.lineTo(3, 2); c.lineTo(-11, 7); c.fill();
        c.restore();
      }
      for (const b of bullets) {
        c.strokeStyle = 'rgba(255,42,42,0.35)'; c.lineWidth = 3; c.beginPath(); b.trail.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.lineTo(b.x, b.y); c.stroke();
        c.fillStyle = '#ff2a2a'; c.beginPath(); c.arc(b.x, b.y, 4, 0, 7); c.fill();
      }
      const pc = center(p);
      c.fillStyle = '#1b1b1f'; c.beginPath(); c.moveTo(pc.x, pc.y - 11); c.lineTo(pc.x + 9, pc.y + 8); c.lineTo(pc.x - 9, pc.y + 8); c.fill();
      if (ts < 0.5) { c.fillStyle = `rgba(80,90,110,${(0.5 - ts) * 0.12})`; c.fillRect(0, 0, W, H); }
      label(c, `ZEIT ×${ts.toFixed(2)}`, W - 26, 36, ts < 0.5 ? '#8a8a96' : '#ff2a2a', 'right', 14);
      flashOverlay(c, flash, '255,42,42');
    }
  };
  return self;
}
