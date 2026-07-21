// ============================================================
// Science Module — Sun-Earth Interactive Visualization
// ============================================================

let scienceAnimId = null;
let scienceAngle = 0;
let scienceSpeed = 1;
let sciencePaused = false;
let scienceSeasonLabels = ['spring', 'summer', 'autumn', 'winter'];

function renderSciencePage(container) {
  container.innerHTML = `
    <div class="science-page">
      <div class="page-header">
        <h2>🌍 ${t('science.title')}</h2>
        <p class="science-subtitle">${t('science.subtitle')}</p>
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

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 20;
  const orbitR = 200;
  const sunR = 45;
  const earthR = 22;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Background — space gradient
  const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 400);
  grad.addColorStop(0, '#0a0a2e');
  grad.addColorStop(1, '#000010');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Stars
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 120; i++) {
    const sx = (i * 137.5 + 50) % w;
    const sy = (i * 97.3 + 20) % h;
    const sr = 0.5 + (i % 3) * 0.5;
    ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Orbit path
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, orbitR, orbitR * 0.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Season labels on orbit
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd700';
  ctx.fillText(`${t('science.summer')}`, cx - orbitR - 20, cy - 5);
  ctx.fillText(`${t('science.winter')}`, cx + orbitR + 20, cy + 5);
  ctx.fillStyle = '#4fc3f7';
  ctx.fillText(`${t('science.spring')}`, cx, cy - orbitR * 0.6 - 15);
  ctx.fillStyle = '#ff8a65';
  ctx.fillText(`${t('science.autumn')}`, cx, cy + orbitR * 0.6 + 20);

  // Sun
  const sunGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, sunR);
  sunGrad.addColorStop(0, '#fff7a0');
  sunGrad.addColorStop(0.4, '#ffdd44');
  sunGrad.addColorStop(0.8, '#ff8800');
  sunGrad.addColorStop(1, '#cc4400');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Sun glow
  ctx.shadowColor = '#ff8800';
  ctx.shadowBlur = 40;
  ctx.fillStyle = 'rgba(255,136,0,0.15)';
  ctx.beginPath();
  ctx.arc(cx, cy, sunR + 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Sun rays
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + Date.now() * 0.0005;
    const r1 = sunR + 8;
    const r2 = sunR + 18 + Math.sin(Date.now() * 0.003 + i) * 5;
    ctx.strokeStyle = 'rgba(255,200,50,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

  // Earth position
  const earthX = cx + Math.cos(scienceAngle) * orbitR;
  const earthY = cy + Math.sin(scienceAngle) * (orbitR * 0.6);

  // Sunlight rays to Earth
  const rayCount = 5;
  for (let i = 0; i < rayCount; i++) {
    const t = i / (rayCount - 1);
    const rx = cx + (earthX - cx) * t;
    const ry = cy + (earthY - cy) * t;
    ctx.strokeStyle = `rgba(255,200,50,${0.4 - t * 0.3})`;
    ctx.lineWidth = 2 - t;
    ctx.beginPath();
    ctx.moveTo(cx + (earthX - cx) * (t - 0.02), cy + (earthY - cy) * (t - 0.02));
    ctx.lineTo(rx, ry);
    ctx.stroke();
  }

  // Earth
  const earthGrad = ctx.createRadialGradient(earthX - 5, earthY - 5, 3, earthX, earthY, earthR);
  earthGrad.addColorStop(0, '#4fc3f7');
  earthGrad.addColorStop(0.5, '#2196f3');
  earthGrad.addColorStop(0.8, '#1565c0');
  earthGrad.addColorStop(1, '#0d47a1');
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, 0, Math.PI * 2);
  ctx.fill();

  // Earth continents
  ctx.fillStyle = 'rgba(76,175,80,0.6)';
  const continentAngle = scienceAngle * 3;
  const continents = [
    { a: continentAngle + 0.3, r: 0.5, s: 0.4 },
    { a: continentAngle + 1.8, r: 0.6, s: 0.3 },
    { a: continentAngle + 3.0, r: 0.4, s: 0.35 },
    { a: continentAngle + 4.5, r: 0.55, s: 0.25 },
  ];
  continents.forEach(c => {
    ctx.beginPath();
    ctx.arc(
      earthX + Math.cos(c.a) * earthR * c.r,
      earthY + Math.sin(c.a) * earthR * c.r,
      earthR * c.s,
      0, Math.PI * 2
    );
    ctx.fill();
  });

  // Earth day/night terminator line
  const terminatorAngle = scienceAngle; // light from sun direction
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, terminatorAngle + Math.PI / 2, terminatorAngle - Math.PI / 2);
  ctx.stroke();

  // Dark side overlay
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.arc(earthX, earthY, earthR, terminatorAngle - Math.PI / 2, terminatorAngle + Math.PI / 2);
  ctx.lineTo(earthX, earthY);
  ctx.closePath();
  ctx.fill();

  // Tilt axis
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(earthX, earthY - earthR - 8);
  ctx.lineTo(earthX, earthY + earthR + 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // N/S label
  ctx.font = '9px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('N', earthX, earthY - earthR - 10);
  ctx.fillText('S', earthX, earthY + earthR + 14);

  // Season determination based on angle
  const normAngle = ((scienceAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let seasonIdx;
  let seasonKey;
  if (normAngle < Math.PI * 0.5 || normAngle >= Math.PI * 3.5) {
    seasonIdx = 0; // Spring
    seasonKey = 'spring';
  } else if (normAngle < Math.PI * 1.5) {
    seasonIdx = 1; // Summer
    seasonKey = 'summer';
  } else if (normAngle < Math.PI * 2.5) {
    seasonIdx = 2; // Autumn
    seasonKey = 'autumn';
  } else {
    seasonIdx = 3; // Winter
    seasonKey = 'winter';
  }

  // Update season info
  const seasonEl = document.getElementById('seasonName');
  const seasonDesc = document.getElementById('seasonDescription');
  if (seasonEl) seasonEl.textContent = t(`science.${seasonKey}`);
  if (seasonDesc) seasonDesc.textContent = t(`science.${seasonKey}Desc`);

  // Info labels on canvas
  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(`🌡️ ${t('science.season')}: ${t(`science.${seasonKey}`)}`, 15, 25);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText(`🔄 ${t('science.orbitAngle')}: ${Math.round((normAngle / Math.PI) * 180)}°`, 15, 45);

  // Day/night label on Earth
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  // Day side
  ctx.fillStyle = 'rgba(255,255,100,0.8)';
  ctx.fillText(t('science.day'), earthX + earthR * 0.5, earthY - 5);
  // Night side
  ctx.fillStyle = 'rgba(100,100,255,0.8)';
  ctx.fillText(t('science.night'), earthX - earthR * 0.5, earthY - 5);
}

function toggleSciencePause() {
  sciencePaused = !sciencePaused;
  const btn = document.getElementById('sciencePauseBtn');
  if (btn) btn.textContent = sciencePaused ? `▶ ${t('science.play')}` : `⏸ ${t('science.pause')}`;
}

function setScienceSpeed(val) {
  scienceSpeed = parseFloat(val);
  const label = document.getElementById('scienceSpeedLabel');
  if (label) label.textContent = val + 'x';
}
