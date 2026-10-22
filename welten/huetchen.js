/* =====================================================================
   WELT – Hütchenspiel: Unter einem der Messingbecher liegt eine leuchtende Perle. Die Becher werden
   vertauscht – folge dem richtigen mit den Augen. ← → wählt einen Becher, Leertaste hebt ihn an.
   Ab Level 7 tauschen zwei Paare gleichzeitig, ab Level 9 rücken auch drei Becher im Kreis.
   ===================================================================== */
function makeHuetchen(next, level = 0) {
  const CUPS = [3, 3, 3, 4, 4, 4, 5, 5, 5, 5][level], MOVES = [3, 5, 6, 6, 7, 8, 8, 9, 10, 11][level];
  const DUR = [0.85, 0.75, 0.68, 0.62, 0.57, 0.53, 0.53, 0.5, 0.48, 0.46][level]; // Sekunden pro Zug
  const DOUBLE = [0, 0, 0, 0, 0, 0, 0.35, 0.4, 0.4, 0.45][level], CYCLE = [0, 0, 0, 0, 0, 0, 0, 0, 0.25, 0.3][level];
  const ROUNDS = level < 2 ? 2 : 3, LIVES = 3;
  const finale = makeFinale(next);
  const SP = Math.min(130, 540 / CUPS), X0 = W / 2 - SP * (CUPS - 1) / 2, CY = 268;
  const slotX = s => X0 + s * SP;
  let slotOf, ballCup, phase, timer, moves, mv, mvT, sel, picked, roundI, lives, failed, t = 0, msg = '', msgT = 0, ok = false;
  const ri = n => Math.floor(Math.random() * n);
  function shuffleArr(a) { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // Ein Zug = Liste von [vonPlatz, nachPlatz]
  function makeMove() {
    const s = shuffleArr([...Array(CUPS).keys()]), r = Math.random();
    if (CUPS >= 3 && r < CYCLE) return [[s[0], s[1]], [s[1], s[2]], [s[2], s[0]]];
    if (CUPS >= 4 && r < CYCLE + DOUBLE) return [[s[0], s[1]], [s[1], s[0]], [s[2], s[3]], [s[3], s[2]]];
    return [[s[0], s[1]], [s[1], s[0]]];
  }
  function newRound() {
    slotOf = [...Array(CUPS).keys()]; ballCup = ri(CUPS);
    moves = []; for (let i = 0; i < MOVES; i++) moves.push(makeMove());
    phase = 'show'; timer = 1.7; mv = -1; mvT = 0; sel = Math.floor(CUPS / 2); picked = -1;
  }
  function reset() { roundI = 0; lives = LIVES; failed = false; newRound(); }
  reset();
  const cupAt = s => slotOf.indexOf(s);
  // Position und Anhebung eines Bechers im aktuellen Moment
  function cupPos(cup) {
    let x = slotX(slotOf[cup]), y = CY, lift = 0, depth = 0;
    if (phase === 'shuffle' && mv >= 0 && mv < moves.length) {
      const m = moves[mv], i = m.findIndex(p => p[0] === slotOf[cup]);
      if (i >= 0) {
        const u = clamp(mvT / DUR, 0, 1), e = u * u * (3 - 2 * u), [a, b] = m[i];
        // nach rechts vorn, nach links hinten; zweiter Becher derselben Richtung mit kleinerem Bogen
        const dir = b > a ? 1 : -1, nth = m.slice(0, i).filter(q => (q[1] > q[0] ? 1 : -1) === dir).length;
        const sign = dir * (nth ? 0.5 : 1);
        x = slotX(a) + (slotX(b) - slotX(a)) * e;
        depth = Math.sin(Math.PI * e) * sign; y = CY + depth * 26;
      }
    }
    if (phase === 'show' && cup === ballCup) lift = clamp(Math.min((1.7 - timer) / 0.3, (timer - 0.2) / 0.3), 0, 1);
    if (phase === 'reveal' && (cup === picked || cup === ballCup)) lift = clamp((1.8 - timer) / 0.25, 0, 1);
    return { x, y, lift: lift * 62, depth };
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, failed, phase, sel, ballSlot: slotOf[ballCup], cups: CUPS }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { timer -= dt; if (timer <= 0 && pressed.action) { died(); reset(); } return; }
      if (phase === 'show') { timer -= dt; if (timer <= 0) { phase = 'shuffle'; mv = -1; mvT = 0.35; } }
      else if (phase === 'shuffle') {
        mvT += dt;
        if (mv < 0) { if (mvT >= 0.35) { mv = 0; mvT = 0; Klang.tone(330, 0.08); } }
        else if (mvT >= DUR + 0.05) {
          const m = moves[mv], old = slotOf.slice();
          for (const [a, b] of m) slotOf[old.indexOf(a)] = b;
          mv++; mvT = 0;
          if (mv >= moves.length) { phase = 'pick'; } else Klang.tone(300 + 30 * (mv % 4), 0.08);
        }
      } else if (phase === 'pick') {
        if (pressed.left) sel = Math.max(0, sel - 1);
        if (pressed.right) sel = Math.min(CUPS - 1, sel + 1);
        if (pressed.action) {
          picked = cupAt(sel); ok = picked === ballCup; phase = 'reveal'; timer = 1.8;
          if (ok) { Klang.tone(660, 0.3); msg = 'Gefunden!'; } else { lives--; Klang.tone(160, 0.4); msg = lives > 0 ? 'Leer! Die Perle lag woanders.' : 'Leer – keine Versuche mehr.'; }
          msgT = 1.8;
        }
      } else if (phase === 'reveal') {
        timer -= dt;
        if (timer <= 0) {
          if (ok) { roundI++; if (roundI >= ROUNDS) { finale.start(); return; } newRound(); }
          else if (lives <= 0) { failed = true; timer = 0.5; }
          else newRound();
        }
      }
    },
    draw(c) {
      // Gauklerzelt: violette Bahnen, Laternen, roter Samttisch
      c.fillStyle = '#1a0b26'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#2b1140' : '#3a1652'; c.beginPath(); c.moveTo(W / 2, -60); c.lineTo(i * 64 - 40, 200); c.lineTo(i * 64 + 24, 200); c.fill(); }
      for (let i = 0; i < 5; i++) {
        const lx = 70 + i * 125, ly = 52 + Math.sin(t * 1.3 + i) * 3;
        const g = c.createRadialGradient(lx, ly, 2, lx, ly, 46); g.addColorStop(0, 'rgba(255,190,90,0.45)'); g.addColorStop(1, 'rgba(255,190,90,0)');
        c.fillStyle = g; c.fillRect(lx - 46, ly - 46, 92, 92);
        c.fillStyle = '#ffb35a'; c.beginPath(); c.ellipse(lx, ly, 7, 10, 0, 0, 7); c.fill();
      }
      c.fillStyle = '#4a0f1e'; c.beginPath(); c.ellipse(W / 2, 300, 320, 90, 0, 0, 7); c.fill();
      c.fillStyle = '#6d1a2c'; c.beginPath(); c.ellipse(W / 2, 290, 300, 72, 0, 0, 7); c.fill();
      c.strokeStyle = '#d9a441'; c.lineWidth = 2; c.setLineDash([3, 6]); c.beginPath(); c.ellipse(W / 2, 290, 288, 64, 0, 0, 7); c.stroke(); c.setLineDash([]);
      // Perle
      const bp = cupPos(ballCup), showBall = phase === 'show' || phase === 'reveal';
      if (showBall) {
        const g = c.createRadialGradient(bp.x, CY + 4, 1, bp.x, CY + 4, 22); g.addColorStop(0, 'rgba(160,240,255,0.9)'); g.addColorStop(1, 'rgba(160,240,255,0)');
        c.fillStyle = g; c.fillRect(bp.x - 22, CY - 18, 44, 44);
        c.fillStyle = '#e8fbff'; c.beginPath(); c.arc(bp.x, CY + 4, 8, 0, 7); c.fill();
      }
      // Becher (hintere zuerst)
      const order = [...Array(CUPS).keys()].map(i => ({ i, p: cupPos(i) })).sort((a, b) => a.p.depth - b.p.depth);
      for (const { i, p } of order) {
        const x = p.x, y = p.y - p.lift, s = 1 + p.depth * 0.06;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(x, p.y + 10, 34 * s, 8, 0, 0, 7); c.fill();
        const g = c.createLinearGradient(x - 32, 0, x + 32, 0); g.addColorStop(0, '#7a4a12'); g.addColorStop(0.35, '#f2c25a'); g.addColorStop(0.6, '#c98b24'); g.addColorStop(1, '#5c360c');
        c.fillStyle = g; c.beginPath();
        c.moveTo(x - 32 * s, y + 8); c.lineTo(x - 20 * s, y - 60 * s); c.lineTo(x + 20 * s, y - 60 * s); c.lineTo(x + 32 * s, y + 8); c.closePath(); c.fill();
        c.fillStyle = '#ffe39a'; c.beginPath(); c.ellipse(x, y - 60 * s, 20 * s, 5, 0, 0, 7); c.fill();
        c.strokeStyle = '#6b3d0e'; c.lineWidth = 2;
        for (const k of [0.25, 0.7]) { const yy = y + 8 - 68 * s * k, hw = 32 * s - 12 * s * k; c.beginPath(); c.moveTo(x - hw, yy); c.lineTo(x + hw, yy); c.stroke(); }
        c.fillStyle = '#ffe9b0'; c.beginPath(); c.arc(x, y - 22 * s, 3, 0, 7); c.fill();
      }
      if (phase === 'pick') {
        const x = slotX(sel), a = 0.6 + 0.4 * Math.sin(t * 6);
        c.fillStyle = `rgba(160,240,255,${a})`; c.beginPath(); c.moveTo(x, CY - 78); c.lineTo(x - 10, CY - 94); c.lineTo(x + 10, CY - 94); c.fill();
      }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${CUPS} Becher`, 16, 26, '#f2d9a6');
      label(c, '♥'.repeat(Math.max(0, lives)), W - 16, 26, '#ff6b8a', 'right', 16);
      if (msgT > 0) label(c, msg, W / 2, 128, '#e8fbff', 'center', 15);
      else if (phase === 'show') label(c, 'Hier liegt die Perle – lass sie nicht aus den Augen!', W / 2, 128, '#f2d9a6', 'center', 13);
      else if (phase === 'shuffle') label(c, 'Folge dem Becher …', W / 2, 128, '#f2d9a6', 'center', 13);
      else if (phase === 'pick') label(c, '← → Becher wählen · Leertaste anheben', W / 2, 128, '#f2d9a6', 'center', 13);
      if (failed) { c.fillStyle = 'rgba(26,11,38,0.9)'; c.fillRect(0, 160, W, 80); label(c, 'Alle Versuche verbraucht. Leertaste: neuer Versuch', W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#f2d9a6', '#3a1652');
    }
  };
  return self;
}
