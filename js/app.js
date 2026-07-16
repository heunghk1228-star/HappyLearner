// ============================================================
// Main App — Routing, Navigation, Page Rendering
// ============================================================

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  await initSupabase();
  
  // Set up language selector
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setLanguage(lang);
      const page = getCurrentPageFromHash();
      navigateTo(page, true);
    });
  });
  
  // Set up navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page, true);
    });
  });
  
  // Set up auth modal
  document.getElementById('loginBtn')?.addEventListener('click', showAuthModal);
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await logout();
  });
  
  document.getElementById('authModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) hideAuthModal();
  });
  
  // Load saved language
  const savedLang = localStorage.getItem('lang') || 'zh-TW';
  document.querySelector(`.lang-btn[data-lang="${savedLang}"]`)?.classList.add('active');
  setLanguage(savedLang);
  
  // Hash-based routing
  window.addEventListener('hashchange', () => {
    const page = getCurrentPageFromHash();
    navigateTo(page, false);
  });
  
  // Navigate to initial page from hash or default
  const initialPage = getCurrentPageFromHash() || 'about';
  navigateTo(initialPage, false);
  
  // Auth callback
  window.onAuthChange = (user) => {
    if (user) {
      hideAuthModal();
      const page = getCurrentPageFromHash();
      if (page === 'english') navigateTo('english', true);
    }
  };
});

function getCurrentPageFromHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return null;
  // Handle sub-pages: english/vocab -> english
  return hash.split('/')[0];
}

function getCurrentSubPageFromHash() {
  const hash = window.location.hash.replace('#', '');
  const parts = hash.split('/');
  return parts.length > 1 ? parts[1] : null;
}

// ============================================================
// Navigation
// ============================================================

function navigateTo(page, pushHash) {
  // Update URL hash when user navigates (not on hashchange events)
  if (pushHash) {
    window.location.hash = page;
    return; // hashchange will trigger navigateTo again with pushHash=false
  }
  
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navLink = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (navLink) navLink.classList.add('active');
  
  // Render page
  const content = document.getElementById('pageContent');
  switch (page) {
    case 'about': renderAboutPage(content); break;
    case 'chinese': renderComingSoonPage(content, 'chinese'); break;
    case 'english':
      renderEnglishPage(content);
      // Handle sub-pages after English page renders
      setTimeout(() => {
        const sub = getCurrentSubPageFromHash();
        if (sub === 'vocab') openVocabularyBook();
        else if (sub === 'flashcards') openFlashcards();
        else if (sub === 'revision') showRevisionPage();
      }, 10);
      break;
    case 'math': renderComingSoonPage(content, 'math'); break;
    case 'science': renderComingSoonPage(content, 'science'); break;
    case 'humanities': renderComingSoonPage(content, 'humanities'); break;
    default: renderAboutPage(content);
  }
  
  window.scrollTo(0, 0);
}

// ============================================================
// Page Renderers
// ============================================================

function renderAboutPage(container) {
  container.innerHTML = `
    <div class="about-page">
      <div class="about-hero">
        <h1>${t('about.title')}</h1>
        <p class="hero-text">${t('about.hero')}</p>
      </div>
      <div class="about-content">
        <p>${t('about.desc1')}</p>
        <p>${t('about.desc2')}</p>
        <p>${t('about.desc3')}</p>
      </div>
      <div class="features-section">
        <h3>${t('about.features')}</h3>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🧠</div>
            <h4>Memory Curve</h4>
            <p>${t('about.desc2')}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h4>${t('about.title')}</h4>
            <p>${t('about.desc3')}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">✅</div>
            <h4>${t('english.checkin')}</h4>
            <p>${t('about.desc3')}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEnglishPage(container) {
  if (!currentUser) {
    container.innerHTML = `
      <div class="english-page">
        <div class="page-header">
          <h2>${t('english.title')}</h2>
          <p class="subtitle">${t('english.subtitle')}</p>
        </div>
        <div class="login-prompt">
          <p>🔒 ${t('english.loginRequired')}</p>
          <button class="btn btn-primary" onclick="showAuthModal()">${t('english.login')}</button>
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="english-page">
      <div class="page-header">
        <h2>${t('english.title')}</h2>
        <p class="subtitle">${t('english.subtitle')}</p>
      </div>
      
      <!-- Check-in Section -->
      <div class="checkin-section" id="checkinSection">
        ${renderCheckIn()}
      </div>
      
      <!-- Tool Cards -->
      <div class="tool-cards">
        <div class="tool-card" onclick="openVocabularyBook()">
          <div class="tool-icon">📖</div>
          <h3>${t('english.myVocab')}</h3>
          <p>${t('english.myVocabDesc')}</p>
        </div>
        <div class="tool-card" onclick="openFlashcards()">
          <div class="tool-icon">🃏</div>
          <h3>${t('english.flashCards')}</h3>
          <p>${t('english.flashCardsDesc')}</p>
        </div>
        <div class="tool-card" onclick="showRevisionPage()">
          <div class="tool-icon">📝</div>
          <h3>${t('english.revision')}</h3>
          <p>${t('english.revisionDesc')}</p>
        </div>
      </div>
      
      <!-- Dynamic Content Area -->
      <div id="englishContent"></div>
    </div>
  `;
  
  loadCheckInStatus();
}

async function renderCheckIn() {
  const checkedIn = await getTodayCheckIn();
  const streak = await getCheckInStreak();
  
  return `
    <div class="checkin-bar">
      <div class="streak-info">
        🔥 <strong>${t('english.dayStreak')}: ${streak}</strong>
      </div>
      ${checkedIn 
        ? `<div class="checked-in">✅ ${t('english.checkInToday')}</div>`
        : `<button class="btn btn-primary" onclick="doDailyCheckIn()">📅 ${t('english.checkIn')}</button>`
      }
    </div>
  `;
}

async function loadCheckInStatus() {
  const section = document.getElementById('checkinSection');
  if (section) {
    section.innerHTML = await renderCheckIn();
  }
}

async function doDailyCheckIn() {
  try {
    await doCheckIn();
    await loadCheckInStatus();
    // Add gem for check-in
    const profile = await getProfile();
    const currentGems = profile?.gems || 0;
    await updateGems(currentGems + 1);
    await loadGemCount();
    showToast('✅ ' + t('english.checkInToday') + ' +1💎');
  } catch (e) {
    showToast('❌ ' + e.message);
  }
}

// ============================================================
// Vocabulary Book Page
// ============================================================

async function openVocabularyBook() {
  history.replaceState({}, '', '#english/vocab');
  showLoading();
  const words = await fetchVocabulary();
  
  const content = document.getElementById('englishContent');
  if (!content) return;
  
  const newbeeCount = words.filter(w => w.level <= 2).length;
  const wellTestedCount = words.filter(w => w.level >= 3 && w.level <= 5).length;
  const masteredCount = words.filter(w => w.level >= 6).length;
  
  content.innerHTML = `
    <div class="vocab-book-page">
      <div class="vocab-stats">
        <div class="stat-box newbee">
          <span class="stat-num">${newbeeCount}</span>
          <span class="stat-label">${t('english.newbee')}</span>
        </div>
        <div class="stat-box well-tested">
          <span class="stat-num">${wellTestedCount}</span>
          <span class="stat-label">${t('english.wellTested')}</span>
        </div>
        <div class="stat-box mastered">
          <span class="stat-num">${masteredCount}</span>
          <span class="stat-label">${t('english.mastered')}</span>
        </div>
      </div>
      
      <div class="vocab-actions">
        <button class="btn btn-primary" onclick="showAddWordsPage()">➕ ${t('english.addWords')}</button>
        <input type="text" class="input search-input" id="vocabSearch" 
               placeholder="${t('english.search')}" 
               oninput="searchVocabList(this.value)">
      </div>
      
      <div class="vocab-list-header">
        <span class="col-word">${t('english.vocabBook')}</span>
        <span class="col-meaning">${t('english.chineseMeaning')}</span>
        <span class="col-pos">${t('english.partOfSpeech')}</span>
        <span class="col-level">${t('english.level')}</span>
        <span class="col-actions"></span>
      </div>
      <div class="vocab-list" id="vocabList">
        ${renderVocabList(words)}
      </div>
    </div>
  `;
  
  hideLoading();
}

function renderVocabList(words) {
  if (!words.length) {
    return `<div class="empty-state">${t('common.placeholders')}</div>`;
  }
  
  return words.map(w => {
    const posArr = w.part_of_speech ? w.part_of_speech.split(',') : [];
    const posLabels = posArr.map(p => POS_MAP[p]?.[currentLang] || p).join(', ');
    const tierLabel = getTierLabel(w.level);
    
    return `
      <div class="vocab-row" data-id="${w.id}">
        <span class="col-word"><strong>${w.word}</strong></span>
        <span class="col-meaning">
          <span class="meaning-text" id="meaning-${w.id}">${w.chinese_meaning || ''}</span>
          <input class="input edit-input hidden" id="edit-${w.id}" value="${w.chinese_meaning || ''}">
        </span>
        <span class="col-pos">${posLabels}</span>
        <span class="col-level">
          <span class="level-badge level-${w.level}">${tierLabel}</span>
        </span>
        <span class="col-actions">
          <button class="btn-icon" onclick="editMeaning('${w.id}')" title="${t('english.edit')}">✏️</button>
          <button class="btn-icon" onclick="saveMeaning('${w.id}')" id="save-${w.id}" style="display:none" title="${t('english.save')}">💾</button>
          <button class="btn-icon" onclick="cancelEdit('${w.id}')" id="cancel-${w.id}" style="display:none" title="${t('english.cancel')}">❌</button>
          <button class="btn-icon" onclick="deleteVocabWord('${w.id}')" title="${t('english.delete')}">🗑️</button>
        </span>
      </div>
    `;
  }).join('');
}

function editMeaning(id) {
  document.getElementById(`meaning-${id}`).classList.add('hidden');
  document.getElementById(`edit-${id}`).classList.remove('hidden');
  document.getElementById(`save-${id}`).style.display = 'inline';
  document.getElementById(`cancel-${id}`).style.display = 'inline';
  document.getElementById(`edit-${id}`).focus();
}

async function saveMeaning(id) {
  const input = document.getElementById(`edit-${id}`);
  const newMeaning = input.value.trim();
  try {
    await updateWordMeaning(id, newMeaning);
    document.getElementById(`meaning-${id}`).textContent = newMeaning;
    document.getElementById(`meaning-${id}`).classList.remove('hidden');
    input.classList.add('hidden');
    document.getElementById(`save-${id}`).style.display = 'none';
    document.getElementById(`cancel-${id}`).style.display = 'none';
    showToast('✅ ' + t('english.save'));
  } catch (e) {
    showToast('❌ ' + e.message);
  }
}

function cancelEdit(id) {
  document.getElementById(`meaning-${id}`).classList.remove('hidden');
  document.getElementById(`edit-${id}`).classList.add('hidden');
  document.getElementById(`save-${id}`).style.display = 'none';
  document.getElementById(`cancel-${id}`).style.display = 'none';
}

async function deleteVocabWord(id) {
  if (!confirm(t('english.delete') + '?')) return;
  try {
    await deleteWord(id);
    document.querySelector(`.vocab-row[data-id="${id}"]`).remove();
    showToast('🗑️ ' + t('english.delete'));
  } catch (e) {
    showToast('❌ ' + e.message);
  }
}

async function searchVocabList(query) {
  const words = await searchVocabulary(query);
  const list = document.getElementById('vocabList');
  if (list) {
    list.innerHTML = renderVocabList(words);
  }
}

// ============================================================
// Add Words Page
// ============================================================

function showAddWordsPage() {
  const content = document.getElementById('englishContent');
  if (!content) return;
  
  content.innerHTML = `
    <div class="add-words-page">
      <h3>${t('english.inputWords')}</h3>
      <p class="guide">${t('english.inputGuide')}</p>
      <div class="tips">
        <small>✅ ${t('english.noDuplicate')}</small><br>
        <small>✅ ${t('english.nounSingular')}</small><br>
        <small>✅ ${t('english.verbPresent')}</small>
      </div>
      <textarea class="input textarea-input" id="wordInput" rows="8" 
                placeholder="${t('english.inputPlaceholder')}"></textarea>
      <div class="word-count" id="wordCount">0 / 100 ${t('english.words')}</div>
      <button class="btn btn-primary" onclick="processWordInput()">${t('english.submit')}</button>
      <div id="addResult" class="add-result"></div>
      <button class="btn btn-outline" onclick="openVocabularyBook()" style="margin-top: 1rem;">
        ${t('english.back')}
      </button>
    </div>
  `;
  
  // Word count
  document.getElementById('wordInput').addEventListener('input', function() {
    const words = this.value.trim().split(/\s+/).filter(w => w.length > 0);
    document.getElementById('wordCount').textContent = `${words.length} / 100 ${t('english.words')}`;
  });
}

async function processWordInput() {
  const textarea = document.getElementById('wordInput');
  const text = textarea.value.trim();
  if (!text) return;
  
  // Extract words preserving case (to detect names later)
  const rawWords = text
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && /^[a-zA-Z]/.test(w));
  
  // Split contractions: doesn't → does not, don't → do not, can't → cannot, etc.
  const expanded = [];
  const CONTRACTIONS = {
    "doesn't": "does not", "don't": "do not", "can't": "cannot", "couldn't": "could not",
    "wouldn't": "would not", "shouldn't": "should not", "won't": "will not",
    "wasn't": "was not", "weren't": "were not", "hasn't": "has not", "haven't": "have not",
    "hadn't": "had not", "didn't": "did not", "isn't": "is not", "aren't": "are not",
    "mightn't": "might not", "mustn't": "must not", "needn't": "need not",
    "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is",
    "it's": "it is", "we're": "we are", "they're": "they are",
    "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have",
    "i'll": "i will", "you'll": "you will", "he'll": "he will", "she'll": "she will",
    "we'll": "we will", "they'll": "they will",
    "i'd": "i would", "you'd": "you would", "he'd": "he would", "she'd": "she would",
    "we'd": "we would", "they'd": "they would"
  };
  for (const w of rawWords) {
    const lower = w.toLowerCase();
    if (CONTRACTIONS[lower]) {
      expanded.push(...CONTRACTIONS[lower].split(' '));
    } else {
      expanded.push(w);
    }
  }
  
  // Detect names: skip capitalized words that aren't at the start of sentences
  const sentences = text.split(/[.!?]\s*/);
  const firstWords = new Set(sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase()).filter(Boolean));
  const filtered = expanded.filter(w => {
    const lower = w.toLowerCase();
    // Skip if it's capitalized AND not at sentence start AND not a common word
    if (w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase() && !firstWords.has(lower)) {
      // Check if it's a common word that should be capitalized (like "I")
      if (lower !== 'i') return false;
    }
    return true;
  });
  
  // Remove duplicates preserving first occurrence
  const seen = new Set();
  const unique = [];
  for (const w of filtered) {
    const lower = w.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(lower);
    }
  }
  
  // Limit to 100
  const toNormalize = unique.slice(0, 100);
  
  if (!toNormalize.length) {
    document.getElementById('addResult').innerHTML = `<div class="result-info">${t('common.placeholders')}</div>`;
    return;
  }
  
  showLoading();
  
  try {
    // Step 1: AI normalize words (present tense / singular form)
    const normalized = await callAIBatchNormalize(toNormalize);
    
    // Step 2: Build word objects for bulkAdd
    const wordObjects = [];
    const seenNorm = new Set();
    for (const w of normalized) {
      if (!seenNorm.has(w.normalized) && w.normalized.length > 1) {
        seenNorm.add(w.normalized);
        wordObjects.push({ word: w.normalized, pos: w.pos || detectPOS(w.normalized) });
      }
    }
    
    if (!wordObjects.length) {
      document.getElementById('addResult').innerHTML = `<div class="result-info">${t('common.placeholders')}</div>`;
      hideLoading();
      return;
    }
    
    // Step 3: Add to database (includes AI translation inside bulkAddWords)
    const result = await bulkAddWords(wordObjects);
    document.getElementById('addResult').innerHTML = `
      <div class="result-success">✅ ${t('english.wordAdded')}</div>
      <div class="result-details">
        <span>➕ ${t('english.new')}: ${result.added}</span>
        <span>⏭️ ${t('english.noDuplicate')}: ${result.duplicates}</span>
      </div>
    `;
    textarea.value = '';
    document.getElementById('wordCount').textContent = `0 / 100 ${t('english.words')}`;
  } catch (e) {
    document.getElementById('addResult').innerHTML = `<div class="result-error">❌ ${e.message}</div>`;
  }
  hideLoading();
}

// ============================================================
// Auth Modal
// ============================================================

function showAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.remove('hidden');
  modal.classList.add('visible');
  
  modal.innerHTML = `
    <div class="modal-content auth-modal">
      <button class="modal-close" onclick="hideAuthModal()">✕</button>
      <h2 id="authTitle">${t('english.loginTitle')}</h2>
      
      <div class="auth-form">
        <div class="form-group">
          <label>${t('english.email')}</label>
          <input type="email" class="input" id="authEmail" placeholder="email@example.com">
        </div>
        <div class="form-group">
          <label>${t('english.password')}</label>
          <input type="password" class="input" id="authPassword" placeholder="••••••••">
        </div>
        <div class="auth-error" id="authError"></div>
        <button class="btn btn-primary" id="authSubmitBtn" onclick="handleAuth()">${t('english.login')}</button>
        <div class="auth-divider"><span>or</span></div>
        <button class="btn btn-google" onclick="handleGoogleSignIn()">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Sign in with Google
        </button>
        <p class="auth-switch">
          <span id="authSwitchText">${t('english.noAccount')}</span>
          <a href="#" onclick="toggleAuthMode()" id="authSwitchLink">${t('english.register')}</a>
        </p>
      </div>
    </div>
  `;
  
  // Enter key support
  document.getElementById('authPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuth();
  });
}

let isLoginMode = true;

function toggleAuthMode() {
  isLoginMode = !isLoginMode;
  document.getElementById('authTitle').textContent = isLoginMode ? t('english.loginTitle') : t('english.registerTitle');
  document.getElementById('authSubmitBtn').textContent = isLoginMode ? t('english.login') : t('english.register');
  document.getElementById('authSwitchText').textContent = isLoginMode ? t('english.noAccount') : t('english.hasAccount');
  document.getElementById('authSwitchLink').textContent = isLoginMode ? t('english.register') : t('english.login');
}

async function handleAuth() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const errorEl = document.getElementById('authError');
  const btn = document.getElementById('authSubmitBtn');
  
  if (!email || !password) {
    errorEl.textContent = 'Please fill in all fields';
    return;
  }
  
  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters';
    return;
  }
  
  errorEl.textContent = '';
  btn.disabled = true;
  btn.textContent = t('common.loading');
  
  try {
    if (isLoginMode) {
      await login(email, password);
    } else {
      const result = await register(email, password);
      // If email confirmation is required, show message
      if (result?.user?.identities?.length === 0) {
        showToast('📧 Please check your email to confirm registration');
      }
    }
    // Success — the onAuthStateChange callback will hide the modal
    // But also set a timeout to re-enable button just in case
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = isLoginMode ? t('english.login') : t('english.register');
    }, 3000);
  } catch (e) {
    errorEl.textContent = e.message;
    btn.disabled = false;
    btn.textContent = isLoginMode ? t('english.login') : t('english.register');
  }
}

function hideAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.remove('visible');
  modal.classList.add('hidden');
}

async function handleGoogleSignIn() {
  try {
    await signInWithGoogle();
    // OAuth redirects the browser — no further steps needed
  } catch (e) {
    showToast('❌ Google sign in failed: ' + e.message);
  }
}

// ============================================================
// Coming Soon
// ============================================================

function renderComingSoonPage(container, subject) {
  container.innerHTML = `
    <div class="coming-soon-page">
      <div class="coming-soon-icon">🚧</div>
      <h2>${t(`${subject}.title`)}</h2>
      <p>${t(`${subject}.comingSoon`)}</p>
    </div>
  `;
}

// ============================================================
// Utilities
// ============================================================

function showLoading() {
  let loader = document.getElementById('globalLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.className = 'global-loader';
    document.body.appendChild(loader);
  }
  loader.classList.remove('hidden');
}

function hideLoading() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.classList.add('hidden');
}

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

function showEnglishPage() {
  navigateTo('english', true);
}