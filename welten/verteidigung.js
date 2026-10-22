/* =====================================================================
   WELT – Verteidigung: Baue Türme an den Bauplätzen und halte drei Wellen auf.
   Danach öffnet sich das Burgtor. Grafik: Tuschezeichnung auf Pergament.
   ===================================================================== */
function makeVerteidigung(next, level = 0) {
  const PATH = [[-20, 80], [180, 80], [180, 300], [420, 300], [420, 120], [606, 120]];
  const SPOTS = [[110, 160], [250, 200], [330, 100], [300, 370], [340, 220], [500, 200], [500, 50]];
  // Je Level mehr und zähere Wellen. (Mit einem einfachen Bau-Bot auf Machbarkeit geprüft.)
  const WAVES = [
    [{ n: 8, hp: 3, sp: 45, gap: 1.0 }, { n: 12, hp: 5, sp: 50, gap: 0.8 }, { n: 14, hp: 8, sp: 55, gap: 0.7 }],
    [{ n: 10, hp: 4, sp: 48, gap: 0.9 }, { n: 14, hp: 7, sp: 52, gap: 0.75 }, { n: 16, hp: 10, sp: 56, gap: 0.65 }, { n: 18, hp: 13, sp: 60, gap: 0.6 }],
    [{ n: 12, hp: 5, sp: 50, gap: 0.85 }, { n: 16, hp: 8, sp: 54, gap: 0.72 }, { n: 18, hp: 11, sp: 58, gap: 0.64 }, { n: 20, hp: 13, sp: 61, gap: 0.6 }, { n: 22, hp: 15, sp: 64, gap: 0.58 }],
    [{ n: 12, hp: 6, sp: 52, gap: 0.8 }, { n: 16, hp: 9, sp: 56, gap: 0.7 }, { n: 18, hp: 12, sp: 60, gap: 0.62 }, { n: 20, hp: 14, sp: 63, gap: 0.58 }, { n: 22, hp: 16, sp: 66, gap: 0.55 }, { n: 24, hp: 18, sp: 68, gap: 0.52 }],
    [{ n: 14, hp: 6, sp: 54, gap: 0.78 }, { n: 16, hp: 10, sp: 58, gap: 0.68 }, { n: 18, hp: 13, sp: 62, gap: 0.6 }, { n: 20, hp: 16, sp: 65, gap: 0.56 }, { n: 22, hp: 19, sp: 68, gap: 0.53 }, { n: 24, hp: 22, sp: 70, gap: 0.5 }, { n: 26, hp: 25, sp: 72, gap: 0.48 }]
  ][Math.min(level, 4)].slice();
  // Ab Level 6 kommen weitere, immer zähere Wellen dazu
  for (let k = 0; k < level - 4; k++) WAVES.push({ n: 24 + k * 2, hp: Math.round(22 + (level - 4) * 1.5 + k * 2), sp: 70 + level, gap: 0.5 });
  const COST = 40, UP = 60, UP3 = 90, UP4 = 130, MAXLV = level >= 7 ? 4 : level >= 3 ? 3 : 2, INK = '#3b2a1a'; // ab Level 4 gibt es Stufe 3, ab Level 8 Stufe 4
  const segs = []; let total = 0;
  for (let i = 0; i < PATH.length - 1; i++) { const [ax, ay] = PATH[i], [bx, by] = PATH[i + 1], l = Math.hypot(bx - ax, by - ay); segs.push({ ax, ay, bx, by, l, s0: total }); total += l; }
  const at = s => { const g = segs.find(g => s <= g.s0 + g.l) || segs[segs.length - 1]; const k = clamp((s - g.s0) / g.l, 0, 1); return { x: g.ax + (g.bx - g.ax) * k, y: g.ay + (g.by - g.ay) * k }; };
  let towers, enemies, shots, coins, lives, wave, spawned, spawnT, breakT, cur, t = 0, flash = 0, won = false;
  function reset() { towers = SPOTS.map(() => 0); enemies = []; shots = []; coins = [120, 130, 150, 160, 170, 180, 190, 200, 210, 220][level]; lives = 5; wave = 0; spawned = 0; spawnT = 0; breakT = 4; cur = 0; won = false; }
  reset();
  const door = { x: 606, y: 92, w: 28, h: 52 };
  const self = {
    done: false, door: () => door,
    test: { setCursor: i => { cur = i; }, state: () => ({ won, lives, wave, coins, towers: towers.slice(), maxlv: MAXLV }) }, // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt);
      if (won) { if (pressed.action) self.done = true; return; }
      const d = dirOf(pressed);
      if (d) {
        const [cx, cy] = SPOTS[cur]; let best = -1, bd = 1e9;
        SPOTS.forEach(([x, y], i) => { if (i === cur) return; const vx = x - cx, vy = y - cy; if (vx * d[0] + vy * d[1] <= 0) return; const dist = Math.hypot(vx, vy) - (vx * d[0] + vy * d[1]) * 0.5; if (dist < bd) { bd = dist; best = i; } });
        if (best >= 0) cur = best;
      }
      if (pressed.action) {
        if (towers[cur] === 0 && coins >= COST) { towers[cur] = 1; coins -= COST; }
        else if (towers[cur] === 1 && coins >= UP) { towers[cur] = 2; coins -= UP; }
        else if (towers[cur] === 2 && MAXLV >= 3 && coins >= UP3) { towers[cur] = 3; coins -= UP3; }
        else if (towers[cur] === 3 && MAXLV === 4 && coins >= UP4) { towers[cur] = 4; coins -= UP4; }
      }
      if (wave < WAVES.length) {
        const W0 = WAVES[wave];
        if (breakT > 0) breakT -= dt;
        else if (spawned < W0.n) { spawnT -= dt; if (spawnT <= 0) { enemies.push({ s: 0, hp: W0.hp, max: W0.hp, sp: W0.sp }); spawned++; spawnT = W0.gap; } }
        else if (!enemies.length) { wave++; spawned = 0; breakT = 4; }
      } else if (!enemies.length) won = true;
      for (const e of enemies) { e.s += e.sp * dt; if (e.s >= total) { e.gone = true; lives--; flash = 0.3; } }
      if (lives <= 0) { died(); flash = 0.6; reset(); return; }
      towers.forEach((lv, i) => {
        if (!lv) return;
        const tw = SPOTS[i]; tw.cd = (tw.cd || 0) - dt; if (tw.cd > 0) return;
        let target = null;
        for (const e of enemies) { if (e.gone || e.hp <= 0) continue; const p = at(e.s); if (Math.hypot(p.x - tw[0], p.y - tw[1]) < (lv === 4 ? 140 : lv === 3 ? 128 : 115) && (!target || e.s > target.s)) target = e; }
        if (target) { shots.push({ x: tw[0], y: tw[1] - 14, e: target, dmg: lv }); tw.cd = [0, 0.7, 0.4, 0.33, 0.3][lv]; }
      });
      for (const s of shots) {
        const p = at(s.e.s), dx = p.x - s.x, dy = p.y - s.y, dist = Math.hypot(dx, dy);
        if (dist < 8 || s.e.gone) { s.hit = true; if (!s.e.gone && s.e.hp > 0) { s.e.hp -= s.dmg; if (s.e.hp <= 0) { s.e.gone = true; coins += 12; } } }
        else { s.x += dx / dist * 320 * dt; s.y += dy / dist * 320 * dt; }
      }
      shots = shots.filter(s => !s.hit); enemies = enemies.filter(e => !e.gone);
    },
    draw(c) {
      c.fillStyle = '#efe2c2'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(160,110,50,0.08)'; for (const [x, y, r] of [[80, 330, 70], [520, 320, 90], [300, 30, 60]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.strokeStyle = '#e0c995'; c.lineWidth = 30; c.beginPath(); PATH.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.stroke();
      c.strokeStyle = INK; c.lineWidth = 1.5; c.setLineDash([6, 5]);
      for (const off of [-15, 15]) { c.beginPath(); PATH.forEach(([x, y], i) => { const [px, py] = PATH[Math.max(0, i - 1)], [nx, ny] = PATH[Math.min(PATH.length - 1, i + 1)]; const vert = Math.abs(nx - px) < Math.abs(ny - py); c[i ? 'lineTo' : 'moveTo'](x + (vert ? off : 0), y + (vert ? 0 : off)); }); c.stroke(); }
      c.setLineDash([]);
      // Kompassrose
      c.save(); c.translate(580, 340); c.strokeStyle = INK; c.lineWidth = 1;
      for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(5, -6); c.lineTo(0, -26); c.lineTo(-5, -6); c.closePath(); c.stroke(); }
      c.restore(); label(c, 'N', 580, 306, INK, 'center', 10);
      // Burg
      c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(590, 60, 46, 100);
      for (let x = 590; x < 636; x += 12) c.strokeRect(x, 52, 7, 8);
      paintDoor(c, door, { frame: INK, panel: '#8a5a2b', knob: '#d9a441', light: won ? next : '#5a4a3a', open: won ? 0.8 : 0 });
      SPOTS.forEach(([x, y], i) => {
        const lv = towers[i];
        if (!lv) { c.strokeStyle = 'rgba(59,42,26,0.5)'; c.setLineDash([3, 3]); c.beginPath(); c.arc(x, y, 14, 0, 7); c.stroke(); c.setLineDash([]); }
        else {
          c.fillStyle = '#f6ecd2'; c.strokeStyle = INK; c.lineWidth = 2;
          c.beginPath(); c.moveTo(x - 10, y + 10); c.lineTo(x - 8, y - 12); c.lineTo(x + 8, y - 12); c.lineTo(x + 10, y + 10); c.closePath(); c.fill(); c.stroke();
          for (let k = -8; k < 8; k += 6) c.strokeRect(x + k, y - 17, 4, 5);
          c.beginPath(); c.moveTo(x, y - 17); c.lineTo(x, y - 28); c.stroke();
          c.fillStyle = ['', '#d9a441', '#c62828', '#7b3fbf', '#1f6fbf'][lv]; c.beginPath(); c.moveTo(x, y - 28); c.lineTo(x + 10, y - 25); c.lineTo(x, y - 22); c.fill();
        }
        if (i === cur && !won) { c.strokeStyle = '#c62828'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, 115, 0, 7); c.globalAlpha = 0.25; c.stroke(); c.globalAlpha = 1; c.beginPath(); c.arc(x, y, 20, 0, 7); c.stroke(); }
      });
      for (const e of enemies) {
        const p = at(e.s), bob = Math.sin(t * 10 + e.s) * 1.5;
        c.fillStyle = '#a3261b'; c.beginPath(); c.arc(p.x, p.y + bob, 8, 0, 7); c.fill();
        c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x - 4, p.y + 7); c.lineTo(p.x - 6, p.y + 12 + bob); c.moveTo(p.x + 4, p.y + 7); c.lineTo(p.x + 6, p.y + 12 - bob); c.stroke();
        c.fillStyle = INK; c.fillRect(p.x - 9, p.y - 15, 18 * e.hp / e.max, 2);
      }
      c.fillStyle = INK; for (const s of shots) { c.beginPath(); c.arc(s.x, s.y, 3, 0, 7); c.fill(); }
      const status = won ? 'Alle Wellen abgewehrt! Leertaste: durchs Tor' : wave < WAVES.length && breakT > 0 ? `Welle ${wave + 1} in ${Math.ceil(breakT)} s` : `Welle ${Math.min(wave + 1, WAVES.length)} / ${WAVES.length}`;
      label(c, `Gold ${coins}   ·   Leben ${lives}   ·   ${status}`, 14, 24, INK);
      const lv = towers[cur];
      if (!won) label(c, lv === 0 ? `Leertaste: Turm bauen (${COST})` : lv === 1 ? `Leertaste: verbessern (${UP})` : lv === 2 && MAXLV >= 3 ? `Leertaste: Stufe 3 (${UP3})` : lv === 3 && MAXLV === 4 ? `Leertaste: Stufe 4 (${UP4})` : 'Turm voll ausgebaut', 14, H - 12, INK);
      flashOverlay(c, flash, '163,38,27');
    }
  };
  return self;
}
