/* =====================================================================
   WELT – Doppelblitz: Wahlreaktion zwischen zwei Portalen. Links oder rechts blitzt ein Zeichen auf, je nach Regel
   drückst du ← oder →. Regeln: SEITE (wo es aufblitzt), GEGENSEITE, FORM (Kreis ←, Quadrat →). Rot = nicht drücken.
   Ab Level 6 wechselt die Regel, der Rahmen zeigt, welche gerade gilt.
   ===================================================================== */
function makeDoppelblitz(next, level = 0) {
  const TRIALS = [10, 12, 12, 12, 14, 14, 14, 16, 16, 18][level], MAXERR = 2;
  const LIMIT = [1.5, 1.1, 1.3, 1.2, 1.15, 1.25, 1.2, 1.2, 1.1, 1.0][level];       // Antwortzeit
  const WAIT = [[0.8, 1.6], [0.6, 1.3], [0.7, 1.4], [0.7, 1.4], [0.6, 1.3], [0.7, 1.3], [0.6, 1.2], [0.6, 1.2], [0.5, 1.1], [0.5, 1.0]][level];
  const RULES = [['seite'], ['seite'], ['farbe'], ['form'], ['form'], ['seite', 'form'], ['seite', 'form'], ['seite', 'gegen', 'form'], ['seite', 'gegen', 'form'], ['seite', 'gegen', 'form']][level];
  const NOGO = [0, 0, 0, 0, 0.2, 0, 0.2, 0, 0.2, 0.22][level], EVERY = level === 9 ? [1, 3] : [3, 5];
  const RNAME = { seite: 'SEITE', gegen: 'GEGENSEITE', form: 'FORM', farbe: 'FARBE' };
  const RCOL = { seite: '#ffe14d', gegen: '#3ff0ff', form: '#c58bff', farbe: '#ff3fa4' };
  const RHINT = { seite: 'Drück die Seite, auf der es aufblitzt', gegen: 'Drück die GEGENSEITE', form: 'Kreis = ←   Quadrat = →   (egal wo)', farbe: 'Grün = gleiche Seite · Blau = Gegenseite' };
  const PX = [170, 470], PY = 205;
  const finale = makeFinale(next);
  let phase, timer, stim, rule, untilChange, done, errors, failT, msg, msgT, msgOk, t = 0, rt = 0, id = 0;
  function reset() { done = 0; errors = 0; failT = -1; msg = ''; msgT = 0; rule = RULES[0]; untilChange = rnd(EVERY); stim = null; phase = 'rule'; timer = 1.6; }
  const rnd = r => r[0] + Math.floor(Math.random() * (r[1] - r[0] + 1));
  function newWait() { phase = 'wait'; timer = WAIT[0] + Math.random() * (WAIT[1] - WAIT[0]); stim = null; }
  reset();
  function answer() {
    if (stim.nogo) return null;
    const r = rule === 'farbe' ? (stim.color === 'gruen' ? 'seite' : 'gegen') : rule;
    if (r === 'form') return stim.shape === 'kreis' ? 'left' : 'right';
    const same = stim.side ? 'right' : 'left', opp = stim.side ? 'left' : 'right';
    return r === 'seite' ? same : opp;
  }
  function judge(ok, m) {
    msg = m; msgT = 0.9; msgOk = ok; stim.res = ok ? 1 : -1; phase = 'fb'; timer = 0.45;
    if (ok) { done++; Klang.tone(620, 0.08); } else { errors++; Klang.tone(150, 0.25); }
    if (errors > MAXERR) { failT = 0; return; }
    if (done >= TRIALS) { finale.start(); return; }
  }
  const self = {
    done: false, door: () => finale.rect,
    test: () => ({ fin: finale.active, fail: failT >= 0, phase, rule, stim: stim && phase === 'stim' ? { id: stim.id, side: stim.side, shape: stim.shape, color: stim.color, nogo: stim.nogo } : null }), // für Testprogramme
    update(dt) {
      t += dt; msgT -= dt;
      if (finale.active) { if (finale.update(dt)) self.done = true; return; }
      if (failT >= 0) { failT += dt; if ((failT > 0.8 && pressed.action) || failT > 4) { died(); reset(); } return; }
      const key = pressed.left ? 'left' : pressed.right ? 'right' : null;
      timer -= dt;
      if (phase === 'rule') { if (timer <= 0) newWait(); }
      else if (phase === 'wait') {
        if (key) { stim = {}; judge(false, 'Zu früh!'); return; }
        if (timer <= 0) {
          phase = 'stim'; rt = 0; id++;
          const nogo = Math.random() < NOGO;
          stim = { id, side: Math.random() < 0.5 ? 0 : 1, shape: Math.random() < 0.5 ? 'kreis' : 'quadrat', color: nogo ? 'rot' : rule === 'farbe' ? (Math.random() < 0.5 ? 'gruen' : 'blau') : 'weiss', nogo };
        }
      } else if (phase === 'stim') {
        rt += dt;
        const want = answer();
        if (key) { if (!want) judge(false, 'Rot heißt: nicht drücken!'); else if (key === want) judge(true, `${Math.round(rt * 1000)} ms`); else judge(false, 'Falsche Seite'); }
        else if (!want && rt > 0.9) judge(true, 'Gut gewartet');
        else if (want && rt > LIMIT) judge(false, 'Zu langsam');
      } else if (phase === 'fb') {
        if (timer <= 0) {
          if (RULES.length > 1 && --untilChange <= 0) {
            const others = RULES.filter(r => r !== rule); rule = others[Math.floor(Math.random() * others.length)];
            untilChange = rnd(EVERY); phase = 'rule'; timer = 1.4; stim = null; Klang.tone(880, 0.15);
          } else newWait();
        }
      }
    },
    draw(c) {
      c.fillStyle = '#07020f'; c.fillRect(0, 0, W, H);
      const rc = RCOL[rule];
      // gespiegelte Strahlen um beide Portale
      for (let s = 0; s < 2; s++) {
        c.save(); c.translate(PX[s], PY); c.rotate((s ? -1 : 1) * t * 0.3);
        for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.fillStyle = i % 2 ? 'rgba(255,63,164,0.06)' : 'rgba(120,80,255,0.07)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(220, -30); c.lineTo(220, 30); c.fill(); }
        c.restore();
        const on = phase === 'stim' && stim && stim.side === s;
        c.fillStyle = on ? '#1e0b33' : '#120720'; c.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,0.25)'; c.lineWidth = 4;
        c.beginPath(); c.arc(PX[s], PY, 88, 0, 7); c.fill(); c.stroke();
        label(c, s ? '→' : '←', PX[s], PY + 122, 'rgba(255,255,255,0.35)', 'center', 18);
      }
      if (stim && (phase === 'stim' || phase === 'fb') && stim.side !== undefined) {
        const x = PX[stim.side], col = { rot: '#ff3b4d', gruen: '#4dff88', blau: '#4d8bff', weiss: '#fff6e0' }[stim.color];
        c.fillStyle = col; c.shadowColor = col; c.shadowBlur = phase === 'stim' ? 30 : 0; c.globalAlpha = phase === 'fb' ? 0.35 : 1;
        if (stim.shape === 'kreis') { c.beginPath(); c.arc(x, PY, 44, 0, 7); c.fill(); } else c.fillRect(x - 40, PY - 40, 80, 80);
        if (stim.nogo) { c.strokeStyle = '#07020f'; c.lineWidth = 8; c.beginPath(); c.moveTo(x - 24, PY - 24); c.lineTo(x + 24, PY + 24); c.moveTo(x + 24, PY - 24); c.lineTo(x - 24, PY + 24); c.stroke(); }
        c.shadowBlur = 0; c.globalAlpha = 1;
      }
      // Regelrahmen
      c.strokeStyle = rc; c.lineWidth = 6; c.shadowColor = rc; c.shadowBlur = 16; c.strokeRect(6, 6, W - 12, H - 12); c.shadowBlur = 0;
      label(c, `Regel: ${RNAME[rule]}`, W / 2, 34, rc, 'center', 18);
      label(c, RHINT[rule] + (NOGO ? ' · Rot: nichts drücken' : ''), W / 2, 56, '#d8c8f0', 'center', 12);
      label(c, `${done} / ${TRIALS}`, 22, 30, '#d8c8f0');
      label(c, `Fehler ${errors} / ${MAXERR}`, W - 22, 30, errors ? '#ff9db0' : '#d8c8f0', 'right');
      if (phase === 'rule' && failT < 0) {
        c.fillStyle = 'rgba(7,2,15,0.75)'; c.fillRect(0, PY - 40, W, 80);
        label(c, done === 0 && errors === 0 ? `Regel: ${RNAME[rule]}` : `Neue Regel: ${RNAME[rule]}`, W / 2, PY + 2, rc, 'center', 26);
        label(c, RHINT[rule], W / 2, PY + 26, '#ffffff', 'center', 13);
      }
      if (failT >= 0) label(c, 'Zu viele Fehler! Leertaste: noch einmal', W / 2, 382, '#ffb0d6', 'center', 14);
      else if (msgT > 0) label(c, msg, W / 2, 382, msgOk ? '#9dffc0' : '#ff9db0', 'center', 15);
      finale.draw(c, '#d8c8f0', '#1e0b33');
    }
  };
  return self;
}
