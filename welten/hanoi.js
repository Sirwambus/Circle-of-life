/* =====================================================================
   WELT – Hanoi: Bring den ganzen Scheibenturm auf den rechten Stab. Nie eine größere Scheibe
   auf eine kleinere legen. ← → Stab wählen, Leertaste Scheibe nehmen / ablegen.
   ===================================================================== */
function makeHanoi(next, level = 0) {
  // Kürzeste Lösungen (per Breitensuche geprüft): 7, 15, 15, 31, 26, 13, 63, 17, 25, 33 Züge
  const N = [3, 4, 4, 5, 3, 5, 6, 6, 7, 8][level], P = [3, 3, 3, 3, 3, 4, 3, 4, 4, 4][level];
  const ADJ = level === 4, LIMIT = [0, 0, 20, 38, 32, 17, 72, 21, 29, 37][level], BEST = [7, 15, 15, 31, 26, 13, 63, 17, 25, 33][level];
  const finale = makeFinale(next);
  const GAP = P === 3 ? 200 : 150, X0 = W / 2 - GAP * (P - 1) / 2, BASE = 330, DH = N > 6 ? 17 : 20;
  const MAXW = GAP - 18, MINW = 34;
  const pegX = i => X0 + i * GAP, discW = s => MINW + (MAXW - MINW) * (s - 1) / Math.max(1, N - 1);
  const hue = s => 40 + (s - 1) * 300 / N;
  let pegs, sel, held, from, moves, fail, failT, shake, t = 0, msg = '', msgT = 0, solvedT = -1;
  const anim = {}; // Scheibe -> {x, y} für weiche Bewegung
  function reset() {
    pegs = Array.from({ length: P }, (_, i) => i ? [] : Array.from({ length: N }, (_, k) => N - k));
    sel = 0; held = 0; from = 0; moves = 0; fail = false; failT = 0; shake = 0; solvedT = -1;
    for (let s = 1; s <= N; s++) delete anim[s];
  }
  reset();
  const rest = (p, h) => ({ x: pegX(p), y: BASE - (h + 1) * DH });
  function act() {
    if (!held) {
      if (!pegs[sel].length) { shake = 0.3; return; }
      held = pegs[sel].pop(); from = sel; Klang.tone(300 + held * 40, 0.12);
      return;
    }
    const top = pegs[sel][pegs[sel].length - 1];
    if (top && top < held) { shake = 0.35; msg = 'Nie größer auf kleiner!'; msgT = 1.4; Klang.tone(140, 0.2); return; }
    if (ADJ && Math.abs(sel - from) > 1) { shake = 0.35; msg = 'Nur auf den Nachbarstab!'; msgT = 1.4; Klang.tone(140, 0.2); return; }
    pegs[sel].push(held); Klang.tone(260 + held * 40, 0.15);
    if (sel !== from) moves++;
    held = 0;
    if (pegs[P - 1].length === N) { solvedT = 0; return; }
    if (LIMIT && moves >= LIMIT) { fail = true; failT = 0; }
  }
  const rep = makeRepeater(0.3, 0.16);
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ pegs: pegs.map(p => p.slice()), sel, held, from, moves, fail, fin: finale.active, solved: solvedT >= 0, N, P, ADJ, LIMIT }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; shake = Math.max(0, shake - dt);
      // Animation der Scheiben
      pegs.forEach((p, i) => p.forEach((s, h) => { const r = rest(i, h), a = anim[s] || (anim[s] = { ...r }); a.x += (r.x - a.x) * Math.min(1, dt * 16); a.y += (r.y - a.y) * Math.min(1, dt * 16); }));
      if (held) { const a = anim[held] || (anim[held] = rest(sel, 0)); const tx = pegX(sel), ty = BASE - (N + 2.2) * DH - 6 + Math.sin(t * 4) * 3; a.x += (tx - a.x) * Math.min(1, dt * 18); a.y += (ty - a.y) * Math.min(1, dt * 18); }
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (solvedT >= 0) { solvedT += dt; if (solvedT > 1) finale.start(); return; }
      if (fail) { failT += dt; if (failT > 0.5 && pressed.action) { died(); reset(); } return; }
      const d = rep(dt);
      if (d && d[0]) sel = (sel + d[0] + P) % P;
      if (pressed.action || (pressed.up && !held) || (pressed.down && held)) act();
    },
    draw(c) {
      // Abendhimmel über dem Tempelberg
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1c1036'); sky.addColorStop(0.55, '#7a2f55'); sky.addColorStop(1, '#f08a4b');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,214,140,0.9)'; c.beginPath(); c.arc(W / 2, 250, 120, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,240,200,0.25)'; for (let i = 0; i < 5; i++) c.fillRect(W / 2 - 130, 170 + i * 26, 260, 4);
      c.fillStyle = '#2a1430';
      c.beginPath(); c.moveTo(0, 300); c.lineTo(90, 230); c.lineTo(160, 280); c.lineTo(250, 250); c.lineTo(390, 285); c.lineTo(500, 220); c.lineTo(640, 290); c.lineTo(640, 400); c.lineTo(0, 400); c.fill();
      for (const [x, s] of [[70, 1], [565, 0.8]]) { // Stupas
        c.fillStyle = '#1c0d22'; c.beginPath(); c.arc(x, 250, 22 * s, Math.PI, 0); c.fill(); c.fillRect(x - 30 * s, 250, 60 * s, 10);
        c.fillRect(x - 3, 250 - 44 * s, 6, 22 * s); c.beginPath(); c.arc(x, 250 - 46 * s, 5 * s, 0, 7); c.fill();
      }
      // Sockel und Stäbe
      c.fillStyle = '#3d2238'; c.beginPath(); c.roundRect(X0 - GAP / 2 + 6, BASE, GAP * P - 12, 18, 6); c.fill();
      c.fillStyle = '#5a3550'; c.fillRect(X0 - GAP / 2 + 12, BASE, GAP * P - 24, 4);
      for (let i = 0; i < P; i++) {
        const x = pegX(i), on = i === sel && !finale.active;
        if (on) { const g = c.createRadialGradient(x, BASE - 60, 4, x, BASE - 60, 110); g.addColorStop(0, 'rgba(255,230,160,0.35)'); g.addColorStop(1, 'rgba(255,230,160,0)'); c.fillStyle = g; c.fillRect(x - 110, BASE - 170, 220, 190); }
        c.fillStyle = on ? '#ffd27a' : '#c99a5a'; c.beginPath(); c.roundRect(x - 4, BASE - (N + 1) * DH - 8, 8, (N + 1) * DH + 8, 4); c.fill();
        if (i === P - 1) { c.fillStyle = next; c.beginPath(); c.arc(x, BASE - (N + 1) * DH - 12, 6, 0, 7); c.fill(); }
        if (ADJ && i < P - 1) { c.strokeStyle = 'rgba(255,220,170,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 20, BASE + 30); c.lineTo(pegX(i + 1) - 20, BASE + 30); c.stroke(); }
      }
      const sx = shake > 0 ? Math.sin(shake * 60) * 4 : 0;
      const drawDisc = (s, a, glow) => {
        const w = discW(s), x = a.x + (s === held ? sx : 0);
        c.save();
        if (glow || solvedT >= 0) { c.shadowColor = `hsl(${hue(s)},90%,70%)`; c.shadowBlur = 14; }
        c.fillStyle = `hsl(${hue(s)},70%,${48 + (solvedT >= 0 ? 12 * Math.sin(t * 6 + s) : 0)}%)`; c.beginPath(); c.roundRect(x - w / 2, a.y, w, DH - 2, 7); c.fill();
        c.restore();
        c.fillStyle = `hsla(${hue(s)},90%,80%,0.6)`; c.fillRect(x - w / 2 + 6, a.y + 3, w - 12, 3);
      };
      for (let s = N; s >= 1; s--) if (s !== held && anim[s]) drawDisc(s, anim[s], false);
      if (held && anim[held]) drawDisc(held, anim[held], true);
      // Zeiger unter dem gewählten Stab
      if (!finale.active) { c.fillStyle = '#ffe2a8'; const x = pegX(sel); c.beginPath(); c.moveTo(x, BASE + 22); c.lineTo(x - 9, BASE + 36); c.lineTo(x + 9, BASE + 36); c.fill(); }
      label(c, `Züge ${moves}${LIMIT ? ' / ' + LIMIT : ''}   ·   ${N} Scheiben${P === 4 ? ' · 4 Stäbe' : ''}${ADJ ? ' · nur Nachbarstab' : ''}`, 16, 26, '#ffe2c4');
      label(c, `bestenfalls ${BEST}`, W - 16, 26, 'rgba(255,226,196,0.7)', 'right');
      if (fail) { c.fillStyle = 'rgba(20,6,20,0.6)'; c.fillRect(0, 150, W, 70); label(c, 'Zuglimit erreicht. Leertaste: noch einmal', W / 2, 192, '#ffe2c4', 'center', 16); }
      else if (msgT > 0) label(c, msg, W / 2, 56, '#fff0d8', 'center', 14);
      else if (!finale.active) label(c, held ? '← → Stab wählen · Leertaste ablegen' : '← → Stab wählen · Leertaste Scheibe nehmen', W / 2, 56, 'rgba(255,226,196,0.8)', 'center');
      finale.draw(c, '#ffd27a', '#3d2238');
    }
  };
  return self;
}
