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
      navigateTo(link.dataset.page, true);
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

  // Hash-based routing
  // Guard: skip spurious hashchange when tab is restored from BFCache
  window.addEventListener('hashchange', () => {
    if (document.hidden) return;
    const newHash = window.location.hash;
    if (newHash === lastKnownHash) return;
    lastKnownHash = newHash;
    const page = getCurrentPageFromHash();
    if (page) navigateTo(page, false);
  });

  // Browser back/forward
  window.addEventListener('popstate', () => {
    const newHash = window.location.hash;
    if (newHash === lastKnownHash) return;
    lastKnownHash = newHash;
    const page = getCurrentPageFromHash();
    if (page) navigateTo(page, false);
  });

  // Sync hash when tab becomes visible (prevents BFCache spurious events)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastKnownHash = window.location.hash;
    }
  });
  
  // Navigate to initial page from hash or default
  const initialPage = getCurrentPageFromHash() || 'about';
  navigateTo(initialPage, false);
  
  // Auth callback
  window.onAuthChange = (user) => {
    if (user) {
      hideAuthModal();
      const page = getCurrentPageFromHash();
      if (page) {
        const content = document.getElementById('pageContent');
        if (content) {
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

let lastKnownHash = window.location.hash || '';

function navigateTo(page, pushHash) {
  // Close mobile menu
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.remove('open');
  
  if (pushHash) {
    window.location.hash = page;
    lastKnownHash = '#' + page;
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
      <div class="hero-section">
        <h1 class="hero-title">${t('about.title')}</h1>
        <p class="hero-subtitle">${t('about.subtitle')}</p>
      </div>
      <div class="philosophy-section">
        <h2>${t('about.philosophy_title')}</h2>
        <p>${t('about.philosophy')}</p>
      </div>
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
// Language Selector
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lang-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      document.querySelectorAll('.lang-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setLanguage(lang);
      document.getElementById('langBtnMain').textContent = btn.textContent + ' ▾';
      document.getElementById('langDropdown').classList.add('hidden');
      const activeLink = document.querySelector('.nav-link.active');
      const page = activeLink ? activeLink.dataset.page : 'about';
      navigateTo(page, true);
    });
  });
  const saved = localStorage.getItem('lang') || 'zh-TW';
  const activeOpt = document.querySelector(`.lang-opt[data-lang="${saved}"]`);
  if (activeOpt) {
    activeOpt.classList.add('active');
    document.getElementById('langBtnMain').textContent = activeOpt.textContent + ' ▾';
  }
});