/* =====================================================================
   WELT – Parkplatz: Schieb die Autos vor und zurück, bis dein rotes Auto durch die Ausfahrt
   rechts zur Tür fahren kann. Autos fahren nur geradeaus.
   ↑ ↓ ← → Feld wählen, Leertaste Auto greifen / loslassen, gegriffen: Pfeile schieben.
   ===================================================================== */
function makeParkplatz(next, level = 0) {
  // Aus Zufallsbelegungen erzeugt; kürzeste Lösung per Breitensuche: 3, 5, 8, 10, 13, 16, 19, 21, 23, 26 Züge
  const MAPS = [
    '............E.AAC.E...C..BB.C....DD.',
    '....D....CD..AACDE..BBBE............',
    '............AAD.....D..CBBD..C..EEEC',
    '..CBHH..CB..AAC.....FF.D..GGGD..EEE.',
    'KK.BBEG.JJ.EGFDAAE.FDC..M.DCIIMHH.LL',
    'GFKKBBGF.CJJAADC.EM.D..EM.DIIE.HHLL.',
    '..CC...DEEEB.DAAIBJJH.IGK.H.FGKLL.F.',
    '.II.L.J..FL.JAAFKG.BCCKG.BHDDDEEH...',
    'CJ.FF.CJMMEBDHAAEBDH.LEBDHNLKKGGNII.',
    'KK...GF..IHGFAAIHEL.JDHEL.JDCC..BBB.'
  ];
  const BEST = [3, 5, 8, 10, 13, 16, 19, 21, 23, 26][level];
  const S = 56, GX = 132, GY = 32, N = 6;
  const PAL = ['#f2c14e', '#4fa3e0', '#7bd389', '#c77dff', '#ff9f43', '#5ee6e6', '#f78fb3', '#a0a8b8', '#e8e3d0', '#9ad04b', '#6c7cff', '#ffb3a1', '#d9a066'];
  let cars, cx, cy, grab, grabPos, moves, t = 0, exitT = -1;
  function reset() {
    const m = MAPS[level], seen = {}; cars = [];
    for (let i = 0; i < 36; i++) {
      const ch = m[i]; if (ch === '.' || seen[ch]) continue; seen[ch] = true;
      const cells = []; for (let j = 0; j < 36; j++) if (m[j] === ch) cells.push(j);
      const h = Math.floor(cells[0] / 6) === Math.floor(cells[1] / 6);
      cars.push({ id: ch, h, len: cells.length, x: cells[0] % 6, y: Math.floor(cells[0] / 6), vx: cells[0] % 6, vy: Math.floor(cells[0] / 6), col: ch === 'A' ? '#ff3b3b' : PAL[(ch.charCodeAt(0) - 66) % PAL.length] });
    }
    cx = 0; cy = 2; grab = null; moves = 0; exitT = -1;
  }
  reset();
  const red = () => cars.find(c => c.id === 'A');
  const carAt = (x, y) => cars.find(c => c.h ? y === c.y && x >= c.x && x < c.x + c.len : x === c.x && y >= c.y && y < c.y + c.len);
  function tryMove(c, d) {
    const nx = c.x + (c.h ? d : 0), ny = c.y + (c.h ? 0 : d);
    if (nx < 0 || ny < 0 || (c.h ? nx + c.len > N : ny + c.len > N)) return false;
    const fx = c.h ? (d > 0 ? nx + c.len - 1 : nx) : nx, fy = c.h ? ny : (d > 0 ? ny + c.len - 1 : ny), o = carAt(fx, fy);
    if (o && o !== c) return false;
    c.x = nx; c.y = ny; cx = clamp(cx + (c.h ? d : 0), 0, N - 1); cy = clamp(cy + (c.h ? 0 : d), 0, N - 1); return true;
  }
  const doorR = { x: GX + N * S + 26, y: GY + 2 * S + S / 2 - 44, w: 46, h: 80 };
  const rep = makeRepeater(0.24, 0.1);
  const self = {
    done: false, door: () => doorR,
    test: () => ({ cars: cars.map(c => ({ id: c.id, h: c.h, len: c.len, x: c.x, y: c.y })), cx, cy, grab: grab ? grab.id : null, moves, exiting: exitT >= 0 }), // für Testprogramme
    update(dt) {
      t += dt;
      for (const c of cars) { c.vx += (c.x - c.vx) * Math.min(1, dt * 18); c.vy += (c.y - c.vy) * Math.min(1, dt * 18); }
      if (exitT >= 0) { // rotes Auto fährt hinaus zur Tür
        exitT += dt; const r = red(); r.x = 4 + Math.min(1, exitT / 1.2) * 2.6; r.vx = r.x;
        if (exitT > 1.5) self.done = true; return;
      }
      const d = rep(dt);
      if (d) {
        if (grab) { const along = grab.h ? d[0] : d[1]; if (along && tryMove(grab, along)) Klang.tone(180, 0.05); }
        else { cx = clamp(cx + d[0], 0, N - 1); cy = clamp(cy + d[1], 0, N - 1); }
      }
      if (pressed.action) {
        if (grab) { if (grab.x !== grabPos[0] || grab.y !== grabPos[1]) moves++; grab = null; Klang.tone(260, 0.06); }
        else { const c = carAt(cx, cy); if (c) { grab = c; grabPos = [c.x, c.y]; Klang.tone(390, 0.06); } }
      }
      const r = red();
      if (r.x === 4) { if (grab) { if (grab.x !== grabPos[0] || grab.y !== grabPos[1]) moves++; grab = null; } exitT = 0; Klang.tone(660, 0.3); }
    },
    draw(c) {
      // Parkdeck bei Nacht
      c.fillStyle = '#16171d'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#23252e'; c.fillRect(GX - 14, GY - 14, N * S + 28, N * S + 28);
      c.fillStyle = '#2d303b'; c.fillRect(GX, GY, N * S, N * S);
      c.strokeStyle = 'rgba(255,255,255,0.13)'; c.lineWidth = 2; c.setLineDash([10, 8]);
      for (let i = 1; i < N; i++) { c.beginPath(); c.moveTo(GX + i * S, GY + 4); c.lineTo(GX + i * S, GY + N * S - 4); c.stroke(); c.beginPath(); c.moveTo(GX + 4, GY + i * S); c.lineTo(GX + N * S - 4, GY + i * S); c.stroke(); }
      c.setLineDash([]);
      // Ausfahrt
      c.fillStyle = '#2d303b'; c.fillRect(GX + N * S, GY + 2 * S + 4, 40, S - 8);
      c.fillStyle = 'rgba(255,214,90,0.8)'; for (let i = 0; i < 3; i++) { const x = GX + N * S - 30 + i * 12 + (t * 20 % 12); c.beginPath(); c.moveTo(x, GY + 2 * S + S / 2 - 7); c.lineTo(x + 7, GY + 2 * S + S / 2); c.lineTo(x, GY + 2 * S + S / 2 + 7); c.fill(); }
      // Laternenlicht
      for (const [lx, ly] of [[60, 60], [60, 340], [600, 330]]) { const g = c.createRadialGradient(lx, ly, 4, lx, ly, 110); g.addColorStop(0, 'rgba(255,200,120,0.22)'); g.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = g; c.fillRect(lx - 110, ly - 110, 220, 220); c.fillStyle = '#ffd890'; c.beginPath(); c.arc(lx, ly, 4, 0, 7); c.fill(); }
      const r0 = red();
      paintDoor(c, doorR, { frame: '#5a5f73', panel: '#3a3e4d', knob: '#ffd890', light: next, glow: next, open: clamp((r0.vx - 2) / 3, 0, 1) });
      const sel = grab || carAt(cx, cy);
      for (const car of cars) {
        const x = GX + car.vx * S, y = GY + car.vy * S, w = car.h ? car.len * S : S, h = car.h ? S : car.len * S;
        c.save();
        if (car === sel && exitT < 0) { c.shadowColor = car === grab ? '#ffffff' : 'rgba(255,255,255,0.6)'; c.shadowBlur = car === grab ? 18 : 10; }
        c.fillStyle = car.col; c.beginPath(); c.roundRect(x + 5, y + 5, w - 10, h - 10, 10); c.fill(); c.restore();
        // Scheiben und Lichter
        c.fillStyle = 'rgba(20,24,36,0.65)';
        if (car.h) { c.fillRect(x + w - 22, y + 11, 8, h - 22); c.fillRect(x + 14, y + 11, 6, h - 22); }
        else { c.fillRect(x + 11, y + h - 22, w - 22, 8); c.fillRect(x + 11, y + 14, w - 22, 6); }
        c.fillStyle = car.id === 'A' ? '#fff3c4' : 'rgba(255,250,220,0.8)';
        if (car.h) { c.fillRect(x + w - 9, y + 10, 3, 6); c.fillRect(x + w - 9, y + h - 16, 3, 6); } else { c.fillRect(x + 10, y + h - 9, 6, 3); c.fillRect(x + w - 16, y + h - 9, 6, 3); }
        if (car.len === 3) { c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; c.beginPath(); if (car.h) { c.moveTo(x + S, y + 9); c.lineTo(x + S, y + h - 9); } else { c.moveTo(x + 9, y + S); c.lineTo(x + w - 9, y + S); } c.stroke(); }
        if (car.id === 'A') { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + w / 2 - 4, y + h / 2, 5, 0, 7); c.fill(); }
      }
      if (exitT < 0) {
        c.strokeStyle = grab ? '#ffffff' : '#2fd4a5'; c.lineWidth = 2.5; c.strokeRect(GX + cx * S + 2, GY + cy * S + 2, S - 4, S - 4);
        if (grab) { c.fillStyle = '#ffffff'; const mx = GX + cx * S + S / 2, my = GY + cy * S + S / 2;
          for (const s of [-1, 1]) { c.beginPath(); if (grab.h) { c.moveTo(mx + s * 22, my); c.lineTo(mx + s * 14, my - 6); c.lineTo(mx + s * 14, my + 6); } else { c.moveTo(mx, my + s * 22); c.lineTo(mx - 6, my + s * 14); c.lineTo(mx + 6, my + s * 14); } c.fill(); } }
      }
      label(c, `Züge ${moves}`, 16, 26, '#e6e8f0');
      label(c, `bestenfalls ${BEST}`, 16, 44, 'rgba(230,232,240,0.6)');
      label(c, 'Ausfahrt', doorR.x + doorR.w / 2, doorR.y - 10, 'rgba(255,214,90,0.9)', 'center', 11);
      if (exitT < 0) label(c, grab ? 'Pfeile: schieben · Leertaste: loslassen' : 'Pfeile: Feld · Leertaste: Auto greifen', W / 2, H - 12, 'rgba(230,232,240,0.75)', 'center', 12);
    }
  };
  return self;
}
