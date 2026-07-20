// ============================================================
// Game of Life — standalone module
// ============================================================

let golGrid = [];
let golRunning = false;
let golTimer = null;
let golRows = 30;
let golCols = 50;
let golSpeed = 200;
let golCellSize = 14;
let golZoomLevel = 0;
const golZoomRows = [50, 40, 30, 20, 15];
const golZoomCols = [80, 65, 50, 35, 25];

const GOL_PATTERNS = {
  '🪸 Block':        [[1,1],[1,1]],
  '🔄 Blinker':      [[1,1,1]],
  '🛸 Glider':       [[0,1,0],[0,0,1],[1,1,1]],
  '📡 Beacon':       [[1,1,0,0],[1,1,0,0],[0,0,1,1],[0,0,1,1]],
  '💫 Pulsar (13x13)': [
    [0,0,1,1,1,0,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],[1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],[0,0,1,1,1,0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,0,0,0,1,1,1,0,0],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],[1,0,0,0,0,1,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,1,0,0,0,0,1],[0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,1,1,1,0,0,0,1,1,1,0,0]
  ],
  '🐦 Gosper Glider Gun': [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ]
};

function renderMathPage(container) {
  golZoomLevel = 0;
  golRows = golZoomRows[2];
  golCols = golZoomCols[2];
  
  golGrid = [];
  for (let r = 0; r < golRows; r++) {
    golGrid[r] = [];
    for (let c = 0; c < golCols; c++) golGrid[r][c] = 0;
  }
  golRunning = false;
  if (golTimer) { clearInterval(golTimer); golTimer = null; }
  
  const savedPatterns = golLoadSavedPatterns();
  const _ = (key) => t(`math.${key}`);
  
  container.innerHTML = `
    <div class="page-header">
      <h2>${_('golTitle')}</h2>
    </div>
    <div class="gol-layout" style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
      <div class="gol-main" style="flex:1;min-width:300px;text-align:center">
        <div class="gol-controls" style="display:flex;gap:0.4rem;justify-content:center;flex-wrap:wrap;margin-bottom:0.5rem">
          <button class="btn btn-primary" id="golPlayBtn" onclick="golToggle()">${_('golStart')}</button>
          <button class="btn btn-outline" onclick="golClear()">${_('golClear')}</button>
          <button class="btn btn-outline" onclick="golRandom()">${_('golRandom')}</button>
          <button class="btn btn-outline" onclick="golZoom(-1)">${_('golZoomOut')}</button>
          <span id="golZoomLabel" style="font-size:0.75rem;color:var(--text-light)">${golRows}×${golCols}</span>
          <button class="btn btn-outline" onclick="golZoom(1)">${_('golZoomIn')}</button>
          <label style="display:flex;align-items:center;gap:0.3rem;font-size:0.8rem">
            ⏱ <input type="range" min="50" max="1000" value="${golSpeed}" step="50" oninput="golSetSpeed(this.value)" style="width:60px">
            <span id="golSpeedLabel">${golSpeed}ms</span>
          </label>
        </div>
        <div class="gol-grid" id="golGrid" style="display:inline-grid;grid-template-columns:repeat(${golCols},${golCellSize}px);gap:1px;background:#ddd;border-radius:4px;padding:2px;user-select:none"></div>
        <div style="margin-top:0.3rem;font-size:0.75rem;color:var(--text-light)">
          ${_('golGen')}: <span id="golGenCount">0</span> &nbsp;|&nbsp; ${_('golAlive')}: <span id="golLiveCount">0</span>
        </div>
      </div>
      
      <div class="gol-sidebar" style="width:220px;flex-shrink:0;font-size:0.8rem">
        <details open>
          <summary style="cursor:pointer;font-weight:700">${_('golHowToPlay')}</summary>
          <div style="padding:0.3rem 0;color:var(--text-light)">
            ${_('golRule1')}<br>${_('golRule2')}<br>${_('golRule3')}<br>${_('golRule4')}<br>${_('golRule5')}
          </div>
        </details>
        
        <details style="margin-top:0.5rem">
          <summary style="cursor:pointer;font-weight:700">${_('golPatterns')}</summary>
          <div id="golPatternList" style="display:flex;flex-direction:column;gap:0.2rem;padding:0.3rem 0;max-height:200px;overflow-y:auto">
            ${Object.keys(GOL_PATTERNS).map(name => 
              `<button class="btn btn-sm btn-outline" onclick="golPlacePattern('${name.replace(/'/g, "\\'")}')" style="text-align:left;font-size:0.75rem">${name}</button>`
            ).join('')}
            <hr style="margin:0.3rem 0">
            <button class="btn btn-sm btn-outline" onclick="golSavePattern()" style="font-size:0.75rem">${_('golSave')}</button>
            <div id="golSavedPatterns">
              ${savedPatterns.length ? savedPatterns.map((p, i) => 
                `<div style="display:flex;gap:0.2rem;margin-top:0.15rem">
                  <button class="btn btn-sm btn-outline" onclick="golPlaceSavedPattern(${i})" style="flex:1;text-align:left;font-size:0.7rem">💾 ${p.name}</button>
                  <button class="btn-icon" onclick="golDeleteSavedPattern(${i})" style="font-size:0.7rem">✕</button>
                </div>`
              ).join('') : `<div style="color:var(--text-light);font-size:0.7rem;margin-top:0.2rem">${_('golNoSaved')}</div>`}
            </div>
          </div>
        </details>
        
        <details style="margin-top:0.5rem">
          <summary style="cursor:pointer;font-weight:700">${_('golShortcuts')}</summary>
          <div style="padding:0.3rem 0;color:var(--text-light)">
            ${_('golShortcut1')}<br>${_('golShortcut2')}<br>${_('golShortcut3')}<br>${_('golShortcut4')}
          </div>
        </details>
      </div>
    </div>
  `;
  
  golRenderGrid();
  golUpdateStats();
}

function golRenderGrid() {
  const gridEl = document.getElementById('golGrid');
  if (!gridEl) return;
  gridEl.innerHTML = '';
  for (let r = 0; r < golRows; r++) {
    for (let c = 0; c < golCols; c++) {
      const cell = document.createElement('div');
      cell.className = 'gol-cell' + (golGrid[r][c] ? ' gol-cell-alive' : '');
      cell.style.cssText = `width:${golCellSize}px;height:${golCellSize}px;border-radius:2px;cursor:pointer`;
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.onclick = () => golToggleCell(r, c);
      gridEl.appendChild(cell);
    }
  }
}

function golZoom(dir) {
  golZoomLevel = Math.max(-2, Math.min(2, golZoomLevel + dir));
  const newRows = golZoomRows[golZoomLevel + 2];
  const newCols = golZoomCols[golZoomLevel + 2];
  const newGrid = [];
  for (let r = 0; r < newRows; r++) {
    newGrid[r] = [];
    for (let c = 0; c < newCols; c++)
      newGrid[r][c] = (r < golRows && c < golCols) ? golGrid[r][c] : 0;
  }
  golRows = newRows;
  golCols = newCols;
  golGrid = newGrid;
  const gridEl = document.getElementById('golGrid');
  if (gridEl) {
    gridEl.style.gridTemplateColumns = `repeat(${golCols},${golCellSize}px)`;
    golRenderGrid();
  }
  const label = document.getElementById('golZoomLabel');
  if (label) label.textContent = `${golRows}×${golCols}`;
}

function golToggleCell(r, c) {
  golGrid[r][c] = golGrid[r][c] ? 0 : 1;
  const cells = document.getElementById('golGrid')?.children;
  if (cells) {
    const idx = r * golCols + c;
    if (cells[idx]) cells[idx].className = 'gol-cell' + (golGrid[r][c] ? ' gol-cell-alive' : '');
  }
  golUpdateStats();
}

function golToggle() {
  golRunning = !golRunning;
  const btn = document.getElementById('golPlayBtn');
  if (golRunning) {
    btn.textContent = t('math.golPause');
    btn.className = 'btn btn-warning';
    if (golTimer) clearInterval(golTimer);
    golTimer = setInterval(golStep, golSpeed);
  } else {
    btn.textContent = t('math.golStart');
    btn.className = 'btn btn-primary';
    if (golTimer) { clearInterval(golTimer); golTimer = null; }
  }
}

function golStep() {
  const rows = golRows, cols = golCols;
  const next = [];
  for (let r = 0; r < rows; r++) {
    next[r] = [];
    for (let c = 0; c < cols; c++) {
      let live = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          live += golGrid[(r + dr + rows) % rows][(c + dc + cols) % cols];
        }
      next[r][c] = golGrid[r][c] === 1 ? (live === 2 || live === 3 ? 1 : 0) : (live === 3 ? 1 : 0);
    }
  }
  golGrid = next;
  golUpdateCells();
}

function golUpdateCells() {
  let live = 0;
  const genEl = document.getElementById('golGenCount');
  if (genEl) genEl.textContent = parseInt(genEl.textContent || '0') + 1;
  const cells = document.getElementById('golGrid')?.children;
  if (!cells) return;
  for (let r = 0; r < golRows; r++) {
    for (let c = 0; c < golCols; c++) {
      const alive = golGrid[r][c];
      if (alive) live++;
      const idx = r * golCols + c;
      if (cells[idx]) cells[idx].className = 'gol-cell' + (alive ? ' gol-cell-alive' : '');
    }
  }
  const liveEl = document.getElementById('golLiveCount');
  if (liveEl) liveEl.textContent = live;
}

function golUpdateStats() {
  let live = 0;
  for (let r = 0; r < golRows; r++)
    for (let c = 0; c < golCols; c++)
      if (golGrid[r][c]) live++;
  const liveEl = document.getElementById('golLiveCount');
  if (liveEl) liveEl.textContent = live;
}

function golClear() {
  if (golRunning) golToggle();
  for (let r = 0; r < golRows; r++)
    for (let c = 0; c < golCols; c++)
      golGrid[r][c] = 0;
  const genEl = document.getElementById('golGenCount');
  if (genEl) genEl.textContent = '0';
  golUpdateCells();
  golUpdateStats();
}

function golRandom() {
  if (golRunning) golToggle();
  for (let r = 0; r < golRows; r++)
    for (let c = 0; c < golCols; c++)
      golGrid[r][c] = Math.random() < 0.25 ? 1 : 0;
  const genEl = document.getElementById('golGenCount');
  if (genEl) genEl.textContent = '0';
  golUpdateCells();
  golUpdateStats();
}

function golSetSpeed(ms) {
  golSpeed = parseInt(ms);
  const label = document.getElementById('golSpeedLabel');
  if (label) label.textContent = golSpeed + 'ms';
  if (golRunning) {
    if (golTimer) clearInterval(golTimer);
    golTimer = setInterval(golStep, golSpeed);
  }
}

function golPlacePattern(name) {
  const pattern = GOL_PATTERNS[name];
  if (!pattern) return;
  if (golRunning) golToggle();
  const pr = pattern.length, pc = pattern[0].length;
  const startR = Math.floor((golRows - pr) / 2);
  const startC = Math.floor((golCols - pc) / 2);
  for (let r = 0; r < pr; r++)
    for (let c = 0; c < pc; c++)
      if (startR + r >= 0 && startR + r < golRows && startC + c >= 0 && startC + c < golCols)
        golGrid[startR + r][startC + c] = pattern[r][c];
  const genEl = document.getElementById('golGenCount');
  if (genEl) genEl.textContent = '0';
  golUpdateCells();
  golUpdateStats();
}

const GOL_SAVED_KEY = 'gol_saved_patterns';

function golLoadSavedPatterns() {
  try { return JSON.parse(localStorage.getItem(GOL_SAVED_KEY)) || []; } catch(e) { return []; }
}

function golSavePattern() {
  const name = prompt('為此圖案命名:', '我的圖案 ' + (golLoadSavedPatterns().length + 1));
  if (!name || !name.trim()) return;
  const data = []; let minR = golRows, maxR = 0, minC = golCols, maxC = 0;
  let hasLive = false;
  for (let r = 0; r < golRows; r++)
    for (let c = 0; c < golCols; c++)
      if (golGrid[r][c]) { hasLive = true; minR = Math.min(minR, r); maxR = Math.max(maxR, r); minC = Math.min(minC, c); maxC = Math.max(maxC, c); }
  if (!hasLive) { showToast('⚠️ 網格中沒有活細胞'); return; }
  for (let r = minR; r <= maxR; r++) {
    const row = [];
    for (let c = minC; c <= maxC; c++) row.push(golGrid[r][c]);
    data.push(row);
  }
  const saved = golLoadSavedPatterns();
  saved.push({ name: name.trim(), data });
  localStorage.setItem(GOL_SAVED_KEY, JSON.stringify(saved));
  showToast('✅ 已儲存圖案');
  const container = document.getElementById('golSavedPatterns');
  if (container) {
    const last = saved.length - 1;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:0.2rem;margin-top:0.15rem';
    div.innerHTML = `<button class="btn btn-sm btn-outline" onclick="golPlaceSavedPattern(${last})" style="flex:1;text-align:left;font-size:0.7rem">💾 ${saved[last].name}</button><button class="btn-icon" onclick="golDeleteSavedPattern(${last})" style="font-size:0.7rem">✕</button>`;
    container.appendChild(div);
  }
}

function golPlaceSavedPattern(idx) {
  const saved = golLoadSavedPatterns();
  if (!saved[idx]) return;
  if (golRunning) golToggle();
  const pattern = saved[idx].data;
  const pr = pattern.length, pc = pattern[0].length;
  const startR = Math.floor((golRows - pr) / 2);
  const startC = Math.floor((golCols - pc) / 2);
  for (let r = 0; r < pr; r++)
    for (let c = 0; c < pc; c++)
      if (startR + r >= 0 && startR + r < golRows && startC + c >= 0 && startC + c < golCols)
        golGrid[startR + r][startC + c] = pattern[r][c];
  const genEl = document.getElementById('golGenCount');
  if (genEl) genEl.textContent = '0';
  golUpdateCells();
  golUpdateStats();
}

function golDeleteSavedPattern(idx) {
  const saved = golLoadSavedPatterns();
  if (!saved[idx]) return;
  saved.splice(idx, 1);
  localStorage.setItem(GOL_SAVED_KEY, JSON.stringify(saved));
  showToast('🗑️ 已刪除');
  const container = document.getElementById('golSavedPatterns');
  if (container) {
    container.innerHTML = saved.length ? saved.map((p, i) => 
      `<div style="display:flex;gap:0.2rem;margin-top:0.15rem">
        <button class="btn btn-sm btn-outline" onclick="golPlaceSavedPattern(${i})" style="flex:1;text-align:left;font-size:0.7rem">💾 ${p.name}</button>
        <button class="btn-icon" onclick="golDeleteSavedPattern(${i})" style="font-size:0.7rem">✕</button>
      </div>`
    ).join('') : '<div style="color:var(--text-light);font-size:0.7rem;margin-top:0.2rem">未有儲存圖案</div>';
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (!document.getElementById('golGrid')) return;
  if (e.key === ' ') { e.preventDefault(); golToggle(); }
  else if (e.key === 'c' || e.key === 'C') golClear();
  else if (e.key === 'r' || e.key === 'R') golRandom();
  else if (e.key === '=' || e.key === '+') golZoom(1);
  else if (e.key === '-') golZoom(-1);
});