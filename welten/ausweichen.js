/* =====================================================================
   WELT – Ausweichen: Fahrt durch einen Lichttunnel. Kristallblöcke kommen in Reihen entgegen, mit ← → die Spur
   wechseln. Später schneller, mehr Spuren und Blöcke, die kurz vor dir die Spur wechseln.
   ===================================================================== */
function makeAusweichen(next, level = 0) {
  const LANES = [3, 3, 3, 4, 4, 4, 5, 5, 5, 5][level];
  const TRAVEL = [2.4, 2.25, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4][level];   // Zeit vom Horizont bis zu dir
  const GAPT = [1.25, 1.12, 1.0, 1.05, 0.95, 0.88, 0.92, 0.84, 0.78, 0.72][level]; // Abstand zweier Reihen
  const ROWS = [18, 21, 24, 26, 28, 30, 32, 34, 36, 38][level], SHIFT = [0, 0, 0, 0, 0, 0.25, 0.3, 0.35, 0.4, 0.45][level], LIVES = 3;
  const HOR = 120, PLY = 342, finale = makeFinale(next), rep = makeRepeater(0.2, 0.12);
  const STEPS = Math.max(1, Math.floor((GAPT - 0.3) / 0.14));   // so viele Spurwechsel sind zwischen zwei Reihen sicher machbar
  const SHZ = Math.min(0.5, 1 - GAPT / TRAVEL - 0.05);           // Spurwechsler springen spätestens hier
  let lane, vis, rows, made, spawnT, passed, lives, inv, failT, msg, msgT, t = 0, flash = 0, lastFree;
  function reset() { lane = Math.floor(LANES / 2); vis = lane; rows = []; made = 0; spawnT = 0.8; passed = 0; lives = LIVES; inv = 0; failT = -1; msg = ''; msgT = 0; lastFree = null; }
  reset();
  function say(m) { msg = m; msgT = 1.1; }
  // Neue Reihe: von jeder freien Spur der letzten Reihe muss eine freie Spur dieser Reihe erreichbar sein
  function makeRow() {
    for (let tries = 0; tries < 200; tries++) {
      const nb = 1 + Math.floor(Math.random() * (LANES - 1));
      const blk = new Array(LANES).fill(false); let k = 0;
      while (k < nb) { const l = Math.floor(Math.random() * LANES); if (!blk[l]) { blk[l] = true; k++; } }
      const free = []; blk.forEach((b, i) => { if (!b) free.push(i); });
      if (lastFree && !lastFree.every(a => free.some(f => Math.abs(f - a) <= STEPS))) continue;
      const row = { z: 0, blk, shown: blk.slice(), shift: null, hit: false };
      // Spurwechsler: ein Block startet auf einer freien Nachbarspur und rutscht später auf seinen Platz
      if (Math.random() < SHIFT) {
        const opts = [];
        blk.forEach((b, i) => { if (b) for (const d of [-1, 1]) if (i + d >= 0 && i + d < LANES && !blk[i + d]) opts.push([i, i + d]); });
        if (opts.length) { const [to, from] = opts[Math.floor(Math.random() * opts.length)]; row.shown[to] = false; row.shown[from] = true; row.shift = { from, to }; }
      }
      lastFree = free; return row;
    }
    const blk = new Array(LANES).fill(false); lastFree = [...Array(LANES).keys()]; return { z: 0, blk, shown: blk.slice(), shift: null, hit: false };
  }
  const laneX = (l, z) => { const p = z * z; const wNear = 520, wFar = 70, w = wFar + (wNear - wFar) * p; return W / 2 - w / 2 + w * (l + 0.5) / LANES; };
  const zY = z => HOR + (PLY - HOR) * z * z;
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, fail: failT >= 0, lane, lanes: LANES, travel: TRAVEL, rows: rows.map(r => ({ z: r.z, blk: r.shown, hit: r.hit })) }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; flash = Math.max(0, flash - dt * 2); inv -= dt;
      vis += (lane - vis) * Math.min(1, dt * 18);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failT >= 0) { failT += dt; if ((failT > 0.8 && pressed.action) || failT > 4) { died(); reset(); } return; }
      const d = rep(dt); if (d && d[0]) lane = clamp(lane + d[0], 0, LANES - 1);
      if (made < ROWS) { spawnT -= dt; if (spawnT <= 0) { rows.push(makeRow()); made++; spawnT += GAPT; } }
      for (const r of rows) {
        const oz = r.z; r.z += dt / TRAVEL;
        if (r.shift && oz < SHZ && r.z >= SHZ) { r.shown = r.blk.slice(); Klang.tone(880, 0.05); }
        if (oz < 1 && r.z >= 1) {
          if (r.shown[lane] && inv <= 0) { r.hit = true; lives--; flash = 1; inv = 0.5; Klang.tone(110, 0.35); say('Krach!'); if (lives <= 0) { failT = 0; return; } }
          else { passed++; Klang.tone(500 + passed * 8, 0.04); }
        }
      }
      rows = rows.filter(r => r.z < 1.25);
      if (made >= ROWS && !rows.length) finale.start();
    },
    draw(c) {
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#000010'); bg.addColorStop(0.3, '#1a0638'); bg.addColorStop(1, '#3b0a3f');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // Tunnelringe
      for (let i = 0; i < 12; i++) {
        const z = ((i / 12) + t / TRAVEL * 0.5) % 1, y = zY(z), w = 70 + 450 * z * z;
        c.strokeStyle = `hsla(${300 + i * 8},100%,65%,${0.08 + z * 0.25})`; c.lineWidth = 1 + z * 2;
        c.strokeRect(W / 2 - w / 2 - 20 * z, y - 160 * z * z - 20, w + 40 * z, 160 * z * z + 20);
      }
      // Fahrbahn
      const wb = 70 + 450 * (H - HOR) / (PLY - HOR);   // Fahrbahnbreite am unteren Rand
      c.fillStyle = 'rgba(20,0,40,0.75)';
      c.beginPath(); c.moveTo(W / 2 - 35, HOR); c.lineTo(W / 2 + 35, HOR); c.lineTo(W / 2 + wb / 2, H); c.lineTo(W / 2 - wb / 2, H); c.fill();
      c.strokeStyle = 'rgba(255,63,164,0.5)'; c.lineWidth = 1;
      for (let l = 0; l <= LANES; l++) { c.beginPath(); c.moveTo(W / 2 - 35 + 70 * l / LANES, HOR); c.lineTo(W / 2 - wb / 2 + wb * l / LANES, H); c.stroke(); }
      // Reihen von hinten nach vorn
      const sorted = rows.slice().sort((a, b) => a.z - b.z);
      for (const r of sorted) {
        if (r.z > 1.15) continue;
        const y = zY(Math.min(r.z, 1.15)), s = 0.15 + 0.85 * r.z * r.z;
        r.shown.forEach((b, l) => {
          if (!b) return;
          const x = laneX(l, r.z), w = 420 / LANES * s * 0.8, h = 46 * s;
          const moving = r.shift && r.z < SHZ && l === r.shift.from;
          c.fillStyle = moving ? '#ffe14d' : '#4ff3ff'; c.shadowColor = c.fillStyle; c.shadowBlur = 12 * s;
          c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w / 2, y - h * 0.4); c.lineTo(x, y); c.lineTo(x - w / 2, y - h * 0.4); c.fill();
          c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w / 2, y - h * 0.4); c.lineTo(x, y - h * 0.5); c.fill();
          if (moving && r.z > 0.1) label(c, r.shift.to > r.shift.from ? '›' : '‹', x + (r.shift.to - r.shift.from) * w * 0.7, y - h * 0.3, '#ffe14d', 'center', Math.max(10, 22 * s));
        });
      }
      // Gleiter
      const px = laneX(vis, 1), blink = inv > 0 && Math.floor(t * 20) % 2 === 0;
      if (!blink) {
        c.fillStyle = '#ff3fa4'; c.shadowColor = '#ff3fa4'; c.shadowBlur = 18;
        c.beginPath(); c.moveTo(px, PLY - 26); c.lineTo(px + 26, PLY + 8); c.lineTo(px, PLY); c.lineTo(px - 26, PLY + 8); c.fill(); c.shadowBlur = 0;
        c.fillStyle = '#ffe0f0'; c.beginPath(); c.arc(px, PLY - 6, 5, 0, 7); c.fill();
      }
      if (flash > 0) { c.fillStyle = `rgba(255,80,80,${flash * 0.2})`; c.fillRect(0, 0, W, H); }
      label(c, `Strecke ${Math.round(Math.min(made - rows.length, ROWS) / ROWS * 100)} %`, 16, 26, '#ffd0f0');
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(16, 34, 140, 5); c.fillStyle = '#ff3fa4'; c.fillRect(16, 34, 140 * Math.min(1, (made - rows.length) / ROWS), 5);
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff3fa4', 'right', 16);
      if (failT >= 0) label(c, 'Zu oft angestoßen! Leertaste: noch einmal', W / 2, 388, '#ffb0d6', 'center', 14);
      else if (msgT > 0) label(c, msg, W / 2, 388, '#ffffff', 'center', 14);
      else label(c, SHIFT ? '← → Spur wechseln · gelbe Blöcke rutschen gleich zur Seite!' : '← → Spur wechseln', W / 2, 388, '#c9a0e0', 'center');
      finale.draw(c, '#ffd0f0', '#1a0638');
    }
  };
  return self;
}
