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

// ============================================================
// Helper: English word validation (for error detection)
// ============================================================

// Levenshtein distance for typo detection
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m + 1}, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1;
    }
  }
  return dp[m][n];
}

// Common people names for detection
const COMMON_NAMES = new Set([
  'peter','john','mary','james','robert','michael','william','david','richard','joseph',
  'thomas','charles','christopher','daniel','matthew','anthony','mark','donald','steven',
  'paul','andrew','joshua','kenneth','kevin','brian','george','timothy','ronald','edward',
  'jason','jeffrey','ryan','jacob','gary','nicholas','eric','jonathan','stephen','larry',
  'justin','scott','brandon','benjamin','samuel','frank','raymond','gregory','patrick',
  'alexander','jack','dennis','jerry','tyler','aaron','jose','nathan','henry','douglas',
  'adam','zachary','nathaniel','kyle','walter','carl','willie','jeremy','harold','keith',
  'roger','gerald','ethan','arthur','terry','christian','sean','lawrence','austin','joe',
  'jesse','jordan','billy','bruce','bryan','albert','todd','johnny','randy','philip',
  'jimmy','danny','roy','howard','fred','vincent','jim','troy','craig','alan','shawn',
  'tommy','chuck','bob','jake','matt','tom','dick','harry','luke','liam','noah','oliver',
  'elijah','james','ben','sam','max','leo','oscar','miles','felix','hugo','theo','jude',
  'jane','sarah','jennifer','lisa','sandra','michelle','patricia','linda','barbara',
  'elizabeth','susan','jessica','ashley','karen','nancy','betty','margaret','helen',
  'kimberly','deborah','amanda','donna','carol','melissa','stephanie','rebecca','sharon',
  'laura','cynthia','kathleen','mary','amy','anna','christine','ruth','janet','lori',
  'rachel','andrea','tiffany','katherine','julia','teresa','samantha','kathryn','judy',
  'virginia','catherine','debra','joyce','heather','tina','kelly','denise','doris',
  'marilyn','emma','olivia','ava','isabella','sophia','mia','charlotte','amelia','harper',
  'evelyn','abigail','emily','ella','avery','sofia','camila','aria','scarllet','victoria',
  'chloe','grace','lily','layla','riley','zoey','nora','hannah','lena','sienna','alice',
  'anna','sarah','julia','elena','luna','maya','aisha','mei','sakura','yuki','ling',
  'li','wei','fang','chen','wang','zhang','liu','yang','huang','wu','zhao','zhou',
  'kim','park','choi','jung','lee','yoon','seo','hong','kang','yoon','ahn','baek',
  'taro','hanako','hiroshi','yoko','kenji','yuki','satoshi','akira','ichiro','ryo',
  'ahmed','mohammed','ali','omar','hassan','hussain','abdullah','ibrahim','khalid',
  'fatima','aisha','layla','noor','zara','amira','leila','yusuf','ismail','jamal',
  'siti','budi','dewi','wayan','ketut','made','nyoman','agus','putu','komang',
  'juan','carlos','jose','manuel','jesus','miguel','angel','javier','rafael','pedro',
  'maria','carmen','rosa','elena','sonia','dolores','isabel','ana','lucia','paula',
  'giuseppe','marco','luca','alessandro','francesco','antonio','giovanni','paolo',
  'sofia','giulia','alessia','chara','federica','elena','sara','martina','chiara',
  'hans','fritz','karl','heinrich','wolfgang','klaus','dieter','gerhard','johann',
  'anna','elise','greta','hedwig','ingrid','klara','lotte','marta','ursula','waltraud',
  'yuki','hiroshi','sakura','kenji','yoko','taro','hanako','akira','ichiro','ryo',
  'haruto','souta','yuito','hinata','sakura','mei','ren','aoi','sumire','akari',
  'hongkong','hong','kong','shanghai','beijing','tokyo','seoul','london','paris',
  'berlin','rome','madrid','moscow','newyork','losangeles','chicago','sydney','dubai'
]);

// Common countries and regions
const COMMON_COUNTRIES = new Set([
  'china','japan','korea','india','usa','uk','britain','england','france','germany',
  'italy','spain','portugal','russia','australia','canada','brazil','mexico','argentina',
  'thailand','vietnam','singapore','malaysia','indonesia','philippines','myanmar','cambodia',
  'laos','mongolia','nepal','srilanka','bangladesh','pakistan','iran','iraq','turkey',
  'israel','egypt','nigeria','southafrica','kenya','morocco','sweden','norway','finland',
  'denmark','netherlands','belgium','switzerland','austria','poland','czech','hungary',
  'romania','ukraine','greece','portugal','ireland','scotland','wales','zimbabwe',
  'taiwan','american','european','asian','african','latin','chinese','japanese','korean',
  'indian','british','french','german','italian','spanish','russian','australian',
  'canadian','brazilian','mexican','thai','vietnamese','singaporean','malaysian',
  'hongkonger','english','american','dutch','swedish','norwegian','danish','finnish',
  'polish','turkish','arabic','egyptian','israeli','persian','greek','swiss','austrian'
]);

// Minimal common English word set for basic validation
const COMMON_ENGLISH_WORDS = new Set([
  'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you',
  'do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one',
  'all','would','there','their','what','so','up','out','if','about','who','get','which','go','me',
  'when','make','can','like','time','no','just','him','know','take','people','into','year','your',
  'good','some','could','them','see','other','than','then','now','look','only','come','its','over',
  'think','also','back','after','use','two','how','our','work','first','well','way','even','new',
  'want','because','any','these','give','day','most','us','great','between','need','large','often',
  'hand','high','place','small','under','long','get','live','where','much','should','own','old',
  'too','mean','keep','let','begin','world','run','move','life','night','right','school','still',
  'study','learn','plan','note','page','form','play','turn','cause','change','follow','set','ask',
  'show','hear','try','group','number','open','close','letter','word','line','end','land','air',
  'home','hand','picture','animal','house','point','page','letter','mother','father','family',
  'child','eye','head','foot','hand','body','water','food','room','door','window','book','paper',
  'car','city','tree','sea','star','sun','moon','earth','light','dark','hot','cold','hard','soft',
  'true','love','hate','friend','enemy','war','peace','man','woman','boy','girl','king','queen',
  'law','god','war','art','beauty','truth','power','force','mind','heart','soul','spirit','time',
  'life','death','birth','day','week','month','year','hour','minute','second','morning','noon',
  'evening','night','spring','summer','fall','winter','north','south','east','west','left','right',
  'front','back','top','bottom','side','end','start','begin','finish','stop','go','come','arrive',
  'leave','stay','sit','stand','lie','rise','fall','grow','become','seem','appear','look','feel',
  'sound','taste','smell','eat','drink','run','walk','swim','fly','ride','drive','carry','bring',
  'take','send','receive','give','offer','help','serve','fight','win','lose','play','sing','dance',
  'read','write','draw','paint','build','break','cut','push','pull','lift','drop','throw','catch',
  'apple','banana','orange','grape','water','milk','bread','rice','meat','fish','chicken','egg',
  'cheese','butter','sugar','salt','oil','tea','coffee','juice','cake','cookie','candy','soup',
  'salad','pizza','pasta','noodle','sandwich','breakfast','lunch','dinner','snack','meal','food',
  'drink','water','milk','juice','tea','coffee','beer','wine','fruit','vegetable','potato','tomato',
  'onion','garlic','carrot','bean','pea','corn','wheat','plant','flower','grass','tree','leaf',
  'root','branch','seed','soil','garden','farm','field','forest','mountain','river','lake','ocean',
  'sea','beach','island','desert','valley','hill','rock','stone','sand','sky','air','wind','rain',
  'snow','ice','fire','smoke','cloud','storm','thunder','lightning','earthquake','flood','heat',
  'cold','warm','cool','dry','wet','clean','dirty','bright','dark','sharp','dull','smooth','rough',
  'soft','hard','heavy','light','fast','slow','quiet','loud','deep','shallow','wide','narrow',
  'long','short','tall','big','small','large','tiny','thick','thin','full','empty','old','young',
  'new','early','late','near','far','high','low','rich','poor','cheap','expensive','easy','hard',
  'simple','complex','free','busy','safe','dangerous','possible','impossible','correct','wrong',
  'sure','certain','clear','obvious','strange','normal','special','different','same','similar',
  'important','necessary','popular','common','rare','beautiful','ugly','pretty','handsome','cute',
  'lovely','nice','kind','cruel','brave','coward','strong','weak','healthy','sick','tired','awake',
  'asleep','alive','dead','real','fake','true','false','happy','sad','angry','calm','excited',
  'bored','tired','scared','brave','shy','proud','wise','foolish','funny','serious','smart','dumb',
  'polite','rude','generous','selfish','honest','lazy','hardworking','friendly','mean','strict',
  'patient','curious','creative','careful','careless','responsible','reliable','helpful','useful',
  'color','red','blue','green','yellow','white','black','brown','pink','purple','orange','gray',
  'gold','silver','number','zero','one','two','three','four','five','six','seven','eight','nine',
  'ten','hundred','thousand','million','first','second','third','last','next','previous','final',
  'english','chinese','math','science','history','music','art','sport','game','team','player',
  'coach','teacher','student','doctor','nurse','worker','farmer','driver','pilot','soldier','police',
  'judge','lawyer','banker','artist','writer','singer','actor','dancer','chef','baker','tailor',
  'carpenter','engineer','scientist','pilot','captain','general','king','queen','prince','princess',
  'president','governor','senator','mayor','manager','director','leader','member','citizen','neighbor',
  'guest','host','owner','customer','patient','passenger','audience','crowd','group','team','class',
  'club','party','family','community','society','nation','country','state','city','town','village',
  'street','road','highway','bridge','building','house','home','room','door','window','floor','wall',
  'roof','garden','yard','park','market','shop','store','bank','hospital','school','church','office',
  'factory','airport','station','hotel','restaurant','theater','museum','library','stadium','gym',
  'pool','beach','park','zoo','farm','field','forest','mountain','river','lake','ocean','island'
]);

function isLikelyValidWord(word) {
  const w = word.toLowerCase().trim();
  if (w.length < 2) return false;
  if (!/^[a-zA-Z]+$/.test(w)) return false;
  
  // Check common word set
  if (COMMON_ENGLISH_WORDS.has(w)) return true;
  if (COMMON_WORDS_POS[w]) return true;
  if (IRREGULAR_VERBS[w]) return true;
  
  // Check suffix patterns
  for (const suffix of Object.keys(POS_SUFFIXES)) {
    if (w.endsWith(suffix)) return true;
  }
  
  // At minimum, must have a vowel and be at least 3 chars
  if (w.length < 3) return false;
  if (!/[aeiouy]/i.test(w)) return false;
  
  // Levenshtein check: if word is very close (distance <= 1) to a known word, it's likely a typo
  if (w.length >= 3) {
    const dictWords = COMMON_ENGLISH_WORDS;
    // Only check words of similar length (±2)
    const candidates = [];
    for (const dictW of dictWords) {
      if (Math.abs(dictW.length - w.length) <= 2) {
        candidates.push(dictW);
        if (candidates.length > 100) break; // limit for performance
      }
    }
    for (const dictW of candidates) {
      if (levenshtein(w, dictW) <= 1) {
        return false; // Very close to a real word → likely a typo
      }
    }
  }
  
  return true; // Accept as plausible
}

function isLikelyName(word) {
  const w = word.toLowerCase().trim();
  if (w.length < 2) return false;
  // Check against name list
  if (COMMON_NAMES.has(w)) return true;
  // Check against country list
  if (COMMON_COUNTRIES.has(w)) return true;
  return false;
}

// ============================================================
// Tag operations
// ============================================================

async function fetchTags() {
  if (!currentUser) return [];
  const { data, error } = await supabaseClient
    .from('tags')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createTag(name, color) {
  if (!currentUser) throw new Error('Not logged in');
  const { data, error } = await supabaseClient
    .from('tags')
    .insert({ user_id: currentUser.id, name: name.trim(), color: color || '#6366f1' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteTag(tagId) {
  const { error } = await supabaseClient
    .from('tags')
    .delete()
    .eq('id', tagId);
  if (error) throw error;
}

async function addTagToWord(wordId, tagId) {
  const { error } = await supabaseClient
    .from('word_tags')
    .insert({ word_id: wordId, tag_id: tagId });
  if (error && error.code !== '23505') throw error; // 23505 = already exists
}

async function removeTagFromWord(wordId, tagId) {
  const { error } = await supabaseClient
    .from('word_tags')
    .delete()
    .eq('word_id', wordId)
    .eq('tag_id', tagId);
  if (error) throw error;
}

async function fetchWordTags(wordId) {
  const { data, error } = await supabaseClient
    .from('word_tags')
    .select('tag_id, tags(id, name, color)')
    .eq('word_id', wordId);
  if (error) throw error;
  return (data || []).map(wt => wt.tags).filter(Boolean);
}

async function fetchAllWordTags(wordIds) {
  if (!wordIds || !wordIds.length) return {};
  const { data, error } = await supabaseClient
    .from('word_tags')
    .select('word_id, tags(id, name, color)')
    .in('word_id', wordIds);
  if (error) throw error;
  const result = {};
  for (const wt of (data || [])) {
    if (!wt.tags) continue;
    if (!result[wt.word_id]) result[wt.word_id] = [];
    result[wt.word_id].push(wt.tags);
  }
  return result;
}

// ============================================================
// Vocabulary DB operations
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

async function bulkAddWords(words, tagId) {
  if (!currentUser || !words.length) return { added: 0, duplicates: 0, addedIds: [] };
  
  let added = 0, duplicates = 0, addedIds = [];
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
    const { data: inserted, error } = await supabaseClient
      .from('vocabulary')
      .insert(toInsert)
      .select('id');
    if (error) throw error;
    addedIds = (inserted || []).map(r => r.id);
    
    // Assign tag to newly added words
    if (tagId && addedIds.length > 0) {
      const tagRows = addedIds.map(wid => ({ word_id: wid, tag_id: tagId }));
      const { error: tagErr } = await supabaseClient
        .from('word_tags')
        .insert(tagRows);
      if (tagErr && tagErr.code !== '23505') console.warn('Tag assignment failed:', tagErr);
    }
  }
  
  return { added, duplicates, addedIds };
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

async function updateWordEntry(wordId, updates) {
  const { error } = await supabaseClient
    .from('vocabulary')
    .update(updates)
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