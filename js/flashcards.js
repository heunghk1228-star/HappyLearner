// ============================================================
// Flash Cards Module
// ============================================================

let currentFlashcards = [];
let currentCardIndex = 0;
let isFlipped = false;

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
  'practice': 'Regular practice is essential.',
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

function renderFlashcards(words) {
  currentFlashcards = words;
  currentCardIndex = 0;
  isFlipped = false;
  
  const container = document.getElementById('flashcardContainer');
  if (!container) return;
  
  if (!words.length) {
    container.innerHTML = `<div class="empty-state">${t('common.placeholders')}</div>`;
    return;
  }
  
  renderCard();
}

function renderCard() {
  const container = document.getElementById('flashcardContainer');
  if (!container) return;
  
  const word = currentFlashcards[currentCardIndex];
  if (!word) {
    container.innerHTML = `<div class="empty-state">${t('common.loading')}</div>`;
    return;
  }
  
  const posArr = word.part_of_speech ? word.part_of_speech.split(',') : detectPOS(word.word);
  const posLabels = posArr.map(p => POS_MAP[p]?.[currentLang] || p).join(', ');
  const forms = getWordForms(word.word);
  const isVerb = posArr.includes('verb');
  
  const total = currentFlashcards.length;
  
  // Check if we have a sentence
  const hasSentence = word.sample_sentence && word.sample_sentence.length > 0;
  const fallback = !hasSentence ? getFallbackSentence(word.word) : null;
  const displaySentence = word.sample_sentence || fallback || '';
  
  container.innerHTML = `
    <div class="card-progress">
      <span>${currentCardIndex + 1} / ${total}</span>
    </div>
    <div class="flashcard ${isFlipped ? 'flipped' : ''}" onclick="toggleFlip()">
      <div class="flashcard-inner">
        <div class="flashcard-front">
          <div class="card-word">${word.word}</div>
          <button class="sound-btn" onclick="event.stopPropagation(); speakWord('${word.word}')" title="${t('english.pronunciation')}">
            🔊
          </button>
          ${isVerb ? `
          <div class="word-forms">
            <div><small>${t('english.pastTense')}:</small> ${forms.past}</div>
            <div><small>${t('english.pastParticiple')}:</small> ${forms.pp}</div>
            <div><small>${t('english.presentParticiple')}:</small> ${forms.ing}</div>
            <div><small>${t('english.thirdPerson')}:</small> ${forms.s}</div>
          </div>
          ` : ''}
          <div class="card-hint">${t('english.flip')}</div>
        </div>
        <div class="flashcard-back">
          <div class="card-meaning">${word.chinese_meaning || ''}</div>
          <div class="card-pos">${posLabels}</div>
          <div class="card-level">
            ${t('english.level')}: ${word.level} — ${LEVELS[word.level]?.label[currentLang] || ''}
          </div>
          <div class="card-sentence">
            <small>${t('english.sampleSentence')}:</small>
            ${displaySentence 
              ? `<p>${displaySentence}</p>`
              : `<div class="no-sentence">
                   <p class="text-light">${t('common.placeholders')}</p>
                   <button class="btn btn-sm btn-ai" onclick="event.stopPropagation(); generateSentenceForCard('${word.id}')">
                     ✨ Generate with AI
                   </button>
                 </div>`
            }
            ${fallback && !hasSentence ? `<small class="sentence-source">📝 Fallback</small>` : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="card-nav">
      <button class="btn btn-outline" onclick="prevCard()" ${currentCardIndex === 0 ? 'disabled' : ''}>
        ◀ ${t('english.back')}
      </button>
      <button class="btn btn-primary" onclick="nextCard()">
        ${currentCardIndex < total - 1 ? (t('english.nextQuestion') + ' ▶') : '✅ ' + t('english.finishTest')}
      </button>
    </div>
  `;
}

async function generateSentenceForCard(wordId) {
  const word = currentFlashcards.find(w => w.id === wordId);
  if (!word) return;
  
  const btn = document.querySelector('.no-sentence .btn-ai');
  if (btn) {
    btn.textContent = '⏳ Generating...';
    btn.disabled = true;
  }
  
  try {
    const sentence = await callAISentence(word.word);
    if (sentence) {
      // Save to database
      const { error } = await supabaseClient
        .from('vocabulary')
        .update({ sample_sentence: sentence })
        .eq('id', wordId);
      
      if (!error) {
        word.sample_sentence = sentence;
        renderCard();
        showToast('✅ Sentence generated!');
      }
    } else {
      // Fallback
      const fallback = getFallbackSentence(word.word) || `This is a sample sentence using the word "${word.word}".`;
      word.sample_sentence = fallback;
      const { error } = await supabaseClient
        .from('vocabulary')
        .update({ sample_sentence: fallback })
        .eq('id', wordId);
      if (!error) renderCard();
      showToast('📝 Fallback sentence used');
    }
  } catch (e) {
    showToast('❌ AI failed: ' + e.message);
    if (btn) {
      btn.textContent = '✨ Generate with AI';
      btn.disabled = false;
    }
  }
}

async function callAISentence(word) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.openai.apiKey}`,
      'HTTP-Referer': window.location.origin || 'https://learning-toolkit.local',
      'X-Title': 'Learning Toolkit'
    },
    body: JSON.stringify({
      model: CONFIG.openai.model,
      messages: [
        {
          role: 'system',
          content: 'You are a teacher. Generate ONE simple English sentence using the given word. The sentence should be suitable for F3 (Grade 9, age 14-15) students. Return ONLY the sentence, nothing else.'
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

function toggleFlip() {
  isFlipped = !isFlipped;
  renderCard();
}

function nextCard() {
  if (currentCardIndex < currentFlashcards.length - 1) {
    currentCardIndex++;
    isFlipped = false;
    renderCard();
  }
}

function prevCard() {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    isFlipped = false;
    renderCard();
  }
}

function speakWord(word) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

async function openFlashcards() {
  if (!currentUser) {
    alert(t('english.loginRequired'));
    return;
  }
  
  showLoading();
  const words = await fetchVocabulary();
  
  const page = document.getElementById('pageContent');
  page.innerHTML = `
    <div class="page-header">
      <h2>${t('english.flashCards')}</h2>
      <div class="filter-bar">
        <select id="flashcardFilter" onchange="filterFlashcards()" class="input">
          <option value="all">${t('english.all')} — ${t('english.words')}</option>
          <option value="newbee">${t('english.newbee')}</option>
          <option value="well-tested">${t('english.wellTested')}</option>
          <option value="mastered">${t('english.mastered')}</option>
        </select>
        <button class="btn btn-outline btn-sm" onclick="generateAllSentences()" style="margin-left:0.5rem">
          ✨ Generate All Sentences
        </button>
      </div>
    </div>
    <div id="flashcardContainer"></div>
  `;
  
  currentFlashcards = words;
  renderFlashcards(words);
  hideLoading();
}

async function generateAllSentences() {
  const wordsWithoutSentences = currentFlashcards.filter(
    w => !w.sample_sentence && !getFallbackSentence(w.word)
  );
  
  if (!wordsWithoutSentences.length) {
    showToast('✅ All words already have sentences!');
    return;
  }
  
  if (!confirm(`Generate sentences for ${wordsWithoutSentences.length} words? This may take a while.`)) return;
  
  showLoading();
  let count = 0;
  
  for (const word of wordsWithoutSentences) {
    try {
      const sentence = await callAISentence(word.word);
      if (sentence) {
        await supabaseClient
          .from('vocabulary')
          .update({ sample_sentence: sentence })
          .eq('id', word.id);
        word.sample_sentence = sentence;
        count++;
      }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      // Use fallback
      const fallback = `This is a sample sentence using the word "${word.word}".`;
      await supabaseClient
        .from('vocabulary')
        .update({ sample_sentence: fallback })
        .eq('id', word.id);
      word.sample_sentence = fallback;
      count++;
    }
  }
  
  hideLoading();
  renderCard();
  showToast(`✅ ${count}/${wordsWithoutSentences.length} sentences generated!`);
}

function filterFlashcards() {
  const filter = document.getElementById('flashcardFilter').value;
  if (filter === 'all') {
    fetchVocabulary().then(words => renderFlashcards(words));
  } else {
    getWordsByTier(filter).then(words => renderFlashcards(words));
  }
}