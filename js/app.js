// ============================================================
// Main App — Routing, Navigation, Page Rendering
// ============================================================

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  await initSupabase();
  
  // Set up navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navTriggered = true;
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
  setLanguage(savedLang);
  
  let navCurrentPage = null; // Track current navigation page
  let navTriggered = false; // Set when nav link is clicked (allows re-navigation to parent page)

  // Hash-based routing
    window.addEventListener('hashchange', () => {
      const page = getCurrentPageFromHash();
      const newHash = window.location.hash;
      if (page) {
        if (navTriggered) {
          // User clicked a nav link or back button → always navigate
          navTriggered = false;
          lastKnownHash = newHash;
          navigateTo(page, false);
        } else if (newHash !== lastKnownHash) {
          // Hash actually changed — only navigate if not going longer (sub-page)
          // Sub-page nav (vocab, flashcards, revision) is handled by onclick
          const newLen = newHash.replace('#', '').split('/').length;
          const oldLen = lastKnownHash.replace('#', '').split('/').length;
          lastKnownHash = newHash;
          if (newLen <= oldLen) {
            navigateTo(page, false);
          }
        }
      }
    });

    // Also handle browser back/forward via popstate (fires before hashchange)
    window.addEventListener('popstate', () => {
      const newHash = window.location.hash;
      if (newHash !== lastKnownHash) {
        const page = getCurrentPageFromHash();
        if (page) {
          lastKnownHash = newHash;
          navigateTo(page, false);
        }
      }
    });
  
  // Navigate to initial page from hash or default
  const initialPage = getCurrentPageFromHash() || 'about';
  navigateTo(initialPage, false);

  // Prevent re-navigation when tab is restored from BFCache (tab switch)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Sync lastKnownHash to current hash to prevent stale hashchange/popstate
      lastKnownHash = window.location.hash;
    }
  });
  
  // Auth callback
  window.onAuthChange = (user) => {
    if (user) {
      hideAuthModal();
      // Re-render current page content without changing hash
      const page = getCurrentPageFromHash();
      if (page) {
        const content = document.getElementById('pageContent');
        if (content) {
          // Re-render the page to reflect logged-in state
          switch (page) {
            case 'english':
              renderEnglishPage(content);
              setTimeout(() => {
                const sub = getCurrentSubPageFromHash();
                if (sub === 'vocab') openVocabularyBook();
                else if (sub === 'flashcards') openFlashcards();
                else if (sub === 'revision') showRevisionPage();
              }, 10);
              break;
            case 'about': renderAboutPage(content); break;
            case 'math': renderMathPage(content); break;
            case 'science': renderSciencePage(content); break;
            default:
              if (typeof renderComingSoonPage === 'function')
                renderComingSoonPage(content, page);
          }
        }
      }
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

let navCurrentPage = null; // Track current navigation page to prevent re-navigation
let navTriggered = false; // Set when nav link is clicked (allows re-navigation to parent page)
let lastKnownHash = window.location.hash || ''; // Track full hash for back-from-sub-page detection

function navigateTo(page, pushHash) {
  // Close mobile menu
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.remove('open');
  
  if (pushHash) {
        window.location.hash = page;
        lastKnownHash = '#' + page;
        return; // hashchange will trigger navigateTo again with pushHash=false
  }
  
  // Update tracking
  navCurrentPage = page;
  
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
    case 'math': renderMathPage(content); break;
    case 'science': renderSciencePage(content); break;
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
      <!-- Hero Section -->
      <div class="hero-section">
        <h1 class="hero-title">${t('about.title')}</h1>
        <p class="hero-subtitle">${t('about.subtitle')}</p>
      </div>
      
      <!-- Philosophy Section -->
      <div class="philosophy-section">
        <h2>${t('about.philosophy_title')}</h2>
        <p>${t('about.philosophy')}</p>
      </div>
      
      <!-- Features Section -->
      <div class="features-section">
        <h3>${t('about.features')}</h3>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">📈</div>
            <h4>${t('about.feature1_title')}</h4>
            <p>${t('about.feature1_desc')}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h4>${t('about.feature2_title')}</h4>
            <p>${t('about.feature2_desc')}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h4>${t('about.feature3_title')}</h4>
            <p>${t('about.feature3_desc')}</p>
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
      </div>
      
      <!-- Dynamic Content Area (includes tool cards + streak on main page) -->
      <div id="englishContent">
        <div id="streakDisplay" class="streak-bar"></div>
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
      </div>
    </div>
  `;
  
  // Load streak display
  loadStreakDisplay();
}

async function loadStreakDisplay() {
  const el = document.getElementById('streakDisplay');
  if (!el) return;
  if (!currentUser) { el.classList.add('hidden'); return; }
  const checkedIn = await getTodayCheckIn();
  const streak = await getCheckInStreak();
  const wordsLast7 = await getWordsLast7Days();
  const wordsReviewed = getReviewCountLast7Days();
  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="growth-bar">
      <div class="growth-primary">
        ${t('english.wordsLast7Days').replace('{n}', wordsLast7).replace('{r}', wordsReviewed)}
      </div>
      <div class="growth-secondary">
        🔥 ${t('english.dayStreak')}: ${streak}天 · ${checkedIn ? '✅ ' + t('english.checkInToday') : '📝 ' + t('english.checkIn')}
      </div>
    </div>
  `;
}

// ============================================================
// Vocabulary Book Page
// ============================================================

function showEnglishPage() {
  navTriggered = true;
  navigateTo('english', true);
}

async function openVocabularyBook() {
  // Only push state if not already on this hash (e.g. direct URL load)
  if (window.location.hash !== '#english/vocab') {
    history.pushState({}, '', '#english/vocab');
    lastKnownHash = '#english/vocab';
  }
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
        <div class="tier-filter-btns" style="margin:0.25rem 0">
          <button class="tier-btn tier-newbee active" data-tier="newbee" onclick="toggleVocabTier('newbee')">${t('english.newbee')}</button>
          <button class="tier-btn tier-well-tested active" data-tier="well-tested" onclick="toggleVocabTier('well-tested')">${t('english.wellTested')}</button>
          <button class="tier-btn tier-mastered active" data-tier="mastered" onclick="toggleVocabTier('mastered')">${t('english.mastered')}</button>
        </div>
        <div class="tag-filter-group">
          <select class="input" id="tagFilter" onchange="filterByTag(this.value)" style="max-width:140px;font-size:0.85rem">
            <option value="">🏷️ ${t('english.all')}</option>
          </select>
          <button class="btn-icon" onclick="showCreateTagInput()" title="${t('english.newTag')}">➕</button>
          <div class="inline-tag-create hidden" id="inlineTagCreate">
            <input type="text" class="input" id="inlineTagName" placeholder="${t('english.tagName')}" maxlength="20" style="width:100px;font-size:0.8rem">
            <button class="btn btn-sm btn-primary" onclick="doCreateInlineTag()">${t('english.add')}</button>
            <button class="btn btn-sm btn-outline" onclick="document.getElementById('inlineTagCreate').classList.add('hidden')">✕</button>
          </div>
        </div>
      </div>
      
      <div class="vocab-list-header">
        <span class="col-word">${t('english.vocabBook')}</span>
        <span class="col-meaning">${t('english.chineseMeaning')}</span>
        <span class="col-pos">${t('english.partOfSpeech')}</span>
        <span class="col-level">${t('english.level')}</span>
        <span class="col-tags">${t('english.tags')}</span>
        <span class="col-actions"></span>
      </div>
      <div class="vocab-list" id="vocabList">
        ${t('common.loading')}
      </div>
    </div>
  `;
  
  // Fill vocab list (async render)
  const listEl = document.getElementById('vocabList');
  if (listEl) listEl.innerHTML = await renderVocabList(words);
  
  // Load tag filter
  await loadTagFilter();
  
  hideLoading();
}

function renderVocabList(words) {
  if (!words.length) {
    return `<div class="empty-state">${t('common.placeholders')}</div>`;
  }
  
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  
  return words.map(w => {
    const posArr = w.part_of_speech ? w.part_of_speech.split(',') : [];
    const posLabels = posArr.map(p => POS_MAP[p]?.[currentLang] || p).join(', ');
    const tierLabel = getTierLabel(w.level);
    const allPOS = Object.keys(POS_MAP);
    const wid = esc(w.id);
    const wword = esc(w.word);
    const wmeaning = esc(w.chinese_meaning || '');
    
    return `
      <div class="vocab-row" data-id="${wid}">
        <span class="col-word"><strong>${wword}</strong></span>
        <span class="col-meaning">
          <span class="meaning-text" id="meaning-${wid}">${wmeaning}</span>
          <input class="input edit-input hidden" id="edit-${wid}" value="${wmeaning}">
        </span>
        <span class="col-pos">
          <span class="pos-text" id="posText-${wid}">${posLabels}</span>
          <div class="pos-edit hidden" id="posEdit-${wid}">
            ${allPOS.map(p => `
              <label class="pos-checkbox">
                <input type="checkbox" value="${p}" ${posArr.includes(p) ? 'checked' : ''}>
                ${POS_MAP[p]?.[currentLang] || p}
              </label>
            `).join('')}
          </div>
        </span>
        <span class="col-level">
          <span class="level-badge level-${w.level}">${tierLabel}</span>
        </span>
        <span class="col-actions">
          <button class="btn-icon" onclick="editMeaning('${wid}')" id="editBtn-${wid}" title="✏️">✏️</button>
          <button class="btn-icon" onclick="saveMeaning('${wid}')" id="save-${wid}" style="display:none" title="💾">💾</button>
          <button class="btn-icon" onclick="cancelEdit('${wid}')" id="cancel-${wid}" style="display:none" title="❌">❌</button>
          <button class="btn-icon" onclick="deleteVocabWord('${wid}')" title="🗑️">🗑️</button>
        </span>
      </div>
    `;
  }).join('');
}

function editMeaning(id) {
  const meaning = document.getElementById(`meaning-${id}`);
  const edit = document.getElementById(`edit-${id}`);
  const posText = document.getElementById(`posText-${id}`);
  const posEdit = document.getElementById(`posEdit-${id}`);
  const editBtn = document.getElementById(`editBtn-${id}`);
  const save = document.getElementById(`save-${id}`);
  const cancel = document.getElementById(`cancel-${id}`);
  if (!meaning || !edit || !posText || !posEdit || !editBtn || !save || !cancel) return;
  meaning.classList.add('hidden');
  edit.classList.remove('hidden');
  posText.classList.add('hidden');
  posEdit.classList.remove('hidden');
  editBtn.style.display = 'none';
  save.style.display = 'inline';
  cancel.style.display = 'inline';
  edit.focus();
}

async function saveMeaning(id) {
  try {
    const edit = document.getElementById(`edit-${id}`);
    const posChecks = document.querySelectorAll(`#posEdit-${id} input:checked`);
    if (!edit) return;
    const newMeaning = edit.value.trim();
    const newPOS = Array.from(posChecks).map(cb => cb.value).join(',');
    const updates = {};
    if (newMeaning !== undefined) updates.chinese_meaning = newMeaning;
    if (newPOS) updates.part_of_speech = newPOS;
    await updateWordEntry(id, updates);
    
    document.getElementById(`meaning-${id}`).textContent = newMeaning;
    const posLabels = newPOS.split(',').map(p => POS_MAP[p]?.[currentLang] || p).join(', ');
    document.getElementById(`posText-${id}`).textContent = posLabels;
    
    document.getElementById(`meaning-${id}`).classList.remove('hidden');
    document.getElementById(`edit-${id}`).classList.add('hidden');
    document.getElementById(`posText-${id}`).classList.remove('hidden');
    document.getElementById(`posEdit-${id}`).classList.add('hidden');
    document.getElementById(`editBtn-${id}`).style.display = 'inline';
    document.getElementById(`save-${id}`).style.display = 'none';
    document.getElementById(`cancel-${id}`).style.display = 'none';
    
    showToast('✅ 已儲存');
  } catch (e) {
    showToast('❌ ' + e.message);
  }
}

function cancelEdit(id) {
  document.getElementById(`meaning-${id}`).classList.remove('hidden');
  document.getElementById(`edit-${id}`).classList.add('hidden');
  document.getElementById(`posText-${id}`).classList.remove('hidden');
  document.getElementById(`posEdit-${id}`).classList.add('hidden');
  document.getElementById(`editBtn-${id}`).style.display = 'inline';
  document.getElementById(`save-${id}`).style.display = 'none';
  document.getElementById(`cancel-${id}`).style.display = 'none';
}

// ============================================================
// Delete Word
// ============================================================

async function deleteVocabWord(id) {
  if (!confirm(t('english.delete') + '?')) return;
  try {
    await deleteWord(id);
    document.querySelector(`.vocab-row[data-id="${id}"]`)?.remove();
    showToast('🗑️ ' + t('english.delete'));
  } catch (e) {
    showToast('❌ ' + e.message);
  }
}

async function searchVocabList(query) {
  await applyVocabFilter(query);
}

// Tag filter for vocab book
let currentTagFilter = null;
let vocabActiveTiers = ['newbee', 'well-tested', 'mastered'];

async function loadTagFilter() {
  const select = document.getElementById('tagFilter');
  if (!select) return;
  try {
    const tags = await fetchTags();
    select.innerHTML = `<option value="">🏷️ ${t('english.all')}</option>` +
      tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('') +
      `<option value="__untagged">🚫 ${t('english.noTag')}</option>`;
  } catch(e) { console.warn('Tag filter load failed:', e); }
}

async function showCreateTagInput() {
  document.getElementById('inlineTagCreate').classList.remove('hidden');
  document.getElementById('inlineTagName').focus();
}

async function doCreateInlineTag() {
  const name = document.getElementById('inlineTagName').value.trim();
  if (!name) return;
  try {
    await createTag(name);
    document.getElementById('inlineTagName').value = '';
    document.getElementById('inlineTagCreate').classList.add('hidden');
    await loadTagFilter();
    showToast(`✅ Tag "${name}" created`);
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

async function filterByTag(tagId) {
  currentTagFilter = tagId || null;
  const query = document.getElementById('vocabSearch')?.value || '';
  await applyVocabFilter(query);
}

function toggleVocabTier(tier) {
  const idx = vocabActiveTiers.indexOf(tier);
  if (idx >= 0) {
    vocabActiveTiers.splice(idx, 1);
    document.querySelector(`.tier-btn[data-tier="${tier}"]`).classList.remove('active');
  } else {
    vocabActiveTiers.push(tier);
    document.querySelector(`.tier-btn[data-tier="${tier}"]`).classList.add('active');
  }
  const query = document.getElementById('vocabSearch')?.value || '';
  applyVocabFilter(query);
}

async function applyVocabFilter(query) {
  let words = await searchVocabulary(query);
  
  // Apply tier filter
  words = words.filter(w => {
    const tier = w.level <= 2 ? 'newbee' : w.level <= 5 ? 'well-tested' : 'mastered';
    return vocabActiveTiers.includes(tier);
  });
  
  // Apply tag filter
  if (currentTagFilter) {
    if (currentTagFilter === '__untagged') {
      // Show words with no tags
      const wordIds = words.map(w => w.id);
      const tagMap = await fetchAllWordTags(wordIds);
      words = words.filter(w => !tagMap[w.id] || tagMap[w.id].length === 0);
    } else {
      // Show words with the specific tag
      const { data } = await supabaseClient
        .from('word_tags')
        .select('word_id')
        .eq('tag_id', currentTagFilter);
      const taggedIds = new Set((data || []).map(d => d.word_id));
      words = words.filter(w => taggedIds.has(w.id));
    }
  }
  
  const list = document.getElementById('vocabList');
  if (list) list.innerHTML = await renderVocabList(words);
}

// ============================================================
// Add Words Page
// ============================================================

function showAddWordsPage() {
  const content = document.getElementById('englishContent');
  if (!content) return;
  
  content.innerHTML = `
    <div class="add-words-page">
      <h3>✏️ 輸入詞彙</h3>
      <p class="guide">輸入詞彙，以逗號、空格或換行分隔（會自動忽略標點符號如 full stop）</p>
      <textarea class="input textarea-input" id="manualWordInput" rows="6" 
                placeholder="apple, banana, cat, dog, elephant&#10;Chinese, English, Peter"></textarea>
      <div class="word-count" id="manualWordCount">0 words</div>
      <button class="btn btn-primary" onclick="processManualInput()">${t('english.submit')}</button>
      
      <div id="addResult" class="add-result"></div>
      <button class="btn btn-outline" onclick="openVocabularyBook()" style="margin-top: 1rem;">
        ${t('english.back')}
      </button>
    </div>
  `;
  
  document.getElementById('manualWordInput').addEventListener('input', function() {
    const words = this.value.trim().split(/[,\s\n]+/).filter(w => w.trim().length > 0);
    document.getElementById('manualWordCount').textContent = `${words.length} words`;
  });
}

// Manual input: split words, classify, AI translate, show review page
async function processManualInput() {
  const text = document.getElementById('manualWordInput').value.trim();
  if (!text) return;
  
  showLoading();
  try {
    // Split by comma, space, or newline; strip punctuation like full stops
    const raw = text.split(/[,\s\n]+/).map(w => w.replace(/[^a-zA-Z]/g, '')).filter(w => w.length > 1);
    if (!raw.length) { hideLoading(); return; }
    
    // Dedup preserving original casing
    const seen = new Set();
    const unique = [];      // lowercase keys
    const originalMap = {}; // lowercase -> original casing
    for (const w of raw) {
      const lower = w.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(lower);
        originalMap[lower] = w; // Keep original casing for display
      }
    }
    if (!unique.length) {
      hideLoading();
      document.getElementById('addResult').innerHTML = '<div class="result-info">No valid words</div>';
      return;
    }
    
    // Fetch existing vocabulary for duplicate check
    const allWords = await fetchVocabulary();
    const existingMap = {};
    for (const v of allWords) {
      existingMap[v.word.toLowerCase()] = v;
    }
    
    // Classify each word
    const words = [];
    for (const lower of unique) {
      const orig = originalMap[lower];
      const existing = existingMap[lower];
      let status = 'new';
      if (existing) {
        status = 'duplicate';
      } else if (isLikelyName(lower)) {
        status = 'name';
      } else if (!isLikelyValidWord(lower)) {
        status = 'error';
      }
      words.push({
        word: orig,       // preserve original casing
        lower: lower,     // lowercase for lookups
        meaning: existing ? (existing.chinese_meaning || '') : '',
        pos: status === 'name' ? 'name' : (existing ? (existing.part_of_speech || detectPOS(lower).join(',')) : detectPOS(lower).join(',')),
        status: status,
        existingId: existing ? existing.id : null,
        tagIds: [],
        tagId: ''  // per-word tag selection
      });
    }
    
    // AI translate new words (status 'new' without meaning)
    const needMeaning = words.filter(w => w.status === 'new' && !w.meaning);
    if (needMeaning.length > 0) {
      try {
        const aiWords = needMeaning.map(w => ({ normalized: w.lower, meaning: '' }));
        await callAIBatchMeanings(aiWords);
        for (const w of needMeaning) {
          const match = aiWords.find(a => a.normalized === w.lower);
          if (match && match.meaning) w.meaning = match.meaning;
        }
      } catch (e) {
        console.warn('AI translation failed:', e);
      }
    }
    
    hideLoading();
    document.getElementById('manualWordInput').value = '';
    document.getElementById('manualWordCount').textContent = '0 words';
    showWordReviewPage(words);
  } catch (e) {
    hideLoading();
    console.error('processManualInput error:', e);
    document.getElementById('addResult').innerHTML = `<div class="result-error">❌ ${e.message}</div>`;
  }
}

// Article input: full AI processing (extract, normalize, classify)
async function processArticleInput() {
  const text = document.getElementById('articleWordInput').value.trim();
  if (!text) return;
  
  showLoading();
  try {
    // Step 1: Strip punctuation, extract raw words
    let raw = text.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 1 && /^[a-zA-Z]/.test(w));
    if (!raw.length) { hideLoading(); document.getElementById('addResult').innerHTML = '<div class="result-info">No valid words</div>'; return; }
    
    // Step 2: Expand contractions
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
    const expanded = [];
    for (const w of raw) {
      expanded.push(...(CONTRACTIONS[w.toLowerCase()] || w).split(' '));
    }
    
    // Step 3: Dedup
    const seen = new Set();
    const unique = [];
    for (const w of expanded) {
      const lower = w.toLowerCase();
      if (!seen.has(lower)) { seen.add(lower); unique.push(lower); }
    }
    if (!unique.length) { hideLoading(); document.getElementById('addResult').innerHTML = '<div class="result-info">No valid words</div>'; return; }
    
    // Step 4: AI normalize
    let normalized = [];
    try {
      normalized = await callAIBatchNormalize(unique.slice(0, 100));
    } catch (e) {
      console.warn('AI normalize failed, using original words:', e);
      normalized = unique.map(w => ({ original: w, normalized: w, pos: detectPOS(w) }));
    }
    const seenNorm = new Set();
    const uniqueNorm = [];
    for (const w of normalized) {
      if (!seenNorm.has(w.normalized) && w.normalized.length > 1) {
        seenNorm.add(w.normalized);
        uniqueNorm.push({ word: w.normalized, pos: w.pos || detectPOS(w.normalized), original: w.original });
      }
    }
    const wordTexts = uniqueNorm.map(w => w.word);
    if (!wordTexts.length) {
      hideLoading();
      document.getElementById('addResult').innerHTML = '<div class="result-info">No new words to add</div>';
      return;
    }
    
    // Step 5: Classify and show review page
    let words = [];
    try {
      words = await classifyAndPrepareWords(wordTexts);
    } catch (e) {
      console.warn('Classification failed, showing raw words:', e);
      words = wordTexts.map(w => ({
        original: w, word: w, meaning: '',
        pos: detectPOS(w).join(','),
        status: 'new', existingId: null, existingData: null,
        tagIds: [], editing: false
      }));
    }
    for (const w of words) {
      const match = uniqueNorm.find(u => u.word === w.word);
      if (match && match.pos) w.pos = match.pos;
    }
    hideLoading();
    document.getElementById('articleWordInput').value = '';
    document.getElementById('articleWordCount').textContent = '0 words';
    showWordReviewPage(words);
  } catch (e) {
    hideLoading();
    console.error('processArticleInput error:', e);
    document.getElementById('addResult').innerHTML = `<div class="result-error">❌ ${e.message}</div>`;
  }
}

// ============================================================
// Classification & AI batch meaning
// ============================================================

async function classifyAndPrepareWords(wordTexts) {
  // Fetch existing vocabulary
  const allWords = await fetchVocabulary();
  const existingMap = {};
  for (const v of allWords) {
    existingMap[v.word.toLowerCase()] = v;
  }
  
  // Build word data
  const words = wordTexts.map(w => {
    const norm = normalizeWord(w);
    const existing = existingMap[norm];
    let status = 'new';
    if (existing) {
      status = 'duplicate';
    } else if (!isLikelyValidWord(norm) || (w !== norm && !isLikelyValidWord(w))) {
      status = 'error';
    } else if (isLikelyName(norm)) {
      status = 'name';
    }
    return {
      original: w,
      word: norm,
      meaning: existing ? (existing.chinese_meaning || '') : '',
      pos: status === 'name' ? 'name' : (existing ? (existing.part_of_speech || detectPOS(norm).join(',')) : detectPOS(norm).join(',')),
      status: status,
      existingId: existing ? existing.id : null,
      existingData: existing || null,
      tagIds: [],
      editing: false
    };
  });
  
  // AI batch translate new words without meaning
  const needMeaning = words.filter(w => w.status === 'new' && !w.meaning);
  if (needMeaning.length > 0) {
    const aiWords = needMeaning.map(w => ({ normalized: w.word, meaning: '' }));
    await callAIBatchMeanings(aiWords);
    for (const w of needMeaning) {
      const match = aiWords.find(a => a.normalized === w.word);
      if (match && match.meaning) w.meaning = match.meaning;
    }
  }
  
  // Fetch tags for duplicate words
  const dupIds = words.filter(w => w.status === 'duplicate' && w.existingId).map(w => w.existingId);
  if (dupIds.length > 0) {
    try {
      const tagMap = await fetchAllWordTags(dupIds);
      for (const w of words) {
        if (w.existingId && tagMap[w.existingId]) {
          w.existingTags = tagMap[w.existingId];
        }
      }
    } catch(e) { console.warn('Tag fetch failed:', e); }
  }
  
  return words;
}

// ============================================================
// Word Review Page — Success / Names / Errors sections
// ============================================================

let reviewData = { words: [], selectedTagId: null, allTags: [] };

function showWordReviewPage(words) {
  reviewData.words = words;
  reviewData.selectedTagId = null;

  const content = document.getElementById('englishContent');
  if (!content) return;

  // Load tags for per-word selectors
  fetchTags().then(tags => { reviewData.allTags = tags; });

  const success = words.filter(w => w.status === 'new' || w.status === 'duplicate');
  const names = words.filter(w => w.status === 'name');
  const errors = words.filter(w => w.status === 'error');

  content.innerHTML = `
    <div class="review-page">
      <h3>✏️ ${t('english.reviewWords')}</h3>
      
      <div class="review-sections">
        <div class="review-section review-section-success">
          <div class="review-section-header">✅ 成功輸入 (${success.length})</div>
          <div class="review-section-body" id="reviewSuccessList">
            ${success.length ? success.map((w, i) => renderReviewWordRow(w, reviewData.words.indexOf(w))).join('') : '<div class="review-col-empty">沒有詞彙</div>'}
          </div>
        </div>

        <div class="review-section review-section-name">
          <div class="review-section-header">👤 人名/地名 (${names.length})</div>
          <div class="review-section-body" id="reviewNameList">
            ${names.length ? names.map((w, i) => renderReviewWordRow(w, reviewData.words.indexOf(w))).join('') : '<div class="review-col-empty">沒有詞彙</div>'}
          </div>
        </div>

        <div class="review-section review-section-error">
          <div class="review-section-header">❌ 錯誤輸入 (${errors.length})</div>
          <div class="review-section-body" id="reviewErrorList">
            ${errors.length ? errors.map((w, i) => renderReviewWordRow(w, reviewData.words.indexOf(w))).join('') : '<div class="review-col-empty">沒有詞彙</div>'}
          </div>
        </div>
      </div>

      <div class="review-actions" style="margin-top:1rem">
        <button class="btn btn-primary" onclick="completeReview()">✅ ${t('english.complete')} (${success.length + names.length})</button>
      </div>
    </div>
  `;
}

function renderReviewWordRow(w, idx) {
  const posLabels = w.pos ? w.pos.split(',').map(p => POS_MAP[p]?.[currentLang] || p).join(', ') : '';
  const tagOptions = reviewData.allTags.map(t =>
    `<option value="${t.id}" ${w.tagId === t.id ? 'selected' : ''}>${t.name}</option>`
  ).join('');

  return `
    <div class="review-word-row" data-idx="${idx}">
      <div class="review-word-info">
        <button class="btn-icon" onclick="editReviewWord(${idx})" title="✏️">✏️</button>
        <span class="review-word-word"><strong>${w.word}</strong></span>
        <span class="review-word-meaning" onclick="inlineEditMeaning(${idx})" title="按一下編輯中文意思">📖 <span id="meaningDisplay-${idx}">${w.meaning || '—'}</span></span>
        <span class="review-word-pos" onclick="inlineEditPOS(${idx})" title="按一下編輯詞性">🔤 <span id="posDisplay-${idx}">${posLabels}</span></span>
        <select class="input review-word-tag-select" onchange="onReviewWordTagChange(${idx}, this.value)" style="max-width:110px;font-size:0.8rem">
          <option value="">🏷️ —</option>
          ${tagOptions}
        </select>
      </div>
      <div class="review-word-row-actions">
        <button class="btn-icon" onclick="deleteReviewWord(${idx})" title="🗑️">🗑️</button>
        ${w.status === 'error' ? `<button class="btn-icon" onclick="fixReviewWord(${idx})" title="🔧 修正">🔧</button>` : ''}
        ${w.status === 'name' ? `<button class="btn-icon" onclick="keepReviewWord(${idx})" title="✅ 保留">✅</button>` : ''}
      </div>
    </div>
  `;
}

function inlineEditMeaning(idx) {
  const w = reviewData.words[idx];
  if (!w) return;
  const display = document.getElementById(`meaningDisplay-${idx}`);
  if (!display) return;
  const current = w.meaning || '';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = current;
  input.className = 'input inline-edit-input';
  input.style.width = '150px';
  input.onblur = function() {
    w.meaning = this.value.trim();
    display.textContent = w.meaning || '—';
    this.replaceWith(display);
  };
  input.onkeydown = function(e) {
    if (e.key === 'Enter') this.blur();
    if (e.key === 'Escape') { this.value = current; this.blur(); }
  };
  display.replaceWith(input);
  input.focus();
  input.select();
}

function inlineEditPOS(idx) {
  const w = reviewData.words[idx];
  if (!w) return;
  const display = document.getElementById(`posDisplay-${idx}`);
  if (!display) return;
  const current = w.pos || '';
  const input = document.createElement('select');
  input.className = 'input inline-edit-input';
  input.style.width = '120px';
  input.innerHTML = Object.entries(POS_MAP).map(([key, val]) =>
    `<option value="${key}" ${current === key ? 'selected' : ''}>${val[currentLang] || key}</option>`
  ).join('');
  input.onblur = function() {
    w.pos = this.value;
    const newLabel = POS_MAP[w.pos]?.[currentLang] || w.pos;
    display.textContent = newLabel;
    this.replaceWith(display);
  };
  input.onkeydown = function(e) {
    if (e.key === 'Escape') { this.value = current; this.blur(); }
  };
  display.replaceWith(input);
  input.focus();
}

function onReviewWordTagChange(idx, tagId) {
  if (reviewData.words[idx]) reviewData.words[idx].tagId = tagId;
}

function editReviewWord(idx) {
  const w = reviewData.words[idx];
  const newWord = prompt('修改英文詞彙:', w.word);
  if (newWord && newWord.trim()) {
    w.word = newWord.trim().toLowerCase();
    w.lower = w.word;
    const newMeaning = prompt('修改中文意思:', w.meaning || '');
    if (newMeaning !== null) w.meaning = newMeaning.trim();
    refreshReviewPage();
  }
}

function deleteReviewWord(idx) {
  reviewData.words.splice(idx, 1);
  refreshReviewPage();
}

function fixReviewWord(idx) {
  const w = reviewData.words[idx];
  const newWord = prompt('修正英文詞彙:', w.word);
  if (!newWord || !newWord.trim()) return;
  const lower = newWord.trim().toLowerCase();
  // Re-classify: if it looks valid, move to 'new'; otherwise keep as 'error'
  w.word = newWord.trim();
  w.lower = lower;
  if (isLikelyValidWord(lower) && !isLikelyName(lower)) {
    w.status = 'new';
    w.meaning = ''; // Will get AI translation on complete
  } else if (isLikelyName(lower)) {
    w.status = 'name';
  }
  refreshReviewPage();
}

function keepReviewWord(idx) {
  const w = reviewData.words[idx];
  w.status = 'new';  // Move name to success list
  refreshReviewPage();
}

function refreshReviewPage() {
  // Re-render the page by re-splitting into sections
  // Just call showWordReviewPage with current data
  showWordReviewPage(reviewData.words);
}

async function completeReview() {
  showLoading();
  try {
    // Re-classify all words first (handles edits like 'banan'→'banana')
    const allWords = await fetchVocabulary();
    const existingMap = {};
    for (const v of allWords) {
      existingMap[v.word.toLowerCase()] = v;
    }
    for (const w of reviewData.words) {
      const norm = normalizeWord(w.word);
      const existing = existingMap[norm];
      w.word = norm;
      if (existing) {
        w.status = 'duplicate';
        w.existingId = existing.id;
        w.existingData = existing;
      } else if (!isLikelyValidWord(norm)) {
        w.status = 'error';
        w.existingId = null; w.existingData = null;
      } else if (isLikelyName(norm)) {
        w.status = 'name';
        w.existingId = null; w.existingData = null;
      } else {
        w.status = 'new';
        w.existingId = null; w.existingData = null;
      }
    }
    
    const newWords = reviewData.words.filter(w => w.status === 'new');
    const nameWords = reviewData.words.filter(w => w.status === 'name');
    const duplicates = reviewData.words.filter(w => w.status === 'duplicate');
    const errors = reviewData.words.filter(w => w.status === 'error');
    
    // Skip errors entirely, update duplicates
    for (const d of duplicates) {
      if (d.existingId && (d.meaning || d.pos)) {
        const updates = {};
        if (d.meaning && d.meaning !== (d.existingData?.chinese_meaning || '')) {
          updates.chinese_meaning = d.meaning;
        }
        if (d.pos && d.pos !== (d.existingData?.part_of_speech || '')) {
          updates.part_of_speech = d.pos;
        }
        if (Object.keys(updates).length > 0) {
          await updateWordEntry(d.existingId, updates);
        }
      }
    }
    
    // Add new words + name words (user decided to keep)
    const allNew = [...newWords, ...nameWords];
    let addResult = { added: 0, duplicates: 0 };
    if (allNew.length > 0) {
      const wordObjs = allNew.map(w => ({
        word: w.word,
        pos: w.pos || detectPOS(w.word).join(','),
        meaning: w.meaning || ''
      }));
      addResult = await bulkAddWords(wordObjs, null); // Don't use global tag — per-word tags handled below
      
      // Assign per-word tags
      if (addResult.addedIds && addResult.addedIds.length > 0) {
        for (let i = 0; i < allNew.length; i++) {
          const tagId = allNew[i].tagId;
          if (tagId && addResult.addedIds[i]) {
            try {
              await addTagToWord(addResult.addedIds[i], tagId);
            } catch(e) { console.warn('Tag assign failed:', e); }
          }
        }
      }
    }
    
    const parts = [];
    if (addResult.added > 0) parts.push(`✅ ${addResult.added} new`);
    if (errors.length > 0) parts.push(`❌ ${errors.length} skipped`);
    showToast(parts.join(' · ') || '✅ ' + t('english.wordAdded'));
    openVocabularyBook();
  } catch (e) {
    showToast('❌ ' + e.message);
  }
  hideLoading();
}

// ============================================================
// Review Tag Selection
// ============================================================

async function loadReviewTagOptions() {
  const select = document.getElementById('reviewTagSelect');
  if (!select) return;
  try {
    const tags = await fetchTags();
    const currentVal = select.value;
    select.innerHTML = `<option value="">— ${t('english.noTag')} —</option>` +
      tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    if (currentVal) select.value = currentVal;
  } catch(e) { console.warn('Load tags failed:', e); }
}

function onReviewTagChange(tagId) {
  reviewData.selectedTagId = tagId || null;
}

function showNewReviewTagInput() {
  document.getElementById('reviewNewTag').classList.remove('hidden');
}

async function createReviewTag() {
  const name = document.getElementById('reviewTagName').value.trim();
  if (!name) return;
  try {
    const tag = await createTag(name);
    document.getElementById('reviewTagName').value = '';
    document.getElementById('reviewNewTag').classList.add('hidden');
    await loadReviewTagOptions();
    document.getElementById('reviewTagSelect').value = tag.id;
    reviewData.selectedTagId = tag.id;
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

// ============================================================
// Tag Management in Vocab Book
// ============================================================

async function renderVocabList(words) {
  if (!words.length) {
    return `<div class="empty-state">${t('common.placeholders')}</div>`;
  }
  
  // Fetch tags for all words
  const wordIds = words.map(w => w.id).filter(Boolean);
  let tagMap = {};
  if (wordIds.length > 0) {
    try { tagMap = await fetchAllWordTags(wordIds); } catch(e) {}
  }
  
  return words.map(w => {
    const posArr = w.part_of_speech ? w.part_of_speech.split(',') : [];
    const posLabels = posArr.map(p => POS_MAP[p]?.[currentLang] || p).join(', ');
    const tierLabel = getTierLabel(w.level);
    const allPOS = Object.keys(POS_MAP);
    const tags = tagMap[w.id] || [];
    const tagHtml = tags.map(t => 
      `<span class="tag-badge" style="background:${t.color || '#6366f1'}20;color:${t.color || '#6366f1'}" onclick="event.stopPropagation();showWordTagManager('${w.id}')">${t.name}</span>`
    ).join('');
    
    return `
      <div class="vocab-row" data-id="${w.id}">
        <span class="col-word"><strong>${w.word}</strong></span>
        <span class="col-meaning">
          <span class="meaning-text" id="meaning-${w.id}">${w.chinese_meaning || ''}</span>
          <input class="input edit-input hidden" id="edit-${w.id}" value="${w.chinese_meaning || ''}">
        </span>
        <span class="col-pos">
          <span class="pos-text" id="posText-${w.id}">${posLabels}</span>
          <div class="pos-edit hidden" id="posEdit-${w.id}">
            ${allPOS.map(p => `
              <label class="pos-checkbox">
                <input type="checkbox" value="${p}" ${posArr.includes(p) ? 'checked' : ''}>
                ${POS_MAP[p]?.[currentLang] || p}
              </label>
            `).join('')}
          </div>
        </span>
        <span class="col-level">
          <span class="level-badge level-${w.level}">${tierLabel}</span>
        </span>
        <span class="col-tags">${tagHtml || ''}</span>
        <span class="col-actions">
          <button class="btn-icon" onclick="showWordTagManager('${w.id}')" title="${t('english.tags')}">🏷️</button>
          <button class="btn-icon" onclick="editMeaning('${w.id}')" id="editBtn-${w.id}" title="${t('english.edit')}">✏️</button>
          <button class="btn-icon" onclick="saveMeaning('${w.id}')" id="save-${w.id}" style="display:none" title="${t('english.save')}">💾</button>
          <button class="btn-icon" onclick="cancelEdit('${w.id}')" id="cancel-${w.id}" style="display:none" title="${t('english.cancel')}">❌</button>
          <button class="btn-icon" onclick="deleteVocabWord('${w.id}')" title="${t('english.delete')}">🗑️</button>
        </span>
      </div>
    `;
  }).join('');
}

// ============================================================
// Word Tag Manager Modal
// ============================================================

async function showWordTagManager(wordId) {
  const word = document.querySelector(`.vocab-row[data-id="${wordId}"] .col-word`);
  const wordName = word ? word.textContent.trim() : '';
  
  const tags = await fetchTags();
  const wordTags = await fetchWordTags(wordId);
  const wordTagIds = new Set(wordTags.map(t => t.id));
  
  // Simple overlay
  const overlay = document.createElement('div');
  overlay.className = 'tag-manager-overlay';
  overlay.innerHTML = `
    <div class="tag-manager-modal">
      <div class="tag-manager-header">
        <strong>🏷️ ${t('english.tags')}: ${wordName}</strong>
        <button class="btn-icon" onclick="this.closest('.tag-manager-overlay').remove()">✕</button>
      </div>
      <div class="tag-manager-body">
        ${tags.map(t => `
          <label class="tag-manager-item ${wordTagIds.has(t.id) ? 'selected' : ''}">
            <input type="checkbox" ${wordTagIds.has(t.id) ? 'checked' : ''}
                   onchange="toggleWordTag('${wordId}', '${t.id}', this.checked)">
            <span class="tag-badge" style="background:${t.color}20;color:${t.color}">${t.name}</span>
          </label>
        `).join('')}
        ${!tags.length ? `<div class="review-col-empty">${t('common.placeholders')}</div>` : ''}
      </div>
      <div class="tag-manager-footer">
        <button class="btn btn-sm btn-outline" onclick="this.closest('.tag-manager-overlay').remove()">${t('english.complete')}</button>
        <button class="btn btn-sm btn-danger" onclick="deleteWordTagManager('${wordId}')">🗑️ ${t('english.deleteTag')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

async function toggleWordTag(wordId, tagId, add) {
  try {
    if (add) {
      await addTagToWord(wordId, tagId);
    } else {
      await removeTagFromWord(wordId, tagId);
    }
    // Refresh the row's tag badges immediately
    await refreshVocabRowTags(wordId);
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

async function refreshVocabRowTags(wordId) {
  const row = document.querySelector(`.vocab-row[data-id="${wordId}"]`);
  if (!row) return;
  const tagsEl = row.querySelector('.col-tags');
  if (!tagsEl) return;
  try {
    const tags = await fetchWordTags(wordId);
    if (tags.length > 0) {
      tagsEl.innerHTML = tags.map(t => 
        `<span class="tag-badge" style="background:${t.color || '#6366f1'}20;color:${t.color || '#6366f1'}">${t.name}</span>`
      ).join('');
    } else {
      tagsEl.innerHTML = '<span class="text-light" style="font-size:0.75rem">—</span>';
    }
  } catch(e) {
    console.warn('Refresh tags failed:', e);
  }
}

async function deleteWordTagManager(wordId) {
  // Show all tags and let user delete one
  const tags = await fetchTags();
  const tagNames = tags.map((t, i) => `${i+1}. ${t.name}`).join('\n');
  const input = prompt(`Which tag to delete?\n${tagNames}\n\nEnter tag number or name:`);
  if (!input) return;
  const idx = parseInt(input) - 1;
  const tag = tags[idx] || tags.find(t => t.name === input);
  if (!tag) { showToast('❌ Tag not found'); return; }
  try {
    await removeTagFromWord(wordId, tag.id);
    showToast(`✅ Removed tag "${tag.name}"`);
    // Refresh the modal
    document.querySelector('.tag-manager-overlay')?.remove();
    showWordTagManager(wordId);
  } catch(e) {
    showToast('❌ ' + e.message);
  }
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
  navTriggered = true;
  navigateTo('english', true);
}

function toggleMobileMenu() {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('open');
}

// ============================================================
// Dropdown Toggles
// ============================================================

function toggleLangDropdown() {
  document.getElementById('langDropdown').classList.toggle('hidden');
  document.getElementById('userDropdown').classList.add('hidden');
}

function toggleUserDropdown() {
  document.getElementById('userDropdown').classList.toggle('hidden');
  document.getElementById('langDropdown').classList.add('hidden');
}

async function handleLogout() {
  document.getElementById('userDropdown').classList.add('hidden');
  await logout();
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-selector-simple')) {
    document.getElementById('langDropdown')?.classList.add('hidden');
  }
  if (!e.target.closest('.user-info')) {
    document.getElementById('userDropdown')?.classList.add('hidden');
  }
});

// ============================================================
// Language Selector (simplified)
// ============================================================

// Override lang-btn click handlers for the new simplified design
document.addEventListener('DOMContentLoaded', () => {
  // Re-init lang selector — use lang-opt buttons instead of old lang-btn
  document.querySelectorAll('.lang-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      document.querySelectorAll('.lang-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setLanguage(lang);
      document.getElementById('langBtnMain').textContent = btn.textContent + ' ▾';
      document.getElementById('langDropdown').classList.add('hidden');
      // Get current page from active nav link
      const activeLink = document.querySelector('.nav-link.active');
      const page = activeLink ? activeLink.dataset.page : 'about';
      navigateTo(page, true);
    });
  });
  // Restore saved language
  const saved = localStorage.getItem('lang') || 'zh-TW';
  const activeOpt = document.querySelector(`.lang-opt[data-lang="${saved}"]`);
  if (activeOpt) {
    activeOpt.classList.add('active');
    document.getElementById('langBtnMain').textContent = activeOpt.textContent + ' ▾';
  }
});

// ============================================================
// Account Settings Page
// ============================================================

async function openAccountSettings() {
  document.getElementById('userDropdown').classList.add('hidden');
  // Update hash without triggering full navigation
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
  
  // Save speech speeds locally
  const slowSlider = document.getElementById('settingSlowRate');
  if (slowSlider) setSlowRate(parseFloat(slowSlider.value));
  const fastSlider = document.getElementById('settingFastRate');
  if (fastSlider) setFastRate(parseFloat(fastSlider.value));
  
  // Save celebration music setting
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