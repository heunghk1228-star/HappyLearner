// ============================================================
// Vocabulary Module — CRUD, bulk import, search
// ============================================================

const LEVELS = {
  1: { tier: 'newbee', label: { 'zh-TW': '新手', 'zh-CN': '新手', 'en': 'Newbee' } },
  2: { tier: 'newbee', label: { 'zh-TW': '新手', 'zh-CN': '新手', 'en': 'Newbee' } },
  3: { tier: 'well-tested', label: { 'zh-TW': '已鞏固', 'zh-CN': '已巩固', 'en': 'Well-tested' } },
  4: { tier: 'well-tested', label: { 'zh-TW': '已鞏固', 'zh-CN': '已巩固', 'en': 'Well-tested' } },
  5: { tier: 'well-tested', label: { 'zh-TW': '已鞏固', 'zh-CN': '已巩固', 'en': 'Well-tested' } },
  6: { tier: 'mastered', label: { 'zh-TW': '已精通', 'zh-CN': '已精通', 'en': 'Mastered' } }
};

function getTierLabel(level) {
  return LEVELS[level]?.label?.[currentLang] || '';
}

function getTierName(level) {
  return LEVELS[level]?.tier || 'newbee';
}

const POS_MAP = {
  'verb': { 'zh-TW': '動詞', 'zh-CN': '动词', 'en': 'Verb' },
  'noun': { 'zh-TW': '名詞', 'zh-CN': '名词', 'en': 'Noun' },
  'adjective': { 'zh-TW': '形容詞', 'zh-CN': '形容词', 'en': 'Adjective' },
  'adverb': { 'zh-TW': '副詞', 'zh-CN': '副词', 'en': 'Adverb' },
  'preposition': { 'zh-TW': '介詞', 'zh-CN': '介词', 'en': 'Preposition' },
  'conjunction': { 'zh-TW': '連詞', 'zh-CN': '连词', 'en': 'Conjunction' },
  'pronoun': { 'zh-TW': '代詞', 'zh-CN': '代词', 'en': 'Pronoun' },
  'interjection': { 'zh-TW': '感嘆詞', 'zh-CN': '感叹词', 'en': 'Interjection' },
  'number': { 'zh-TW': '數量詞', 'zh-CN': '数量词', 'en': 'Number' },
  'article': { 'zh-TW': '冠詞', 'zh-CN': '冠词', 'en': 'Article' },
  'modal': { 'zh-TW': '情態動詞', 'zh-CN': '情态动词', 'en': 'Modal Verb' }
};

// Common irregular verbs mapping (base form -> {past, pp, ing, s})
const IRREGULAR_VERBS = {
  'go':     { past: 'went',    pp: 'gone',    ing: 'going',     s: 'goes' },
  'have':   { past: 'had',     pp: 'had',     ing: 'having',    s: 'has' },
  'do':     { past: 'did',     pp: 'done',    ing: 'doing',     s: 'does' },
  'say':    { past: 'said',    pp: 'said',    ing: 'saying',    s: 'says' },
  'get':    { past: 'got',     pp: 'got/gotten', ing: 'getting', s: 'gets' },
  'make':   { past: 'made',    pp: 'made',    ing: 'making',    s: 'makes' },
  'know':   { past: 'knew',    pp: 'known',   ing: 'knowing',   s: 'knows' },
  'think':  { past: 'thought', pp: 'thought', ing: 'thinking',  s: 'thinks' },
  'take':   { past: 'took',    pp: 'taken',   ing: 'taking',    s: 'takes' },
  'see':    { past: 'saw',     pp: 'seen',    ing: 'seeing',    s: 'sees' },
  'come':   { past: 'came',    pp: 'come',    ing: 'coming',    s: 'comes' },
  'find':   { past: 'found',   pp: 'found',   ing: 'finding',   s: 'finds' },
  'give':   { past: 'gave',    pp: 'given',   ing: 'giving',    s: 'gives' },
  'tell':   { past: 'told',    pp: 'told',    ing: 'telling',   s: 'tells' },
  'write':  { past: 'wrote',   pp: 'written', ing: 'writing',   s: 'writes' },
  'read':   { past: 'read',    pp: 'read',    ing: 'reading',   s: 'reads' },
  'speak':  { past: 'spoke',   pp: 'spoken',  ing: 'speaking',  s: 'speaks' },
  'eat':    { past: 'ate',     pp: 'eaten',   ing: 'eating',    s: 'eats' },
  'drink':  { past: 'drank',   pp: 'drunk',   ing: 'drinking',  s: 'drinks' },
  'run':    { past: 'ran',     pp: 'run',     ing: 'running',   s: 'runs' },
  'swim':   { past: 'swam',    pp: 'swum',    ing: 'swimming',  s: 'swims' },
  'begin':  { past: 'began',   pp: 'begun',   ing: 'beginning', s: 'begins' },
  'sing':   { past: 'sang',    pp: 'sung',    ing: 'singing',   s: 'sings' },
  'teach':  { past: 'taught',  pp: 'taught',  ing: 'teaching',  s: 'teaches' },
  'buy':    { past: 'bought',  pp: 'bought',  ing: 'buying',    s: 'buys' },
  'bring':  { past: 'brought', pp: 'brought', ing: 'bringing',  s: 'brings' },
  'catch':  { past: 'caught',  pp: 'caught',  ing: 'catching',  s: 'catches' },
  'fight':  { past: 'fought',  pp: 'fought',  ing: 'fighting',  s: 'fights' },
  'send':   { past: 'sent',    pp: 'sent',    ing: 'sending',   s: 'sends' },
  'build':  { past: 'built',   pp: 'built',   ing: 'building',  s: 'builds' },
  'feel':   { past: 'felt',    pp: 'felt',    ing: 'feeling',   s: 'feels' },
  'keep':   { past: 'kept',    pp: 'kept',    ing: 'keeping',   s: 'keeps' },
  'leave':  { past: 'left',    pp: 'left',    ing: 'leaving',   s: 'leaves' },
  'lend':   { past: 'lent',    pp: 'lent',    ing: 'lending',   s: 'lends' },
  'mean':   { past: 'meant',   pp: 'meant',   ing: 'meaning',   s: 'means' },
  'sleep':  { past: 'slept',   pp: 'slept',   ing: 'sleeping',  s: 'sleeps' },
  'spend':  { past: 'spent',   pp: 'spent',   ing: 'spending',  s: 'spends' },
  'learn':  { past: 'learnt/learned', pp: 'learnt/learned', ing: 'learning', s: 'learns' }
};

// Common suffixes for part-of-speech detection (basic)
const POS_SUFFIXES = {
  'tion': 'noun', 'sion': 'noun', 'ment': 'noun', 'ness': 'noun', 'ity': 'noun',
  'ance': 'noun', 'ence': 'noun', 'ure': 'noun', 'al': 'adjective',
  'ous': 'adjective', 'ive': 'adjective', 'able': 'adjective', 'ible': 'adjective',
  'ful': 'adjective', 'less': 'adjective', 'ic': 'adjective', 'ical': 'adjective',
  'ly': 'adverb', 'ify': 'verb', 'ise': 'verb', 'ize': 'verb', 'en': 'verb'
};

// Common words with POS lookup
const COMMON_WORDS_POS = {
  'the': ['article'], 'a': ['article'], 'an': ['article'],
  'is': ['verb'], 'am': ['verb'], 'are': ['verb'], 'was': ['verb'], 'were': ['verb'],
  'be': ['verb'], 'been': ['verb'], 'being': ['verb'],
  'have': ['verb'], 'has': ['verb'], 'had': ['verb'], 'do': ['verb'], 'does': ['verb'],
  'did': ['verb'], 'done': ['verb'], 'will': ['verb', 'noun'], 'would': ['verb'],
  'can': ['verb', 'noun'], 'could': ['verb'], 'shall': ['verb'], 'should': ['verb'],
  'may': ['verb'], 'might': ['verb'], 'must': ['verb'],
  'and': ['conjunction'], 'but': ['conjunction'], 'or': ['conjunction'],
  'if': ['conjunction'], 'because': ['conjunction'], 'so': ['adverb', 'conjunction'],
  'in': ['preposition'], 'on': ['preposition'], 'at': ['preposition'],
  'to': ['preposition'], 'for': ['preposition'], 'with': ['preposition'],
  'by': ['preposition'], 'from': ['preposition'], 'of': ['preposition'],
  'i': ['pronoun'], 'you': ['pronoun'], 'he': ['pronoun'], 'she': ['pronoun'],
  'it': ['pronoun'], 'we': ['pronoun'], 'they': ['pronoun'],
  'my': ['pronoun'], 'your': ['pronoun'], 'his': ['pronoun'], 'her': ['pronoun'],
  'our': ['pronoun'], 'their': ['pronoun'],
  'this': ['pronoun', 'adjective'], 'that': ['pronoun', 'conjunction'],
  'these': ['pronoun'], 'those': ['pronoun'],
  'not': ['adverb'], 'very': ['adverb'], 'really': ['adverb'], 'always': ['adverb'],
  'often': ['adverb'], 'never': ['adverb'], 'also': ['adverb'], 'just': ['adverb'],
  'well': ['adverb', 'adjective'], 'good': ['adjective'], 'bad': ['adjective'],
  'big': ['adjective'], 'small': ['adjective'], 'new': ['adjective'], 'old': ['adjective'],
  'great': ['adjective'], 'important': ['adjective'], 'different': ['adjective'],
  'first': ['adjective', 'adverb'], 'last': ['adjective', 'noun'],
  'own': ['adjective', 'verb'], 'same': ['adjective'], 'many': ['adjective', 'pronoun'],
  'some': ['adjective', 'pronoun'], 'any': ['adjective', 'pronoun'],
  'each': ['adjective', 'pronoun'], 'every': ['adjective'],
  'more': ['adjective', 'adverb'], 'most': ['adjective', 'adverb'],
  'other': ['adjective', 'pronoun'], 'such': ['adjective'], 'no': ['adjective'],
  'yes': ['interjection'], 'oh': ['interjection'], 'please': ['interjection', 'verb']
};

// ============================================================
// Helper: Normalize word (singular for nouns, base form for verbs)
// ============================================================

function normalizeWord(word) {
  let w = word.toLowerCase().trim();
  
  // Remove common suffixes to find base form
  // Check irregular verbs first
  for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
    if (w === forms.past || w === forms.pp || w === forms.ing || w === forms.s) {
      return base;
    }
  }
  
  // Regular past tense (-ed)
  if (w.endsWith('ied') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ed') && w.length > 3) {
    let base = w.slice(0, -1); // try -e
    if (base.length > 2) return base;
    base = w.slice(0, -2);
    if (base.length > 2) return base;
  }
  
  // Third person singular (-s, -es)
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('es') && w.length > 3) {
    let base = w.slice(0, -2);
    if (base.endsWith('s') || base.endsWith('x') || base.endsWith('z') ||
        base.endsWith('ch') || base.endsWith('sh') || base.endsWith('o')) {
      return base;
    }
  }
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    return w.slice(0, -1);
  }
  
  // Present participle (-ing)
  if (w.endsWith('ying') && w.length > 5) return w.slice(0, -4) + 'ie';
  if (w.endsWith('ing') && w.length > 4) {
    let base = w.slice(0, -3);
    if (base.endsWith('m') || base.endsWith('t') || base.endsWith('d') ||
        base.endsWith('g') || base.endsWith('n') || base.endsWith('p')) {
      // Double consonant - remove last letter
      if (base.length > 2 && base[base.length-1] === base[base.length-2]) {
        return base.slice(0, -1);
      }
    }
    if (base.endsWith('e')) return base.slice(0, -1);
    if (base.endsWith('c')) return base + 'k';
    return base;
  }
  
  // Plural / noun forms
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ves') && w.length > 4) return w.slice(0, -3) + 'f';
  if (w.endsWith('xes') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('shes') && w.length > 5) return w.slice(0, -2);
  if (w.endsWith('ches') && w.length > 5) return w.slice(0, -2);
  if (w.endsWith('sses') && w.length > 5) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    return w.slice(0, -1);
  }
  
  return w;
}

function getWordForms(baseWord) {
  const w = baseWord.toLowerCase();
  if (IRREGULAR_VERBS[w]) {
    return IRREGULAR_VERBS[w];
  }
  // Regular verb forms
  if (w.endsWith('e')) {
    return {
      past: w + 'd',
      pp: w + 'd',
      ing: w.slice(0, -1) + 'ing',
      s: w + 's'
    };
  }
  if (w.endsWith('y') && !'aeiou'.includes(w[w.length-2])) {
    return {
      past: w.slice(0, -1) + 'ied',
      pp: w.slice(0, -1) + 'ied',
      ing: w + 'ing',
      s: w.slice(0, -1) + 'ies'
    };
  }
  return {
    past: w + 'ed',
    pp: w + 'ed',
    ing: w.endsWith('c') ? w + 'king' : w + (w.match(/[aeiou][bdfgkmnpstvz]$/i) ? w[w.length-1] + 'ing' : 'ing'),
    s: w + 's'
  };
}

function detectPOS(word) {
  const w = word.toLowerCase();
  if (COMMON_WORDS_POS[w]) return COMMON_WORDS_POS[w];
  
  // Try suffix-based detection
  for (const [suffix, pos] of Object.entries(POS_SUFFIXES)) {
    if (w.endsWith(suffix)) return [pos];
  }
  
  // Default: if in irregular verbs, it's at least a verb
  if (IRREGULAR_VERBS[w]) return ['verb', 'noun'];
  
  return ['noun']; // Default guess
}

// ============================================================
// Database operations
// ============================================================

async function fetchVocabulary() {
  if (!currentUser) return [];
  const { data, error } = await supabaseClient
    .from('vocabulary')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function addWord(word, chineseMeaning, pos) {
  if (!currentUser) throw new Error('Not logged in');
  
  const normalized = normalizeWord(word);
  
  // Check duplicate
  const { data: existing } = await supabaseClient
    .from('vocabulary')
    .select('id')
    .eq('user_id', currentUser.id)
    .eq('word', normalized)
    .maybeSingle();
    
  if (existing) return { duplicate: true, word: normalized };
  
  const posStr = Array.isArray(pos) ? pos.join(',') : pos;
  const { data, error } = await supabaseClient
    .from('vocabulary')
    .insert({
      user_id: currentUser.id,
      word: normalized,
      chinese_meaning: chineseMeaning || '',
      part_of_speech: posStr,
      level: 1,
      tier: 'newbee'
    })
    .select()
    .single();
    
  if (error) throw error;
  return { duplicate: false, data };
}

async function bulkAddWords(words) {
  if (!currentUser || !words.length) return { added: 0, duplicates: 0 };
  
  let added = 0, duplicates = 0;
  const normalizedWords = words.map(w => {
    const norm = normalizeWord(w.word || w);
    const pos = w.pos || detectPOS(norm);
    return { original: w.word || w, normalized: norm, pos, meaning: w.meaning || '' };
  });
  
  // Get all existing words for this user
  const { data: existing } = await supabaseClient
    .from('vocabulary')
    .select('word')
    .eq('user_id', currentUser.id);
  const existingSet = new Set((existing || []).map(e => e.word));
  
  // AI batch translate missing meanings
  const newWords = normalizedWords.filter(w => !existingSet.has(w.normalized));
  if (newWords.length > 0) {
    await callAIBatchMeanings(newWords);
  }
  
  const toInsert = [];
  for (const w of normalizedWords) {
    if (existingSet.has(w.normalized)) {
      duplicates++;
      continue;
    }
    toInsert.push({
      user_id: currentUser.id,
      word: w.normalized,
      chinese_meaning: w.meaning,
      part_of_speech: Array.isArray(w.pos) ? w.pos.join(',') : w.pos,
      level: 1,
      tier: 'newbee'
    });
    existingSet.add(w.normalized);
    added++;
  }
  
  if (toInsert.length > 0) {
    const { error } = await supabaseClient
      .from('vocabulary')
      .insert(toInsert);
    if (error) throw error;
  }
  
  return { added, duplicates };
}

async function updateWordLevel(wordId, newLevel) {
  const tierInfo = LEVELS[newLevel] || LEVELS[1];
  const { error } = await supabaseClient
    .from('vocabulary')
    .update({ 
      level: newLevel,
      tier: tierInfo.tier,
      last_reviewed: new Date().toISOString().split('T')[0]
    })
    .eq('id', wordId);
  if (error) throw error;
}

async function updateWordMeaning(wordId, meaning) {
  const { error } = await supabaseClient
    .from('vocabulary')
    .update({ chinese_meaning: meaning })
    .eq('id', wordId);
  if (error) throw error;
}

async function updateWordPOS(wordId, pos) {
  const { error } = await supabaseClient
    .from('vocabulary')
    .update({ part_of_speech: pos })
    .eq('id', wordId);
  if (error) throw error;
}

async function deleteWord(wordId) {
  const { error } = await supabaseClient
    .from('vocabulary')
    .delete()
    .eq('id', wordId);
  if (error) throw error;
}

async function searchVocabulary(query) {
  const all = await fetchVocabulary();
  if (!query) return all;
  const q = query.toLowerCase();
  return all.filter(v => 
    v.word.toLowerCase().includes(q) || 
    (v.chinese_meaning && v.chinese_meaning.includes(q))
  );
}

async function getWordsByTier(tier) {
  if (!currentUser) return [];
  const { data } = await supabaseClient
    .from('vocabulary')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('tier', tier);
  return data || [];
}

async function getTodayCheckIn() {
  if (!currentUser) return null;
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabaseClient
    .from('check_ins')
    .select('*')
    .eq('user_id', currentUser.id)
    .eq('check_in_date', today)
    .maybeSingle();
  return data;
}

async function doCheckIn() {
  if (!currentUser) throw new Error('Not logged in');
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabaseClient
    .from('check_ins')
    .insert({ user_id: currentUser.id, check_in_date: today })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getCheckInStreak() {
  if (!currentUser) return 0;
  const { data } = await supabaseClient
    .from('check_ins')
    .select('check_in_date')
    .eq('user_id', currentUser.id)
    .order('check_in_date', { ascending: false });
  
  if (!data || data.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < data.length; i++) {
    const checkDate = new Date(data[i].check_in_date + 'T00:00:00');
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    
    if (checkDate.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ============================================================
// AI: Batch Chinese meaning generation
// ============================================================

async function callAIBatchMeanings(words) {
  // Only translate words without a meaning
  const needMeaning = words.filter(w => !w.meaning || !w.meaning.trim());
  if (!needMeaning.length) return;
  
  const BATCH_SIZE = 20;
  const batches = [];
  for (let i = 0; i < needMeaning.length; i += BATCH_SIZE) {
    batches.push(needMeaning.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    try {
      const wordList = batch.map(w => w.normalized || w.word || w).join('\n');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.openai.apiKey}`,
          'HTTP-Referer': window.location.origin || 'https://happylearner2077.vercel.app',
          'X-Title': 'HappyLearner'
        },
        body: JSON.stringify({
          model: CONFIG.openai.model || 'deepseek/deepseek-v4-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a translator. Translate each English word to Traditional Chinese (Hong Kong). Return ONLY a JSON object like {"word1":"翻譯1","word2":"翻譯2"}. No explanations, no markdown.'
            },
            {
              role: 'user',
              content: `Translate these English words to Traditional Chinese:\n${wordList}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API error');
      
      const text = data.choices?.[0]?.message?.content?.trim() || '{}';
      // Try to parse JSON from the response
      let translations = {};
      try {
        // Handle potential markdown code blocks
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        translations = JSON.parse(jsonStr);
      } catch (e) {
        console.warn('Failed to parse AI translation:', text);
        continue;
      }
      
      // Assign meanings back to the words
      for (const w of batch) {
        const wordKey = (w.normalized || w.word || w).toLowerCase();
        if (translations[wordKey] && (!w.meaning || !w.meaning.trim())) {
          w.meaning = translations[wordKey];
        }
      }
    } catch (e) {
      console.warn('AI batch translation failed:', e.message);
      // Continue without AI meanings rather than failing entirely
    }
  }
}

// ============================================================
// AI: Batch word normalization (base form extraction)
// ============================================================

async function callAIBatchNormalize(words) {
  if (!words.length) return [];
  
  const BATCH_SIZE = 30;
  const batches = [];
  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    batches.push(words.slice(i, i + BATCH_SIZE));
  }
  
  const allResults = [];
  for (const batch of batches) {
    try {
      const wordList = batch.join('\n');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.openai.apiKey}`,
          'HTTP-Referer': window.location.origin || 'https://happylearner2077.vercel.app',
          'X-Title': 'HappyLearner'
        },
        body: JSON.stringify({
          model: CONFIG.openai.model || 'deepseek/deepseek-v4-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a linguist. Convert each word to its base form: verbs to present tense, nouns to singular. Keep number words (ten, five), prepositions, country/race names (Chinese, English, Asian), and function words. Skip ONLY personal names (Peter, John, Mary — return empty). Return ONLY a JSON object like {"ran":"run","apples":"apple","ten":"ten","Chinese":"Chinese","Peter":""}. No explanations, no markdown.'
            },
            {
              role: 'user',
              content: `Convert these words to their base forms:\n${wordList}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API error');
      
      const text = data.choices?.[0]?.message?.content?.trim() || '{}';
      let normalizations = {};
      try {
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        normalizations = JSON.parse(jsonStr);
      } catch (e) {
        console.warn('Failed to parse AI normalization:', text);
        // Fallback: use original words
        for (const w of batch) {
          allResults.push({ original: w, normalized: w, pos: detectPOS(w) });
        }
        continue;
      }
      
      for (const w of batch) {
        const base = normalizations[w];
        if (base && base.length > 0) {
          allResults.push({ original: w, normalized: base, pos: detectPOS(base) });
        }
        // If AI returned empty string (name/proper noun), skip it
      }
    } catch (e) {
      console.warn('AI normalization failed:', e.message);
      // Fallback: use original words
      for (const w of batch) {
        allResults.push({ original: w, normalized: w, pos: detectPOS(w) });
      }
    }
  }
  return allResults;
}