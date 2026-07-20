// ============================================================
// Revision Module — Short-term Memory Test with Filters
// ============================================================

let testWords = [];
let currentTestIndex = 0;
let correctCount = 0;
let testQuestions = [];
let retryQueue = [];
let initialQuestionCount = 0;

// Tier filter state for word selection
let revisionActiveTiers = ['newbee', 'well-tested', 'mastered'];
let revisionTagFilter = '';

// ============================================================
// Page: Word Selection (entry point)
// ============================================================

async function showRevisionPage() {
  if (!currentUser) {
    alert(t('english.loginRequired'));
    return;
  }
  if (window.location.hash !== '#english/revision') {
    history.pushState({}, '', '#english/revision');
    lastKnownHash = '#english/revision';
  }

  const page = document.getElementById('pageContent');
  page.innerHTML = `
    <div class="page-header">
      <h2>${t('english.revisionTitle')}</h2>
    </div>
    <div id="revisionArea"></div>
  `;

  await showWordSelection();
}

// ============================================================
// Word Selection with Tag + Tier Filters
// ============================================================

async function showWordSelection() {
  const area = document.getElementById('revisionArea');
  if (!area) return;

  const words = await fetchVocabulary();
  if (!words.length) {
    area.innerHTML = `<div class="empty-state">${t('common.placeholders')}</div>`;
    return;
  }

  // Load tags for filter dropdown
  const tags = await fetchTags();
  const tagOptions = tags.map(t =>
    `<option value="${t.id}">${t.name}</option>`
  ).join('');

  area.innerHTML = `
    <div class="word-selection">
      <h3>📝 ${t('english.filter')} ${t('english.words')}</h3>

      <div class="selection-filters">
        <div class="filter-row">
          <label>🏷️ ${t('english.tag')}:</label>
          <select class="input" id="revisionTagFilter" onchange="onRevisionFilterChange()" style="max-width:160px">
            <option value="">${t('english.all')}</option>
            ${tagOptions}
            <option value="__untagged">🚫 ${t('english.noTag')}</option>
          </select>
        </div>

        <div class="filter-row">
          <label>📊 ${t('english.level')}:</label>
          <div class="tier-filter-btns">
            <button class="tier-btn tier-newbee active" data-tier="newbee" onclick="toggleRevisionTier('newbee')">🟢 ${t('english.newbee')}</button>
            <button class="tier-btn tier-well-tested active" data-tier="well-tested" onclick="toggleRevisionTier('well-tested')">🟡 ${t('english.wellTested')}</button>
            <button class="tier-btn tier-mastered active" data-tier="mastered" onclick="toggleRevisionTier('mastered')">🔵 ${t('english.mastered')}</button>
          </div>
        </div>
      </div>

      <div class="selection-actions">
        <label class="checkbox-inline">
          <input type="checkbox" id="selectAllCheck" onchange="toggleSelectAll()" checked>
          <strong>${t('english.selectAll')}</strong>
        </label>
        <span class="selection-count" id="selectionCount">${t('english.totalWords')}: <strong id="selectedCount">${words.length}</strong></span>
      </div>

      <div class="selection-list" id="revisionWordList"></div>

      <div class="selection-bottom">
        <div class="question-count-row">
          <label>📝 ${t('english.question')} ${t('english.of')} ${t('english.words')}:</label>
          <input type="number" class="input" id="questionCount" value="${words.length}" min="1" max="${words.length}" style="width:80px">
          <span class="question-count-note">(${t('english.totalWords')}: <span id="maxCount">${words.length}</span>)</span>
        </div>
        <button class="btn btn-primary" onclick="confirmWordSelection()">${t('english.startTest')}</button>
      </div>
    </div>
  `;

  // Render word list
  renderRevisionWordList(words);
}

function renderRevisionWordList(words) {
  const list = document.getElementById('revisionWordList');
  if (!list) return;

  // Apply tier filter
  let filtered = words.filter(w => {
    const tier = w.level <= 2 ? 'newbee' : w.level <= 5 ? 'well-tested' : 'mastered';
    return revisionActiveTiers.includes(tier);
  });

  // Apply tag filter
  if (revisionTagFilter) {
    applyRevisionTagFilter(filtered).then(f => {
      filtered = f;
      renderListItems(filtered, words.length);
    });
  } else {
    renderListItems(filtered, words.length);
  }
}

async function applyRevisionTagFilter(words) {
  const wordIds = words.map(w => w.id).filter(Boolean);
  if (!wordIds.length) return [];

  if (revisionTagFilter === '__untagged') {
    const tagMap = await fetchAllWordTags(wordIds);
    return words.filter(w => !tagMap[w.id] || tagMap[w.id].length === 0);
  }

  const { data } = await supabaseClient
    .from('word_tags')
    .select('word_id')
    .eq('tag_id', revisionTagFilter);
  const taggedIds = new Set((data || []).map(d => d.word_id));
  return words.filter(w => taggedIds.has(w.id));
}

function renderListItems(filtered, totalCount) {
  const list = document.getElementById('revisionWordList');
  const selectAll = document.getElementById('selectAllCheck');

  list.innerHTML = filtered.map(w => {
    const tier = w.level <= 2 ? 'newbee' : w.level <= 5 ? 'well-tested' : 'mastered';
    const tierLabel = getTierLabel(w.level);
    return `
      <label class="selection-item">
        <input type="checkbox" value="${w.id}" data-word='${JSON.stringify(w).replace(/'/g, "&#39;")}' checked onchange="updateSelectionCount()">
        <span><strong>${w.word}</strong> <small>${w.chinese_meaning || ''}</small> <span class="tier-badge tier-${tier}">${tierLabel}</span></span>
      </label>
    `;
  }).join('');

  // Update counts
  const selected = document.querySelectorAll('#revisionWordList input:checked').length;
  document.getElementById('selectedCount').textContent = selected;
  document.getElementById('maxCount').textContent = selected;
  const qtyInput = document.getElementById('questionCount');
  qtyInput.max = selected;
  if (parseInt(qtyInput.value) > selected) qtyInput.value = selected;

  // Update select-all state
  const allChecked = document.querySelectorAll('#revisionWordList input:checked').length === filtered.length;
  selectAll.checked = allChecked && filtered.length > 0;
}

function updateSelectionCount() {
  const selected = document.querySelectorAll('#revisionWordList input:checked').length;
  document.getElementById('selectedCount').textContent = selected;
  document.getElementById('maxCount').textContent = selected;
  const qtyInput = document.getElementById('questionCount');
  qtyInput.max = selected;
  if (parseInt(qtyInput.value) > selected) qtyInput.value = selected;
}

function toggleSelectAll() {
  const checked = document.getElementById('selectAllCheck').checked;
  document.querySelectorAll('#revisionWordList input[type="checkbox"]').forEach(cb => cb.checked = checked);
  updateSelectionCount();
}

function toggleRevisionTier(tier) {
  const idx = revisionActiveTiers.indexOf(tier);
  if (idx >= 0) {
    revisionActiveTiers.splice(idx, 1);
    document.querySelector(`.tier-btn[data-tier="${tier}"]`).classList.remove('active');
  } else {
    revisionActiveTiers.push(tier);
    document.querySelector(`.tier-btn[data-tier="${tier}"]`).classList.add('active');
  }
  // Re-render
  fetchVocabulary().then(words => renderRevisionWordList(words));
}

function onRevisionFilterChange() {
  revisionTagFilter = document.getElementById('revisionTagFilter').value;
  fetchVocabulary().then(words => renderRevisionWordList(words));
}

// ============================================================
// Start Test
// ============================================================

function confirmWordSelection() {
  const checked = document.querySelectorAll('#revisionWordList input:checked');
  if (checked.length === 0) {
    alert(t('english.filter'));
    return;
  }

  const qty = parseInt(document.getElementById('questionCount').value);
  if (qty < 1 || qty > checked.length) {
    alert(`${t('english.question')} ${t('english.of')} ${t('english.words')} ${t('english.filter')}`);
    return;
  }

  // Reset state
  currentTestIndex = 0;
  correctCount = 0;
  testQuestions = [];
  retryQueue = [];
  initialQuestionCount = 0;

  testWords = [];
  checked.forEach(cb => {
    const wordData = JSON.parse(cb.dataset.word);
    testWords.push(wordData);
  });

  // Shuffle and pick question count
  shuffleArray(testWords);
  testWords = testWords.slice(0, qty);

  prepareQuestions();
}

function prepareQuestions() {
  testQuestions = [];
  initialQuestionCount = testWords.length;

  for (const word of testWords) {
    const level = word.level || 1;
    const qType = level <= 2 ? 'spelling' : 'fillblank';

    testQuestions.push({
      word,
      type: qType,
      answered: false,
      correct: false
    });
  }

  shuffleArray(testQuestions);
  showQuestion();
}

// ============================================================
// Question Display
// ============================================================

function showQuestion() {
  const area = document.getElementById('revisionArea');

  // If all initial questions done, check retry queue
  if (currentTestIndex >= testQuestions.length) {
    if (retryQueue.length > 0) {
      // Retry phase: use retryQueue as new questions
      testQuestions = retryQueue;
      retryQueue = [];
      currentTestIndex = 0;
      // Show retry header
    } else {
      finishTest();
      return;
    }
  }

  const q = testQuestions[currentTestIndex];
  const isLast = currentTestIndex >= testQuestions.length - 1;
  const isRetry = q.isRetry;

  area.innerHTML = `
    <div class="test-progress">
      ${isRetry ? '🔄 ' : ''}${t('english.question')} ${currentTestIndex + 1} ${t('english.of')} ${testQuestions.length}
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(currentTestIndex / testQuestions.length) * 100}%"></div>
      </div>
    </div>
    ${isRetry ? '<div class="retry-notice">🔄 重溫錯題</div>' : ''}
    <div class="test-card">
      ${q.type === 'spelling' ? renderSpellingQuestion(q) : renderFillBlankQuestion(q)}
    </div>
    <div class="test-result" id="testResult"></div>
    <div class="test-actions">
      <button class="btn btn-primary" id="submitAnswerBtn" onclick="submitAnswer()">
        ✅ 確定
      </button>
    </div>
  `;

  // Auto-speak for spelling questions
  if (q.type === 'spelling') {
    setTimeout(() => speakWord(q.word.word, getSlowRate()), 500);
  }
}

function renderSpellingQuestion(q) {
  const word = q.word.word;
  return `
    <div class="question-type">${t('english.listenAndType')}</div>
    <div class="sound-btns-row">
      <button class="sound-btn-large" onclick="speakWordSlow('${word}')" title="🐢 ${t('english.slow')}">🐢</button>
      <button class="sound-btn-large" onclick="speakWordFast('${word}')" title="🐇 ${t('english.fast')}">🐇</button>
    </div>
    <div class="question-word-hint">
      <small>${q.word.chinese_meaning || ''}</small>
    </div>
    <input type="text" id="answerInput" class="input answer-input" 
           placeholder="${t('english.typeHere')}" autocomplete="off"
           onkeydown="if(event.key==='Enter') submitAnswer()">
  `;
}

function renderFillBlankQuestion(q) {
  const word = q.word;
  setTimeout(() => generateSentence(word.word), 50);
  return `
    <div class="question-type">${t('english.fillBlank')}</div>
    <div class="fill-blank-sentence" id="sentenceDisplay">
      <div class="loading-sentence">${t('common.loading')}</div>
    </div>
    <div class="fill-blank-actions">
      <button class="hint-btn-large" onclick="showHint('${word.id}')" title="💡 提示">💡</button>
    </div>
    <input type="text" id="answerInput" class="input answer-input" 
           placeholder="${t('english.typeHere')}" autocomplete="off"
           onkeydown="if(event.key==='Enter') submitAnswer()">
  `;
}

async function generateSentence(word) {
  const display = document.getElementById('sentenceDisplay');
  if (!display) return;

  try {
    const sentence = await callAISentence(word);
    if (sentence && display) {
      const blanked = sentence.replace(new RegExp(word, 'gi'), '________');
      display.innerHTML = `
        <div class="sentence-text">${blanked}</div>
        <div class="sentence-source">✨ AI generated</div>
      `;
      display.dataset.sentence = sentence;
      display.dataset.word = word;
      return;
    }
  } catch (e) {
    console.log('AI failed, using fallback');
  }

  const fallback = `Please _____ the word "${word}" in this sentence.`;
  display.innerHTML = `
    <div class="sentence-text">${fallback.replace(word, '________')}</div>
    <div class="sentence-source">📝 Fallback</div>
  `;
  display.dataset.sentence = fallback;
  display.dataset.word = word;
}

function showHint(wordId) {
  const q = testQuestions[currentTestIndex];
  if (!q || q.word.id !== wordId) return;
  const hint = q.word.chinese_meaning || '(未有翻譯)';

  let hintEl = document.getElementById('hintDisplay');
  if (!hintEl) {
    const input = document.getElementById('answerInput');
    if (!input) return;
    hintEl = document.createElement('div');
    hintEl.id = 'hintDisplay';
    hintEl.className = 'hint-bubble';
    input.parentNode.insertBefore(hintEl, input);
  }
  hintEl.textContent = hint;
  hintEl.classList.add('visible');
  q.hinted = true;
}

// ============================================================
// AI Sentence Generation
// ============================================================

async function callAISentence(word) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.openai.apiKey}`,
      'HTTP-Referer': window.location.origin || 'https://happylearner2077.vercel.app',
      'X-Title': 'HappyLearner'
    },
    body: JSON.stringify({
      model: CONFIG.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a language teacher. Generate ONE simple English sentence using the given word. The sentence should be suitable for F3 (Grade 9) students. Return ONLY the sentence, nothing else.'
        },
        {
          role: 'user',
          content: `Generate a sentence using the word "${word}".`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `API error (${response.status})`);
  return data.choices?.[0]?.message?.content?.trim() || '';
}

// ============================================================
// Answer Checking
// ============================================================

function submitAnswer() {
  const input = document.getElementById('answerInput');
  const resultArea = document.getElementById('testResult');
  if (!input || !resultArea) return;

  const q = testQuestions[currentTestIndex];
  const userAnswer = input.value.trim().toLowerCase();
  const correctAnswer = q.word.word.toLowerCase();

  let isCorrect = false;
  if (q.type === 'spelling') {
    isCorrect = userAnswer === correctAnswer;
  } else {
    const normalized = normalizeWord(userAnswer);
    isCorrect = normalized === correctAnswer || userAnswer === correctAnswer;
  }

  q.answered = true;
  q.correct = isCorrect;

  if (isCorrect) {
    resultArea.innerHTML = `<div class="result-correct">${t('english.correct')}</div>`;
    playClapSound();

    if (!q.isRetry) {
      correctCount++;
    }
  } else {
    resultArea.innerHTML = `
      <div class="result-wrong">
        <strong>正確答案為：${correctAnswer}</strong>
      </div>
    `;

    // Add to retry queue (only for non-retry questions)
    if (!q.isRetry) {
      const retryQ = { ...q, isRetry: true };
      retryQueue.push(retryQ);
    }
    // If it's already a retry and wrong → drop it (no more retries)
  }

  input.disabled = true;
  const submitBtn = document.getElementById('submitAnswerBtn');
  const isLast = currentTestIndex >= testQuestions.length - 1;
  submitBtn.onclick = isLast ? finishTest : nextQuestion;
  submitBtn.textContent = isLast ? '🏁 ' + t('english.finishTest') : '▶ ' + t('english.nextQuestion');

  showEncouragement(isCorrect);
}

function nextQuestion() {
  currentTestIndex++;
  showQuestion();
}

// ============================================================
// Finish Test
// ============================================================

function finishTest() {
  const area = document.getElementById('revisionArea');
  const earnedGem = correctCount > 5;
  const pct = Math.round((correctCount / initialQuestionCount) * 100);

  // Auto check-in
  if (initialQuestionCount >= 7) {
    doCheckIn().catch(() => {});
  }

  if (earnedGem) {
    getProfile().then(async (profile) => {
      const currentGems = profile?.gems || 0;
      await updateGems(currentGems + 1);
      loadGemCount();
    });
  }

  if (pct >= 70) {
    setTimeout(() => playCelebrationMusic(), 300);
  }

  let encouragement = '';
  if (pct >= 90) encouragement = '🏆 ' + t('english.correct');
  else if (pct >= 70) encouragement = '🌟 ' + t('english.wellTested');
  else if (pct >= 50) encouragement = '💪 ' + t('english.wrong');
  else encouragement = '📚 ' + t('english.wrong');

  area.innerHTML = `
    <div class="test-complete">
      <div class="complete-emoji">${pct >= 70 ? '🎉' : '💪'}</div>
      <h2>${t('english.testComplete')}</h2>
      <div class="complete-stats">
        <div class="stat-item">
          <div class="stat-num">${correctCount}/${initialQuestionCount}</div>
          <div class="stat-label">${t('english.correct')}</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">${pct}%</div>
          <div class="stat-label">${t('english.stats')}</div>
        </div>
      </div>
      <div class="encouragement">${encouragement}</div>
      ${earnedGem ? `<div class="gem-earned">💎 ${t('english.gemsEarned')}</div>` : `<div class="no-gem">${t('english.noGems')}</div>`}
      <div class="test-actions">
        <button class="btn btn-primary" onclick="showRevisionPage()">🔄 ${t('english.startTest')}</button>
        <button class="btn btn-outline" onclick="showEnglishPage()">${t('english.back')}</button>
      </div>
    </div>
  `;
}

function showEncouragement(isCorrect) {
  // placeholder
}

// ============================================================
// Utility
// ============================================================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function playClapSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    g.connect(ctx.destination);

    const notes = [
      { freq: 523, start: 0, dur: 0.25 },
      { freq: 659, start: 0.12, dur: 0.25 },
      { freq: 784, start: 0.25, dur: 0.4 },
    ];
    for (const n of notes) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(n.freq, now + n.start);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.01, now + n.start);
      ng.gain.linearRampToValueAtTime(0.4, now + n.start + 0.05);
      ng.gain.exponentialRampToValueAtTime(0.01, now + n.start + n.dur);
      o.connect(ng);
      ng.connect(g);
      o.start(now + n.start);
      o.stop(now + n.start + n.dur + 0.05);
    }
    setTimeout(() => ctx.close(), 1000);
  } catch (e) { /* silent fail */ }
}

// ============================================================
// Celebration Music
// ============================================================

function getCelebrationMusicEnabled() {
  return localStorage.getItem('celebrationMusic') !== 'off';
}

function setCelebrationMusicEnabled(val) {
  localStorage.setItem('celebrationMusic', val ? 'on' : 'off');
}

function playCelebrationMusic() {
  if (!getCelebrationMusicEnabled()) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.gain.setValueAtTime(0.35, now + 2.5);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 4.0);
    masterGain.connect(ctx.destination);

    function playNote(freq, start, dur, type, gainVal) {
      const o = ctx.createOscillator();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, now + start);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.01, now + start);
      ng.gain.linearRampToValueAtTime(gainVal || 0.3, now + start + 0.05);
      ng.gain.setValueAtTime(gainVal || 0.3, now + start + dur - 0.15);
      ng.gain.exponentialRampToValueAtTime(0.01, now + start + dur);
      o.connect(ng);
      ng.connect(masterGain);
      o.start(now + start);
      o.stop(now + start + dur + 0.05);
    }

    playNote(523.25, 0.0, 0.25, 'sine', 0.3);
    playNote(659.25, 0.15, 0.25, 'sine', 0.3);
    playNote(783.99, 0.3, 0.25, 'sine', 0.3);
    playNote(1046.5, 0.45, 0.4, 'sine', 0.35);

    playNote(523.25, 1.0, 0.6, 'triangle', 0.2);
    playNote(659.25, 1.0, 0.6, 'triangle', 0.2);
    playNote(783.99, 1.0, 0.6, 'triangle', 0.2);

    playNote(783.99, 1.0, 0.2, 'sine', 0.25);
    playNote(659.25, 1.2, 0.25, 'sine', 0.25);
    playNote(587.33, 1.45, 0.3, 'sine', 0.25);
    playNote(523.25, 1.75, 0.4, 'sine', 0.3);

    playNote(523.25, 2.4, 0.7, 'triangle', 0.2);
    playNote(659.25, 2.4, 0.7, 'triangle', 0.2);
    playNote(783.99, 2.4, 0.7, 'triangle', 0.2);
    playNote(1046.5, 2.4, 0.8, 'sine', 0.3);
    playNote(1318.5, 2.6, 0.5, 'sine', 0.15);

    setTimeout(() => ctx.close(), 5000);
  } catch (e) { /* silent fail */ }
}