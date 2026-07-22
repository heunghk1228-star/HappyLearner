// ============================================================
// Revision Module — Test system with Auto & Specify modes
// ============================================================

let testMode = 'auto'; // 'auto' | 'specify'
let testWords = [];
let currentTestIndex = 0;
let correctCount = 0;
let testQuestions = [];
let retryQueue = [];
let leveledUpWords = [];
let initialQuestionCount = 0;

// Spelling test mode: 'spelling-only' | 'mixed'
let revisionSpellingMode = localStorage.getItem('revisionSpellingMode') || 'mixed';

// Tier filter state for word selection (specify mode)
let revisionActiveTiers = ['newbee', 'well-tested', 'mastered'];
let revisionTagFilter = '';
let revisionSelectedIds = new Set(); // Track checked word IDs across filter changes
let revisionWordData = {}; // id -> word object for selected words

// ============================================================
// Page: Main entry — show mode selection
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
  isInSubPage = true;

  const page = document.getElementById('pageContent');
  page.innerHTML = `
      <div class="page-header">
        <h2>${t('english.revisionTitle')}</h2>
      </div>
      <div class="revision-spelling-modes">
        <div class="revision-mode-card ${revisionSpellingMode === 'spelling-only' ? 'active' : ''}" onclick="selectSpellingMode('spelling-only')">
          <div class="mode-icon">🔤</div>
          <h3>${t('english.spellingMode')}</h3>
          <p>${t('english.spellingModeDesc')}</p>
        </div>
        <div class="revision-mode-card ${revisionSpellingMode === 'mixed' ? 'active' : ''}" onclick="selectSpellingMode('mixed')">
          <div class="mode-icon">🔤✏️</div>
          <h3>${t('english.mixedMode')}</h3>
          <p>${t('english.mixedModeDesc')}</p>
        </div>
      </div>
      <div class="revision-modes">
        <div class="mode-card" onclick="startRevision('auto')">
        <div class="mode-icon">🧠</div>
        <h3>${t('english.autoMode')}</h3>
        <p>${t('english.autoModeDesc')}</p>
      </div>
      <div class="mode-card" onclick="startRevision('specify')">
        <div class="mode-icon">🎯</div>
        <h3>${t('english.specifyMode')}</h3>
        <p>${t('english.specifyModeDesc')}</p>
      </div>
    </div>
    <div id="revisionArea"></div>
  `;
}

// Spelling mode selector
function selectSpellingMode(mode) {
  revisionSpellingMode = mode;
  localStorage.setItem('revisionSpellingMode', mode);
  // Update active state on cards
  document.querySelectorAll('.revision-spelling-modes .revision-mode-card').forEach(card => {
    card.classList.toggle('active', card.getAttribute('onclick')?.includes(mode));
  });
}

// ============================================================
// Start Revision (called by mode cards)
// ============================================================

async function startRevision(mode) {
  testMode = mode;
  currentTestIndex = 0;
  correctCount = 0;
  testQuestions = [];
  retryQueue = [];
  leveledUpWords = [];
  initialQuestionCount = 0;

  // Hide the mode selection cards when auto mode starts directly
  // (specify mode keeps them visible during word selection)
  const modes = document.querySelector('.revision-modes');
  const spellingModes = document.querySelector('.revision-spelling-modes');
  if (spellingModes) spellingModes.style.display = 'none';

  const words = await fetchVocabulary();
  if (!words.length) {
    document.getElementById('revisionArea').innerHTML = `
      <div class="empty-state">${t('common.placeholders')}</div>
    `;
    return;
  }

  if (mode === 'auto') {
    // Hide mode cards — auto test starts immediately
    if (modes) modes.style.display = 'none';
    // Auto mode: pick 3 newbee, 2 well-tested, 2 mastered
    const newbee = words.filter(w => w.level <= 2);
    const wellTested = words.filter(w => w.level >= 3 && w.level <= 5);
    const mastered = words.filter(w => w.level >= 6);

    shuffleArray(newbee);
    shuffleArray(wellTested);
    shuffleArray(mastered);

    testWords = [
      ...newbee.slice(0, 3),
      ...wellTested.slice(0, 2),
      ...mastered.slice(0, 2)
    ];

    // Fill missing with random words
    if (testWords.length < 7) {
      const remaining = words.filter(w => !testWords.find(t => t.id === w.id));
      shuffleArray(remaining);
      testWords = [...testWords, ...remaining.slice(0, 7 - testWords.length)];
    }

    prepareQuestions();
  } else {
    // Specify mode: show word selection with filters
    showWordSelection(words);
  }
}

// ============================================================
// Word Selection with Tag + Tier Filters (specify mode)
// ============================================================

async function showWordSelection(words) {
  const area = document.getElementById('revisionArea');
  if (!area) return;

  const tags = await fetchTags();
  const tagOptions = tags.map(t =>
    `<option value="${t.id}">${t.name}</option>`
  ).join('');

  area.innerHTML = `
    <div class="word-selection">
      <div class="selection-filters selection-filters-row">
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
            <button class="tier-btn tier-newbee active" data-tier="newbee" onclick="toggleRevisionTier('newbee')">${t('english.newbee')}</button>
            <button class="tier-btn tier-well-tested active" data-tier="well-tested" onclick="toggleRevisionTier('well-tested')">${t('english.wellTested')}</button>
            <button class="tier-btn tier-mastered active" data-tier="mastered" onclick="toggleRevisionTier('mastered')">${t('english.mastered')}</button>
          </div>
        </div>
      </div>

      <div class="selection-actions">
        <label class="checkbox-inline">
          <input type="checkbox" id="selectAllCheck" onchange="toggleSelectAll()">
          <strong>${t('english.selectAll')}</strong>
        </label>
      </div>

      <div class="selection-list" id="revisionWordList"></div>

      <div class="selection-bottom">
              <div class="question-count-row">
                <label>📝 題目數量:</label>
                <input type="number" class="input" id="questionCount" value="${words.length}" min="1" max="${words.length}" style="width:80px" oninput="golUpdateStartBtn()">
                <span class="question-count-note">(已選: <span id="maxCount">${words.length}</span>)</span>
              </div>
              <button class="btn btn-primary" id="golStartBtn" onclick="confirmWordSelection()">${t('english.startTest')}</button>
            </div>
    </div>
  `;

  // Reset selection tracking BEFORE rendering so defaults are clean
  revisionSelectedIds = new Set();
  revisionWordData = {};
  renderRevisionWordList(words);
  updateSelectionCount(0);
}

function renderRevisionWordList(words) {
  const list = document.getElementById('revisionWordList');
  if (!list) return;

  let filtered = words.filter(w => {
    const tier = w.level <= 2 ? 'newbee' : w.level <= 5 ? 'well-tested' : 'mastered';
    return revisionActiveTiers.includes(tier);
  });

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

  // Store word data for all visible words
  filtered.forEach(w => { if (w.id) revisionWordData[w.id] = w; });

  list.innerHTML = filtered.map(w => {
    const tier = w.level <= 2 ? 'newbee' : w.level <= 5 ? 'well-tested' : 'mastered';
    const tierLabel = getTierLabel(w.level);
    const isChecked = revisionSelectedIds.has(w.id) ? 'checked' : '';
    return `
      <label class="selection-item">
        <input type="checkbox" value="${w.id}" data-word='${JSON.stringify(w).replace(/'/g, "&#39;")}' ${isChecked} onchange="onRevisionCheckChange(this, '${w.id}')">
        <span><strong>${w.word}</strong> <small>${w.chinese_meaning || ''}</small> <span class="tier-badge tier-${tier}">${tierLabel}</span></span>
      </label>
    `;
  }).join('');

  updateSelectionCount(filtered.length);
  const allChecked = document.querySelectorAll('#revisionWordList input:checked').length === filtered.length;
  selectAll.checked = allChecked && filtered.length > 0;
}

function onRevisionCheckChange(el, id) {
  if (el.checked) {
    revisionSelectedIds.add(id);
    // Also populate word data from the checkbox's data attribute
    try {
      const wordData = JSON.parse(el.dataset.word);
      if (wordData && wordData.id) revisionWordData[id] = wordData;
    } catch (e) {}
  } else {
    revisionSelectedIds.delete(id);
  }
  updateSelectionCount(document.querySelectorAll('#revisionWordList label.selection-item').length);
}

function updateSelectionCount(visibleCount) {
  const totalSelected = revisionSelectedIds.size;
  const qtyInput = document.getElementById('questionCount');
  const maxEl = document.getElementById('maxCount');
  if (maxEl) maxEl.textContent = totalSelected;
  if (qtyInput) {
    qtyInput.max = totalSelected;
    if (parseInt(qtyInput.value) > totalSelected) qtyInput.value = totalSelected;
  }
  golUpdateStartBtn();
}

function golUpdateStartBtn() {
  const btn = document.getElementById('golStartBtn');
  const qtyInput = document.getElementById('questionCount');
  if (!btn || !qtyInput) return;
  const qty = parseInt(qtyInput.value);
  const total = revisionSelectedIds.size;
  if (qty < 1 || qty > total) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.cursor = '';
  }
}

function toggleSelectAll() {
  const checked = document.getElementById('selectAllCheck').checked;
  document.querySelectorAll('#revisionWordList input[type="checkbox"]').forEach(cb => {
    cb.checked = checked;
    if (checked) {
      revisionSelectedIds.add(cb.value);
      try {
        const wordData = JSON.parse(cb.dataset.word);
        if (wordData && wordData.id) revisionWordData[cb.value] = wordData;
      } catch (e) {}
    } else {
      revisionSelectedIds.delete(cb.value);
    }
  });
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
  fetchVocabulary().then(words => renderRevisionWordList(words));
}

function onRevisionFilterChange() {
  revisionTagFilter = document.getElementById('revisionTagFilter').value;
  fetchVocabulary().then(words => renderRevisionWordList(words));
}

// ============================================================
// Confirm Word Selection (specify mode)
// ============================================================

function confirmWordSelection() {
  // Hide mode cards — test is about to start
  const modes = document.querySelector('.revision-modes');
  if (modes) modes.style.display = 'none';
  const spellingModes = document.querySelector('.revision-spelling-modes');
  if (spellingModes) spellingModes.style.display = 'none';

  const totalSelected = revisionSelectedIds.size;
  if (totalSelected === 0) {
    alert(t('english.filter'));
    return;
  }
  const qty = parseInt(document.getElementById('questionCount').value);
  if (qty < 1 || qty > totalSelected) {
    alert('題目數量不能超過已選詞彙數');
        return;
      }

      currentTestIndex = 0;
  correctCount = 0;
  testQuestions = [];
  retryQueue = [];
  leveledUpWords = [];
  initialQuestionCount = 0;

  // Gather selected words from revisionSelectedIds + revisionWordData
    testWords = [];
    revisionSelectedIds.forEach(id => {
      if (revisionWordData[id]) testWords.push(revisionWordData[id]);
    });

  shuffleArray(testWords);
  testWords = testWords.slice(0, qty);

  prepareQuestions();
}

// ============================================================
// Prepare Questions (both modes)
// ============================================================

function prepareQuestions() {
  testQuestions = [];
  initialQuestionCount = testWords.length;

  for (const word of testWords) {
    const level = word.level || 1;
    const pos = (word.pos || word.part_of_speech || '').toLowerCase();
    // Name/place words are always spelling only
    const qType = revisionSpellingMode === 'spelling-only' || pos.includes('name') ? 'spelling' : (level <= 2 ? 'spelling' : 'fillblank');

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
      testQuestions = retryQueue;
      retryQueue = [];
      currentTestIndex = 0;
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
  setTimeout(() => generateSentence(word.word, word.fillblank_sentence), 50);
  return `
    <div class="question-type">${t('english.fillBlank')}</div>
    <div class="fill-blank-sentence" id="sentenceDisplay">
      <div class="loading-sentence">${t('common.loading')}</div>
    </div>
    <div class="fill-blank-actions">
      <button class="sound-btn-large" onclick="speakFillBlankSentence()" title="🔊 ${t('english.listen')}">🔊</button>
      <button class="hint-btn-large" onclick="showHint('${word.id}')" title="💡 ${t('english.hint')}">💡</button>
    </div>
    <input type="text" id="answerInput" class="input answer-input" 
           placeholder="${t('english.typeHere')}" autocomplete="off"
           onkeydown="if(event.key==='Enter') submitAnswer()">
  `;
}

async function generateSentence(word, cachedSentence) {
  const display = document.getElementById('sentenceDisplay');
  if (!display) return;

  // Use cached sentence if available
  if (cachedSentence) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + escaped + '\\b', 'i');
    const blanked = cachedSentence.replace(re, '________');
    display.innerHTML = `
      <div class="sentence-text">${blanked}</div>
    `;
    display.dataset.sentence = cachedSentence;
    display.dataset.word = word;
    return;
  }

  try {
    const sentence = await callAISentence(word);
    if (sentence && display) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp('\\b' + escaped + '\\b', 'i');
      const blanked = sentence.replace(re, '________');
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
    <div class="sentence-text">${fallback.replace('_____', '________')}</div>
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
  // Fill-Blank Read-Aloud (speak sentence, skip blanked word)
  // ============================================================

  function speakFillBlankSentence() {
    const display = document.getElementById('sentenceDisplay');
    if (!display || !('speechSynthesis' in window)) return;
    const sentence = display.dataset.sentence;
    const word = display.dataset.word;
    if (!sentence || !word) return;

    window.speechSynthesis.cancel();
    const regex = new RegExp(word, 'gi');
    const parts = sentence.split(regex);
    if (parts.length < 2) {
      // Word not found in sentence — read whole thing
      const u = new SpeechSynthesisUtterance(sentence);
      u.lang = 'en-US';
      u.rate = getFastRate();
      if (availableVoices.length > 0) u.voice = pickBestVoice();
      window.speechSynthesis.speak(u);
      return;
    }

    // Speak each part with a gap where the blank would be
    parts.forEach((part, i) => {
      if (part.trim()) {
        const u = new SpeechSynthesisUtterance(part);
        u.lang = 'en-US';
        u.rate = getFastRate();
        if (availableVoices.length > 0) u.voice = pickBestVoice();
        window.speechSynthesis.speak(u);
      }
      // Add a brief pause between parts (the blank)
      if (i < parts.length - 1) {
        const pause = new SpeechSynthesisUtterance(' ');
        pause.rate = 0.01;
        pause.lang = 'en-US';
        window.speechSynthesis.speak(pause);
      }
    });
  }

  // ============================================================
  // Background Pre-generation of Fill-Blank Sentences
  // ============================================================

  async function precacheFillBlankSentence(word) {
    if (!word || word.fillblank_sentence) return; // Already cached
    try {
      const sentence = await callAISentence(word.word);
      if (sentence && sentence.includes(word.word)) {
        await supabaseClient
          .from('vocabulary')
          .update({ fillblank_sentence: sentence })
          .eq('id', word.id);
        word.fillblank_sentence = sentence;
      }
    } catch (e) {
      console.log('Precache failed for', word.word, e.message);
    }
  }

  // ============================================================
  // AI Sentence Generation

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

async function submitAnswer() {
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

    // Auto mode: level up (max 1 level per day, skip if hinted)
    if (testMode === 'auto' && q.word.level < 6 && !q.hinted) {
      // Spelling-only mode: only newbee words can level up
      if (revisionSpellingMode === 'spelling-only' && q.word.level >= 3) {
        // Block leveling up well-tested+ words
      } else {
        const today = new Date().toISOString().split('T')[0];
        if (q.word.last_reviewed !== today) {
          const oldLevel = q.word.level;
          const newLevel = Math.min(q.word.level + 1, 6);
          updateWordLevel(q.word.id, newLevel);
          q.word.level = newLevel;
          leveledUpWords.push({ word: q.word.word, oldLevel, newLevel });
          // Background pre-generate fill-blank sentence when reaching level 3 (well-tested)
          if (oldLevel < 3 && newLevel >= 3) {
            precacheFillBlankSentence(q.word);
          }
        }
      }
    }

    if (!q.isRetry) {
      correctCount++;
      trackCorrectAnswer();
    }

    // Regenerate fill-blank sentence after correct answer
    if (q.type === 'fillblank') {
      // Clear cached sentence so a new one is generated
      await supabaseClient
        .from('vocabulary')
        .update({ fillblank_sentence: null })
        .eq('id', q.word.id);
      q.word.fillblank_sentence = null;
      precacheFillBlankSentence(q.word);
    }
  } else {
    resultArea.innerHTML = `
      <div class="result-wrong">
        <strong>正確答案為：${correctAnswer}</strong>
      </div>
    `;

    // Auto mode: down level
    if (testMode === 'auto' && q.word.level > 1) {
      const newLevel = Math.max(q.word.level - 1, 1);
      updateWordLevel(q.word.id, newLevel);
      q.word.level = newLevel;
    }

    // Add to retry queue (only for non-retry questions)
    if (!q.isRetry) {
      const retryQ = { ...q, isRetry: true };
      retryQueue.push(retryQ);
    }
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

  // If there are wrong answers to retry, cycle them back in
  if (retryQueue.length > 0) {
    testQuestions = retryQueue;
    retryQueue = [];
    currentTestIndex = 0;
    showQuestion();
    return;
  }

  const earnedGem = correctCount > 5;
  const pct = Math.round((correctCount / initialQuestionCount) * 100);

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
      ${leveledUpWords.length > 0 ? `
        <div class="leveled-up-section">
          <div class="leveled-up-title">⬆️ 升級字詞</div>
          <div class="leveled-up-list">
            ${leveledUpWords.map(lw => {
              const oldLabel = getTierLabel(lw.oldLevel);
              const newLabel = getTierLabel(lw.newLevel);
              return `<div class="leveled-up-item"><strong>${lw.word}</strong> ${oldLabel} → ${newLabel}</div>`;
            }).join('')}
          </div>
        </div>
      ` : ''}
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