/* =====================================================================
   WELT – Farbfolge: Vier Lotusblätter leuchten in einer Folge auf. Spiel sie mit den Pfeiltasten nach.
   Jede gelungene Runde wird die Folge um einen Ton länger.
   ===================================================================== */
function makeFarbfolge(next, level = 0) {
  const GOAL = [6, 8, 10, 12, 14, 15, 16, 17, 18, 20][level], STEP = [0.62, 0.5, 0.4, 0.36, 0.32, 0.3, 0.28, 0.26, 0.25, 0.24][level], LIVES = 3;
  const PET = [
    { key: 'up', col: '#ff4fd8', f: 293.7 }, { key: 'right', col: '#ffd23f', f: 349.2 },
    { key: 'down', col: '#3fe0ff', f: 440 }, { key: 'left', col: '#8cff5a', f: 523.3 }
  ];
  const finale = makeFinale(next);
  let seq, pos, phase, timer, lit, lives, t = 0, msg = '', msgT = 0;
  function grow() { seq.push(Math.floor(Math.random() * 4)); }
  function play() { phase = 'show'; pos = 0; timer = 0.7; lit = -1; }
  function reset() { seq = []; for (let i = 0; i < 3; i++) grow(); lives = LIVES; play(); }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, seq, phase, pos, keyOf: i => PET[i].key }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'show') {
        timer -= dt;
        if (timer <= 0) {
          if (lit >= 0) { lit = -1; timer = STEP * 0.35; pos++; return; }
          if (pos >= seq.length) { phase = 'input'; pos = 0; return; }
          lit = seq[pos]; timer = STEP; Klang.tone(PET[lit].f, STEP * 1.6);
        }
      } else if (phase === 'input') {
        if (timer > 0) { timer -= dt; if (timer <= 0) lit = -1; }
        const k = PET.findIndex(p => pressed[p.key]);
        if (k < 0) return;
        lit = k; timer = 0.25; Klang.tone(PET[k].f, 0.5);
        if (k !== seq[pos]) {
          lives--; msg = lives > 0 ? 'Falsch. Die Folge kommt noch einmal.' : 'Keine Versuche mehr. Von vorn.'; msgT = 1.6;
          if (lives <= 0) { died(); reset(); } else play();
          timer = 1.2; return;
        }
        pos++;
        if (pos >= seq.length) {
          if (seq.length >= GOAL) { finale.start(); return; }
          msg = 'Richtig!'; msgT = 0.9; grow(); play(); timer = 1.1;
        }
      }
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 380);
      bg.addColorStop(0, '#1d0e33'); bg.addColorStop(1, '#05030b'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, H / 2);
      c.strokeStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.beginPath(); c.ellipse(90, 0, 90, 30, 0, 0, 7); c.stroke(); }
      PET.forEach((p, i) => {
        const a = -Math.PI / 2 + i * Math.PI / 2, on = lit === i;
        c.save(); c.rotate(a);
        c.shadowColor = p.col; c.shadowBlur = on ? 40 : 0;
        c.fillStyle = p.col; c.globalAlpha = on ? 1 : 0.22;
        c.beginPath(); c.moveTo(30, 0); c.quadraticCurveTo(95, -70, 160, 0); c.quadraticCurveTo(95, 70, 30, 0); c.fill();
        c.restore();
      });
      c.globalAlpha = 1; c.fillStyle = '#f6e9ff'; c.beginPath(); c.arc(0, 0, 18 + Math.sin(t * 2) * 2, 0, 7); c.fill();
      c.restore();
      label(c, `Folge ${seq.length} / ${GOAL}`, 16, 26, '#f6e9ff');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff4fd8', 'right', 16);
      const hint = phase === 'show' ? 'Schau zu und hör hin …' : `Du bist dran: ${pos} / ${seq.length}`;
      label(c, msgT > 0 ? msg : hint, W / 2, H - 20, '#c9b6ff', 'center');
      finale.draw(c, '#f6e9ff', '#1d0e33');
    }
  };
  return self;
}
