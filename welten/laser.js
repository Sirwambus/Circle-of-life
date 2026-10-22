/* =====================================================================
   WELT – Laser: Dreh die Spiegel, bis der Strahl das Schloss der Tür trifft.
   Ab Level 8 muss der Strahl unterwegs zusätzlich alle Kristalle treffen.
   ===================================================================== */
function makeLaser(next, level = 0) {
  // Spiegel: [x, y, Startstellung] mit 0 = '/', 1 = '\'. Die Startstellung ist bewusst falsch.
  // Level 2–5 per Generator erzeugt; mindestens 6, 9, 11 bzw. 13 Drehungen nötig (per Komplettsuche geprüft).
  // Level 6–10: größeres Feld (cw × ch), mindestens 15, 17, 18, 20 bzw. 22 Drehungen; ab Level 8 Kristalle,
  // durch die der Strahl vor dem Schloss laufen muss (1, 2, 3 Stück). Geprüft per Suche entlang des Strahls.
  const LV = [
    { emit: [0, 1], lock: [11, 6], walls: ['5,1', '9,4', '2,7', '6,0', '8,3', '1,6', '4,2'],
      mirrors: [[3, 1, 0], [3, 5, 0], [7, 5, 0], [7, 2, 0], [10, 2, 0], [10, 6, 0], [5, 3, 0], [8, 7, 0], [5, 6, 0], [1, 4, 0]] },
    { emit: [0, 5], lock: [10, 0], walls: ['8,6', '10,2', '10,6', '9,6', '11,5', '2,1', '8,2', '7,7', '4,2'],
      mirrors: [[3, 5, 0], [3, 6, 0], [5, 6, 1], [5, 3, 1], [7, 3, 1], [7, 0, 1], [1, 6, 0], [1, 3, 0], [10, 7, 0], [2, 7, 0]] },
    { emit: [0, 1], lock: [9, 0], walls: ['10,4', '11,4', '6,4', '6,6', '9,7', '2,7', '2,4', '5,6', '2,5', '4,2', '1,5'],
      mirrors: [[1, 1, 1], [1, 0, 1], [2, 0, 0], [2, 3, 0], [5, 3, 0], [5, 5, 0], [8, 5, 1], [8, 3, 1], [9, 3, 1], [11, 2, 0], [4, 7, 0], [3, 0, 0], [8, 0, 0], [7, 0, 0]] },
    { emit: [0, 4], lock: [8, 1], walls: ['7,0', '11,5', '3,7', '10,3', '7,2', '3,1', '7,1', '1,0', '7,7', '4,0', '4,4', '8,6'],
      mirrors: [[3, 4, 0], [3, 5, 0], [5, 5, 0], [5, 7, 0], [6, 7, 1], [6, 4, 0], [5, 4, 0], [5, 3, 1], [7, 3, 0], [7, 4, 0], [8, 4, 1], [3, 3, 0], [10, 2, 0], [2, 5, 0], [1, 6, 0], [9, 5, 0]] },
    { emit: [0, 4], lock: [6, 0], walls: ['11,5', '3,7', '10,3', '3,1', '7,1', '1,0', '7,7', '4,0', '4,4', '8,6', '2,3', '10,2', '1,5'],
      mirrors: [[3, 4, 0], [3, 5, 0], [5, 5, 0], [5, 7, 0], [6, 7, 1], [6, 4, 0], [5, 4, 0], [5, 3, 1], [7, 3, 0], [7, 4, 0], [8, 4, 1], [8, 2, 0], [6, 2, 0], [1, 6, 0], [9, 5, 0], [4, 3, 0], [3, 6, 0], [10, 7, 0]] },
    { cw: 14, ch: 9, emit: [0,7], lock: [7,5], walls: ['8,1', '9,5', '3,8', '12,5', '11,5', '9,1', '10,7', '2,2', '9,3', '12,6', '12,2', '2,4', '1,5', '8,7'],
      mirrors: [[1, 7, 0], [1, 8, 0], [2, 8, 1], [2, 6, 1], [3, 6, 1], [3, 3, 1], [4, 3, 0], [4, 5, 0], [6, 5, 0], [6, 7, 1], [5, 7, 0], [5, 6, 0], [4, 6, 1], [4, 8, 0], [7, 8, 1], [12, 0, 0], [8, 3, 1], [10, 2, 1], [13, 3, 0], [11, 2, 0], [6, 4, 0], [12, 8, 0], [10, 0, 1], [10, 6, 1]] },
    { cw: 14, ch: 9, emit: [0,7], lock: [12,0], walls: ['0,6', '12,7', '6,7', '8,7', '7,7', '10,7', '4,6', '12,4', '5,8', '6,5', '1,2', '13,3', '5,4', '9,2', '1,1'],
      mirrors: [[3, 7, 1], [3, 4, 0], [1, 4, 0], [1, 3, 1], [2, 3, 1], [2, 1, 1], [4, 1, 1], [4, 0, 1], [7, 0, 0], [7, 3, 0], [9, 3, 0], [9, 6, 0], [11, 6, 1], [11, 5, 0], [10, 5, 0], [10, 3, 1], [12, 3, 1], [12, 6, 1], [5, 7, 0], [1, 5, 1], [4, 8, 1], [6, 6, 1], [5, 3, 0], [2, 6, 1], [4, 3, 1], [9, 7, 1], [2, 5, 0]] },
    { cw: 14, ch: 9, emit: [0,4], lock: [12,2], walls: ['1,6', '9,7', '7,8', '2,5', '0,3', '2,2', '7,5', '10,3', '5,1', '2,8', '3,7', '5,7', '0,2', '4,4', '7,4'],
      crystals: [[13, 2]],
      mirrors: [[3, 4, 1], [3, 1, 0], [1, 1, 0], [1, 0, 1], [4, 0, 0], [4, 2, 0], [6, 2, 1], [6, 1, 1], [8, 1, 1], [8, 0, 1], [10, 0, 0], [10, 1, 0], [13, 1, 0], [13, 3, 1], [11, 3, 1], [11, 4, 1], [8, 4, 0], [8, 2, 1], [13, 4, 1], [1, 5, 1], [6, 4, 0], [4, 5, 1], [1, 7, 1], [8, 6, 1], [13, 0, 0], [8, 5, 0], [11, 7, 1], [2, 6, 0], [3, 6, 1], [3, 5, 1]] },
    { cw: 16, ch: 10, emit: [0,6], lock: [14,0], walls: ['0,7', '9,3', '13,6', '10,5', '1,2', '2,1', '9,1', '12,6', '5,1', '2,9', '1,7', '2,0', '13,8', '5,9', '1,3', '12,9', '7,9', '5,0'],
      crystals: [[4, 8], [14, 5]],
      mirrors: [[3, 6, 0], [3, 8, 0], [5, 8, 1], [5, 5, 0], [3, 5, 0], [3, 3, 1], [6, 3, 0], [6, 5, 0], [8, 5, 0], [8, 6, 0], [11, 6, 1], [11, 3, 1], [12, 3, 0], [12, 5, 0], [15, 5, 1], [15, 3, 0], [13, 3, 0], [13, 1, 0], [11, 1, 0], [11, 0, 1], [1, 4, 1], [7, 8, 1], [4, 2, 1], [7, 7, 0], [11, 7, 0], [14, 9, 0], [9, 9, 1], [1, 9, 1], [10, 2, 1], [14, 7, 1], [14, 2, 1], [6, 7, 1], [8, 2, 1]] },
    { cw: 16, ch: 10, emit: [0,9], lock: [12,4], walls: ['8,0', '0,8', '14,6', '15,0', '1,1', '13,0', '11,9', '3,3', '2,0', '8,5', '8,6', '6,1', '3,1', '13,7', '15,9', '3,2', '5,3', '8,9'],
      crystals: [[5, 8], [7, 4], [13, 2]],
      mirrors: [[3, 9, 1], [3, 7, 1], [5, 7, 0], [5, 9, 0], [6, 9, 1], [6, 8, 1], [7, 8, 1], [7, 6, 0], [5, 6, 0], [5, 4, 1], [8, 4, 1], [8, 3, 1], [9, 3, 1], [9, 0, 1], [12, 0, 0], [12, 1, 1], [10, 1, 1], [10, 3, 0], [12, 3, 1], [12, 2, 1], [15, 2, 0], [15, 4, 1], [8, 8, 1], [14, 5, 0], [15, 8, 0], [4, 2, 1], [6, 0, 1], [13, 8, 1], [1, 7, 1], [14, 0, 1], [7, 2, 1], [3, 6, 1], [10, 4, 0], [6, 7, 0], [13, 1, 0], [9, 7, 0]] }
  ][level];
  const CW = LV.cw || 12, CH = LV.ch || 8, S = Math.min(48, Math.floor(624 / CW), Math.floor(384 / CH));
  const OX = (W - CW * S) / 2, OY = (H - CH * S) / 2, F = S / 48; // F: Zeichenmaßstab gegenüber 48er-Zellen
  const walls = new Set(LV.walls);
  const mirrors = LV.mirrors.map(([x, y, o]) => ({ x, y, o, vis: o }));
  const crystals = (LV.crystals || []).map(([x, y]) => ({ x, y, glow: 0 }));
  const EMIT = { x: LV.emit[0], y: LV.emit[1] }, LOCK = { x: LV.lock[0], y: LV.lock[1] };
  const cur = { x: mirrors[0].x, y: mirrors[0].y }, rep = makeRepeater();
  let solvedT = -1, t = 0, turns = 0;
  // Strahlverlauf; lit = Menge der getroffenen Kristalle, hit = Schloss erreicht und alle Kristalle getroffen
  function trace() {
    const pts = [[EMIT.x, EMIT.y]], lit = new Set(); let x = EMIT.x, y = EMIT.y, dx = 1, dy = 0;
    for (let i = 0; i < 1000; i++) {
      x += dx; y += dy;
      if (x < 0 || y < 0 || x >= CW || y >= CH) { pts.push([x - dx * 0.5, y - dy * 0.5]); return { pts, lit, hit: false }; }
      if (x === LOCK.x && y === LOCK.y) { pts.push([x, y]); return { pts, lit, atLock: true, hit: lit.size === crystals.length }; }
      if (walls.has(x + ',' + y)) { pts.push([x - dx * 0.5, y - dy * 0.5]); return { pts, lit, hit: false }; }
      const k = crystals.findIndex(k => k.x === x && k.y === y); if (k >= 0) lit.add(k);
      const m = mirrors.find(m => m.x === x && m.y === y);
      if (m) { pts.push([x, y]); if (m.o === 0) [dx, dy] = [-dy, -dx]; else [dx, dy] = [dy, dx]; }
    }
    return { pts, lit, hit: false };
  }
  const cx = x => OX + x * S + S / 2, cy = y => OY + y * S + S / 2;
  const self = {
    done: false,
    door: () => ({ x: OX + LOCK.x * S + 8 * F, y: OY + LOCK.y * S + 2 * F, w: S - 16 * F, h: S - 4 * F }),
    test: () => ({ cur: { ...cur }, turns, mirrors: mirrors.map(m => ({ x: m.x, y: m.y, o: m.o })), solved: solvedT >= 0 }), // für Testprogramme
    update(dt) {
      t += dt;
      for (const m of mirrors) m.vis += (m.o - m.vis) * Math.min(1, dt * 14);
      if (crystals.length) { const { lit } = trace(); crystals.forEach((k, i) => { k.glow += ((lit.has(i) ? 1 : 0) - k.glow) * Math.min(1, dt * 10); }); }
      if (solvedT >= 0) { solvedT += dt; if (solvedT > 1.4) self.done = true; return; }
      const d = rep(dt);
      if (d) { cur.x = clamp(cur.x + d[0], 0, CW - 1); cur.y = clamp(cur.y + d[1], 0, CH - 1); }
      if (pressed.action) { const m = mirrors.find(m => m.x === cur.x && m.y === cur.y); if (m) { m.o ^= 1; turns++; } }
      if (trace().hit) solvedT = 0;
    },
    draw(c) {
      c.fillStyle = '#0b0a12'; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(157,255,0,0.07)'; c.lineWidth = 1;
      for (let x = 0; x <= CW; x++) { c.beginPath(); c.moveTo(OX + x * S + 0.5, OY); c.lineTo(OX + x * S + 0.5, OY + CH * S); c.stroke(); }
      for (let y = 0; y <= CH; y++) { c.beginPath(); c.moveTo(OX, OY + y * S + 0.5); c.lineTo(OX + CW * S, OY + y * S + 0.5); c.stroke(); }
      for (const k of walls) {
        const [x, y] = k.split(',').map(Number), px = OX + x * S, py = OY + y * S;
        c.fillStyle = '#1d1a2e'; c.fillRect(px + 3, py + 3, S - 6, S - 6);
        c.strokeStyle = '#4a4470'; c.strokeRect(px + 3.5, py + 3.5, S - 7, S - 7);
        c.beginPath(); c.moveTo(px + 3, py + 3); c.lineTo(px + S - 3, py + S - 3); c.stroke();
      }
      const dr = self.door(), lit = solvedT >= 0 ? clamp(solvedT / 0.8, 0, 1) : 0;
      paintDoor(c, dr, { frame: '#c8c8e0', panel: '#2a2440', knob: '#9dff00', light: lit ? next : '#0b0a12', glow: lit ? '#9dff00' : null, open: lit * 0.8 });
      // Strahl
      const tr = trace(), { pts } = tr;
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round';
      for (const [w, a] of [[10, 0.12], [5, 0.3], [2, 1]]) {
        c.strokeStyle = `rgba(157,255,0,${a})`; c.lineWidth = w; c.beginPath();
        pts.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](cx(x), cy(y))); c.stroke();
      }
      c.restore();
      // Sender
      c.fillStyle = '#3a3a52'; c.fillRect(OX + 4 * F, cy(EMIT.y) - 14 * F, 34 * F, 28 * F);
      c.fillStyle = '#9dff00'; c.beginPath(); c.arc(OX + 38 * F, cy(EMIT.y), 5 * F, 0, 7); c.fill();
      // Kristalle: leuchten auf, sobald der Strahl sie trifft
      for (const k of crystals) {
        const x = cx(k.x), y = cy(k.y), r = 15 * F, g = k.glow;
        c.save(); c.shadowColor = '#4ff0ff'; c.shadowBlur = 18 * g;
        c.fillStyle = g > 0.5 ? '#bdfaff' : '#1e3f52'; c.strokeStyle = g > 0.5 ? '#ffffff' : '#4ff0ff'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.7, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.7, y); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x - r * 0.7, y); c.lineTo(x + r * 0.7, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.globalAlpha = 0.5; c.stroke(); c.restore();
      }
      for (const m of mirrors) {
        const a = Math.PI / 4 * (m.vis * 2 - 1) * -1, x = cx(m.x), y = cy(m.y);
        c.save(); c.translate(x, y); c.rotate(a);
        c.shadowColor = '#cfe8ff'; c.shadowBlur = 8; c.fillStyle = '#d8e4f0'; c.fillRect(-20 * F, -3 * F, 40 * F, 6 * F);
        c.shadowBlur = 0; c.fillStyle = '#6a7a90'; c.fillRect(-20 * F, 1 * F, 40 * F, 2 * F); c.restore();
        c.fillStyle = '#9dff00'; c.beginPath(); c.arc(x, y, 3 * F, 0, 7); c.fill();
      }
      if (solvedT < 0) { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.strokeRect(OX + cur.x * S + 2, OY + cur.y * S + 2, S - 4, S - 4); }
      label(c, `Drehungen ${turns}`, W - 8, H - 6, '#9dff00', 'right', 10);
      if (crystals.length) {
        label(c, `Kristalle ${tr.lit.size} / ${crystals.length}  ·  ${tr.atLock && !tr.hit ? 'Schloss getroffen, aber es fehlen noch Kristalle!' : 'erst alle treffen, dann das Schloss'}`, 8, H - 6, '#4ff0ff', 'left', 10);
      }
    }
  };
  return self;
}
