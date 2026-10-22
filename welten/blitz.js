/* =====================================================================
   WELT – Blitz: Reaktionszeit. Warte, bis das Mandala aufblüht, dann sofort drücken.
   Level 1: einfache Reaktion. Level 2: nur bei Grün drücken, bei Rot nicht (Go/No-Go).
   Level 3: Ein Pfeil zeigt, welche Taste gedrückt werden muss (Wahlreaktion).
   Level 4: dazu rote Pfeile, bei denen man nicht drücken darf. Level 5: in die Gegenrichtung drücken.
   ===================================================================== */
function makeBlitz(next, level = 0) {
  // Modus je Level: 0 einfach, 1 Go/No-Go, 2 Pfeil, 3 Pfeil mit Rot, 4 Gegenrichtung. Ab Level 6 kehren die Modi strenger wieder.
  const MODE = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4][level];
  const TRIALS = [5, 8, 8, 10, 10, 10, 12, 12, 12, 14][level], LIMIT = [420, 470, 620, 640, 720, 360, 420, 560, 590, 660][level], MAXERR = [99, 2, 2, 2, 2, 1, 1, 1, 1, 1][level];
  const NOGO = [0, 0.3, 0, 0.25, 0.2][MODE], OPP = { left: 'right', right: 'left', up: 'down', down: 'up' };
  const ARROWS = ['left', 'up', 'right', 'down'], GLYPH = { left: '←', up: '↑', right: '→', down: '↓' };
  const finale = makeFinale(next);
  let state, wait, stim, rt, times, errors, msg, msgT, t = 0, bloom = 0, result = '';
  function reset() { times = []; errors = 0; result = ''; newTrial(); }
  function newTrial() { state = 'wait'; wait = 1.1 + Math.random() * 1.9; rt = 0; stim = null; }
  function feedback(m) { msg = m; msgT = 1; }
  reset();
  const anyKey = () => pressed.action || ARROWS.some(k => pressed[k]);
  const avg = () => times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, state, stim }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; bloom = Math.max(0, bloom - dt * 1.5);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (result) { if (anyKey()) { if (result === 'fail') { died(); reset(); } } return; }
      if (state === 'wait') {
        wait -= dt;
        if (anyKey()) { feedback('Zu früh!'); if (level > 0) errors++; newTrial(); return; }
        if (wait <= 0) {
          state = 'go'; bloom = 1;
          stim = Math.random() < NOGO ? 'nogo' : MODE >= 2 ? ARROWS[Math.floor(Math.random() * 4)] : 'go';
        }
      } else if (state === 'go') {
        rt += dt;
        if (stim === 'nogo') {
          if (anyKey()) { errors++; feedback('Rot heißt: nicht drücken!'); newTrial(); }
          else if (rt > 1.0) { feedback('Gut gewartet'); newTrial(); }
        } else if (anyKey()) {
          const ok = MODE < 2 || pressed[MODE === 4 ? OPP[stim] : stim];
          if (ok) { times.push(rt * 1000); feedback(`${Math.round(rt * 1000)} ms`); }
          else { errors++; feedback('Falsche Richtung'); }
          newTrial();
        } else if (rt > 2) { errors++; feedback('Zu langsam'); newTrial(); }
        if (times.length >= TRIALS) result = avg() <= LIMIT && errors <= MAXERR ? 'win' : 'fail';
        if (errors > MAXERR && MAXERR < 99) result = 'fail';
        if (result === 'win') finale.start();
      }
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 380);
      bg.addColorStop(0, '#2a0b45'); bg.addColorStop(1, '#07010f'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const col = stim === 'nogo' ? '#ff3b4d' : '#53ffb0';
      const live = state === 'go';
      c.save(); c.translate(W / 2, H / 2 - 10); c.rotate(t * 0.1);
      for (let ring = 3; ring >= 1; ring--) {
        const n = ring * 6, r = 28 + ring * 30 + (live ? 10 : 0);
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2;
          c.save(); c.rotate(a);
          c.fillStyle = live ? col : `rgba(160,110,255,${0.12 + 0.05 * Math.sin(t * 2 + i)})`;
          c.globalAlpha = live ? 0.35 + 0.15 * ring : 1;
          c.beginPath(); c.ellipse(r, 0, 16 + ring * 2, 6, 0, 0, 7); c.fill();
          c.restore();
        }
      }
      c.globalAlpha = 1; c.fillStyle = live ? col : '#3a1d5c';
      c.beginPath(); c.arc(0, 0, 24, 0, 7); c.fill();
      c.restore();
      if (live && MODE >= 2 && stim !== 'nogo') label(c, GLYPH[stim], W / 2, H / 2 + 2, '#07010f', 'center', 30);
      if (bloom > 0) { c.fillStyle = `rgba(255,255,255,${bloom * 0.08})`; c.fillRect(0, 0, W, H); }
      label(c, `Versuch ${Math.min(times.length + 1, TRIALS)} / ${TRIALS}`, 16, 26, '#d7c4ff');
      label(c, `Schnitt ${avg() || '–'} ms · Ziel unter ${LIMIT} ms`, W - 16, 26, '#d7c4ff', 'right');
      if (MAXERR < 99) label(c, `Fehler ${errors} / ${MAXERR}`, W - 16, 44, errors ? '#ff9db0' : '#d7c4ff', 'right');
      times.forEach((ms, i) => { const x = 40 + i * 70; c.fillStyle = ms <= LIMIT ? '#53ffb0' : '#ffb35a'; c.fillRect(x, H - 40, 50 * Math.min(1, ms / 800), 6); label(c, `${Math.round(ms)}`, x, H - 48, '#a990d8', 'left', 10); });
      if (msgT > 0) label(c, msg, W / 2, H / 2 + 120, '#ffffff', 'center', 16);
      else if (state === 'wait' && !result) label(c, MODE === 1 ? 'Warte … bei Grün drücken, bei Rot nicht' : MODE === 2 ? 'Warte … dann die Pfeiltaste in Pfeilrichtung' : MODE === 3 ? 'Pfeilrichtung drücken, bei Rot stillhalten' : MODE === 4 ? 'Gegenrichtung drücken! Bei Rot stillhalten' : 'Warte … drück sofort, wenn es aufblüht', W / 2, H / 2 + 120, '#a990d8', 'center');
      if (result === 'fail') label(c, `Nicht geschafft (Schnitt ${avg()} ms, ${errors} Fehler). Taste: neuer Versuch`, W / 2, H / 2 + 146, '#ff9db0', 'center');
      finale.draw(c, '#d7c4ff', '#2a0b45');
    }
  };
  return self;
}
