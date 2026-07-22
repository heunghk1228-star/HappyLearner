// ============================================================
// Auth Modal — Login / Register / Google Sign-In
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
        <div class="auth-divider"><span>or</span></div>
        <button class="btn btn-outline" onclick="handleDemoLogin()" style="width:100%;justify-content:center">
          👤 ${t('english.demoLogin')}
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
      if (result?.user?.identities?.length === 0) {
        showToast('📧 Please check your email to confirm registration');
      }
    }
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
  } catch (e) {
    showToast('❌ Google sign in failed: ' + e.message);
  }
}