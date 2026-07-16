// ============================================================
// Supabase Auth — Login / Register / Session management
// ============================================================

let supabaseClient;
let currentUser = null;

async function initSupabase() {
  // Check if supabase library loaded
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase library not loaded');
    return null;
  }
  
  const { createClient } = window.supabase;
  supabaseClient = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
  
  // Check existing session
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      currentUser = session.user;
      await ensureProfile(session.user.id);
    }
  } catch (e) {
    console.warn('Session check failed:', e.message);
  }
  
  // Listen for auth changes
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      currentUser = session.user;
      try {
        await ensureProfile(session.user.id);
      } catch (e) {
        console.warn('Profile creation failed:', e.message);
      }
    } else {
      currentUser = null;
    }
    updateAuthUI();
    if (window.onAuthChange) window.onAuthChange(currentUser);
  });
  
  updateAuthUI();
  return supabaseClient;
}

async function ensureProfile(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (error && error.code === 'PGRST116') {
    await supabaseClient
      .from('profiles')
      .insert({ id: userId, gems: 0 });
  }
}

async function login(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email, password
  });
  if (error) throw error;
  return data;
}

async function register(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email, password
  });
  if (error) throw error;
  return data;
}

async function logout() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

async function signInWithGoogle() {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin || 'https://happy-learner.vercel.app'
    }
  });
  if (error) throw error;
  return data;
}

async function getProfile() {
  if (!currentUser) return null;
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();
  if (error) return null;
  return data;
}

async function updateGems(newCount) {
  if (!currentUser) return;
  await supabaseClient
    .from('profiles')
    .update({ gems: newCount })
    .eq('id', currentUser.id);
}

function updateAuthUI() {
  const loginBtn = document.getElementById('loginBtn');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  
  if (!loginBtn) return;
  
  if (currentUser) {
    loginBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userName.textContent = currentUser.email.split('@')[0];
    loadGemCount();
  } else {
    loginBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
  }
}

async function loadGemCount() {
  const profile = await getProfile();
  const gemCount = document.getElementById('gemCount');
  if (profile && gemCount) {
    gemCount.textContent = profile.gems || 0;
  }
}