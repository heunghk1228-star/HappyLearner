// ============================================================
// Science Module — Interactive Simulations
// ============================================================

let scienceAnimId = null;
let scienceAngle = 0;
let scienceSpeed = 1;
let sciencePaused = false;

// ============================================================
// Module Selection Page
// ============================================================

function renderSciencePage(container) {
  container.innerHTML = `
    <div class="science-page">
      <div class="page-header">
        <h2>🔬 ${t('science.title')}</h2>
        <p class="subtitle">${t('science.subtitle')}</p>
      </div>
      <h3 class="science-modules-title">${t('science.modules')}</h3>
      <div class="science-modules-grid">
        <div class="science-module-card" onclick="showEarthOrbitSim()">
          <div class="module-icon">🌍</div>
          <h4>${t('science.earthOrbit')}</h4>
          <p>${t('science.earthOrbitDesc')}</p>
        </div>
        <div class="science-module-card" onclick="showWaterCycleSim()">
          <div class="module-icon">💧</div>
          <h4>${t('science.waterCycle')}</h4>
          <p>${t('science.waterCycleDesc')}</p>
        </div>
        <div class="science-module-card" onclick="showCircuitSim()">
          <div class="module-icon">⚡</div>
          <h4>${t('science.circuit')}</h4>
          <p>${t('science.circuitDesc')}</p>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// Earth Orbit Simulation (existing)
// ============================================================

function showEarthOrbitSim() {
  const container = document.getElementById('pageContent');
  container.innerHTML = `
    <div class="science-page">
      <div class="science-back-bar">
        <button class="btn btn-sm btn-outline" onclick="renderSciencePage(document.getElementById('pageContent'))">${t('science.back')}</button>
      </div>
      <div class="page-header">
        <h2>🌍 ${t('science.earthOrbit')}</h2>
      </div>
      <div class="science-canvas-wrapper">
        <canvas id="scienceCanvas" width="800" height="600"></canvas>
      </div>
      <div class="science-controls">
        <button class="btn btn-sm btn-outline" id="sciencePauseBtn" onclick="toggleSciencePause()">⏸ ${t('science.pause')}</button>
        <div class="science-speed-control">
          <label>${t('science.speed')}:</label>
          <input type="range" id="scienceSpeedSlider" min="0.1" max="3" step="0.1" value="1" oninput="setScienceSpeed(this.value)">
          <span id="scienceSpeedLabel">1x</span>
        </div>
      </div>
      <div class="science-info">
        <div class="info-card" id="scienceSeasonInfo">
          <h3>${t('science.currentSeason')}: <span id="seasonName">${t('science.spring')}</span></h3>
          <p id="seasonDescription">${t('science.springDesc')}</p>
        </div>
        <div class="info-card">
          <h3>${t('science.howItWorks')}</h3>
          <ul>
            <li>🌞 ${t('science.fact1')}</li>
            <li>🌍 ${t('science.fact2')}</li>
            <li>🌏 ${t('science.fact3')}</li>
            <li>☀️ ${t('science.fact4')}</li>
          </ul>
        </div>
      </div>
    </div>
  `;
  startScienceAnimation();
}

function startScienceAnimation() {
  const canvas = document.getElementById('scienceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  scienceAngle = 0;
  sciencePaused = false;
  animateScience(ctx, canvas);
}

function animateScience(ctx, canvas) {
  scienceAnimId = requestAnimationFrame(() => animateScience(ctx, canvas));
  if (!sciencePaused) {
    scienceAngle += 0.005 * scienceSpeed;
  }
  const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2 + 20;
  const orbitR = 200, sunR = 45, earthR = 22;
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 400);
  grad.addColorStop(0, '#0a0a2e'); grad.addColorStop(1, '#000010');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 120; i++) {
    const sx = (i * 137.5 + 50) % w, sy = (i * 97.3 + 20) % h, sr = 0.5 + (i % 3) * 0.5;
    ctx.globalAlpha = 0.3 + (i % 5) * 0.15; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 8]);
  ctx.beginPath(); ctx.ellipse(cx, cy, orbitR, orbitR * 0.6, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700'; ctx.fillText(`${t('science.summer')}`, cx - orbitR - 20, cy - 5);
  ctx.fillText(`${t('science.winter')}`, cx + orbitR + 20, cy + 5);
  ctx.fillStyle = '#4fc3f7'; ctx.fillText(`${t('science.spring')}`, cx, cy - orbitR * 0.6 - 15);
  ctx.fillStyle = '#ff8a65'; ctx.fillText(`${t('science.autumn')}`, cx, cy + orbitR * 0.6 + 20);
  const sunGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, sunR);
  sunGrad.addColorStop(0, '#fff7a0'); sunGrad.addColorStop(0.4, '#ffdd44');
  sunGrad.addColorStop(0.8, '#ff8800'); sunGrad.addColorStop(1, '#cc4400');
  ctx.fillStyle = sunGrad; ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 40;
  ctx.fillStyle = 'rgba(255,136,0,0.15)'; ctx.beginPath(); ctx.arc(cx, cy, sunR + 20, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Date.now() * 0.0005, r1 = sunR + 8, r2 = sunR + 18 + Math.sin(Date.now() * 0.003 + i) * 5;
    ctx.strokeStyle = 'rgba(255,200,50,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
  }
  const earthX = cx + Math.cos(scienceAngle) * orbitR, earthY = cy + Math.sin(scienceAngle) * (orbitR * 0.6);
  for (let i = 0; i < 5; i++) {
    const t = i / 4, rx = cx + (earthX - cx) * t, ry = cy + (earthY - cy) * t;
    ctx.strokeStyle = `rgba(255,200,50,${0.4 - t * 0.3})`; ctx.lineWidth = 2 - t;
    ctx.beginPath(); ctx.moveTo(cx + (earthX - cx) * (t - 0.02), cy + (earthY - cy) * (t - 0.02));
    ctx.lineTo(rx, ry); ctx.stroke();
  }
  const earthGrad = ctx.createRadialGradient(earthX - 5, earthY - 5, 3, earthX, earthY, earthR);
  earthGrad.addColorStop(0, '#4fc3f7'); earthGrad.addColorStop(0.5, '#2196f3');
  earthGrad.addColorStop(0.8, '#1565c0'); earthGrad.addColorStop(1, '#0d47a1');
  ctx.fillStyle = earthGrad; ctx.beginPath(); ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(76,175,80,0.6)'; const ca = scienceAngle * 3;
  [[ca + 0.3, 0.5, 0.4], [ca + 1.8, 0.6, 0.3], [ca + 3.0, 0.4, 0.35], [ca + 4.5, 0.55, 0.25]].forEach(c => {
    ctx.beginPath(); ctx.arc(earthX + Math.cos(c[0]) * earthR * c[1], earthY + Math.sin(c[0]) * earthR * c[1], earthR * c[2], 0, Math.PI * 2); ctx.fill();
  });
  const ta = scienceAngle;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(earthX, earthY, earthR, ta + Math.PI / 2, ta - Math.PI / 2); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(earthX, earthY, earthR, ta - Math.PI / 2, ta + Math.PI / 2); ctx.lineTo(earthX, earthY); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
  ctx.beginPath(); ctx.moveTo(earthX, earthY - earthR - 8); ctx.lineTo(earthX, earthY + earthR + 8); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '9px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.textAlign = 'center';
  ctx.fillText('N', earthX, earthY - earthR - 10); ctx.fillText('S', earthX, earthY + earthR + 14);
  const na = ((scienceAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let sk; if (na < Math.PI * 0.5 || na >= Math.PI * 3.5) sk = 'spring'; else if (na < Math.PI * 1.5) sk = 'summer'; else if (na < Math.PI * 2.5) sk = 'autumn'; else sk = 'winter';
  const se = document.getElementById('seasonName'), sd = document.getElementById('seasonDescription');
  if (se) se.textContent = t(`science.${sk}`); if (sd) sd.textContent = t(`science.${sk}Desc`);
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
  ctx.fillText(`🌡️ ${t('science.season')}: ${t(`science.${sk}`)}`, 15, 25);
  ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`🔄 ${t('science.orbitAngle')}: ${Math.round((na / Math.PI) * 180)}°`, 15, 45);
  ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,100,0.8)'; ctx.fillText(t('science.day'), earthX + earthR * 0.5, earthY - 5);
  ctx.fillStyle = 'rgba(100,100,255,0.8)'; ctx.fillText(t('science.night'), earthX - earthR * 0.5, earthY - 5);
}

function toggleSciencePause() {
  sciencePaused = !sciencePaused;
  const btn = document.getElementById('sciencePauseBtn');
  if (btn) btn.textContent = sciencePaused ? `▶ ${t('science.play')}` : `⏸ ${t('science.pause')}`;
}
function setScienceSpeed(val) {
  scienceSpeed = parseFloat(val);
  const el = document.getElementById('scienceSpeedLabel');
  if (el) el.textContent = val + 'x';
}

// ============================================================
// Water Cycle Simulation
// ============================================================

let wcAnimId = null;

function showWaterCycleSim() {
  const container = document.getElementById('pageContent');
  container.innerHTML = `
    <div class="science-page">
      <div class="science-back-bar">
        <button class="btn btn-sm btn-outline" onclick="renderSciencePage(document.getElementById('pageContent'))">${t('science.back')}</button>
      </div>
      <div class="page-header">
        <h2>💧 ${t('science.waterCycle')}</h2>
      </div>
      <div class="science-canvas-wrapper">
        <canvas id="wcCanvas" width="800" height="520"></canvas>
      </div>
      <div class="science-info">
        <div class="wc-stages">
          <div class="wc-stage">
            <div class="wc-stage-icon">💨</div>
            <h4>${t('science.evaporation')}</h4>
            <p>${t('science.evaporationDesc')}</p>
          </div>
          <div class="wc-stage">
            <div class="wc-stage-icon">☁️</div>
            <h4>${t('science.condensation')}</h4>
            <p>${t('science.condensationDesc')}</p>
          </div>
          <div class="wc-stage">
            <div class="wc-stage-icon">🌧️</div>
            <h4>${t('science.precipitation')}</h4>
            <p>${t('science.precipitationDesc')}</p>
          </div>
          <div class="wc-stage">
            <div class="wc-stage-icon">🌊</div>
            <h4>${t('science.collection')}</h4>
            <p>${t('science.collectionDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  startWaterCycle();
}

function startWaterCycle() {
  const canvas = document.getElementById('wcCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  animateWaterCycle(ctx, canvas);
}

function animateWaterCycle(ctx, canvas) {
  wcAnimId = requestAnimationFrame(() => animateWaterCycle(ctx, canvas));
  const w = canvas.width, h = canvas.height;
  const t = Date.now() / 1000;
  ctx.clearRect(0, 0, w, h);

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#1a73e8'); sky.addColorStop(0.5, '#64b5f6'); sky.addColorStop(0.85, '#e3f2fd'); sky.addColorStop(1, '#8d6e63');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

  // Sun
  ctx.fillStyle = '#fff59d';
  ctx.shadowColor = '#ffd54f'; ctx.shadowBlur = 40;
  ctx.beginPath(); ctx.arc(680, 60, 35, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // Sun rays
  ctx.strokeStyle = 'rgba(255,213,79,0.4)'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + t * 0.3;
    ctx.beginPath(); ctx.moveTo(680 + Math.cos(a) * 40, 60 + Math.sin(a) * 40);
    ctx.lineTo(680 + Math.cos(a) * 55, 60 + Math.sin(a) * 55); ctx.stroke();
  }

  // Ocean
  const oceanY = h - 80;
  const oceanGrad = ctx.createLinearGradient(0, oceanY, 0, h);
  oceanGrad.addColorStop(0, '#1565c0'); oceanGrad.addColorStop(0.5, '#0d47a1'); oceanGrad.addColorStop(1, '#0a3d6b');
  ctx.fillStyle = oceanGrad; ctx.fillRect(0, oceanY, w, h - oceanY);
  // Waves
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    for (let x = 0; x < w; x += 5) {
      const yy = oceanY + 5 + i * 8 + Math.sin((x + t * 30 + i * 100) * 0.02) * 3;
      x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // Ground (beach/mountain)
  ctx.fillStyle = '#6d4c41';
  ctx.beginPath(); ctx.moveTo(0, oceanY);
  ctx.quadraticCurveTo(100, oceanY - 20, 200, oceanY - 5);
  ctx.quadraticCurveTo(300, oceanY + 5, 400, oceanY - 2);
  ctx.quadraticCurveTo(500, oceanY - 15, 600, oceanY);
  ctx.lineTo(w, oceanY); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
  // Grass
  ctx.fillStyle = '#388e3c';
  ctx.beginPath(); ctx.moveTo(0, oceanY);
  ctx.quadraticCurveTo(100, oceanY - 22, 200, oceanY - 7);
  ctx.quadraticCurveTo(300, oceanY + 3, 400, oceanY - 4);
  ctx.quadraticCurveTo(500, oceanY - 17, 600, oceanY);
  ctx.lineTo(w, oceanY); ctx.closePath(); ctx.fill();

  // Mountain
  ctx.fillStyle = '#5d4037';
  ctx.beginPath(); ctx.moveTo(100, oceanY - 5);
  ctx.quadraticCurveTo(150, oceanY - 70, 200, oceanY - 5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8e0d0';
  ctx.beginPath(); ctx.moveTo(140, oceanY - 5);
  ctx.quadraticCurveTo(160, oceanY - 45, 180, oceanY - 5);
  ctx.closePath(); ctx.fill();

  // Evaporation particles (rising from ocean)
  const particleCount = 25;
  for (let i = 0; i < particleCount; i++) {
    const px = (i * 37.7 + t * 15) % w;
    const py = oceanY - 8 - (t * 12 + i * 23) % (oceanY * 0.55);
    const size = 2 + Math.sin(t + i) * 1;
    ctx.globalAlpha = 0.5 + Math.sin(t * 2 + i) * 0.3;
    ctx.fillStyle = i % 3 === 0 ? '#e3f2fd' : '#ffffff';
    ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Clouds
  const cloudPositions = [
    { x: 150, y: 70, s: 1.0 }, { x: 350, y: 55, s: 1.3 }, { x: 520, y: 65, s: 1.1 },
    { x: 220, y: 100, s: 0.8 }, { x: 450, y: 90, s: 0.9 },
  ];
  cloudPositions.forEach((c, idx) => {
    const cx = c.x + Math.sin(t * 0.05 + idx) * 15;
    const cy = c.y + Math.sin(t * 0.03 + idx * 2) * 5;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(cx, cy, 25 * c.s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 20 * c.s, cy - 5, 20 * c.s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 15 * c.s, cy + 3, 18 * c.s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 30 * c.s, cy + 5, 15 * c.s, 0, Math.PI * 2); ctx.fill();
  });

  // Rain drops
  ctx.strokeStyle = 'rgba(100,181,246,0.6)'; ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const rx = (i * 29.7 + t * 80) % w;
    const ry = 110 + (t * 60 + i * 19) % (oceanY - 140);
    const rlen = 8 + (i % 5) * 2;
    ctx.globalAlpha = 0.4 + (i % 3) * 0.2;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 1, ry + rlen);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // River flowing down the mountain
  ctx.strokeStyle = 'rgba(66,165,245,0.5)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(160, oceanY - 40);
  ctx.quadraticCurveTo(180, oceanY - 20, 200, oceanY - 5);
  ctx.quadraticCurveTo(220, oceanY + 5, 300, oceanY + 2);
  ctx.stroke();

  // Labels
  ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
  ctx.fillText(`💨 ${t('science.evaporation')}`, 500, 150);
  ctx.fillText(`☁️ ${t('science.condensation')}`, 350, 40);
  ctx.fillText(`🌧️ ${t('science.precipitation')}`, 300, 200);
  ctx.fillText(`🌊 ${t('science.collection')}`, 500, oceanY + 30);
  ctx.shadowBlur = 0;

  // Info text on canvas
  ctx.font = '12px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.textAlign = 'left'; ctx.fillText('💧 ' + t('science.waterCycle'), 10, 20);
}

// ============================================================
// Circuit Simulation
// ============================================================

let circuitOn = false;

function showCircuitSim() {
  const container = document.getElementById('pageContent');
  container.innerHTML = `
    <div class="science-page">
      <div class="science-back-bar">
        <button class="btn btn-sm btn-outline" onclick="renderSciencePage(document.getElementById('pageContent'))">${t('science.back')}</button>
      </div>
      <div class="page-header">
        <h2>⚡ ${t('science.circuit')}</h2>
      </div>
      <div class="science-canvas-wrapper">
        <canvas id="circuitCanvas" width="800" height="500"></canvas>
      </div>
      <div class="circuit-controls">
        <button class="btn btn-primary" id="circuitToggleBtn" onclick="toggleCircuit()">
          ${circuitOn ? '🔴 ' + t('science.switch') + ': OFF' : '🟢 ' + t('science.switch') + ': ON'}
        </button>
        <p class="circuit-status" id="circuitStatus">💡 ${t('science.clickSwitch')}</p>
      </div>
    </div>
  `;
  drawCircuit();
}

function drawCircuit() {
  const canvas = document.getElementById('circuitCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#f5f5f5'; ctx.fillRect(0, 0, w, h);

  // Circuit path
  const pathColor = circuitOn ? '#ff6f00' : '#9e9e9e';
  const glowColor = circuitOn ? 'rgba(255,111,0,0.3)' : 'transparent';

  // Wire glow when on
  if (circuitOn) {
    ctx.shadowColor = '#ff6f00'; ctx.shadowBlur = 15;
  }

  // Draw wires (rectangular circuit path)
  const left = 120, right = w - 120, top = 80, bottom = h - 60;
  ctx.strokeStyle = pathColor; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(left, cy); ctx.lineTo(right, cy); // bottom wire
  ctx.moveTo(left, top); ctx.lineTo(right, top); // top wire
  ctx.moveTo(left, top); ctx.lineTo(left, cy); // left wire
  ctx.moveTo(right, top); ctx.lineTo(right, cy); // right wire
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Battery (left side)
  const batX = left - 10, batY = top + 30;
  ctx.fillStyle = '#37474f'; 
  ctx.fillRect(batX - 12, batY, 24, 50);
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(batX - 8, batY + 5, 16, 18);
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(batX - 8, batY + 27, 16, 18);
  ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#333'; ctx.textAlign = 'center';
  ctx.fillText('🔋 ' + t('science.battery'), batX, batY + 75);

  // + - labels
  ctx.font = 'bold 14px sans-serif'; ctx.fillStyle = '#ff5722';
  ctx.fillText('+', batX - 20, batY + 18);
  ctx.fillStyle = '#333';
  ctx.fillText('−', batX - 20, batY + 52);

  // Switch (right side, top)
  const swX = right, swY = top + 15;
  ctx.fillStyle = circuitOn ? '#4caf50' : '#f44336';
  ctx.beginPath();
  ctx.arc(swX, swY + 15, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif';
  ctx.fillText('⚡', swX, swY + 21);
  // Switch lever
  ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
  ctx.beginPath();
  if (circuitOn) {
    ctx.moveTo(swX, swY + 15); ctx.lineTo(swX + 15, swY); // closed
  } else {
    ctx.moveTo(swX, swY + 15); ctx.lineTo(swX + 15, swY + 25); // open
  }
  ctx.stroke();
  ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#333'; ctx.textAlign = 'center';
  ctx.fillText(t('science.switch'), swX, swY + 50);

  // Bulb (right side, bottom)
  const bulbX = right, bulbY = bottom - 30;
  // Bulb base
  ctx.fillStyle = '#795548'; ctx.fillRect(bulbX - 6, bulbY + 10, 12, 15);
  // Bulb glass
  if (circuitOn) {
    const glow = ctx.createRadialGradient(bulbX, bulbY - 5, 5, bulbX, bulbY - 5, 40);
    glow.addColorStop(0, '#fff9c4'); glow.addColorStop(0.3, '#fff176'); glow.addColorStop(0.6, '#ffee58');
    glow.addColorStop(1, 'rgba(255,238,88,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(bulbX, bulbY - 5, 40, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff9c4';
  } else {
    ctx.fillStyle = '#e0e0e0';
  }
  ctx.beginPath();
  ctx.arc(bulbX, bulbY - 5, 18, 0, Math.PI); ctx.fill();
  // Filament
  ctx.strokeStyle = circuitOn ? '#ff6f00' : '#9e9e9e'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bulbX - 8, bulbY + 2);
  ctx.quadraticCurveTo(bulbX - 4, bulbY - 18, bulbX, bulbY - 12);
  ctx.quadraticCurveTo(bulbX + 4, bulbY - 18, bulbX + 8, bulbY + 2);
  ctx.stroke();

  ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#333'; ctx.textAlign = 'center';
  ctx.fillText(t('science.bulb'), bulbX, bulbY + 40);

  // Current flow animation (dots moving along wires when on)
  if (circuitOn) {
    const t = Date.now() / 1000;
    const dotCount = 8;
    ctx.fillStyle = '#ff6f00'; ctx.shadowColor = '#ff6f00'; ctx.shadowBlur = 8;
    for (let i = 0; i < dotCount; i++) {
      const progress = ((t * 0.8 + i / dotCount) % 1);
      let dx, dy;
      if (progress < 0.25) { // top wire left to right
        dx = left + (right - left) * (progress / 0.25);
        dy = top;
      } else if (progress < 0.5) { // right wire down
        dx = right;
        dy = top + (cy - top) * ((progress - 0.25) / 0.25);
      } else if (progress < 0.75) { // bottom wire right to left
        dx = right - (right - left) * ((progress - 0.5) / 0.25);
        dy = cy;
      } else { // left wire up
        dx = left;
        dy = cy - (cy - top) * ((progress - 0.75) / 0.25);
      }
      ctx.beginPath(); ctx.arc(dx, dy, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  // Click hint
  ctx.font = '14px sans-serif'; ctx.fillStyle = '#666'; ctx.textAlign = 'center';
  ctx.fillText('👆 ' + t('science.clickSwitch'), cx, h - 10);
}

function toggleCircuit() {
  circuitOn = !circuitOn;
  drawCircuit();
  const btn = document.getElementById('circuitToggleBtn');
  const status = document.getElementById('circuitStatus');
  if (btn) btn.textContent = circuitOn ? '🔴 ' + t('science.switch') + ': OFF' : '🟢 ' + t('science.switch') + ': ON';
  if (status) status.innerHTML = circuitOn ? '✅ ' + t('science.lightOn') : '❌ ' + t('science.lightOff');
  // Keep animation running
  if (circuitOn) requestAnimationFrame(animateCircuit);
}

function animateCircuit() {
  drawCircuit();
  if (circuitOn) requestAnimationFrame(animateCircuit);
}