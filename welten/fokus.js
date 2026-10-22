/* =====================================================================
   WELT – Fokus: Stroop-Test. Ein Farbwort steht in einer anderen Farbe. Wähle die Farbe der Schrift.
   Level 3: Steht das Wort in einem goldenen Rahmen, zählt stattdessen die Bedeutung des Wortes.
   ===================================================================== */
function makeFokus(next, level = 0) {
  const NEED = [12, 15, 15, 18, 20, 22, 22, 24, 25, 26][level], TIME = [40, 40, 45, 45, 45, 45, 44, 44, 43, 42][level], INCONG = [0.5, 0.8, 0.75, 0.8, 0.85, 0.85, 0.85, 0.85, 0.9, 0.9][level], SWITCH = [0, 0, 0.4, 0.5, 0.5, 0.5, 0.55, 0.55, 0.6, 0.6][level];
  const COLORS = [
    { name: 'ROT', col: '#ff4a4a', key: 'left' }, { name: 'BLAU', col: '#4a86ff', key: 'up' },
    { name: 'GRÜN', col: '#3fd46e', key: 'right' }, { name: 'GELB', col: '#ffd23f', key: 'down' }
  ];
  const POS = { left: [-1, 0], up: [0, -1], right: [1, 0], down: [0, 1] };
  const finale = makeFinale(next);
  let word, ink, byMeaning, score, timeLeft, started, failed, flash, flashCol, t = 0;
  function round() {
    word = Math.floor(Math.random() * 4);
    ink = Math.random() < INCONG ? (word + 1 + Math.floor(Math.random() * 3)) % 4 : word;
    byMeaning = Math.random() < SWITCH;
  }
  function reset() { score = 0; timeLeft = TIME; started = false; failed = false; flash = 0; round(); }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, answerKey: COLORS[byMeaning ? word : ink].key }), // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt * 3);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { if (pressed.action || dirOf(pressed)) { died(); reset(); } return; }
      const chosen = COLORS.findIndex(cl => pressed[cl.key]);
      if (chosen < 0) { if (started) timeLeft -= dt; if (timeLeft <= 0) failed = true; return; }
      started = true;
      const right = byMeaning ? word : ink;
      if (chosen === right) { score++; flash = 1; flashCol = '#ffffff'; } else { timeLeft -= 3; flash = 1; flashCol = '#ff4a4a'; }
      if (score >= NEED) finale.start(); else round();
    },
    draw(c) {
      c.fillStyle = '#0a0a0a'; c.fillRect(0, 0, W, H);
      // Op-Art: schwarz-weiße Ringe, die sich langsam verschieben
      for (let i = 22; i > 0; i--) { c.fillStyle = i % 2 ? '#141414' : '#0a0a0a'; c.beginPath(); c.arc(W / 2 + Math.sin(t * 0.3) * 20, H / 2 + Math.cos(t * 0.23) * 14, i * 20 + (t * 12) % 20, 0, 7); c.fill(); }
      if (byMeaning) { c.strokeStyle = '#d4af37'; c.lineWidth = 4; c.setLineDash([10, 6]); c.strokeRect(W / 2 - 150, H / 2 - 55, 300, 90); c.setLineDash([]); }
      c.font = '52px Bungee, "Arial Black", sans-serif'; c.textAlign = 'center'; c.fillStyle = COLORS[ink].col;
      c.fillText(COLORS[word].name, W / 2, H / 2 + 8); c.textAlign = 'left';
      for (const cl of COLORS) {
        const [dx, dy] = POS[cl.key], x = W / 2 + dx * 230, y = H / 2 - 10 + dy * 140;
        c.fillStyle = cl.col; c.beginPath(); c.arc(x, y, 18, 0, 7); c.fill();
        label(c, { left: '←', up: '↑', right: '→', down: '↓' }[cl.key], x + dx * 34, y + 5 + dy * 32, '#bbbbbb', 'center', 13);
      }
      label(c, level >= 2 ? 'Farbe der Schrift wählen · goldener Rahmen: Bedeutung des Wortes' : 'Wähle die Farbe der Schrift, nicht das Wort', W / 2, H - 34, '#9a9a9a', 'center');
      label(c, `Richtig ${score} / ${NEED}`, 16, 26, '#eeeeee');
      label(c, started ? `${Math.ceil(Math.max(0, timeLeft))} s` : 'Die Zeit läuft ab der ersten Antwort', W - 16, 26, '#eeeeee', 'right');
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, H - 16, W - 32, 5);
      c.fillStyle = timeLeft < 10 ? '#ff4a4a' : '#eeeeee'; c.fillRect(16, H - 16, (W - 32) * clamp(timeLeft / TIME, 0, 1), 5);
      if (flash > 0) { c.fillStyle = flashCol; c.globalAlpha = flash * 0.12; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      if (failed) { c.fillStyle = 'rgba(10,10,10,0.9)'; c.fillRect(0, 160, W, 80); label(c, `Zeit abgelaufen: ${score} von ${NEED}. Taste: neuer Versuch`, W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#eeeeee', '#141414');
    }
  };
  return self;
}
