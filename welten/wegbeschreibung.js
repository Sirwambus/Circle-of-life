/* =====================================================================
   WELT – Wegbeschreibung: Eine Wegbeschreibung („3 × →, 2 × ↑ …“) wird kurz gezeigt und verschwindet.
   Geh den Weg danach Schritt für Schritt durch die nächtliche Stadt – ein falsches Feld, und du hast dich verlaufen.
   ===================================================================== */
function makeWegbeschreibung(next, level = 0) {
  // Ab Level 6 erscheint die Beschreibung nur noch Zeile für Zeile
  const S = [2, 3, 3, 4, 4, 5, 5, 6, 6, 7][level], LMAX = [3, 3, 4, 4, 4, 4, 4, 5, 5, 5][level], DECOY = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5][level];
  const SHOWT = [3.5, 4.5, 4.5, 5.5, 5, 6.5, 0, 0, 0, 0][level], STEP = [0, 0, 0, 0, 0, 0, 1.4, 1.35, 1.3, 1.25][level], SEQ = level >= 6, ROUNDS = 3, LIVES = 3;
  const GC = 12, GR = 7, CS = 42, OX = W / 2 - GC * CS / 2, OY = 70;
  const ARROW = { '1,0': '→', '-1,0': '←', '0,-1': '↑', '0,1': '↓' };
  const finale = { rect: { x: 0, y: 0, w: CS, h: CS } };
  let path, segs, street, doors, houses, pos, fig, phase, timer, roundI, lives, wrong, t = 0, msg = '', msgT = 0, open = 0;
  function gen() {
    for (;;) {
      const sx = Math.floor(Math.random() * GC), sy = Math.floor(Math.random() * GR), p = [[sx, sy]], sg = [];
      let ok = true, last = null;
      for (let s = 0; s < S && ok; s++) {
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(d => !last || (d[0] === 0) !== (last[0] === 0));
        let placed = false;
        for (let tries = 0; tries < 12 && !placed; tries++) {
          const d = opts[Math.floor(Math.random() * opts.length)], len = 1 + Math.floor(Math.random() * LMAX);
          const cells = []; let [x, y] = p[p.length - 1];
          for (let k = 0; k < len; k++) { x += d[0]; y += d[1]; cells.push([x, y]); }
          if (cells.every(([a, b]) => a >= 0 && b >= 0 && a < GC && b < GR && !p.some(q => Math.abs(q[0] - a) + Math.abs(q[1] - b) === 0))) {
            p.push(...cells); sg.push({ d, len }); last = d; placed = true;
          }
        }
        ok = placed;
      }
      if (ok) return { p, sg };
    }
  }
  function newRound() {
    const g = gen(); path = g.p; segs = g.sg; pos = 0; fig = { x: path[0][0], y: path[0][1] }; wrong = null; open = 0;
    const onPath = (x, y) => path.some(q => q[0] === x && q[1] === y);
    street = []; houses = [];
    for (let y = 0; y < GR; y++) for (let x = 0; x < GC; x++) {
      const st = onPath(x, y) || Math.random() < 0.42; street.push(st);
      if (!st) houses.push({ x, y, h: Math.random(), win: Math.floor(Math.random() * 4) });
    }
    const end = path[path.length - 1]; doors = [{ x: end[0], y: end[1] }];
    const free = []; for (let y = 0; y < GR; y++) for (let x = 0; x < GC; x++) if (street[y * GC + x] && !onPath(x, y) && Math.abs(x - path[0][0]) + Math.abs(y - path[0][1]) > 2) free.push([x, y]);
    while (doors.length < DECOY + 1 && free.length) { const [x, y] = free.splice(Math.floor(Math.random() * free.length), 1)[0]; doors.push({ x, y }); }
    doors.sort(() => Math.random() - 0.5);
    phase = 'show'; timer = SEQ ? 0.5 + S * STEP : 0.5 + SHOWT;
    finale.rect = { x: OX + end[0] * CS + 8, y: OY + end[1] * CS + 2, w: CS - 16, h: CS - 6 };
  }
  function reset() { roundI = 0; lives = LIVES; newRound(); }
  reset();
  // Welche Zeilen der Beschreibung sind gerade zu sehen?
  function visibleSegs() {
    if (phase !== 'show') return [];
    const el = (SEQ ? 0.5 + S * STEP : 0.5 + SHOWT) - timer;
    if (el < 0.5) return [];
    if (!SEQ) return segs.map((_, i) => i);
    const i = Math.floor((el - 0.5) / STEP); return i < S ? [i] : [];
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ phase, segs, visible: visibleSegs(), pos, path, round: roundI }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      fig.x += (path[pos][0] - fig.x) * Math.min(1, dt * 16); fig.y += (path[pos][1] - fig.y) * Math.min(1, dt * 16);
      if (wrong) { fig.x = wrong.x; fig.y = wrong.y; }
      if (phase === 'show') { timer -= dt; if (timer <= 0) phase = 'walk'; }
      else if (phase === 'walk') {
        const d = dirOf(pressed); if (!d) return;
        const nx = path[pos][0] + d[0], ny = path[pos][1] + d[1];
        if (nx < 0 || ny < 0 || nx >= GC || ny >= GR) return;
        const nxt = path[pos + 1], prv = path[pos - 1];
        if (nxt && nxt[0] === nx && nxt[1] === ny) {
          pos++; Klang.tone(300 + pos * 12, 0.08);
          if (pos === path.length - 1) {
            roundI++; Klang.tone(620, 0.5);
            if (roundI >= ROUNDS) { phase = 'enter'; timer = 0.7; msg = 'Angekommen!'; msgT = 2; }
            else { phase = 'arrive'; timer = 1.4; msg = 'Richtig angekommen! Nächster Weg …'; msgT = 1.4; }
          }
        } else if (prv && prv[0] === nx && prv[1] === ny) pos--;
        else { wrong = { x: nx, y: ny }; lives--; msg = lives > 0 ? 'Verlaufen! So wäre der Weg gewesen.' : 'Keine Versuche mehr. Von vorn.'; msgT = 2.2; phase = 'lost'; timer = 2.4; Klang.tone(150, 0.4); }
      } else if (phase === 'enter') { timer -= dt; open = Math.min(1, open + dt * 2); if (timer <= 0) self.done = true; }
      else if (phase === 'arrive') { timer -= dt; open = Math.min(1, open + dt * 2); if (timer <= 0) newRound(); }
      else if (phase === 'lost') { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      c.fillStyle = '#0b0f24'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,220,${0.2 + 0.2 * Math.sin(t + i)})`; c.fillRect((i * 97) % W, (i * 53) % 60, 2, 2); }
      c.fillStyle = '#141a38'; c.fillRect(OX - 8, OY - 8, GC * CS + 16, GR * CS + 16);
      for (let y = 0; y < GR; y++) for (let x = 0; x < GC; x++) {
        const px = OX + x * CS, py = OY + y * CS;
        if (street[y * GC + x]) {
          c.fillStyle = (x + y) % 2 ? '#3a4266' : '#363e60'; c.fillRect(px, py, CS, CS);
          c.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 4; k++) c.fillRect(px + 6 + (k % 2) * 18, py + 6 + Math.floor(k / 2) * 18, 14, 12);
        }
      }
      for (const h of houses) {
        const px = OX + h.x * CS, py = OY + h.y * CS;
        c.fillStyle = h.h < 0.5 ? '#2a1d3a' : '#1f2a3d'; c.fillRect(px + 2, py + 2, CS - 4, CS - 4);
        c.fillStyle = h.h < 0.5 ? '#5a2f4a' : '#2f4a5a'; c.beginPath(); c.moveTo(px + 2, py + 2); c.lineTo(px + CS / 2, py + CS / 2); c.lineTo(px + CS - 2, py + 2); c.fill();
        c.fillStyle = '#ffd56b'; if (h.win & 1) c.fillRect(px + 9, py + 24, 7, 7); if (h.win & 2) c.fillRect(px + CS - 16, py + 24, 7, 7);
      }
      const showPath = phase === 'lost';
      if (showPath || pos > 0) {
        const upto = showPath ? path.length : pos + 1;
        c.strokeStyle = showPath ? 'rgba(255,220,120,0.85)' : 'rgba(140,200,255,0.45)'; c.lineWidth = 6; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
        for (let i = 0; i < upto; i++) c[i ? 'lineTo' : 'moveTo'](OX + path[i][0] * CS + CS / 2, OY + path[i][1] * CS + CS / 2); c.stroke();
      }
      for (const d of doors) {
        const isEnd = d.x === path[path.length - 1][0] && d.y === path[path.length - 1][1];
        paintDoor(c, { x: OX + d.x * CS + 12, y: OY + d.y * CS + 6, w: CS - 24, h: CS - 12 }, { frame: '#c8b6ff', panel: '#3b2a6a', knob: '#ffe27a', light: next, glow: isEnd && open > 0 ? next : null, open: isEnd ? open : 0 });
      }
      // Start-Markierung und Figur
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(OX + path[0][0] * CS + CS / 2, OY + path[0][1] * CS + CS / 2, 16, 0, 7); c.stroke();
      const fx = OX + fig.x * CS + CS / 2, fy = OY + fig.y * CS + CS / 2;
      const lg = c.createRadialGradient(fx, fy, 2, fx, fy, 44); lg.addColorStop(0, 'rgba(255,220,130,0.45)'); lg.addColorStop(1, 'rgba(255,220,130,0)'); c.fillStyle = lg; c.beginPath(); c.arc(fx, fy, 44, 0, 7); c.fill();
      c.fillStyle = wrong ? '#ff5a5a' : '#f4e9ff'; c.beginPath(); c.arc(fx, fy - 6, 6, 0, 7); c.fill(); c.beginPath(); c.moveTo(fx - 8, fy + 12); c.lineTo(fx, fy - 2); c.lineTo(fx + 8, fy + 12); c.fill();
      c.fillStyle = '#ffd56b'; c.beginPath(); c.arc(fx + 10, fy + 2, 3.5, 0, 7); c.fill();
      // Beschreibung
      const vis = visibleSegs();
      if (phase === 'show') {
        const n = SEQ ? 1 : S, bw = SEQ ? 220 : Math.min(600, 40 + n * 82), bx = W / 2 - bw / 2, by = path[0][1] < 3 ? 262 : 84; // Zettel verdeckt den Start nicht
        c.fillStyle = 'rgba(244,234,210,0.96)'; c.beginPath(); c.roundRect(bx, by, bw, 100, 10); c.fill();
        c.strokeStyle = '#8a6a3a'; c.lineWidth = 2; c.beginPath(); c.roundRect(bx + 4, by + 4, bw - 8, 92, 8); c.stroke();
        label(c, SEQ ? `Wegbeschreibung ${vis.length ? vis[0] + 1 : '–'} / ${S}` : 'Wegbeschreibung', W / 2, by + 24, '#5a3a1a', 'center', 13);
        vis.forEach((i, k) => {
          const s = segs[i], cx = SEQ ? W / 2 : bx + 20 + 41 + k * 82;
          label(c, ARROW[s.d.join(',')], cx, by + 70, '#2a1a4a', 'center', 34);
          label(c, `${s.len} ×`, cx, by + 90, '#7a4a2a', 'center', 12);
        });
      }
      label(c, `Weg ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${S} Abschnitte`, 16, 26, '#d8d0ff');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff8aa8', 'right', 16);
      const hint = phase === 'show' ? 'Merk dir den Weg …' : phase === 'walk' ? 'Geh den Weg mit den Pfeiltasten – ein Schritt pro Druck' : '';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 14, '#d8d0ff', 'center');
      if (wrong && phase === 'lost') { const wx = OX + wrong.x * CS + CS / 2, wy = OY + wrong.y * CS + CS / 2; c.strokeStyle = '#ff5a5a'; c.lineWidth = 4; c.beginPath(); c.moveTo(wx - 12, wy - 12); c.lineTo(wx + 12, wy + 12); c.moveTo(wx + 12, wy - 12); c.lineTo(wx - 12, wy + 12); c.stroke(); }
    }
  };
  return self;
}
