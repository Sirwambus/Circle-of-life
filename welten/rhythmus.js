/* =====================================================================
   WELT – Rhythmus: Die Trommel spielt einen Rhythmus vor (Ton und Licht). Klopf ihn danach
   mit der Leertaste im selben Rhythmus nach – das Tempo deiner Schläge muss passen.
   ===================================================================== */
function makeRhythmus(next, level = 0) {
  // Abstände in Schlägen; ab Level 5 halbe und punktierte Schläge
  const N = [3, 4, 4, 5, 5, 6, 6, 7, 7, 8][level], BEAT = [0.5, 0.48, 0.46, 0.45, 0.44, 0.42, 0.41, 0.4, 0.39, 0.38][level];
  const SET = [[1, 2], [1, 2], [1, 2, 3], [1, 2, 3], [1, 2, 3], [0.5, 1, 2], [0.5, 1, 1.5, 2], [0.5, 1, 1.5, 2], [0.5, 1, 1.5, 2, 3], [0.5, 1, 1.5, 2, 3]][level];
  const PLAYS = [2, 2, 2, 2, 1, 1, 1, 1, 1, 1][level], TREL = [0.32, 0.31, 0.3, 0.29, 0.28, 0.27, 0.26, 0.25, 0.24, 0.23][level], TMIN = [0.11, 0.11, 0.105, 0.1, 0.1, 0.095, 0.09, 0.09, 0.085, 0.085][level];
  const ROUNDS = 3, LIVES = 3;
  const finale = makeFinale(next);
  let beats, taps, phase, timer, playT, playI, hits, roundI, lives, lastTap, t = 0, msg = '', msgT = 0, flash = 0, pflash = 0, badI = -1;
  const rings = [];
  function makeBeats() {
    for (;;) {
      const iv = Array.from({ length: N - 1 }, () => SET[Math.floor(Math.random() * SET.length)]);
      if (new Set(iv).size < Math.min(2, SET.length)) continue;               // nicht ganz gleichmäßig
      if (iv.some((v, i) => v === 0.5 && iv[i + 1] === 0.5)) continue;     // keine zwei halben Schläge hintereinander
      const b = [0]; for (const v of iv) b.push(b[b.length - 1] + v * BEAT); return b;
    }
  }
  function startPlay(keep) { if (!keep) beats = makeBeats(); taps = []; badI = -1; phase = 'pre'; timer = 1.0; playI = 0; hits = 0; }
  function reset() { roundI = 0; lives = LIVES; startPlay(false); }
  reset();
  const total = () => beats[beats.length - 1];
  function fail(text) { lives--; msg = lives > 0 ? text : 'Keine Versuche mehr. Von vorn.'; msgT = 2.4; phase = 'fail'; timer = 2.6; Klang.tone(140, 0.4); }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, phase, beats, taps, playing: phase === 'play' }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt; flash = Math.max(0, flash - dt * 4); pflash = Math.max(0, pflash - dt * 4);
      for (let i = rings.length - 1; i >= 0; i--) { rings[i].r += dt * 160; rings[i].a -= dt * 1.4; if (rings[i].a <= 0) rings.splice(i, 1); }
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (phase === 'pre') { timer -= dt; if (timer <= 0) { phase = 'play'; playT = 0; playI = 0; hits = 0; } }
      else if (phase === 'play') {
        const per = total() + 1.1;
        while (hits < PLAYS * N) {
          const k = hits % N, rep = Math.floor(hits / N), at = rep * per + beats[k];
          if (playT < at) break;
          hits++; flash = 1; rings.push({ r: 60, a: 1, col: '255,90,60' }); Klang.tone(k === 0 ? 196 : 247, 0.18);
        }
        playT += dt;
        if (hits >= PLAYS * N && playT > (PLAYS - 1) * per + total() + 0.5) { phase = 'input'; taps = []; }
      } else if (phase === 'input') {
        if (pressed.action) {
          taps.push(t); pflash = 1; rings.push({ r: 60, a: 1, col: '255,210,90' }); Klang.tone(330, 0.15);
          const i = taps.length - 1;
          if (i > 0) {
            const want = beats[i] - beats[i - 1], got = taps[i] - taps[i - 1];
            if (Math.abs(got - want) > Math.max(TMIN, TREL * want)) { badI = i; fail(got < want ? 'Zu früh geklopft – hör noch einmal zu.' : 'Zu spät geklopft – hör noch einmal zu.'); return; }
          }
          if (taps.length === N) {
            roundI++; Klang.tone(523, 0.5);
            if (roundI >= ROUNDS) { finale.start(); return; }
            msg = 'Genau im Takt!'; msgT = 1.6; phase = 'good'; timer = 1.8;
          }
        } else if (taps.length > 0) {
          const i = taps.length, want = beats[i] - beats[i - 1];
          if (t - taps[i - 1] > want + Math.max(TMIN, TREL * want) + 0.05) { badI = i; fail('Zu spät oder zu wenige Schläge.'); }
        }
      } else if (phase === 'fail') { timer -= dt; if (timer <= 0) { if (lives <= 0) { died(); reset(); } else startPlay(true); } }
      else if (phase === 'good') { timer -= dt; if (timer <= 0) startPlay(false); }
    },
    draw(c) {
      const bg = c.createRadialGradient(W / 2, 190, 30, W / 2, 190, 420); bg.addColorStop(0, '#3a0c2a'); bg.addColorStop(1, '#0c0310'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // Muster am Rand
      c.strokeStyle = 'rgba(255,140,80,0.12)'; c.lineWidth = 2;
      for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 + t * 0.05; c.beginPath(); c.moveTo(W / 2 + Math.cos(a) * 150, 190 + Math.sin(a) * 150); c.lineTo(W / 2 + Math.cos(a) * 420, 190 + Math.sin(a) * 420); c.stroke(); }
      for (const r of rings) { c.strokeStyle = `rgba(${r.col},${r.a})`; c.lineWidth = 4; c.beginPath(); c.arc(W / 2, 190, r.r, 0, 7); c.stroke(); }
      // Trommel
      const glow = Math.max(flash, pflash), gcol = pflash > flash ? '255,210,90' : '255,90,60';
      c.save(); c.shadowColor = `rgba(${gcol},1)`; c.shadowBlur = 50 * glow;
      c.fillStyle = '#5a1f12'; c.beginPath(); c.ellipse(W / 2, 214, 86, 30, 0, 0, Math.PI); c.lineTo(W / 2 - 86, 190); c.fill();
      c.fillStyle = `rgb(${Math.round(230 + 25 * glow)},${Math.round(200 + 30 * glow)},${Math.round(160 + 40 * glow)})`;
      c.beginPath(); c.ellipse(W / 2, 176, 86, 30, 0, 0, 7); c.fill(); c.restore();
      c.fillStyle = '#5a1f12'; c.fillRect(W / 2 - 86, 176, 172, 38);
      c.strokeStyle = '#d9a35a'; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= 8; i++) c.lineTo(W / 2 - 84 + i * 21, i % 2 ? 210 : 184); c.stroke();
      c.fillStyle = `rgba(${gcol},${0.5 * glow})`; c.beginPath(); c.ellipse(W / 2, 176, 86, 30, 0, 0, 7); c.fill();
      // Schlag-Punkte
      const sx = i => W / 2 - (N - 1) * 14 + i * 28;
      for (let i = 0; i < N; i++) {
        const done = phase === 'input' || phase === 'fail' || phase === 'good' ? i < taps.length : phase === 'play' ? i < (hits - 1) % N + 1 && hits > 0 : false;
        c.fillStyle = i === badI ? '#ff4a4a' : done ? (phase === 'play' ? '#ff6a4a' : '#ffd25a') : 'rgba(255,220,200,0.18)';
        c.beginPath(); c.arc(sx(i), 282, 8, 0, 7); c.fill();
      }
      // Vergleich nach einem Fehler: oben die Vorgabe, unten deine Schläge
      if (phase === 'fail' && taps.length) {
        const sc = Math.min(70, 440 / Math.max(total(), 0.5)), x0 = W / 2 - total() * sc / 2;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0 - 70, 304, total() * sc + 140, 52);
        label(c, 'Vorgabe', x0 - 62, 322, '#ff8a6a'); label(c, 'Du', x0 - 62, 346, '#ffd25a');
        for (const b of beats) { c.fillStyle = '#ff6a4a'; c.fillRect(x0 + b * sc - 2, 312, 4, 14); }
        for (const tp of taps) { const x = x0 + (tp - taps[0]) * sc; if (x < W - 10) { c.fillStyle = '#ffd25a'; c.fillRect(x - 2, 336, 4, 14); } }
      }
      label(c, `Runde ${Math.min(roundI + 1, ROUNDS)} / ${ROUNDS} · ${N} Schläge`, 16, 26, '#ffd9c2');
      label(c, '♥'.repeat(lives), W - 16, 26, '#ff6a6a', 'right', 16);
      const hint = phase === 'pre' || phase === 'play' ? 'Hör zu und schau hin …' : phase === 'input' ? (taps.length ? 'Weiter im Rhythmus …' : 'Jetzt du: Leertaste im selben Rhythmus') : '';
      label(c, msgT > 0 ? msg : hint, W / 2, H - 18, '#ffd9c2', 'center', 14);
      finale.draw(c, '#ffd9c2', '#3a0c2a');
    }
  };
  return self;
}
