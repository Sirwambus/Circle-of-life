/* =====================================================================
   WELT – Eisbahn: Auf Eis rutschst du, bis dich etwas aufhält. Schnee bremst, Wasserlöcher (ab Level 8) schicken dich zurück.
   ===================================================================== */
function makeEisbahn(next, level = 0) {
  // Kürzeste Lösungen (per Suche geprüft): Level 1: 10 Züge, Level 2: 13, Level 3: 19, Level 4: 24, Level 5: 29,
  // Level 6: 33, Level 7: 38, Level 8: 42, Level 9: 45, Level 10: 52. Ab Level 6 per Generator erzeugt: größere Flächen,
  // ohne Sackgassen (von jedem erreichbaren Feld aus bleibt die Tür erreichbar); ab Level 8 Wasserlöcher 'w'.
  const MAP = [[
    '################',
    '#P     #       #',
    '#      s    #  #',
    '#   #          #',
    '#         #    #',
    '##     s     # #',
    '#    #     #s  D',
    '#  #           #',
    '#        #    s#',
    '################'
  ], [
    '################',
    '#P #           #',
    '#   # s s s  ###',
    '#      ###     #',
    '#  # s#  #    ##',
    '#              D',
    '#     #   s   s#',
    '##  # s        #',
    '#        #     #',
    '################'
  ], [
    '################',
    '#P  ##s     #  #',
    '##        #    #',
    '# #         s  #',
    '#    s#   #    #',
    '#          #   #',
    '#  #   #  #  s #',
    '##        #    D',
    '#     #  ###   #',
    '################'
  ], [
    '################',
    '#P   ##  #  #  #',
    '#   # #   s #  D',
    '###     #  # # #',
    '#      #  #    #',
    '#   #         ##',
    '#   s          #',
    '#        #     #',
    '#         #    #',
    '################'
  ], [
    '################',
    '#P #  s #      #',
    '##    #       ##',
    '#  s  #  s    ##',
    '#       #  #   D',
    '##       #  #  #',
    '#    #       # #',
    '#  #   #   s# ##',
    '#       #     ##',
    '################'
  ], [
    '##################',
    '#P   #      #s # #',
    '##  s#     #     #',
    '##  #  ##     #  #',
    '### ## #    #    #',
    '##   s s##  s  ###',
    '#  #       #    ##',
    '#   #       #  s##',
    '# # #s  # #      D',
    '##        #    # #',
    '##################'
  ], [
    '####################',
    '#P ## #  #  #   #  #',
    '#     #s       ##s D',
    '# #    #        #  #',
    '#    s # # # s  s s#',
    '# #  ##   #s #    ##',
    '#  # s     # #     #',
    '##      ###  s  #s##',
    '#  #    ##  #    # #',
    '# # #    s   #  # ##',
    '##    #  #        ##',
    '####################'
  ], [
    '####################',
    '#P  w #w   # s##  ##',
    '#    #  #  s  #  # D',
    '#  s   w   ##  #   #',
    '##    ##  s    ss ##',
    '#   ###  ## #      #',
    '#  # s   s #  # ##s#',
    '##   ##  w w#w #   #',
    '#w# w   #  #   ## ##',
    '# s  w  ##      s  #',
    '##          s#  #  #',
    '####################'
  ], [
    '######################',
    '#P ## #  # s #  ## s #',
    '#      #  #  w      ##',
    '# #  #s #    s #   # D',
    '# w #  w#  # #    #  #',
    '# # #    #     ##    #',
    '# # w s##    # # sws##',
    '### w#    # ##  #  s##',
    '#  #         #    #s##',
    '#  #s   #s#w   s     #',
    '###   s  w    w      #',
    '##  # s    w# #  s#  #',
    '######################'
  ], [
    '########################',
    '#P   ###  ## s  ##     #',
    '# s #   #       ##     #',
    '##w        #     s ##  #',
    '# # ##    # s   #      D',
    '###   s #  s##   #  sw #',
    '# #s## #s     ww# ##   #',
    '#    #    #s # ##s #   #',
    '#      # #    #        #',
    '#     #w #      #   ## #',
    '#   # w     w ##  #  ###',
    '#  #w# #s ##w   s wsw# #',
    '# s     #    s s   #w# #',
    '########################'
  ]][level];
  // Gezeichnet wird in 40er-Zellen; größere Karten werden passend verkleinert.
  const S = 40, COLS = MAP[0].length, ROWS = MAP.length, K = Math.min(W / (COLS * S), H / (ROWS * S));
  const OX = (W - COLS * S * K) / 2, OY = (H - ROWS * S * K) / 2, WATER = MAP.some(r => r.includes('w'));
  let pos, from, to, prog = 1, dist = 1, moves = 0, t = 0, face = [1, 0], sink = 0, start;
  MAP.forEach((r, y) => { const x = r.indexOf('P'); if (x >= 0) start = { x, y }; });
  pos = { ...start }; from = { ...pos }; to = { ...pos };
  const cell = (x, y) => MAP[y][x];
  const flakes = Array.from({ length: 50 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() }));
  const door40 = () => { const y = MAP.findIndex(r => r.includes('D')), d = { x: MAP[y].indexOf('D'), y }; return { x: d.x * S + 4, y: d.y * S - 14, w: 32, h: 54 }; };
  function slide(dx, dy) {
    face = [dx, dy];
    let x = pos.x, y = pos.y;
    for (;;) {
      const c = cell(x + dx, y + dy);
      if (c === '#') break;
      x += dx; y += dy;
      if (c === 'D' || c === 's' || c === 'w') break;
    }
    if (x === pos.x && y === pos.y) return;
    from = { ...pos }; to = { x, y }; dist = Math.abs(x - pos.x) + Math.abs(y - pos.y); prog = 0; pos = { x, y }; moves++;
  }
  const self = {
    done: false,
    door: () => { const d = door40(); return { x: OX + d.x * K, y: OY + d.y * K, w: d.w * K, h: d.h * K }; },
    test: () => ({ x: pos.x, y: pos.y, moves, sliding: prog < 1, sinking: sink > 0 }), // für Testprogramme
    update(dt) {
      t += dt;
      for (const f of flakes) { f.y += 20 * f.s * dt; f.x += Math.sin(t + f.y * 0.05) * 10 * dt; if (f.y > H) { f.y = -4; f.x = Math.random() * W; } }
      if (sink > 0) { // eingebrochen: kurz zappeln lassen, dann zurück zum Start
        sink += dt;
        if (sink > 1.2) { died(); sink = 0; pos = { ...start }; from = { ...pos }; to = { ...pos }; moves = 0; face = [1, 0]; }
        return;
      }
      if (prog < 1) {
        prog = Math.min(1, prog + dt * 10 / dist);
        if (prog >= 1 && cell(pos.x, pos.y) === 'D') self.done = true;
        if (prog >= 1 && cell(pos.x, pos.y) === 'w') { sink = 0.001; Klang.tone(150, 0.3); }
        return;
      }
      const d = dirOf(pressed); if (d) slide(...d);
    },
    draw(c) {
      if (K < 1) { c.fillStyle = '#6e8499'; c.fillRect(0, 0, W, H); }
      c.save(); c.translate(OX, OY); c.scale(K, K);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const ch = MAP[y][x], px = x * S, py = y * S;
        c.fillStyle = (x + y) % 2 ? '#d6eefc' : '#cde8f9'; c.fillRect(px, py, S, S);
        if (ch === ' ' || ch === 'P') {
          c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1;
          if ((x * 7 + y * 3) % 4 === 0) { c.beginPath(); c.moveTo(px + 6, py + 30); c.lineTo(px + 22, py + 14); c.stroke(); }
        } else if (ch === 's') {
          c.fillStyle = '#ffffff'; c.fillRect(px + 2, py + 2, S - 4, S - 4);
          c.fillStyle = '#e6f2fb'; for (const [a, b] of [[10, 12], [26, 20], [16, 30]]) { c.beginPath(); c.arc(px + a, py + b, 4, 0, 7); c.fill(); }
        } else if (ch === 'w') { // Wasserloch mit Eisrand
          c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(px + 20, py + 21, 17, 14, 0, 0, 7); c.fill();
          c.fillStyle = '#1f5d8c'; c.beginPath(); c.ellipse(px + 20, py + 21, 14, 11, 0, 0, 7); c.fill();
          c.strokeStyle = 'rgba(160,215,250,0.7)'; c.lineWidth = 1.5;
          c.beginPath(); c.ellipse(px + 20, py + 21, 5 + 4 * ((t + x * 0.3) % 1), 3 + 3 * ((t + x * 0.3) % 1), 0, 0, 7); c.stroke();
        }
      }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        if (MAP[y][x] !== '#') continue;
        const px = x * S, py = y * S;
        c.fillStyle = '#6e8499'; c.beginPath(); c.roundRect(px + 2, py + 4, S - 4, S - 4, 8); c.fill();
        c.fillStyle = '#8aa0b4'; c.beginPath(); c.roundRect(px + 4, py + 4, S - 10, S - 14, 6); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(px + S / 2, py + 7, 15, 5, 0, 0, 7); c.fill();
      }
      const dr = door40();
      const k = 1 - Math.pow(1 - prog, 2);
      const vx = (from.x + (to.x - from.x) * k) * S + 20, vy = (from.y + (to.y - from.y) * k) * S + 20;
      paintDoor(c, dr, { frame: '#4f6b86', panel: '#a9d4f0', knob: '#ffffff', light: next, open: doorOpenness({ x: vx - 10, y: vy - 10, w: 20, h: 20 }, dr, 120) });
      // Pinguin (beim Einbrechen sinkt er ins Loch)
      if (sink > 0) { c.save(); c.beginPath(); c.rect(vx - 20, vy - 30, 40, 30 + 10 * (1 - Math.min(1, sink * 1.5))); c.clip(); c.translate(0, Math.min(1, sink * 1.2) * 22 + Math.sin(sink * 30) * 1.5); }
      c.fillStyle = 'rgba(40,80,120,0.2)'; c.beginPath(); c.ellipse(vx, vy + 14, 12, 4, 0, 0, 7); c.fill();
      c.fillStyle = '#1d2433'; c.beginPath(); c.ellipse(vx, vy, 12, 15, 0, 0, 7); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(vx + face[0] * 3, vy + 3, 8, 10, 0, 0, 7); c.fill();
      c.fillStyle = '#ff9f2e'; c.beginPath(); c.moveTo(vx + face[0] * 10, vy - 6 + face[1] * 4); c.lineTo(vx + face[0] * 4 - 3, vy - 8); c.lineTo(vx + face[0] * 4 + 3, vy - 4); c.fill();
      c.fillRect(vx - 7, vy + 13, 5, 3); c.fillRect(vx + 2, vy + 13, 5, 3);
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(vx - 4 + face[0] * 3, vy - 8, 2.5, 0, 7); c.arc(vx + 4 + face[0] * 3, vy - 8, 2.5, 0, 7); c.fill();
      c.fillStyle = '#1d2433'; c.fillRect(vx - 4 + face[0] * 4, vy - 9, 1.5, 2); c.fillRect(vx + 4 + face[0] * 4, vy - 9, 1.5, 2);
      if (sink > 0) c.restore();
      c.restore();
      c.fillStyle = 'rgba(255,255,255,0.85)'; for (const f of flakes) c.fillRect(f.x, f.y, 2 * f.s, 2 * f.s);
      label(c, `Rutschzüge ${moves}   ·   Schnee bremst${WATER ? '   ·   Wasserlöcher meiden!' : ''}`, 12, K < 1 ? OY + 24 * K : 26, '#1d3550');
      if (sink > 0) label(c, 'Eingebrochen! Zurück zum Start …', W / 2, H / 2, '#1d3550', 'center', 16);
    }
  };
  return self;
}
