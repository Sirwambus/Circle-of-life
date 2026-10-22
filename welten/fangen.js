/* =====================================================================
   WELT – Fangen: Fang die goldenen Lichtkugeln mit der Schale. Dunkle Kugeln kosten ein Leben.
   Level 4: Wind treibt die Kugeln seitlich. Level 5: Sie fallen im Zickzack.
   ===================================================================== */
function makeFangen(next, level = 0) {
  const NEED = [12, 16, 20, 24, 28, 30, 32, 34, 36, 40][level], FALL = [110, 140, 165, 185, 200, 210, 220, 230, 240, 250][level], DARK = [0.15, 0.25, 0.3, 0.33, 0.36, 0.38, 0.4, 0.42, 0.44, 0.45][level];
  const SPAWN = [0.9, 0.75, 0.64, 0.56, 0.5, 0.47, 0.44, 0.42, 0.4, 0.38][level], WIND = [0, 0, 0, 60, 0, 50, 70, 60, 80, 90][level], ZIG = [0, 0, 0, 0, 70, 50, 40, 70, 70, 80][level], LIVES = 3;
  const finale = makeFinale(next);
  const bowl = { x: W / 2, w: 74 };
  let orbs, caught, lives, spawnT, t = 0, flash = 0, flashCol = '#fff';
  const stars = Array.from({ length: 70 }, () => [Math.random() * W, Math.random() * 300, Math.random() * 6]);
  function reset() { orbs = []; caught = 0; lives = LIVES; spawnT = 0.5; }
  reset();
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, bowl, orbs }), // für Testprogramme
    update(dt) {
      t += dt; flash = Math.max(0, flash - dt * 2);
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      bowl.x = clamp(bowl.x + ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * 380 * dt, bowl.w / 2 + 8, W - bowl.w / 2 - 8);
      spawnT -= dt;
      if (spawnT <= 0) { spawnT = SPAWN * (0.7 + Math.random() * 0.6); orbs.push({ x: 40 + Math.random() * (W - 80), y: -12, dark: Math.random() < DARK, ph: Math.random() * 6 }); }
      const wind = WIND * Math.sin(t * 0.7);
      for (const o of orbs) {
        o.y += FALL * dt; o.x += (wind + (ZIG ? Math.cos(t * 3 + o.ph) * ZIG : 0)) * dt; o.x = clamp(o.x, 12, W - 12);
        if (o.y > 340 && o.y < 362 && Math.abs(o.x - bowl.x) < bowl.w / 2) {
          o.gone = true;
          if (o.dark) { lives--; flash = 1; flashCol = '#ff3b6b'; if (lives <= 0) { died(); reset(); return; } }
          else { caught++; flash = 0.6; flashCol = '#ffd86b'; Klang.tone(440 * Math.pow(1.06, caught % 12), 0.3); if (caught >= NEED) { finale.start(); return; } }
        }
        if (o.y > H + 20) o.gone = true;
      }
      orbs = orbs.filter(o => !o.gone);
    },
    draw(c) {
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#071026'); sky.addColorStop(1, '#13203f'); c.fillStyle = sky; c.fillRect(0, 0, W, H);
      for (const [x, y, p] of stars) { c.fillStyle = `rgba(220,230,255,${0.3 + 0.3 * Math.sin(t + p)})`; c.fillRect(x, y, 1.5, 1.5); }
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { // Polarlicht
        c.strokeStyle = `hsla(${150 + i * 40},90%,60%,0.12)`; c.lineWidth = 30; c.beginPath();
        for (let x = 0; x <= W; x += 20) c.lineTo(x, 80 + i * 30 + Math.sin(x * 0.01 + t * 0.5 + i) * 30); c.stroke();
      }
      for (const o of orbs) {
        if (o.dark) { c.fillStyle = '#1a0628'; c.strokeStyle = '#ff3b6b'; c.lineWidth = 2; c.beginPath(); c.arc(o.x, o.y, 11, 0, 7); c.fill(); c.stroke(); }
        else { c.shadowColor = '#ffd86b'; c.shadowBlur = 18; c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(o.x, o.y, 9, 0, 7); c.fill(); c.shadowBlur = 0; }
      }
      c.restore();
      c.fillStyle = '#0a1226'; c.fillRect(0, 368, W, H - 368);
      c.fillStyle = '#c9a65a'; c.beginPath(); c.moveTo(bowl.x - bowl.w / 2, 344); c.quadraticCurveTo(bowl.x, 384, bowl.x + bowl.w / 2, 344); c.lineTo(bowl.x + bowl.w / 2 - 6, 344); c.quadraticCurveTo(bowl.x, 372, bowl.x - bowl.w / 2 + 6, 344); c.fill();
      c.strokeStyle = '#ffe9a8'; c.lineWidth = 2; c.beginPath(); c.moveTo(bowl.x - bowl.w / 2, 344); c.lineTo(bowl.x + bowl.w / 2, 344); c.stroke();
      label(c, `Gefangen ${caught} / ${NEED}`, 16, 26, '#e6f0ff');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff3b6b', 'right', 16);
      if (flash > 0) { c.fillStyle = flashCol; c.globalAlpha = flash * 0.12; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      finale.draw(c, '#ffe9a8', '#13203f');
    }
  };
  return self;
}
