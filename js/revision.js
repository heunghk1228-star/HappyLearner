// ============================================================
// Revision Module — 6-level test system with AI sentences
// ============================================================

let testMode = 'auto'; // 'auto' | 'specify'
let testWords = [];
let currentTestIndex = 0;
let correctCount = 0;
let testHistory = []; // tracks which words were right/wrong for retry
let currentQuestionType = 'spelling';
let testQuestions = [];
let retryQueue = [];

async function showRevisionPage() {
  if (!currentUser) {
    alert(t('english.loginRequired'));
    return;
  }
  history.replaceState({}, '', '#english/revision');
  
  const page = document.getElementById('pageContent');
  page.innerHTML = `
    <div class="page-header">
      <h2>${t('english.revisionTitle')}</h2>
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

async function startRevision(mode) {
  testMode = mode;
  currentTestIndex = 0;
  correctCount = 0;
  testHistory = [];
  testQuestions = [];
  retryQueue = [];
  
  const words = await fetchVocabulary();
  if (!words.length) {
    document.getElementById('revisionArea').innerHTML = `
      <div class="empty-state">${t('common.placeholders')}</div>
    `;
    return;
  }
  
  if (mode === 'auto') {
    // Pick: 3 newbee, 2 well-tested, 2 mastered
    const newbee = words.filter(w => w.level <= 2);
    const wellTested = words.filter(w => w.level >= 3 && w.level <= 5);
    const mastered = words.filter(w => w.level >= 6);
    
    // Shuffle
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
  } else {
    // Specify mode — show word selection
    showWordSelection(words);
    return;
  }
  
  prepareQuestions();
}

function showWordSelection(words) {
  const area = document.getElementById('revisionArea');
  area.innerHTML = `
    <div class="word-selection">
      <h3>${t('english.filter')} ${t('english.words')}</h3>
      <div class="selection-list">
        ${words.map(w => `
          <label class="selection-item">
            <input type="checkbox" value="${w.id}" data-word='${JSON.stringify(w).replace(/'/g, "&#39;")}'>
            <span>${w.word}</span>
            <small>${w.chinese_meaning || ''}</small>
          </label>
        `).join('')}
      </div>
      <button class="btn btn-primary" onclick="confirmWordSelection()">${t('english.startTest')} (${t('english.totalWords')}: ${words.length})</button>
    </div>
  `;
}

function confirmWordSelection() {
  const checked = document.querySelectorAll('.selection-item input:checked');
  if (checked.length === 0) {
    alert(t('english.filter'));
    return;
  }
  
  testWords = [];
  checked.forEach(cb => {
    const wordData = JSON.parse(cb.dataset.word);
    testWords.push(wordData);
  });
  
  prepareQuestions();
}

function prepareQuestions() {
  testQuestions = [];
  
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

function showQuestion() {
  const area = document.getElementById('revisionArea');
  
  // If we have retry queue items, interleave them
  if (retryQueue.length > 0 && testQuestions.length > 0) {
    // Insert retry at position after current
    const insertAt = Math.min(currentTestIndex + 1, testQuestions.length);
    testQuestions.splice(insertAt, 0, ...retryQueue);
    retryQueue = [];
  }
  
  if (currentTestIndex >= testQuestions.length) {
    finishTest();
    return;
  }
  
  const q = testQuestions[currentTestIndex];
  const isLast = currentTestIndex >= testQuestions.length - 1;
  
  area.innerHTML = `
    <div class="test-progress">
      ${t('english.question')} ${currentTestIndex + 1} ${t('english.of')} ${testQuestions.length}
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(currentTestIndex / testQuestions.length) * 100}%"></div>
      </div>
    </div>
    <div class="test-card">
      ${q.type === 'spelling' ? renderSpellingQuestion(q) : renderFillBlankQuestion(q)}
    </div>
    <div class="test-result" id="testResult"></div>
    <div class="test-actions">
      <button class="btn btn-primary" id="submitAnswerBtn" onclick="submitAnswer()">
        ✅ ${isLast ? t('english.finishTest') : t('english.nextQuestion')}
      </button>
    </div>
  `;
  
  // Auto-speak for spelling questions
  if (q.type === 'spelling') {
    setTimeout(() => speakWord(q.word.word), 500);
  }
}

function renderSpellingQuestion(q) {
  const word = q.word.word;
  return `
    <div class="question-type">${t('english.listenAndType')}</div>
    <div class="sound-btn-large" onclick="speakWord('${word}')">🔊</div>
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
  return `
    <div class="question-type">${t('english.fillBlank')}</div>
    <div class="fill-blank-sentence" id="sentenceDisplay">
      <div class="loading-sentence">${t('common.loading')}</div>
    </div>
    <div class="question-word-hint">
      <small>${word.chinese_meaning || ''} · ${word.part_of_speech ? word.part_of_speech.split(',').map(p => POS_MAP[p]?.[currentLang] || p).join(', ') : ''}</small>
    </div>
    <input type="text" id="answerInput" class="input answer-input" 
           placeholder="${t('english.typeHere')}" autocomplete="off"
           onkeydown="if(event.key==='Enter') submitAnswer()">
  `;
  
  // Generate AI sentence in background
  generateSentence(word.word);
}

async function generateSentence(word) {
  const display = document.getElementById('sentenceDisplay');
  if (!display) return;
  
  // Try AI-generated sentence first
  try {
    const sentence = await callAISentence(word);
    if (sentence && display) {
      const blanked = sentence.replace(new RegExp(word, 'gi'), '________');
      display.innerHTML = `
        <div class="sentence-text">${blanked}</div>
        <div class="sentence-source">✨ AI generated</div>
      `;
      // Store the sentence for answer checking
      display.dataset.sentence = sentence;
      display.dataset.word = word;
      return;
    }
  } catch (e) {
    console.log('AI failed, using fallback');
  }
  
  // Fallback sentence
  const fallback = `Please _____ the word "${word}" in this sentence.`;
  display.innerHTML = `
    <div class="sentence-text">${fallback.replace(word, '________')}</div>
    <div class="sentence-source">📝 Fallback</div>
  `;
  display.dataset.sentence = fallback;
  display.dataset.word = word;
}

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

function submitAnswer() {
  const input = document.getElementById('answerInput');
  const resultArea = document.getElementById('testResult');
  if (!input || !resultArea) return;
  
  const q = testQuestions[currentTestIndex];
  const userAnswer = input.value.trim().toLowerCase();
  const correctAnswer = q.word.word.toLowerCase();
  
  // Check answer (for fill-blank, check if the word appears in the answer)
  let isCorrect = false;
  if (q.type === 'spelling') {
    isCorrect = userAnswer === correctAnswer;
  } else {
    // Fill blank: check if the base form matches, also accept different forms
    const normalized = normalizeWord(userAnswer);
    isCorrect = normalized === correctAnswer || userAnswer === correctAnswer;
  }
  
  q.answered = true;
  q.correct = isCorrect;
  
  if (isCorrect) {
    correctCount++;
    resultArea.innerHTML = `<div class="result-correct">${t('english.correct')}</div>`;
    
    // Level up logic (auto mode only, max 1 level per day)
    if (testMode === 'auto' && q.word.level < 6) {
      const today = new Date().toISOString().split('T')[0];
      if (q.word.last_reviewed !== today) {
        const newLevel = Math.min(q.word.level + 1, 6);
        updateWordLevel(q.word.id, newLevel);
        q.word.level = newLevel;
      }
    }
  } else {
    resultArea.innerHTML = `
      <div class="result-wrong">
        ${t('english.wrong')}<br>
        <strong>${t('english.correct')}: ${correctAnswer}</strong>
      </div>
    `;
    
    // Down level (auto mode), min level 1
    if (testMode === 'auto' && q.word.level > 1) {
      const newLevel = Math.max(q.word.level - 1, 1);
      updateWordLevel(q.word.id, newLevel);
      q.word.level = newLevel;
    }
    
    // Add to retry queue — will appear again after current questions
    if (retryQueue.length < 3) {
      const retryQ = { ...q };
      // For fill-blank, generate a new sentence on retry
      retryQueue.push(retryQ);
    }
  }
  
  // Disable input and change button
  input.disabled = true;
  const submitBtn = document.getElementById('submitAnswerBtn');
  submitBtn.onclick = nextQuestion;
  submitBtn.textContent = '▶ ' + t('english.nextQuestion');
  
  // Show encouragement
  showEncouragement(isCorrect);
}

function nextQuestion() {
  currentTestIndex++;
  showQuestion();
}

function finishTest() {
  const area = document.getElementById('revisionArea');
  const earnedGem = correctCount > 5;
  
  // Auto check-in
  doCheckIn().catch(() => {});
  
  if (earnedGem) {
    // Add gem
    getProfile().then(profile => {
      const currentGems = profile?.gems || 0;
      updateGems(currentGems + 1);
      loadGemCount();
    });
  }
  
  // Show encouragement
  let encouragement = '';
  const pct = Math.round((correctCount / testQuestions.length) * 100);
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
          <div class="stat-num">${correctCount}/${testQuestions.length}</div>
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
        <button class="btn btn-primary" onclick="startRevision('${testMode}')">🔄 ${t('english.startTest')}</button>
        <button class="btn btn-outline" onclick="showEnglishPage()">${t('english.back')}</button>
      </div>
    </div>
  `;
}

function showEncouragement(isCorrect) {
  // Animated encouragement effect
  const emoji = isCorrect ? '🎉' : '💪';
  // Could add confetti or animation here
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}