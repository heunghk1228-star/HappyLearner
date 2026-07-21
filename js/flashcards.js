// ============================================================
// Flash Cards Module — Grid View with Pagination
// ============================================================

let currentFlashcards = [];
let currentPage = 0;
const CARDS_PER_PAGE = 12;

// Fallback sample sentences for common words
const FALLBACK_SENTENCES = {
  'go': 'I need to go to school every morning.',
  'have': 'I have a big test tomorrow.',
  'do': 'What do you want to eat for lunch?',
  'make': 'She can make a beautiful cake.',
  'take': 'Please take a seat and wait.',
  'get': 'I need to get some water.',
  'use': 'Can you use this tool properly?',
  'find': 'I need to find my lost keys.',
  'give': 'Please give me a chance.',
  'tell': 'Can you tell me a story?',
  'work': 'I work hard every day.',
  'call': 'Please call me when you arrive.',
  'try': 'Let me try this new method.',
  'ask': 'I need to ask a question.',
  'need': 'I need to finish my homework.',
  'feel': 'I feel very happy today.',
  'help': 'Can you help me with this problem?',
  'learn': 'I want to learn new things.',
  'study': 'I study English every evening.',
  'read': 'I love to read books.',
  'write': 'Please write your name here.',
  'think': 'I think this is correct.',
  'know': 'I know the answer to this question.',
  'want': 'I want to become a doctor.',
  'see': 'I can see the blackboard clearly.',
  'come': 'Please come to the front.',
  'look': 'Look at the diagram carefully.',
  'show': 'Show me your homework.',
  'start': 'Let us start the lesson now.',
  'keep': 'Keep quiet during the exam.',
  'understand': 'I understand the concept now.',
  'remember': 'Remember to bring your textbook.',
  'forget': 'Do not forget to submit your assignment.',
  'believe': 'I believe you can do it.',
  'consider': 'Consider all the possibilities.',
  'continue': 'Please continue reading.',
  'expect': 'I expect good results.',
  'follow': 'Follow the instructions carefully.',
  'happen': 'What will happen next?',
  'introduce': 'Let me introduce my family.',
  'join': 'Join us for the study group.',
  'listen': 'Listen to the teacher carefully.',
  'live': 'I live in Hong Kong.',
  'mean': 'What does this word mean?',
  'open': 'Please open your book to page 10.',
  'play': 'I play basketball after school.',
  'practice': 'Practice makes perfect.',
  'prepare': 'Prepare for the exam early.',
  'reach': 'We can reach our goals.',
  'seem': 'This seems too difficult.',
  'suggest': 'I suggest reviewing the notes.',
  'support': 'My parents support my education.',
  'talk': 'Let us talk about the topic.',
  'teach': 'She teaches mathematics.',
  'visit': 'We will visit the museum.',
  'wait': 'Please wait for your turn.',
  'walk': 'I walk to school every day.',
  'watch': 'Watch the educational video.',
  'worry': 'Do not worry about the exam.',
  'beautiful': 'The sunset is very beautiful.',
  'important': 'Education is very important.',
  'different': 'We have different opinions.',
  'difficult': 'This question is too difficult.',
  'easy': 'This exercise is very easy.',
  'interesting': 'The lesson is very interesting.',
  'possible': 'It is possible to improve.',
  'useful': 'This dictionary is very useful.',
  'popular': 'This subject is very popular.',
  'special': 'Today is a special day.',
  'education': 'Education changes lives.',
  'knowledge': 'Knowledge is power.',
  'experience': 'I gained valuable experience.',
  'information': 'Please read the information carefully.',
  'problem': 'Can you solve this problem?',
  'question': 'Do you have any question?',
  'answer': 'Please write your answer clearly.',
  'example': 'Let me give you an example.',
  'exercise': 'Complete the exercise on page 5.',
  'homework': 'I finished my homework early.',
  'lesson': 'The lesson was very helpful.',
  'student': 'Every student must study hard.',
  'teacher': 'The teacher explained the concept.',
  'subject': 'My favourite subject is science.',
  'exam': 'The exam is next Monday.',
  'test': 'We have a spelling test tomorrow.',
  'result': 'The result was better than expected.',
  'progress': 'I can see my progress.',
  'improve': 'I want to improve my English.',
  'achieve': 'You can achieve anything.',
  'success': 'Hard work leads to success.',
  'effort': 'Put more effort into your studies.'
};

function getFallbackSentence(word) {
  return FALLBACK_SENTENCES[word.toLowerCase()] || null;
}

// ============================================================
// Render flashcard grid
// ============================================================

function renderFlashcards(words) {
  currentFlashcards = words;
  currentPage = 0;
  renderGrid();
}

function renderGrid() {
  const container = document.getElementById('flashcardContainer');
  if (!container) return;

  if (!currentFlashcards.length) {
    container.innerHTML = `<div class="empty-state">${t('common.placeholders')}</div>`;
    return;
  }

  // Show AI status indicator
  const aiStatus = CONFIG.openai.apiKey ? '' : '<div class="ai-warning">⚠️ AI 未設定 — 檢查 API Key</div>';

  const totalPages = Math.ceil(currentFlashcards.length / CARDS_PER_PAGE);
  const start = currentPage * CARDS_PER_PAGE;
  const pageWords = currentFlashcards.slice(start, start + CARDS_PER_PAGE);

  let html = aiStatus + `<div class="flashcard-grid">`;
  for (const word of pageWords) {
    html += renderMiniCard(word);
  }
  html += `</div>`;

  // Pagination
  html += `<div class="grid-pagination">
    <span class="page-info">${t('english.question')} ${start + 1}–${Math.min(start + CARDS_PER_PAGE, currentFlashcards.length)} ${t('english.of')} ${currentFlashcards.length}</span>
    <div class="pagination-actions">
      <button class="btn btn-outline btn-sm" onclick="prevPage()" ${currentPage === 0 ? 'disabled' : ''}>◀ ${t('english.back')}</button>
      <span class="page-num">${currentPage + 1} / ${totalPages}</span>
      <button class="btn btn-primary btn-sm" onclick="nextPage()" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>${t('english.nextPage')} ▶</button>
    </div>
  </div>`;

  container.innerHTML = html;
}

function renderMiniCard(word) {
  const posArr = word.part_of_speech ? word.part_of_speech.split(',') : detectPOS(word.word);
  const posLabels = posArr.map(p => POS_MAP[p]?.[currentLang] || p).join(', ');
  const forms = getWordForms(word.word);
  const isVerb = posArr.includes('verb');
  const tierLabel = getTierLabel(word.level);
  const hasSentence = word.sample_sentence && word.sample_sentence.length > 0;
  const fallback = !hasSentence ? getFallbackSentence(word.word) : null;
  const displaySentence = word.sample_sentence || fallback || '';

  return `
    <div class="grid-card" onclick="this.classList.toggle('flipped')">
      <div class="grid-card-inner">
        <div class="grid-card-front">
          <div class="grid-word">${word.word}</div>
          <div class="sound-row">
            <button class="sound-btn-sm" onclick="event.stopPropagation(); speakWordSlow('${word.word}')" title="🐢 ${t('english.slow')}">🐢</button>
            <button class="sound-btn-sm" onclick="event.stopPropagation(); speakWordFast('${word.word}')" title="🐇 ${t('english.fast')}">🐇</button>
          </div>
          <div class="grid-tier">${tierLabel}</div>
        </div>
        <div class="grid-card-back">
          <div class="grid-meaning">${word.chinese_meaning || '<span class="text-light">(未有翻譯)</span>'}</div>
          <div class="grid-pos">${posLabels}</div>
          ${isVerb ? `<div class="grid-forms"><small>${forms.past}, ${forms.pp}</small></div>` : ''}
          ${displaySentence 
            ? `<div class="grid-sentence">${displaySentence}
               <button class="btn-regenerate" onclick="event.stopPropagation(); speakSentence('${word.id}')" title="🔊 朗讀句子">🔊</button>
               <button class="btn-regenerate" onclick="event.stopPropagation(); regenerateSentence('${word.id}')" title="Regenerate">🔄</button></div>`
            : `<div class="grid-sentence"><button class="btn-regenerate" onclick="event.stopPropagation(); regenerateSentence('${word.id}')">✨ Generate</button></div>`}
        </div>
      </div>
    </div>
  `;
}

function nextPage() {
  const totalPages = Math.ceil(currentFlashcards.length / CARDS_PER_PAGE);
  if (currentPage < totalPages - 1) {
    currentPage++;
    renderGrid();
  }
}

function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    renderGrid();
  }
}

// ============================================================
// Pronunciation — Speak Word with voice selection
// ============================================================

// Get stored speech rates from localStorage
function getSlowRate() {
  const val = parseFloat(localStorage.getItem('speechSlowRate'));
  return val >= 0.1 && val <= 1.0 ? val : 0.5;
}
function setSlowRate(rate) {
  localStorage.setItem('speechSlowRate', rate.toString());
}
function getFastRate() {
  const val = parseFloat(localStorage.getItem('speechFastRate'));
  return val >= 0.1 && val <= 1.0 ? val : 0.9;
}
function setFastRate(rate) {
  localStorage.setItem('speechFastRate', rate.toString());
}

// Get preferred voice name
function getSpeechVoice() {
  return localStorage.getItem('speechVoice') || '';
}

function setSpeechVoice(voiceName) {
  localStorage.setItem('speechVoice', voiceName || '');
}

// Lazy-init voices cache
let voicesLoaded = false;
let availableVoices = [];

function initVoices() {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve([]); return; }
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      availableVoices = voices;
      voicesLoaded = true;
      resolve(voices);
      return;
    }
    // Voices might load asynchronously (especially on Chrome)
    window.speechSynthesis.onvoiceschanged = () => {
      availableVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(availableVoices);
    };
    // Timeout fallback
    setTimeout(() => {
      if (!voicesLoaded) {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) {
          availableVoices = v;
          voicesLoaded = true;
        }
        resolve(availableVoices);
      }
    }, 2000);
  });
}

function pickBestVoice() {
  const preferred = getSpeechVoice();
  
  // 1. Try user's preferred voice
  if (preferred) {
    const match = availableVoices.find(v => v.name === preferred);
    if (match) return match;
  }
  
  // 2. Try to find a good English voice — prefer natural-sounding voices
  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
  
  // Priority order: good desktop voices first
  const priorityNames = [
    'Microsoft David', 'Microsoft Zira', 'Microsoft Mark',
    'Google US English', 'Samantha', 'Karen', 'Daniel',
    'Alex', 'Moira', 'Fiona', 'Tessa', 'Veena',
    'Siri', 'English United States', 'English United Kingdom'
  ];
  
  for (const name of priorityNames) {
    const match = englishVoices.find(v => v.name.includes(name));
    if (match) return match;
  }
  
  // 3. Fallback: any English voice
  if (englishVoices.length > 0) return englishVoices[0];
  
  // 4. Last resort: any voice
  return availableVoices[0] || null;
}

function speakWord(word, rate) {
  if (!('speechSynthesis' in window)) {
    showToast('🔇 ' + (t('english.speechUnavailable') || 'Speech not available on this device'));
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  if (!word) return;
  
  const speechRate = rate != null ? rate : getSlowRate();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = speechRate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  
  // Try to pick the best voice
  if (availableVoices.length === 0) {
    // Try to init voices synchronously
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) availableVoices = v;
  }
  
  const voice = pickBestVoice();
  if (voice) {
    utterance.voice = voice;
  }
  
  // Handle errors
  utterance.onerror = (e) => {
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('Speech error:', e.error);
      // Retry once after a short delay (some browsers need a fresh context)
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch(err) {
          console.warn('Speech retry failed:', err);
        }
      }, 300);
    }
  };
  
  // Speak
  try {
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('SpeechSynthesis.speak failed:', e);
    showToast('🔇 ' + (t('english.speechUnavailable') || 'Speech not available'));
  }
}

function speakWordSlow(word) {
  speakWord(word, getSlowRate());
}

function speakWordFast(word) {
  speakWord(word, getFastRate());
}

// ============================================================
// Open flash cards page

function testSpeechVoice() {
  speakWord('Hello. This is a test.', getFastRate());
}

function populateVoiceSelector() {
  const sel = document.getElementById('voiceSelector');
  if (!sel) return;
  const preferred = getSpeechVoice();
  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
  sel.innerHTML = `<option value="">${t('english.autoVoice')}</option>` +
    englishVoices.map(v => 
      `<option value="${v.name}" ${v.name === preferred ? 'selected' : ''}>${v.name.replace('Microsoft ', '')}</option>`
    ).join('');
}

function selectVoice(voiceName) {
  setSpeechVoice(voiceName);
  // Test the selected voice
  if (voiceName) {
    speakWord('Hello, this is my new voice.');
  }
}

// ============================================================
// AI sentence generation (per card)
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
          content: 'You are a teacher. Generate ONE simple English sentence using the given word. Suitable for F3 (Grade 9, age 14-15) students. Return ONLY the sentence, nothing else.'
        },
        { role: 'user', content: `Generate a sentence using the word "${word}".` }
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
// Open flash cards page
// ============================================================

async function openFlashcards() {
  if (!currentUser) {
    alert(t('english.loginRequired'));
    return;
  }
  if (window.location.hash !== '#english/flashcards') {
    history.pushState({}, '', '#english/flashcards');
    lastKnownHash = '#english/flashcards';
  }

  showLoading();
  const words = await fetchVocabulary();

  const page = document.getElementById('pageContent');
  page.innerHTML = `
    <div class="page-header">
      <h2>${t('english.flashCards')}</h2>
      <div class="filter-bar" style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
        <div class="tier-filter-btns">
          <button class="tier-btn tier-newbee active" data-tier="newbee" onclick="toggleTierFilter('newbee')">${t('english.newbee')}</button>
          <button class="tier-btn tier-well-tested active" data-tier="well-tested" onclick="toggleTierFilter('well-tested')">${t('english.wellTested')}</button>
          <button class="tier-btn tier-mastered active" data-tier="mastered" onclick="toggleTierFilter('mastered')">${t('english.mastered')}</button>
        </select>
        <select id="flashcardTagFilter" onchange="filterFlashcards()" class="input" style="max-width:140px;font-size:0.85rem">
          <option value="">🏷️ ${t('english.all')}</option>
        </select>
        <div class="speech-controls">
          <select id="voiceSelector" class="input" style="max-width:160px;font-size:0.8rem" onchange="selectVoice(this.value)">
            <option value="">${t('english.autoVoice')}</option>
          </select>
          <button class="btn btn-sm btn-outline" onclick="testSpeechVoice()" title="${t('english.testVoice')}">🎤</button>
        </div>
      </div>
    </div>
    <div id="flashcardContainer"></div>
  `;

  // Init voices on first load and populate voice selector
  initVoices().then(() => populateVoiceSelector());

  // Load tag filter
  loadFlashcardTagFilter();

  // Reset tier filter buttons
  activeTiers = ['newbee', 'well-tested', 'mastered'];

  currentFlashcards = words;
  renderFlashcards(words);
  hideLoading();
}

async function generateAllSentences() {
  const wordsWithout = currentFlashcards.filter(w => !w.sample_sentence && !getFallbackSentence(w.word));
  if (!wordsWithout.length) { showToast('✅ All words have sentences!'); return; }
  if (!confirm(`Generate sentences for ${wordsWithout.length} words?`)) return;

  showLoading();
  let count = 0;
  for (const w of wordsWithout) {
    try {
      const sentence = await callAISentence(w.word);
      if (sentence) {
        await supabaseClient.from('vocabulary').update({ sample_sentence: sentence }).eq('id', w.id);
        w.sample_sentence = sentence;
        count++;
      }
    } catch {
      const fb = `This is a sample sentence using the word "${w.word}".`;
      await supabaseClient.from('vocabulary').update({ sample_sentence: fb }).eq('id', w.id);
      w.sample_sentence = fb;
      count++;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  hideLoading();
  renderGrid();
  showToast(`✅ ${count}/${wordsWithout.length} sentences generated!`);
}

async function regenerateSentence(wordId) {
  const word = currentFlashcards.find(w => w.id === wordId);
  if (!word) return;
  
  // Show loading state on the card
  const btn = document.querySelector(`[onclick*="regenerateSentence('${wordId}')"]`);
  const sentenceDiv = btn?.closest('.grid-sentence');
  if (sentenceDiv) sentenceDiv.innerHTML = '<span class="text-light">⏳ Generating...</span>';
  
  try {
    const sentence = await callAISentence(word.word);
    if (sentence) {
      await supabaseClient.from('vocabulary').update({ sample_sentence: sentence }).eq('id', wordId);
      word.sample_sentence = sentence;
    } else {
      const fb = getFallbackSentence(word.word) || ('This is a sample sentence using the word "' + word.word + '".');
      await supabaseClient.from('vocabulary').update({ sample_sentence: fb }).eq('id', wordId);
      word.sample_sentence = fb;
    }
    // Update the card DOM directly — no full grid re-render
    if (sentenceDiv) {
      sentenceDiv.innerHTML = word.sample_sentence + `
        <button class="btn-regenerate" onclick="event.stopPropagation(); speakSentence('${word.id}')" title="🔊 朗讀句子">🔊</button>
        <button class="btn-regenerate" onclick="event.stopPropagation(); regenerateSentence('${word.id}')" title="Regenerate">🔄</button>`;
    }
    showToast('✅ Sentence updated!');
  } catch (e) {
    showToast('❌ AI failed: ' + e.message);
    if (sentenceDiv) {
      sentenceDiv.innerHTML = '<span class="text-light">❌ Failed</span>' +
        `<button class="btn-regenerate" onclick="event.stopPropagation(); regenerateSentence('${word.id}')">🔄 Retry</button>`;
    }
  }
}

function speakSentence(wordId) {
  const word = currentFlashcards.find(w => w.id === wordId);
  if (!word || !word.sample_sentence) return;
  speakWord(word.sample_sentence, getFastRate());
}

let activeTiers = ['newbee', 'well-tested', 'mastered'];

function toggleTierFilter(tier) {
  const idx = activeTiers.indexOf(tier);
  if (idx >= 0) {
    activeTiers.splice(idx, 1);
    document.querySelector(`.tier-btn[data-tier="${tier}"]`).classList.remove('active');
  } else {
    activeTiers.push(tier);
    document.querySelector(`.tier-btn[data-tier="${tier}"]`).classList.add('active');
  }
  filterFlashcards();
}

function filterFlashcards() {
  const tagFilter = document.getElementById('flashcardTagFilter').value;

  // Fetch all words first
    fetchVocabulary().then(async (allWords) => {
    let words = allWords;

    // Apply tier filter from active buttons
    words = words.filter(w => {
      const tier = w.level <= 2 ? 'newbee' : w.level <= 5 ? 'well-tested' : 'mastered';
      return activeTiers.includes(tier);
    });

    // Apply tag filter
    if (tagFilter) {
      if (tagFilter === '__untagged') {
        const wordIds = words.map(w => w.id);
        const tagMap = await fetchAllWordTags(wordIds);
        words = words.filter(w => !tagMap[w.id] || tagMap[w.id].length === 0);
      } else {
        const { data } = await supabaseClient
          .from('word_tags')
          .select('word_id')
          .eq('tag_id', tagFilter);
        const taggedIds = new Set((data || []).map(d => d.word_id));
        words = words.filter(w => taggedIds.has(w.id));
      }
    }

    renderFlashcards(words);
  });
}

async function loadFlashcardTagFilter() {
  const select = document.getElementById('flashcardTagFilter');
  if (!select) return;
  try {
    const tags = await fetchTags();
    select.innerHTML = `<option value="">🏷️ ${t('english.all')}</option>` +
      tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('') +
      `<option value="__untagged">🚫 ${t('english.noTag')}</option>`;
  } catch(e) { console.warn('Flashcard tag filter load failed:', e); }
}