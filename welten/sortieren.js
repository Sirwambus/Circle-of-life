/* =====================================================================
   WELT – Sortieren: Wirf jedes Ding so schnell wie möglich in die richtige Schale.
   Level 1: warme oder kalte Farbe. 2: rund oder eckig. 3: gerade oder ungerade Zahl.
   4: Der Rahmen sagt, ob Farbe oder Form zählt. 5: drei Schalen nach Form.
   ===================================================================== */
function makeSortieren(next, level = 0) {
  // Ab Level 6 kehren die Regeln schneller wieder
  const MODE = [0, 1, 2, 3, 4, 3, 4, 2, 3, 4][level], NEED = [12, 15, 18, 20, 22, 24, 24, 26, 26, 28][level], TIME = [40, 40, 40, 40, 40, 38, 36, 32, 30, 28][level];
  const WARM = ['#ff5a4a', '#ff9a2a', '#ffd23f'], COOL = ['#3f8cff', '#35d4c0', '#8a6bff'];
  const finale = makeFinale(next);
  let item, score, timeLeft, started, failed, flash, flashCol, fly = null, t = 0;
  const ri = n => Math.floor(Math.random() * n);
  function newItem() {
    const warm = Math.random() < 0.5, shape = ['kreis', 'oval', 'dreieck', 'quadrat', 'stern'][ri(5)];
    item = { col: (warm ? WARM : COOL)[ri(3)], warm, shape, round: shape === 'kreis' || shape === 'oval', num: 1 + ri(99), rule: MODE === 3 ? (Math.random() < 0.5 ? 'farbe' : 'form') : null };
    if (MODE === 4) item.shape = ['kreis', 'dreieck', 'quadrat'][ri(3)];
  }
  // richtige Taste für das aktuelle Ding
  function answer() {
    if (MODE === 0) return item.warm ? 'left' : 'right';
    if (MODE === 1) return item.round ? 'left' : 'right';
    if (MODE === 2) return item.num % 2 === 0 ? 'left' : 'right';
    if (MODE === 3) return item.rule === 'farbe' ? (item.warm ? 'left' : 'right') : (item.round ? 'left' : 'right');
    return { kreis: 'left', dreieck: 'up', quadrat: 'right' }[item.shape];
  }
  const BINS = [['warm', 'kalt'], ['rund', 'eckig'], ['gerade', 'ungerade'], ['warm / rund', 'kalt / eckig'], ['Kreis', 'Quadrat', 'Dreieck']][MODE];
  function reset() { score = 0; timeLeft = TIME; started = false; failed = false; flash = 0; newItem(); }
  reset();
  function shape(c, s, x, y, r) {
    c.beginPath();
    if (s === 'kreis') c.arc(x, y, r, 0, 7);
    else if (s === 'oval') c.ellipse(x, y, r * 1.25, r * 0.75, 0, 0, 7);
    else if (s === 'dreieck') { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
    else if (s === 'quadrat') c.rect(x - r * 0.85, y - r * 0.85, r * 1.7, r * 1.7);
    else for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r * 1.1; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.fill();
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, answer: answer() }), // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt * 3);
      if (fly) { fly.k += dt * 5; if (fly.k >= 1) fly = null; }
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failed) { if (pressed.action || dirOf(pressed)) { died(); reset(); } return; }
      const k = ['left', 'right', 'up'].find(d => pressed[d] && (d !== 'up' || MODE === 4));
      if (!k) { if (started) timeLeft -= dt; if (timeLeft <= 0) failed = true; return; }
      started = true;
      fly = { ...item, k: 0, to: k };
      if (k === answer()) { score++; flash = 1; flashCol = '#7dffb0'; } else { timeLeft -= 3; flash = 1; flashCol = '#ff4d6d'; }
      if (score >= NEED) finale.start(); else newItem();
    },
    draw(c) {
      c.fillStyle = '#1c1430'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.03)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(W / 2, -200, 260 + i * 34, 0, 7); c.fill(); }
      const binPos = { left: [110, 330], right: [W - 110, 330], up: [W / 2, 90] };
      const binKeys = MODE === 4 ? ['left', 'right', 'up'] : ['left', 'right'];
      binKeys.forEach((k, i) => {
        const [x, y] = binPos[k];
        c.fillStyle = '#2d2350'; c.beginPath(); c.ellipse(x, y, 80, 26, 0, 0, 7); c.fill();
        c.strokeStyle = '#a99bff'; c.lineWidth = 2; c.stroke();
        label(c, `${{ left: '←', right: '→', up: '↑' }[k]} ${BINS[i]}`, x, y + 5, '#e8e2ff', 'center', 13);
      });
      if (MODE === 3) { c.strokeStyle = item.rule === 'farbe' ? '#ffd23f' : '#ffffff'; c.lineWidth = 3; c.setLineDash(item.rule === 'farbe' ? [] : [6, 5]); c.strokeRect(W / 2 - 56, 150, 112, 112); c.setLineDash([]);
        label(c, item.rule === 'farbe' ? 'FARBE zählt' : 'FORM zählt', W / 2, 284, item.rule === 'farbe' ? '#ffd23f' : '#ffffff', 'center'); }
      c.fillStyle = item.col; shape(c, item.shape, W / 2, 206, 36);
      if (MODE === 2) label(c, String(item.num), W / 2, 216, '#1c1430', 'center', 26);
      if (fly) { const [tx, ty] = binPos[fly.to], x = W / 2 + (tx - W / 2) * fly.k, y = 206 + (ty - 206) * fly.k; c.globalAlpha = 1 - fly.k; c.fillStyle = fly.col; shape(c, fly.shape, x, y, 36 * (1 - fly.k * 0.6)); c.globalAlpha = 1; }
      label(c, `Richtig ${score} / ${NEED}`, 16, 26, '#e8e2ff');
      label(c, started ? `${Math.ceil(Math.max(0, timeLeft))} s` : 'Die Zeit läuft ab der ersten Antwort', W - 16, 26, '#e8e2ff', 'right');
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(16, H - 14, W - 32, 5);
      c.fillStyle = timeLeft < 10 ? '#ff4d6d' : '#a99bff'; c.fillRect(16, H - 14, (W - 32) * clamp(timeLeft / TIME, 0, 1), 5);
      if (flash > 0) { c.fillStyle = flashCol; c.globalAlpha = flash * 0.12; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      if (failed) { c.fillStyle = 'rgba(28,20,48,0.9)'; c.fillRect(0, 160, W, 80); label(c, `Zeit abgelaufen: ${score} von ${NEED}. Taste: neuer Versuch`, W / 2, 205, '#ff9db0', 'center', 14); }
      finale.draw(c, '#e8e2ff', '#2d2350');
    }
  };
  return self;
}
