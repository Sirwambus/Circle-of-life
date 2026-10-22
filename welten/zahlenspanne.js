/* =====================================================================
   WELT – Zahlenspanne: Ziffern erscheinen nacheinander im Kerzenlicht. Gib sie danach in derselben
   Reihenfolge ein: ← → wählt eine Ziffer auf dem Ring, Leertaste setzt sie.
   ===================================================================== */
function makeZahlenspanne(next, level = 0) {
  // Ab Level 7 wird rückwärts eingegeben
  const SPAN = [4, 5, 6, 7, 8, 9, 6, 7, 8, 9][level], SHOW = [0.95, 0.85, 0.8, 0.75, 0.7, 0.68, 0.8, 0.75, 0.7, 0.66][level], REV = level >= 6, ROUNDS = 3, LIVES = 3;
  const finale = makeFinale(next);
  let seq, phase, timer, shown, typed, sel, roundI, lives, t = 0, msg = '', msgT = 0;
  const rep = makeRepeater(0.25, 0.1);
  function newRound() { seq = Array.from({ length: SPAN }, () => Math.floor(Math.random() * 10)); phase = 'show'; timer = 0.9; shown = -1; typed = []; }
  function reset() { roundI = 0; lives = LIVES; sel = 0; newRound(); }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, seq, phase, typed, sel }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') {
        timer -= dt;
        if (timer <= 0) { shown++; timer = SHOW; if (shown < seq.length) Klang.tone(260 + seq[shown] * 30, 0.4); else phase = 'input'; }
      } else if (phase === 'input') {
        const d = rep(dt); if (d && d[0]) sel = (sel + d[0] + 10) % 10;
        if (pressed.action) {
          typed.push(sel); Klang.tone(260 + sel * 30, 0.3);
          const want = REV ? seq[seq.length - typed.length] : seq[typed.length - 1];
          if (sel !== want) { lives--; msg = lives > 0 ? `Falsch, richtig war ${seq.join(' ')}` : 'Keine Versuche mehr. Von vorn.'; msgT = 2; phase = 'wait'; timer = 2; }
          else if (typed.length === seq.length) { roundI++; if (roundI >= ROUNDS) { finale.start(); return; } msg = 'Richtig!'; msgT = 1.2; phase = 'wait'; timer = 1.2; }
        }
      } else if (phase === 'wait') { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else newRound(); } }
    },
    draw(c) {
      c.fillStyle = '#120a06'; c.fillRect(0, 0, W, H);
      const glow = c.createRadialGradient(W / 2, 150, 10, W / 2, 150, 260); glow.addColorStop(0, 'rgba(255,170,80,0.35)'); glow.addColorStop(1, 'rgba(255,170,80,0)');
      c.fillStyle = glow; c.fillRect(0, 0, W, H);
      // Kerze
      c.fillStyle = '#efe2c4'; c.fillRect(W / 2 - 8, 250, 16, 60);
      c.fillStyle = '#ffcf6b'; c.beginPath(); c.ellipse(W / 2, 238 + Math.sin(t * 9) * 1.5, 5, 11, Math.sin(t * 5) * 0.1, 0, 7); c.fill();
      if (phase === 'show' && shown >= 0 && shown < seq.length) {
        c.save(); c.shadowColor = '#ffb050'; c.shadowBlur = 30; label(c, String(seq[shown]), W / 2, 170, '#fff3d6', 'center', 72); c.restore();
      }
      if (phase !== 'show') {
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i - sel) * Math.PI / 5 + Math.PI / 2 * 0, x = W / 2 + Math.cos(-Math.PI / 2 + i * Math.PI / 5) * 120, y = 175 + Math.sin(-Math.PI / 2 + i * Math.PI / 5) * 120;
          const on = i === sel;
          c.fillStyle = on ? '#ffcf6b' : 'rgba(255,207,107,0.15)'; c.beginPath(); c.arc(x, y, on ? 22 : 17, 0, 7); c.fill();
          label(c, String(i), x, y + 6, on ? '#120a06' : '#ffdca0', 'center', on ? 18 : 15);
        }
        label(c, typed.map(String).join(' ') + (phase === 'input' ? ' _' : ''), W / 2, 372, '#fff3d6', 'center', 20);
      }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${SPAN} Ziffern${REV ? ' · rückwärts!' : ''}`, 16, 26, '#ffdca0');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff7a5a', 'right', 16);
      if (msgT > 0) label(c, msg, W / 2, 46, '#fff3d6', 'center', 14);
      else if (phase === 'show') label(c, 'Merk dir die Ziffern …', W / 2, 46, '#ffdca0', 'center');
      else if (phase === 'input') label(c, REV ? 'Rückwärts eingeben! ← → wählen · Leertaste setzen' : '← → Ziffer wählen · Leertaste setzen', W / 2, 46, '#ffdca0', 'center');
      finale.draw(c, '#ffdca0', '#2a1608');
    }
  };
  return self;
}
