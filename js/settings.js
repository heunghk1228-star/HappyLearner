// ============================================================
// Account Settings Module
// ============================================================

async function openAccountSettings() {
  document.getElementById('userDropdown').classList.add('hidden');
  if (window.location.hash !== '#english/settings') {
    history.pushState({}, '', '#english/settings');
  }
  showLoading();
  const profile = await getProfile();
  
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="settings-page">
      <h3>⚙️ 帳戶設定</h3>
      
      <div class="settings-section">
        <label>顯示名稱</label>
        <input type="text" class="input" id="settingName" value="${profile?.display_name || ''}" placeholder="你的名稱">
      </div>
      
      <div class="settings-section">
        <label>頭像</label>
        <div class="avatar-grid" id="avatarGrid">
          ${Object.entries(AVATARS).map(([key, emoji]) => `
            <div class="avatar-opt ${profile?.avatar_style === key ? 'selected' : ''}" 
                 data-avatar="${key}" onclick="selectAvatar('${key}')">${emoji}</div>
          `).join('')}
        </div>
        <div class="avatar-upload">
          <label>或貼上自訂頭像 URL</label>
          <input type="url" class="input" id="settingAvatarUrl" value="${profile?.avatar_url || ''}" placeholder="https://...">
        </div>
      </div>
      
      <div class="settings-section">
        <label>聯絡電話</label>
        <input type="tel" class="input" id="settingPhone" value="${profile?.contact_phone || ''}" placeholder="+852 1234 5678">
      </div>
      
      <div class="settings-section">
        <label>備用電郵</label>
        <input type="email" class="input" id="settingContactEmail" value="${profile?.contact_email || ''}" placeholder="backup@email.com">
      </div>
      
      <div class="settings-section">
        <label>🔊 ${t('english.speechSpeed')}</label>
        <div class="speech-speed-setting">
          <div class="speed-row">
            <span>🐢 ${t('english.slow')}</span>
            <input type="range" id="settingSlowRate" min="0.2" max="0.7" step="0.05" value="${getSlowRate()}"
                   oninput="document.getElementById('settingSlowVal').textContent = Math.round(this.value * 100) + '%'">
            <span class="speed-value" id="settingSlowVal">${Math.round(getSlowRate() * 100)}%</span>
            <button class="btn btn-sm btn-outline" onclick="speakWord('Hello, slow test.', getSlowRate())">🎤</button>
          </div>
          <div class="speed-row">
            <span>🐇 ${t('english.fast')}</span>
            <input type="range" id="settingFastRate" min="0.6" max="1.2" step="0.05" value="${getFastRate()}"
                   oninput="document.getElementById('settingFastVal').textContent = Math.round(this.value * 100) + '%'">
            <span class="speed-value" id="settingFastVal">${Math.round(getFastRate() * 100)}%</span>
            <button class="btn btn-sm btn-outline" onclick="speakWord('Hello, fast test.', getFastRate())">🎤</button>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <label>🎵 測驗完成音樂</label>
        <label class="toggle-label">
          <input type="checkbox" id="settingCelebrationMusic" ${getCelebrationMusicEnabled() ? 'checked' : ''}>
          <span>完成測驗時播放慶祝音樂</span>
        </label>
      </div>
      
      <div class="settings-actions">
        <button class="btn btn-primary" onclick="saveAccountSettings()">💾 儲存</button>
        <button class="btn btn-outline" onclick="showEnglishPage()">← 返回</button>
      </div>
      <div id="settingsResult"></div>
    </div>
  `;
  hideLoading();
}

let selectedAvatar = null;

function selectAvatar(key) {
  selectedAvatar = key;
  document.querySelectorAll('.avatar-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector(`.avatar-opt[data-avatar="${key}"]`).classList.add('selected');
}

async function saveAccountSettings() {
  const fields = {
    display_name: document.getElementById('settingName').value.trim(),
    avatar_style: selectedAvatar || document.querySelector('.avatar-opt.selected')?.dataset.avatar || 'cat',
    contact_phone: document.getElementById('settingPhone').value.trim(),
    contact_email: document.getElementById('settingContactEmail').value.trim(),
  };
  const avatarUrl = document.getElementById('settingAvatarUrl').value.trim();
  if (avatarUrl) fields.avatar_url = avatarUrl;
  
  const slowSlider = document.getElementById('settingSlowRate');
  if (slowSlider) setSlowRate(parseFloat(slowSlider.value));
  const fastSlider = document.getElementById('settingFastRate');
  if (fastSlider) setFastRate(parseFloat(fastSlider.value));
  
  const musicCb = document.getElementById('settingCelebrationMusic');
  if (musicCb) setCelebrationMusicEnabled(musicCb.checked);
  
  try {
    await updateProfile(fields);
    updateAuthUI();
    document.getElementById('settingsResult').innerHTML = '<div class="result-success">✅ 已儲存！</div>';
  } catch (e) {
    document.getElementById('settingsResult').innerHTML = `<div class="result-error">❌ ${e.message}</div>`;
  }
}