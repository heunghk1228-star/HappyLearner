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
  'modal': { 'zh-TW': '情態動詞', 'zh-CN': '情态动词', 'en': 'Modal Verb' },
  'name': { 'zh-TW': '人名/地名', 'zh-CN': '人名/地名', 'en': 'Name/Place' }
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
  const todayStr = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');
  
  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.getFullYear() + '-' + 
      String(expected.getMonth() + 1).padStart(2, '0') + '-' +
      String(expected.getDate()).padStart(2, '0');
    
    if (data[i].check_in_date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function getWordsLast7Days() {
  if (!currentUser) return 0;
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabaseClient
    .from('vocabulary')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .gte('created_at', startDate);
  if (error) { console.warn('getWordsLast7Days error:', error); return 0; }
  return count || 0;
}

async function getWordsReviewedLast7Days() {
  if (!currentUser) return 0;
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { count, error } = await supabaseClient
    .from('vocabulary')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .gte('last_reviewed', startDate);
  if (error) { console.warn('getWordsReviewedLast7Days error:', error); return 0; }
  return count || 0;
}

// Track a correct answer in the review count (localStorage-based, per day)
function trackCorrectAnswer() {
  const today = new Date();
  const key = 'reviewCount_' + today.getFullYear() + '_' +
    String(today.getMonth() + 1).padStart(2, '0') + '_' +
    String(today.getDate()).padStart(2, '0');
  const count = parseInt(localStorage.getItem(key) || '0');
  localStorage.setItem(key, count + 1);
}

// Get total correct answers in the last 7 days from localStorage
function getReviewCountLast7Days() {
  let total = 0;
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = 'reviewCount_' + d.getFullYear() + '_' +
      String(d.getMonth() + 1).padStart(2, '0') + '_' +
      String(d.getDate()).padStart(2, '0');
    total += parseInt(localStorage.getItem(key) || '0');
  }
  return total;
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
          'Authorization': `Bearer ${CONFIG.openrouter.apiKey}`,
          'HTTP-Referer': window.location.origin || 'https://happylearner2077.vercel.app',
          'X-Title': 'HappyLearner'
        },
        body: JSON.stringify({
          model: CONFIG.openrouter.model || 'deepseek/deepseek-v4-flash',
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
          'Authorization': `Bearer ${CONFIG.openrouter.apiKey}`,
          'HTTP-Referer': window.location.origin || 'https://happylearner2077.vercel.app',
          'X-Title': 'HappyLearner'
        },
        body: JSON.stringify({
          model: CONFIG.openrouter.model || 'deepseek/deepseek-v4-flash',
          messages: [
            {
              role: 'system',
              content: 'You are a linguist. Convert each word to its base form: verbs to present tense, nouns to singular. Keep number words (ten, five), prepositions, country/race names (Chinese, English, Asian), and function words. Return ONLY a JSON object like {"ran":"run","apples":"apple","ten":"ten","Peter":"Peter","Chinese":"Chinese"}. No explanations, no markdown.'
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

// ============================================================
// Vocabulary Book Page — UI (moved from app.js)
// ============================================================

function showEnglishPage() {
  window.__hermes_navTriggered = true;
  navigateTo('english', true);
}

async function openVocabularyBook() {
  if (window.location.hash !== '#english/vocab') {
    history.pushState({}, '', '#english/vocab');
    lastKnownHash = '#english/vocab';
  }
  isInSubPage = true;
  showLoading();
  const words = await fetchVocabulary();
  
  const content = document.getElementById('englishContent');
  if (!content) return;
  
  const newbeeCount = words.filter(w => w.level <= 2).length;
  const wellTestedCount = words.filter(w => w.level >= 3 && w.level <= 5).length;
  const masteredCount = words.filter(w => w.level >= 6).length;
  
  content.innerHTML = `
    <div class="vocab-book-page">
      <div class="vocab-stats">
        <div class="stat-box newbee">
          <span class="stat-num">${newbeeCount}</span>
          <span class="stat-label">${t('english.newbee')}</span>
        </div>
        <div class="stat-box well-tested">
          <span class="stat-num">${wellTestedCount}</span>
          <span class="stat-label">${t('english.wellTested')}</span>
        </div>
        <div class="stat-box mastered">
          <span class="stat-num">${masteredCount}</span>
          <span class="stat-label">${t('english.mastered')}</span>
        </div>
      </div>
      
      <div class="vocab-actions">
        <button class="btn btn-primary" onclick="showAddWordsPage()">➕ ${t('english.addWords')}</button>
        <input type="text" class="input search-input" id="vocabSearch" 
               placeholder="${t('english.search')}" 
               oninput="searchVocabList(this.value)">
        <div class="tier-filter-btns" style="margin:0.25rem 0">
          <button class="tier-btn tier-newbee active" data-tier="newbee" onclick="toggleVocabTier('newbee')">${t('english.newbee')}</button>
          <button class="tier-btn tier-well-tested active" data-tier="well-tested" onclick="toggleVocabTier('well-tested')">${t('english.wellTested')}</button>
          <button class="tier-btn tier-mastered active" data-tier="mastered" onclick="toggleVocabTier('mastered')">${t('english.mastered')}</button>
        </div>
        <div class="tag-filter-group">
          <select class="input" id="tagFilter" onchange="filterByTag(this.value)" style="max-width:140px;font-size:0.85rem">
            <option value="">🏷️ ${t('english.all')}</option>
          </select>
          <button class="btn-icon" onclick="showCreateTagInput()" title="${t('english.newTag')}">➕</button>
          <div class="inline-tag-create hidden" id="inlineTagCreate">
            <input type="text" class="input" id="inlineTagName" placeholder="${t('english.tagName')}" maxlength="20" style="width:100px;font-size:0.8rem">
            <button class="btn btn-sm btn-primary" onclick="doCreateInlineTag()">${t('english.add')}</button>
            <button class="btn btn-sm btn-outline" onclick="document.getElementById('inlineTagCreate').classList.add('hidden')">✕</button>
          </div>
        </div>
      </div>
      
      <div class="vocab-list-header">
        <span class="col-word">${t('english.vocabBook')}</span>
        <span class="col-meaning">${t('english.chineseMeaning')}</span>
        <span class="col-pos">${t('english.partOfSpeech')}</span>
        <span class="col-level">${t('english.level')}</span>
        <span class="col-tags">${t('english.tags')}</span>
        <span class="col-actions"></span>
      </div>
      <div class="vocab-list" id="vocabList">
        ${t('common.loading')}
      </div>
    </div>
  `;
  
  const listEl = document.getElementById('vocabList');
  if (listEl) listEl.innerHTML = await renderVocabList(words);
  await loadTagFilter();
  hideLoading();
}

function editMeaning(id) {
  const meaning = document.getElementById(`meaning-${id}`);
  const edit = document.getElementById(`edit-${id}`);
  const posText = document.getElementById(`posText-${id}`);
  const posEdit = document.getElementById(`posEdit-${id}`);
  const editBtn = document.getElementById(`editBtn-${id}`);
  const save = document.getElementById(`save-${id}`);
  const cancel = document.getElementById(`cancel-${id}`);
  if (!meaning || !edit || !posText || !posEdit || !editBtn || !save || !cancel) return;
  meaning.classList.add('hidden');
  edit.classList.remove('hidden');
  posText.classList.add('hidden');
  posEdit.classList.remove('hidden');
  editBtn.style.display = 'none';
  save.style.display = 'inline';
  cancel.style.display = 'inline';
  edit.focus();
}

async function saveMeaning(id) {
  try {
    const edit = document.getElementById(`edit-${id}`);
    const posChecks = document.querySelectorAll(`#posEdit-${id} input:checked`);
    if (!edit) return;
    const newMeaning = edit.value.trim();
    const newPOS = Array.from(posChecks).map(cb => cb.value).join(',');
    const updates = {};
    if (newMeaning !== undefined) updates.chinese_meaning = newMeaning;
    if (newPOS) updates.part_of_speech = newPOS;
    await updateWordEntry(id, updates);
    
    document.getElementById(`meaning-${id}`).textContent = newMeaning;
    const posLabels = newPOS.split(',').map(p => POS_MAP[p]?.[currentLang] || p).join(', ');
    document.getElementById(`posText-${id}`).textContent = posLabels;
    
    document.getElementById(`meaning-${id}`).classList.remove('hidden');
    document.getElementById(`edit-${id}`).classList.add('hidden');
    document.getElementById(`posText-${id}`).classList.remove('hidden');
    document.getElementById(`posEdit-${id}`).classList.add('hidden');
    document.getElementById(`editBtn-${id}`).style.display = 'inline';
    document.getElementById(`save-${id}`).style.display = 'none';
    document.getElementById(`cancel-${id}`).style.display = 'none';
    
    showToast('✅ 已儲存');
  } catch (e) {
    showToast('❌ ' + e.message);
  }
}

function cancelEdit(id) {
  document.getElementById(`meaning-${id}`).classList.remove('hidden');
  document.getElementById(`edit-${id}`).classList.add('hidden');
  document.getElementById(`posText-${id}`).classList.remove('hidden');
  document.getElementById(`posEdit-${id}`).classList.add('hidden');
  document.getElementById(`editBtn-${id}`).style.display = 'inline';
  document.getElementById(`save-${id}`).style.display = 'none';
  document.getElementById(`cancel-${id}`).style.display = 'none';
}

async function deleteVocabWord(id) {
  if (!confirm(t('english.delete') + '?')) return;
  try {
    await deleteWord(id);
    document.querySelector(`.vocab-row[data-id="${id}"]`)?.remove();
    showToast('🗑️ ' + t('english.delete'));
  } catch (e) {
    showToast('❌ ' + e.message);
  }
}

async function searchVocabList(query) {
  await applyVocabFilter(query);
}

// Tag filter for vocab book
let currentTagFilter = null;
let vocabActiveTiers = ['newbee', 'well-tested', 'mastered'];

async function loadTagFilter() {
  const select = document.getElementById('tagFilter');
  if (!select) return;
  try {
    const tags = await fetchTags();
    select.innerHTML = `<option value="">🏷️ ${t('english.all')}</option>` +
      tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('') +
      `<option value="__untagged">🚫 ${t('english.noTag')}</option>`;
  } catch(e) { console.warn('Tag filter load failed:', e); }
}

async function showCreateTagInput() {
  document.getElementById('inlineTagCreate').classList.remove('hidden');
  document.getElementById('inlineTagName').focus();
}

async function doCreateInlineTag() {
  const name = document.getElementById('inlineTagName').value.trim();
  if (!name) return;
  try {
    await createTag(name);
    document.getElementById('inlineTagName').value = '';
    document.getElementById('inlineTagCreate').classList.add('hidden');
    await loadTagFilter();
    showToast(`✅ Tag "${name}" created`);
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

async function filterByTag(tagId) {
  currentTagFilter = tagId || null;
  const query = document.getElementById('vocabSearch')?.value || '';
  await applyVocabFilter(query);
}

function toggleVocabTier(tier) {
  const idx = vocabActiveTiers.indexOf(tier);
  if (idx >= 0) {
    vocabActiveTiers.splice(idx, 1);
    document.querySelector(`.tier-btn[data-tier="${tier}"]`).classList.remove('active');
  } else {
    vocabActiveTiers.push(tier);
    document.querySelector(`.tier-btn[data-tier="${tier}"]`).classList.add('active');
  }
  const query = document.getElementById('vocabSearch')?.value || '';
  applyVocabFilter(query);
}

async function applyVocabFilter(query) {
  let words = await searchVocabulary(query);
  words = words.filter(w => {
    const tier = w.level <= 2 ? 'newbee' : w.level <= 5 ? 'well-tested' : 'mastered';
    return vocabActiveTiers.includes(tier);
  });
  if (currentTagFilter) {
    if (currentTagFilter === '__untagged') {
      const wordIds = words.map(w => w.id);
      const tagMap = await fetchAllWordTags(wordIds);
      words = words.filter(w => !tagMap[w.id] || tagMap[w.id].length === 0);
    } else {
      const { data } = await supabaseClient
        .from('word_tags')
        .select('word_id')
        .eq('tag_id', currentTagFilter);
      const taggedIds = new Set((data || []).map(d => d.word_id));
      words = words.filter(w => taggedIds.has(w.id));
    }
  }
  const list = document.getElementById('vocabList');
  if (list) list.innerHTML = await renderVocabList(words);
}

// ============================================================
// Add Words Page
// ============================================================

function showAddWordsPage() {
  const content = document.getElementById('englishContent');
  if (!content) return;
  
  content.innerHTML = `
    <div class="add-words-page">
      <h3>✏️ 輸入詞彙</h3>
      <p class="guide">輸入詞彙，以逗號、空格或換行分隔（會自動忽略標點符號如 full stop）</p>
      <textarea class="input textarea-input" id="manualWordInput" rows="6" 
                placeholder="apple, banana, cat, dog, elephant&#10;Chinese, English, Peter"></textarea>
      <div class="word-count" id="manualWordCount">0 words</div>
      <button class="btn btn-primary" onclick="processManualInput()">${t('english.submit')}</button>
      
      <div id="addResult" class="add-result"></div>
      <button class="btn btn-outline" onclick="openVocabularyBook()" style="margin-top: 1rem;">
        ${t('english.back')}
      </button>
    </div>
  `;
  
  document.getElementById('manualWordInput').addEventListener('input', function() {
    const words = this.value.trim().split(/[,\s\n]+/).filter(w => w.trim().length > 0);
    document.getElementById('manualWordCount').textContent = `${words.length} words`;
  });
}

async function processManualInput() {
  const text = document.getElementById('manualWordInput').value.trim();
  if (!text) return;
  
  showLoading();
  try {
    const raw = text.split(/[,\s\n]+/).map(w => w.replace(/[^a-zA-Z]/g, '')).filter(w => w.length > 1);
    if (!raw.length) { hideLoading(); return; }
    
    const seen = new Set();
    const unique = [];
    const originalMap = {};
    for (const w of raw) {
      const lower = w.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(lower);
        originalMap[lower] = w;
      }
    }
    if (!unique.length) {
      hideLoading();
      document.getElementById('addResult').innerHTML = '<div class="result-info">No valid words</div>';
      return;
    }
    
    const allWords = await fetchVocabulary();
    const existingMap = {};
    for (const v of allWords) {
      existingMap[v.word.toLowerCase()] = v;
    }
    
    const words = [];
    for (const lower of unique) {
      const orig = originalMap[lower];
      const existing = existingMap[lower];
      let status = 'new';
      if (existing) {
        status = 'duplicate';
      } else if (isLikelyName(lower)) {
        status = 'name';
      } else if (!isLikelyValidWord(lower)) {
        status = 'error';
      }
      words.push({
        word: orig,
        lower: lower,
        meaning: existing ? (existing.chinese_meaning || '') : '',
        pos: status === 'name' ? 'name' : (existing ? (existing.part_of_speech || detectPOS(lower).join(',')) : detectPOS(lower).join(',')),
        status: status,
        existingId: existing ? existing.id : null,
        tagIds: [],
        tagId: ''
      });
    }
    
    const needMeaning = words.filter(w => w.status === 'new' && !w.meaning);
    if (needMeaning.length > 0) {
      try {
        const aiWords = needMeaning.map(w => ({ normalized: w.lower, meaning: '' }));
        await callAIBatchMeanings(aiWords);
        for (const w of needMeaning) {
          const match = aiWords.find(a => a.normalized === w.lower);
          if (match && match.meaning) w.meaning = match.meaning;
        }
      } catch (e) {
        console.warn('AI translation failed:', e);
      }
    }
    
    hideLoading();
    document.getElementById('manualWordInput').value = '';
    document.getElementById('manualWordCount').textContent = '0 words';
    showWordReviewPage(words);
  } catch (e) {
    hideLoading();
    console.error('processManualInput error:', e);
    document.getElementById('addResult').innerHTML = `<div class="result-error">❌ ${e.message}</div>`;
  }
}

// ============================================================
// Article input
// ============================================================

const CONTRACTIONS = {
  "doesn't": "does not", "don't": "do not", "can't": "cannot", "couldn't": "could not",
  "wouldn't": "would not", "shouldn't": "should not", "won't": "will not",
  "wasn't": "was not", "weren't": "were not", "hasn't": "has not", "haven't": "have not",
  "hadn't": "had not", "didn't": "did not", "isn't": "is not", "aren't": "are not",
  "mightn't": "might not", "mustn't": "must not", "needn't": "need not",
  "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is",
  "it's": "it is", "we're": "we are", "they're": "they are",
  "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have",
  "i'll": "i will", "you'll": "you will", "he'll": "he will", "she'll": "she will",
  "we'll": "we will", "they'll": "they will",
  "i'd": "i would", "you'd": "you would", "he'd": "he would", "she'd": "she would",
  "we'd": "we would", "they'd": "they would"
};

async function processArticleInput() {
  const text = document.getElementById('articleWordInput').value.trim();
  if (!text) return;
  
  showLoading();
  try {
    let raw = text.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 1 && /^[a-zA-Z]/.test(w));
    if (!raw.length) { hideLoading(); document.getElementById('addResult').innerHTML = '<div class="result-info">No valid words</div>'; return; }
    
    const expanded = [];
    for (const w of raw) {
      expanded.push(...(CONTRACTIONS[w.toLowerCase()] || w).split(' '));
    }
    
    const seen = new Set();
    const unique = [];
    for (const w of expanded) {
      const lower = w.toLowerCase();
      if (!seen.has(lower)) { seen.add(lower); unique.push(lower); }
    }
    if (!unique.length) { hideLoading(); document.getElementById('addResult').innerHTML = '<div class="result-info">No valid words</div>'; return; }
    
    let normalized = [];
    try {
      normalized = await callAIBatchNormalize(unique.slice(0, 100));
    } catch (e) {
      console.warn('AI normalize failed, using original words:', e);
      normalized = unique.map(w => ({ original: w, normalized: w, pos: detectPOS(w) }));
    }
    const seenNorm = new Set();
    const uniqueNorm = [];
    for (const w of normalized) {
      if (!seenNorm.has(w.normalized) && w.normalized.length > 1) {
        seenNorm.add(w.normalized);
        uniqueNorm.push({ word: w.normalized, pos: w.pos || detectPOS(w.normalized), original: w.original });
      }
    }
    const wordTexts = uniqueNorm.map(w => w.word);
    if (!wordTexts.length) {
      hideLoading();
      document.getElementById('addResult').innerHTML = '<div class="result-info">No new words to add</div>';
      return;
    }
    
    let words = [];
    try {
      words = await classifyAndPrepareWords(wordTexts);
    } catch (e) {
      console.warn('Classification failed, showing raw words:', e);
      words = wordTexts.map(w => ({
        original: w, word: w, meaning: '',
        pos: detectPOS(w).join(','),
        status: 'new', existingId: null, existingData: null,
        tagIds: [], editing: false
      }));
    }
    for (const w of words) {
      const match = uniqueNorm.find(u => u.word === w.word);
      if (match && match.pos) w.pos = match.pos;
    }
    hideLoading();
    document.getElementById('articleWordInput').value = '';
    document.getElementById('articleWordCount').textContent = '0 words';
    showWordReviewPage(words);
  } catch (e) {
    hideLoading();
    console.error('processArticleInput error:', e);
    document.getElementById('addResult').innerHTML = `<div class="result-error">❌ ${e.message}</div>`;
  }
}

// ============================================================
// Classification & AI batch meaning
// ============================================================

async function classifyAndPrepareWords(wordTexts) {
  const allWords = await fetchVocabulary();
  const existingMap = {};
  for (const v of allWords) {
    existingMap[v.word.toLowerCase()] = v;
  }
  
  const words = wordTexts.map(w => {
    const norm = normalizeWord(w);
    const existing = existingMap[norm];
    let status = 'new';
    if (existing) {
      status = 'duplicate';
    } else if (!isLikelyValidWord(norm) || (w !== norm && !isLikelyValidWord(w))) {
      status = 'error';
    } else if (isLikelyName(norm)) {
      status = 'name';
    }
    return {
      original: w,
      word: norm,
      meaning: existing ? (existing.chinese_meaning || '') : '',
      pos: status === 'name' ? 'name' : (existing ? (existing.part_of_speech || detectPOS(norm).join(',')) : detectPOS(norm).join(',')),
      status: status,
      existingId: existing ? existing.id : null,
      existingData: existing || null,
      tagIds: [],
      editing: false
    };
  });
  
  const needMeaning = words.filter(w => w.status === 'new' && !w.meaning);
  if (needMeaning.length > 0) {
    const aiWords = needMeaning.map(w => ({ normalized: w.word, meaning: '' }));
    await callAIBatchMeanings(aiWords);
    for (const w of needMeaning) {
      const match = aiWords.find(a => a.normalized === w.word);
      if (match && match.meaning) w.meaning = match.meaning;
    }
  }
  
  const dupIds = words.filter(w => w.status === 'duplicate' && w.existingId).map(w => w.existingId);
  if (dupIds.length > 0) {
    try {
      const tagMap = await fetchAllWordTags(dupIds);
      for (const w of words) {
        if (w.existingId && tagMap[w.existingId]) {
          w.existingTags = tagMap[w.existingId];
        }
      }
    } catch(e) { console.warn('Tag fetch failed:', e); }
  }
  
  return words;
}

// ============================================================
// Word Review Page
// ============================================================

let reviewData = { words: [], selectedTagId: null, allTags: [] };

function showWordReviewPage(words) {
  reviewData.words = words;
  reviewData.selectedTagId = null;

  const content = document.getElementById('englishContent');
  if (!content) return;

  fetchTags().then(tags => { reviewData.allTags = tags; });

  const success = words.filter(w => w.status === 'new' || w.status === 'duplicate');
  const names = words.filter(w => w.status === 'name');
  const errors = words.filter(w => w.status === 'error');

  content.innerHTML = `
    <div class="review-page">
      <h3>✏️ ${t('english.reviewWords')}</h3>
      
      <div class="review-sections">
        <div class="review-section review-section-success">
          <div class="review-section-header">✅ 成功輸入 (${success.length})</div>
          <div class="review-section-body" id="reviewSuccessList">
            ${success.length ? success.map((w, i) => renderReviewWordRow(w, reviewData.words.indexOf(w))).join('') : '<div class="review-col-empty">沒有詞彙</div>'}
          </div>
        </div>

        <div class="review-section review-section-name">
          <div class="review-section-header">👤 人名/地名 (${names.length})</div>
          <div class="review-section-body" id="reviewNameList">
            ${names.length ? names.map((w, i) => renderReviewWordRow(w, reviewData.words.indexOf(w))).join('') : '<div class="review-col-empty">沒有詞彙</div>'}
          </div>
        </div>

        <div class="review-section review-section-error">
          <div class="review-section-header">❌ 錯誤輸入 (${errors.length})</div>
          <div class="review-section-body" id="reviewErrorList">
            ${errors.length ? errors.map((w, i) => renderReviewWordRow(w, reviewData.words.indexOf(w))).join('') : '<div class="review-col-empty">沒有詞彙</div>'}
          </div>
        </div>
      </div>

      <div class="review-actions" style="margin-top:1rem">
        <button class="btn btn-primary" onclick="completeReview()">✅ ${t('english.complete')} (${success.length + names.length})</button>
      </div>
    </div>
  `;
}

function renderReviewWordRow(w, idx) {
  const posLabels = w.pos ? w.pos.split(',').map(p => POS_MAP[p]?.[currentLang] || p).join(', ') : '';
  const tagOptions = reviewData.allTags.map(t =>
    `<option value="${t.id}" ${w.tagId === t.id ? 'selected' : ''}>${t.name}</option>`
  ).join('');

  return `
    <div class="review-word-row" data-idx="${idx}">
      <div class="review-word-info">
        <button class="btn-icon" onclick="editReviewWord(${idx})" title="✏️">✏️</button>
        <span class="review-word-word"><strong>${w.word}</strong></span>
        <span class="review-word-meaning" onclick="inlineEditMeaning(${idx})" title="按一下編輯中文意思">📖 <span id="meaningDisplay-${idx}">${w.meaning || '—'}</span></span>
        <span class="review-word-pos" onclick="inlineEditPOS(${idx})" title="按一下編輯詞性">🔤 <span id="posDisplay-${idx}">${posLabels}</span></span>
        <select class="input review-word-tag-select" onchange="onReviewWordTagChange(${idx}, this.value)" style="max-width:110px;font-size:0.8rem">
          <option value="">🏷️ —</option>
          ${tagOptions}
        </select>
      </div>
      <div class="review-word-row-actions">
        <button class="btn-icon" onclick="deleteReviewWord(${idx})" title="🗑️">🗑️</button>
        ${w.status === 'error' ? `<button class="btn-icon" onclick="fixReviewWord(${idx})" title="🔧 修正">🔧</button>` : ''}
        ${w.status === 'name' ? `<button class="btn-icon" onclick="keepReviewWord(${idx})" title="✅ 保留">✅</button>` : ''}
      </div>
    </div>
  `;
}

function inlineEditMeaning(idx) {
  const w = reviewData.words[idx];
  if (!w) return;
  const display = document.getElementById(`meaningDisplay-${idx}`);
  if (!display) return;
  const current = w.meaning || '';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = current;
  input.className = 'input inline-edit-input';
  input.style.width = '150px';
  input.onblur = function() {
    w.meaning = this.value.trim();
    display.textContent = w.meaning || '—';
    this.replaceWith(display);
  };
  input.onkeydown = function(e) {
    if (e.key === 'Enter') this.blur();
    if (e.key === 'Escape') { this.value = current; this.blur(); }
  };
  display.replaceWith(input);
  input.focus();
  input.select();
}

function inlineEditPOS(idx) {
  const w = reviewData.words[idx];
  if (!w) return;
  const display = document.getElementById(`posDisplay-${idx}`);
  if (!display) return;
  const current = w.pos || '';
  const input = document.createElement('select');
  input.className = 'input inline-edit-input';
  input.style.width = '120px';
  input.innerHTML = Object.entries(POS_MAP).map(([key, val]) =>
    `<option value="${key}" ${current === key ? 'selected' : ''}>${val[currentLang] || key}</option>`
  ).join('');
  input.onblur = function() {
    w.pos = this.value;
    const newLabel = POS_MAP[w.pos]?.[currentLang] || w.pos;
    display.textContent = newLabel;
    this.replaceWith(display);
  };
  input.onkeydown = function(e) {
    if (e.key === 'Escape') { this.value = current; this.blur(); }
  };
  display.replaceWith(input);
  input.focus();
}

function onReviewWordTagChange(idx, tagId) {
  if (reviewData.words[idx]) reviewData.words[idx].tagId = tagId;
}

function editReviewWord(idx) {
  const w = reviewData.words[idx];
  const newWord = prompt('修改英文詞彙:', w.word);
  if (newWord && newWord.trim()) {
    w.word = newWord.trim().toLowerCase();
    w.lower = w.word;
    const newMeaning = prompt('修改中文意思:', w.meaning || '');
    if (newMeaning !== null) w.meaning = newMeaning.trim();
    refreshReviewPage();
  }
}

function deleteReviewWord(idx) {
  reviewData.words.splice(idx, 1);
  refreshReviewPage();
}

function fixReviewWord(idx) {
  const w = reviewData.words[idx];
  const newWord = prompt('修正英文詞彙:', w.word);
  if (!newWord || !newWord.trim()) return;
  const lower = newWord.trim().toLowerCase();
  w.word = newWord.trim();
  w.lower = lower;
  if (isLikelyValidWord(lower) && !isLikelyName(lower)) {
    w.status = 'new';
    w.meaning = '';
  } else if (isLikelyName(lower)) {
    w.status = 'name';
  }
  refreshReviewPage();
}

function keepReviewWord(idx) {
  const w = reviewData.words[idx];
  w.status = 'new';
  refreshReviewPage();
}

function refreshReviewPage() {
  showWordReviewPage(reviewData.words);
}

async function completeReview() {
  showLoading();
  try {
    const allWords = await fetchVocabulary();
    const existingMap = {};
    for (const v of allWords) {
      existingMap[v.word.toLowerCase()] = v;
    }
    for (const w of reviewData.words) {
      const norm = normalizeWord(w.word);
      const existing = existingMap[norm];
      w.word = norm;
      if (existing) {
        w.status = 'duplicate';
        w.existingId = existing.id;
        w.existingData = existing;
      } else if (!isLikelyValidWord(norm)) {
        w.status = 'error';
        w.existingId = null; w.existingData = null;
      } else if (isLikelyName(norm)) {
        w.status = 'name';
        w.existingId = null; w.existingData = null;
      } else {
        w.status = 'new';
        w.existingId = null; w.existingData = null;
      }
    }
    
    const newWords = reviewData.words.filter(w => w.status === 'new');
    const nameWords = reviewData.words.filter(w => w.status === 'name');
    const duplicates = reviewData.words.filter(w => w.status === 'duplicate');
    const errors = reviewData.words.filter(w => w.status === 'error');
    
    for (const d of duplicates) {
      if (d.existingId && (d.meaning || d.pos)) {
        const updates = {};
        if (d.meaning && d.meaning !== (d.existingData?.chinese_meaning || '')) {
          updates.chinese_meaning = d.meaning;
        }
        if (d.pos && d.pos !== (d.existingData?.part_of_speech || '')) {
          updates.part_of_speech = d.pos;
        }
        if (Object.keys(updates).length > 0) {
          await updateWordEntry(d.existingId, updates);
        }
      }
    }
    
    const allNew = [...newWords, ...nameWords];
    let addResult = { added: 0, duplicates: 0 };
    if (allNew.length > 0) {
      const wordObjs = allNew.map(w => ({
        word: w.word,
        pos: w.pos || detectPOS(w.word).join(','),
        meaning: w.meaning || ''
      }));
      addResult = await bulkAddWords(wordObjs, null);
      
      if (addResult.addedIds && addResult.addedIds.length > 0) {
        for (let i = 0; i < allNew.length; i++) {
          const tagId = allNew[i].tagId;
          if (tagId && addResult.addedIds[i]) {
            try {
              await addTagToWord(addResult.addedIds[i], tagId);
            } catch(e) { console.warn('Tag assign failed:', e); }
          }
        }
      }
    }
    
    const parts = [];
    if (addResult.added > 0) parts.push(`✅ ${addResult.added} new`);
    if (errors.length > 0) parts.push(`❌ ${errors.length} skipped`);
    showToast(parts.join(' · ') || '✅ ' + t('english.wordAdded'));
    openVocabularyBook();
  } catch (e) {
    showToast('❌ ' + e.message);
  }
  hideLoading();
}

// ============================================================
// Review Tag Selection
// ============================================================

async function loadReviewTagOptions() {
  const select = document.getElementById('reviewTagSelect');
  if (!select) return;
  try {
    const tags = await fetchTags();
    const currentVal = select.value;
    select.innerHTML = `<option value="">— ${t('english.noTag')} —</option>` +
      tags.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    if (currentVal) select.value = currentVal;
  } catch(e) { console.warn('Load tags failed:', e); }
}

function onReviewTagChange(tagId) {
  reviewData.selectedTagId = tagId || null;
}

function showNewReviewTagInput() {
  document.getElementById('reviewNewTag').classList.remove('hidden');
}

async function createReviewTag() {
  const name = document.getElementById('reviewTagName').value.trim();
  if (!name) return;
  try {
    const tag = await createTag(name);
    document.getElementById('reviewTagName').value = '';
    document.getElementById('reviewNewTag').classList.add('hidden');
    await loadReviewTagOptions();
    document.getElementById('reviewTagSelect').value = tag.id;
    reviewData.selectedTagId = tag.id;
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

// ============================================================
// Vocab Book Tag Rendering (async version with tag badges)
// ============================================================

async function renderVocabList(words) {
  if (!words.length) {
    return `<div class="empty-state">${t('common.placeholders')}</div>`;
  }
  
  const wordIds = words.map(w => w.id).filter(Boolean);
  let tagMap = {};
  if (wordIds.length > 0) {
    try { tagMap = await fetchAllWordTags(wordIds); } catch(e) {}
  }
  
  return words.map(w => {
    const posArr = w.part_of_speech ? w.part_of_speech.split(',') : [];
    const posLabels = posArr.map(p => POS_MAP[p]?.[currentLang] || p).join(', ');
    const tierLabel = getTierLabel(w.level);
    const allPOS = Object.keys(POS_MAP);
    const tags = tagMap[w.id] || [];
    const tagHtml = tags.map(t => 
      `<span class="tag-badge" style="background:${t.color || '#6366f1'}20;color:${t.color || '#6366f1'}" onclick="event.stopPropagation();showWordTagManager('${w.id}')">${t.name}</span>`
    ).join('');
    
    return `
      <div class="vocab-row" data-id="${w.id}">
        <span class="col-word"><strong>${w.word}</strong></span>
        <span class="col-meaning">
          <span class="meaning-text" id="meaning-${w.id}">${w.chinese_meaning || ''}</span>
          <input class="input edit-input hidden" id="edit-${w.id}" value="${w.chinese_meaning || ''}">
        </span>
        <span class="col-pos">
          <span class="pos-text" id="posText-${w.id}">${posLabels}</span>
          <div class="pos-edit hidden" id="posEdit-${w.id}">
            ${allPOS.map(p => `
              <label class="pos-checkbox">
                <input type="checkbox" value="${p}" ${posArr.includes(p) ? 'checked' : ''}>
                ${POS_MAP[p]?.[currentLang] || p}
              </label>
            `).join('')}
          </div>
        </span>
        <span class="col-level">
          <span class="level-badge level-${w.level}">${tierLabel}</span>
        </span>
        <span class="col-tags">${tagHtml || ''}</span>
        <span class="col-actions">
          <button class="btn-icon" onclick="showWordTagManager('${w.id}')" title="${t('english.tags')}">🏷️</button>
          <button class="btn-icon" onclick="editMeaning('${w.id}')" id="editBtn-${w.id}" title="${t('english.edit')}">✏️</button>
          <button class="btn-icon" onclick="saveMeaning('${w.id}')" id="save-${w.id}" style="display:none" title="${t('english.save')}">💾</button>
          <button class="btn-icon" onclick="cancelEdit('${w.id}')" id="cancel-${w.id}" style="display:none" title="${t('english.cancel')}">❌</button>
          <button class="btn-icon" onclick="deleteVocabWord('${w.id}')" title="${t('english.delete')}">🗑️</button>
        </span>
      </div>
    `;
  }).join('');
}

// ============================================================
// Word Tag Manager Modal
// ============================================================

async function showWordTagManager(wordId) {
  const word = document.querySelector(`.vocab-row[data-id="${wordId}"] .col-word`);
  const wordName = word ? word.textContent.trim() : '';
  
  const tags = await fetchTags();
  const wordTags = await fetchWordTags(wordId);
  const wordTagIds = new Set(wordTags.map(t => t.id));
  
  const overlay = document.createElement('div');
  overlay.className = 'tag-manager-overlay';
  overlay.innerHTML = `
    <div class="tag-manager-modal">
      <div class="tag-manager-header">
        <strong>🏷️ ${t('english.tags')}: ${wordName}</strong>
        <button class="btn-icon" onclick="this.closest('.tag-manager-overlay').remove()">✕</button>
      </div>
      <div class="tag-manager-body">
        ${tags.map(t => `
          <label class="tag-manager-item ${wordTagIds.has(t.id) ? 'selected' : ''}">
            <input type="checkbox" ${wordTagIds.has(t.id) ? 'checked' : ''}
                   onchange="toggleWordTag('${wordId}', '${t.id}', this.checked)">
            <span class="tag-badge" style="background:${t.color}20;color:${t.color}">${t.name}</span>
          </label>
        `).join('')}
        ${!tags.length ? `<div class="review-col-empty">${t('common.placeholders')}</div>` : ''}
      </div>
      <div class="tag-manager-footer">
        <button class="btn btn-sm btn-outline" onclick="this.closest('.tag-manager-overlay').remove()">${t('english.complete')}</button>
        <button class="btn btn-sm btn-danger" onclick="deleteWordTagManager('${wordId}')">🗑️ ${t('english.deleteTag')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

async function toggleWordTag(wordId, tagId, add) {
  try {
    if (add) {
      await addTagToWord(wordId, tagId);
    } else {
      await removeTagFromWord(wordId, tagId);
    }
    await refreshVocabRowTags(wordId);
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}

async function refreshVocabRowTags(wordId) {
  const row = document.querySelector(`.vocab-row[data-id="${wordId}"]`);
  if (!row) return;
  const tagsEl = row.querySelector('.col-tags');
  if (!tagsEl) return;
  try {
    const tags = await fetchWordTags(wordId);
    if (tags.length > 0) {
      tagsEl.innerHTML = tags.map(t => 
        `<span class="tag-badge" style="background:${t.color || '#6366f1'}20;color:${t.color || '#6366f1'}">${t.name}</span>`
      ).join('');
    } else {
      tagsEl.innerHTML = '<span class="text-light" style="font-size:0.75rem">—</span>';
    }
  } catch(e) {
    console.warn('Refresh tags failed:', e);
  }
}

async function deleteWordTagManager(wordId) {
  const tags = await fetchTags();
  const tagNames = tags.map((t, i) => `${i+1}. ${t.name}`).join('\n');
  const input = prompt(`Which tag to delete?\n${tagNames}\n\nEnter tag number or name:`);
  if (!input) return;
  const idx = parseInt(input) - 1;
  const tag = tags[idx] || tags.find(t => t.name === input);
  if (!tag) { showToast('❌ Tag not found'); return; }
  try {
    await removeTagFromWord(wordId, tag.id);
    showToast(`✅ Removed tag "${tag.name}"`);
    document.querySelector('.tag-manager-overlay')?.remove();
    showWordTagManager(wordId);
  } catch(e) {
    showToast('❌ ' + e.message);
  }
}