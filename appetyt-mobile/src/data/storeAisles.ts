export const STORE_AISLE_ORDER = [
  'produce',
  'bakery',
  'dairy',
  'meat',
  'dry',
  'jar',
  'sauce',
  'sweets',
  'drinks',
  'other',
  'frozen',
] as const;

export type StoreAisleId = (typeof STORE_AISLE_ORDER)[number];

export const STORE_AISLE_ICONS: Record<StoreAisleId, string> = {
  produce: 'nutrition',
  bakery: 'bakery_dining',
  dairy: 'egg_alt',
  meat: 'skillet',
  dry: 'grain',
  jar: 'inventory_2',
  sauce: 'water_drop',
  sweets: 'cookie',
  drinks: 'local_bar',
  other: 'category',
  frozen: 'ac_unit',
};

/** Longer phrases win, so "olive oil" is a fat and not a jar of olives. */
const PHRASES: { aisle: StoreAisleId; phrase: string }[] = [
  { aisle: 'jar', phrase: 'maslo orzechowe' },
  { aisle: 'jar', phrase: 'peanut butter' },
  { aisle: 'jar', phrase: 'almond butter' },
  { aisle: 'jar', phrase: 'pasta pomidorowa' },
  { aisle: 'jar', phrase: 'przecier pomidorowy' },
  { aisle: 'jar', phrase: 'koncentrat pomidorowy' },
  { aisle: 'jar', phrase: 'tomato paste' },
  { aisle: 'jar', phrase: 'tomato puree' },
  { aisle: 'jar', phrase: 'tomato passata' },
  { aisle: 'jar', phrase: 'tomato sauce' },
  { aisle: 'jar', phrase: 'crushed tomatoes' },
  { aisle: 'jar', phrase: 'crushed tomato' },
  { aisle: 'jar', phrase: 'diced tomatoes' },
  { aisle: 'jar', phrase: 'chopped tomatoes' },
  { aisle: 'jar', phrase: 'krojone pomidory' },
  { aisle: 'jar', phrase: 'pomidory krojone' },
  { aisle: 'jar', phrase: 'pomidory z puszki' },
  { aisle: 'jar', phrase: 'canned tomatoes' },
  { aisle: 'jar', phrase: 'canned tomato' },
  { aisle: 'jar', phrase: 'sun dried tomatoes' },
  { aisle: 'jar', phrase: 'sun dried tomato' },
  { aisle: 'jar', phrase: 'suszone pomidory' },
  { aisle: 'jar', phrase: 'canned corn' },
  { aisle: 'jar', phrase: 'canned tuna' },
  { aisle: 'jar', phrase: 'canned beans' },
  { aisle: 'jar', phrase: 'baked beans' },
  { aisle: 'jar', phrase: 'coconut cream' },
  { aisle: 'jar', phrase: 'maple syrup' },
  { aisle: 'jar', phrase: 'syrop klonowy' },
  { aisle: 'jar', phrase: 'dill pickles' },
  { aisle: 'jar', phrase: 'ogorki kiszone' },
  { aisle: 'jar', phrase: 'ogorek kiszony' },
  { aisle: 'jar', phrase: 'kapusta kiszona' },
  { aisle: 'jar', phrase: 'sweet corn' },
  { aisle: 'jar', phrase: 'green peas' },
  { aisle: 'jar', phrase: 'kidney beans' },
  { aisle: 'jar', phrase: 'black beans' },
  { aisle: 'sauce', phrase: 'oliwa z oliwek' },
  { aisle: 'sauce', phrase: 'olive oil' },
  { aisle: 'sauce', phrase: 'sesame oil' },
  { aisle: 'sauce', phrase: 'olej sezamowy' },
  { aisle: 'sauce', phrase: 'vegetable oil' },
  { aisle: 'sauce', phrase: 'olej roslinny' },
  { aisle: 'sauce', phrase: 'canola oil' },
  { aisle: 'sauce', phrase: 'sunflower oil' },
  { aisle: 'sauce', phrase: 'olej slonecznikowy' },
  { aisle: 'sauce', phrase: 'coconut oil' },
  { aisle: 'sauce', phrase: 'avocado oil' },
  { aisle: 'sauce', phrase: 'fish sauce' },
  { aisle: 'sauce', phrase: 'sos rybny' },
  { aisle: 'sauce', phrase: 'soy sauce' },
  { aisle: 'sauce', phrase: 'sos sojowy' },
  { aisle: 'sauce', phrase: 'oyster sauce' },
  { aisle: 'sauce', phrase: 'sos ostrygowy' },
  { aisle: 'sauce', phrase: 'worcestershire' },
  { aisle: 'sauce', phrase: 'hot sauce' },
  { aisle: 'sauce', phrase: 'rice vinegar' },
  { aisle: 'sauce', phrase: 'ocet ryzowy' },
  { aisle: 'sauce', phrase: 'apple cider vinegar' },
  { aisle: 'sauce', phrase: 'ocet jablkowy' },
  { aisle: 'sauce', phrase: 'balsamic' },
  { aisle: 'sauce', phrase: 'ocet balsamiczny' },
  { aisle: 'sauce', phrase: 'curry paste' },
  { aisle: 'sauce', phrase: 'pasta curry' },
  { aisle: 'sauce', phrase: 'miso paste' },
  { aisle: 'sauce', phrase: 'pasta miso' },
  { aisle: 'sauce', phrase: 'garlic powder' },
  { aisle: 'sauce', phrase: 'czosnek w proszku' },
  { aisle: 'sauce', phrase: 'onion powder' },
  { aisle: 'sauce', phrase: 'cebula w proszku' },
  { aisle: 'sauce', phrase: 'chili powder' },
  { aisle: 'sauce', phrase: 'chili flakes' },
  { aisle: 'sauce', phrase: 'platki chili' },
  { aisle: 'sauce', phrase: 'red pepper flakes' },
  { aisle: 'sauce', phrase: 'black pepper' },
  { aisle: 'sauce', phrase: 'white pepper' },
  { aisle: 'sauce', phrase: 'smoked paprika' },
  { aisle: 'sauce', phrase: 'papryka wedzona' },
  { aisle: 'sauce', phrase: 'papryka slodka' },
  { aisle: 'sauce', phrase: 'papryka ostra' },
  { aisle: 'sauce', phrase: 'sweet paprika' },
  { aisle: 'sauce', phrase: 'bay leaves' },
  { aisle: 'sauce', phrase: 'bay leaf' },
  { aisle: 'sauce', phrase: 'lisc laurowy' },
  { aisle: 'sauce', phrase: 'garlic salt' },
  { aisle: 'sauce', phrase: 'onion salt' },
  { aisle: 'sweets', phrase: 'proszek do pieczenia' },
  { aisle: 'sweets', phrase: 'baking powder' },
  { aisle: 'sweets', phrase: 'baking soda' },
  { aisle: 'sweets', phrase: 'soda oczyszczona' },
  { aisle: 'sweets', phrase: 'soda do pieczenia' },
  { aisle: 'sweets', phrase: 'cream of tartar' },
  { aisle: 'sweets', phrase: 'vanilla extract' },
  { aisle: 'sweets', phrase: 'ekstrakt waniliowy' },
  { aisle: 'sweets', phrase: 'vanilla sugar' },
  { aisle: 'sweets', phrase: 'cukier waniliowy' },
  { aisle: 'sweets', phrase: 'cukier wanilinowy' },
  { aisle: 'sweets', phrase: 'powdered sugar' },
  { aisle: 'sweets', phrase: 'icing sugar' },
  { aisle: 'sweets', phrase: 'cukier puder' },
  { aisle: 'sweets', phrase: 'instant yeast' },
  { aisle: 'sweets', phrase: 'active dry yeast' },
  { aisle: 'sweets', phrase: 'dry yeast' },
  { aisle: 'sweets', phrase: 'drozdze instant' },
  { aisle: 'sweets', phrase: 'drozdze suszone' },
  { aisle: 'sweets', phrase: 'cocoa powder' },
  { aisle: 'sweets', phrase: 'chocolate chips' },
  { aisle: 'sweets', phrase: 'dark chocolate' },
  { aisle: 'sweets', phrase: 'green tea' },
  { aisle: 'sweets', phrase: 'black tea' },
  { aisle: 'sweets', phrase: 'instant coffee' },
  { aisle: 'drinks', phrase: 'mleko owsiane' },
  { aisle: 'drinks', phrase: 'napoj owsiany' },
  { aisle: 'drinks', phrase: 'oat milk' },
  { aisle: 'drinks', phrase: 'mleko sojowe' },
  { aisle: 'drinks', phrase: 'napoj sojowy' },
  { aisle: 'drinks', phrase: 'soy milk' },
  { aisle: 'drinks', phrase: 'mleko migdalowe' },
  { aisle: 'drinks', phrase: 'almond milk' },
  { aisle: 'drinks', phrase: 'mleko kokosowe' },
  { aisle: 'drinks', phrase: 'coconut milk' },
  { aisle: 'drinks', phrase: 'rice milk' },
  { aisle: 'drinks', phrase: 'sok pomaranczowy' },
  { aisle: 'drinks', phrase: 'orange juice' },
  { aisle: 'drinks', phrase: 'sok jablkowy' },
  { aisle: 'drinks', phrase: 'apple juice' },
  { aisle: 'drinks', phrase: 'woda gazowana' },
  { aisle: 'drinks', phrase: 'sparkling water' },
  { aisle: 'drinks', phrase: 'club soda' },
  { aisle: 'drinks', phrase: 'tonic water' },
  { aisle: 'bakery', phrase: 'bread crumbs' },
  { aisle: 'bakery', phrase: 'breadcrumbs' },
  { aisle: 'bakery', phrase: 'bulka tarta' },
  { aisle: 'bakery', phrase: 'hamburger buns' },
  { aisle: 'bakery', phrase: 'hot dog buns' },
  { aisle: 'dairy', phrase: 'cream cheese' },
  { aisle: 'dairy', phrase: 'serek kremowy' },
  { aisle: 'dairy', phrase: 'sour cream' },
  { aisle: 'dairy', phrase: 'smietana kwasna' },
  { aisle: 'dairy', phrase: 'kwasna smietana' },
  { aisle: 'dairy', phrase: 'fresh yeast' },
  { aisle: 'dairy', phrase: 'drozdze swieze' },
  { aisle: 'dairy', phrase: 'buttermilk' },
  { aisle: 'dairy', phrase: 'maslanka' },
  { aisle: 'dry', phrase: 'all purpose flour' },
  { aisle: 'dry', phrase: 'maka pszenna' },
  { aisle: 'dry', phrase: 'bread flour' },
  { aisle: 'dry', phrase: 'brown sugar' },
  { aisle: 'dry', phrase: 'cukier brazowy' },
  { aisle: 'dry', phrase: 'cukier trzcinowy' },
  { aisle: 'dry', phrase: 'palm sugar' },
  { aisle: 'dry', phrase: 'cukier palmowy' },
  { aisle: 'dry', phrase: 'corn starch' },
  { aisle: 'dry', phrase: 'cornstarch' },
  { aisle: 'dry', phrase: 'skrobia ziemniaczana' },
  { aisle: 'dry', phrase: 'maka ziemniaczana' },
  { aisle: 'dry', phrase: 'skrobia kukurydziana' },
  { aisle: 'dry', phrase: 'rice noodles' },
  { aisle: 'dry', phrase: 'makaron ryzowy' },
  { aisle: 'produce', phrase: 'bell pepper' },
  { aisle: 'produce', phrase: 'green onion' },
  { aisle: 'produce', phrase: 'spring onion' },
  { aisle: 'produce', phrase: 'red onion' },
  { aisle: 'produce', phrase: 'yellow onion' },
  { aisle: 'produce', phrase: 'lemon zest' },
  { aisle: 'produce', phrase: 'lime zest' },
  { aisle: 'produce', phrase: 'orange zest' },
  { aisle: 'produce', phrase: 'juice of' },
  { aisle: 'produce', phrase: 'sok z cytryny' },
  { aisle: 'produce', phrase: 'sok z limonki' },
  { aisle: 'produce', phrase: 'sok z pomaranczy' },
  { aisle: 'produce', phrase: 'cherry tomatoes' },
  { aisle: 'produce', phrase: 'cherry tomato' },
  { aisle: 'produce', phrase: 'sugar snap' },
  { aisle: 'produce', phrase: 'snow peas' },
  { aisle: 'produce', phrase: 'groszek cukrowy' },
  { aisle: 'meat', phrase: 'chicken breast' },
  { aisle: 'meat', phrase: 'chicken thighs' },
  { aisle: 'meat', phrase: 'chicken thigh' },
  { aisle: 'meat', phrase: 'piersi z kurczaka' },
  { aisle: 'meat', phrase: 'udka z kurczaka' },
  { aisle: 'meat', phrase: 'ground beef' },
  { aisle: 'meat', phrase: 'ground pork' },
  { aisle: 'meat', phrase: 'ground chicken' },
  { aisle: 'meat', phrase: 'ground turkey' },
  { aisle: 'meat', phrase: 'mielona wolowina' },
  { aisle: 'meat', phrase: 'smoked salmon' },
  { aisle: 'meat', phrase: 'losos wedzony' },
  { aisle: 'meat', phrase: 'tuna steak' },
  { aisle: 'meat', phrase: 'stek z tunczyka' },
  { aisle: 'meat', phrase: 'fresh tuna' },
  { aisle: 'meat', phrase: 'ahi tuna' },
];

const SORTED_PHRASES = [...PHRASES].sort((a, b) => b.phrase.length - a.phrase.length);

const SPICE_AMOUNT = /\b(tsp|tbsp|teaspoon|tablespoon|teaspoons|tablespoons|lyzka|lyzki|lyzke|lyzek|lyzeczka|lyzeczki|lyzeczek|szczypta|pinch|dash)\b/;

export function normalizeAisleText(value: string): string {
  return value
    .toLocaleLowerCase('pl-PL')
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokensOf(normalized: string): string[] {
  return normalized.split(' ').filter(Boolean);
}

function hasPhrase(normalized: string, phrase: string): boolean {
  return ` ${normalized} `.includes(` ${phrase} `);
}

function hasToken(normalized: string, token: string): boolean {
  return tokensOf(normalized).includes(token);
}

function hasStem(normalized: string, stem: string): boolean {
  return tokensOf(normalized).some((token) => token.startsWith(stem));
}

function hit(normalized: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.startsWith('=')) return hasToken(normalized, pattern.slice(1));
    if (pattern.includes(' ')) return hasPhrase(normalized, pattern);
    return hasStem(normalized, pattern);
  });
}

function isFrozenAisle(normalized: string): boolean {
  if (hit(normalized, ['ice cream', 'gelato', '=lody', 'lodow', 'sorbet'])) {
    return !hit(normalized, ['maker', 'machine', '=salt', '=sol', '=soli']);
  }
  if (hit(normalized, ['frytk', 'french fries', 'hash brown', 'fish stick', 'chicken nugget', '=nuggets'])) {
    return true;
  }
  if (!/\b(frozen|mrozon\w*|zamroz\w*)\b/.test(normalized)) return false;
  if (/\b(frozen for|if frozen|not frozen)\b/.test(normalized)) return false;
  if (
    hit(normalized, ['=butter', 'masl', 'cheese stick', 'garlic clove', 'czosnk', 'jajk', '=egg', '=eggs']) &&
    !hit(normalized, ['nugget', 'frytk', 'fries'])
  ) {
    return false;
  }
  return true;
}

function matchPhrase(normalized: string): StoreAisleId | null {
  for (const rule of SORTED_PHRASES) {
    if (hasPhrase(normalized, rule.phrase)) return rule.aisle;
  }
  return null;
}

function isSpiceForm(normalized: string): boolean {
  return (
    SPICE_AMOUNT.test(normalized) ||
    hit(normalized, ['suszon', 'dried', 'mielon', 'ground', 'proszk', 'powder', 'flakes', 'platk', 'granul'])
  );
}

function isFreshHerb(normalized: string): boolean {
  return hit(normalized, ['fresh', 'swiez', 'bunch', 'garsc', 'sprig', 'liscie', 'leaves', 'natka', 'posiek']);
}

export function classifyStoreAisle(title: string): StoreAisleId {
  const normalized = normalizeAisleText(title);
  if (!normalized) return 'other';
  if (isFrozenAisle(normalized)) return 'frozen';

  const phraseAisle = matchPhrase(normalized);
  if (phraseAisle) return phraseAisle;
  if (hasPhrase(normalized, 'sok z') || hasPhrase(normalized, 'soku z') || hasPhrase(normalized, 'juice of')) return 'produce';

  if (hit(normalized, ['eggplant', 'baklazan', 'aubergine', 'watermelon', 'arbuz', 'winogron', 'cremini', 'portobello', 'butternut'])) return 'produce';
  if (hit(normalized, ['cukierk', 'candy', 'batonik'])) return 'sweets';
  if (hit(normalized, ['cheesecake', 'sernik'])) return 'sweets';
  if (hit(normalized, ['pikl', 'pickle', 'kiszon', 'sauerkraut'])) return 'jar';
  if (((hit(normalized, ['proszk', 'powder']) && hit(normalized, ['pieczen', 'baking'])) || (hit(normalized, ['soda', 'sody']) && hit(normalized, ['oczyszcz', 'baking', 'pieczen']))) || hit(normalized, ['drozdze', 'drozdz', 'yeast'])) {
    if (hit(normalized, ['swiez', 'fresh', 'cake yeast'])) return 'dairy';
    return 'sweets';
  }
  if (hit(normalized, ['cukr', 'sugar']) && hit(normalized, ['wanil', 'vanilla', 'pudr', 'powdered', 'icing'])) return 'sweets';

  if (hit(normalized, ['papry', '=paprika'])) {
    if (hit(normalized, ['slodk', 'ostr', 'wedz', 'mielon', 'powder', 'proszk', 'flakes', 'platk', '=paprika']) || isSpiceForm(normalized)) {
      return 'sauce';
    }
    return 'produce';
  }

  if (hit(normalized, ['=pepper', '=peppers', 'peppercorn', 'jalapen', 'poblano', 'serrano', 'habaner'])) {
    if (hit(normalized, ['peppercorn', 'flakes', 'cayenne'])) return 'sauce';
    if (hit(normalized, ['=pepper']) && !hit(normalized, ['bell', 'jalapen', 'poblano', 'serrano', 'habaner'])) return 'sauce';
    if (hit(normalized, ['=peppers', 'bell', 'jalapen', 'poblano', 'serrano', 'habaner'])) return 'produce';
  }

  if (hit(normalized, ['chili', 'chilli', 'chile', 'chipotl'])) {
    if (hit(normalized, ['flakes', 'powder', 'proszk', 'platk', 'suszon', 'dried']) || (isSpiceForm(normalized) && !hit(normalized, ['fresh', 'swiez']))) {
      return 'sauce';
    }
    return 'produce';
  }

  if (hit(normalized, ['czosnk', 'garlic', 'cebul', 'onion', 'szalot', 'shallot', '=clove', '=cloves'])) {
    if (hit(normalized, ['gozdz']) || (hit(normalized, ['=clove', '=cloves']) && hit(normalized, ['ground', 'mielon']) && !hit(normalized, ['czosnk', 'garlic']))) {
      return 'sauce';
    }
    if (hit(normalized, ['proszk', 'powder', 'granul', 'suszon', 'dried'])) return 'sauce';
    return 'produce';
  }

  if (hit(normalized, ['imbir', 'ginger', 'bazyl', 'basil', 'pietruszk', 'parsley', 'kolendr', 'cilantro', 'coriander', 'koper', 'dill', 'szczypior', 'chive', 'tymian', 'thyme', 'rozmaryn', 'rosemary', 'mieta', 'miet', '=mint', 'oregano', 'majeran', 'marjoram', 'szalwi', '=sage'])) {
    if (hit(normalized, ['=oregano', 'majeran', 'marjoram'])) return 'sauce';
    if (hit(normalized, ['dried', 'suszon', 'ground', 'mielon', 'powder', 'proszk', 'seed', 'ziarn', 'nasion'])) return 'sauce';
    if (isFreshHerb(normalized)) return 'produce';
    if (hit(normalized, ['tymian', 'thyme', 'rozmaryn', 'rosemary', 'coriander', 'kolendr']) && isSpiceForm(normalized)) return 'sauce';
    return 'produce';
  }

  if (hit(normalized, ['oliwek', 'oliwk', '=olive', '=olives'])) return 'jar';
  if (hit(normalized, ['czekolad', 'chocolat', 'kakao', '=cocoa'])) return 'sweets';
  if (hit(normalized, ['bulion', 'broth', '=stock', 'bouillon', 'rosol'])) return 'sauce';

  if (hit(normalized, ['pizz', 'francusk'])) return 'bakery';
  if (hit(normalized, ['bulka tarta', 'breadcrumb', 'panko', 'panier', 'chleb', '=bread', 'bulk', 'bagiet', 'baguette', 'tortill', 'ciabatt', 'focacci', 'brioche', 'kajzer', 'precel', 'croissant', '=buns', '=bun', '=roll', '=rolls', 'bagel', 'chalka', 'paczek', 'donut', 'doughnut', '=dough', 'puff'])) {
    return 'bakery';
  }

  if (hit(normalized, ['masl', 'butter', 'orzech', 'peanut', 'almond']) && hit(normalized, ['masl', 'butter']) && hit(normalized, ['orzech', 'peanut', 'almond'])) {
    return 'jar';
  }
  if (hit(normalized, ['mlek', 'mleko', '=milk']) && hit(normalized, ['owsian', 'sojow', 'migdal', 'kokos', 'roslin', 'almond', 'oat', 'soy', 'coconut'])) {
    return 'drinks';
  }

  if (hit(normalized, ['mleczk', 'mleko', 'mlek', '=milk', 'maslank', 'buttermilk', 'masl', 'butter', 'smietan', 'cream', 'fraiche', 'jogurt', 'yogurt', 'kefir', 'twarog', 'ricott', 'mozzarell', 'cheddar', 'parmezan', 'parmesan', 'parmigiano', 'reggiano', 'feta', 'halloumi', 'burrat', 'mascarpone', 'gorgonzol', 'camembert', '=brie', 'gruyer', 'emmental', '=gouda', 'oscypek', 'skyr', 'jaj', '=egg', '=eggs', '=yolk', 'yolks', 'bialko', 'serka', 'serek', '=cheese', 'queso'])) {
    return 'dairy';
  }
  if (hit(normalized, ['=ser', '=sera', '=serem', '=sery', '=serow'])) return 'dairy';

  if (hit(normalized, ['kurczak', 'kurcz', 'chicken', 'drobi', 'wolow', 'beef', 'steak', 'stek', 'ribeye', 'brisket', 'wieprz', 'pork', 'schab', 'karkow', 'bacon', 'boczk', 'bocze', 'szynk', '=ham', 'kielbas', 'sausage', 'kabano', 'wedlin', 'salami', 'chorizo', 'pepperoni', 'prosciutto', 'pancett', 'indyk', 'turkey', 'kaczk', 'duck', 'jagniec', 'lamb', 'watrob', '=thigh', '=thighs', 'losos', 'salmon', 'dorsz', 'cod', 'pstrag', 'trout', 'krewet', 'shrimp', 'prawn', 'halibut', 'tilapia', 'makrel', 'sledz', 'anchov', 'sardyn', 'sardine', 'kalmar', 'squid', 'osmior', 'octopus', '=fish', 'ryb', '=crab', 'krab', 'tofu', 'tempeh', 'filet', 'fillet', '=meat', 'meatball', 'mieso', 'miesa', 'miesem'])) {
    return 'meat';
  }

  if (hit(normalized, ['makaron', 'pasta', 'noodle', 'spaghetti', 'penne', 'fettuccin', 'tagliatel', 'rigatoni', 'lasagna', 'lasagne', 'ramen', '=udon', '=soba', '=rice', 'ryz', 'risotto', 'basmati', 'kasza', 'bulgur', 'kuskus', 'couscous', 'quinoa', 'komos', 'peczak', 'soczew', 'lentil', 'ciecierzyc', 'chickpea', 'groch', '=peas', 'fasol', '=bean', '=beans', 'maki', 'maka', 'make', '=flour', 'cukr', '=sugar', 'platk', 'oat', 'owsian', 'musli', 'muesli', 'granola', 'cornflake', 'cornmeal', 'skrobi', 'starch'])) {
    if (hit(normalized, ['=peas', 'groszek']) && !hit(normalized, ['cukrow', 'sugar snap', 'snow'])) return 'jar';
    if (hit(normalized, ['fasol', '=bean', '=beans', 'chickpea', 'ciecierzyc']) && hit(normalized, ['puszk', 'canned', 'can of'])) return 'jar';
    return 'dry';
  }

  if (hit(normalized, ['kukurydz', '=corn', 'groszek', 'tunczyk', '=tuna', 'dzem', '=jam', 'marmolad', 'konfitur', 'powidl', 'miod', '=honey', 'syrop', 'kapar', 'caper', 'passata', 'przecier', 'puszk', 'canned', 'sloik', 'chrzan', 'horseradish'])) {
    if (hit(normalized, ['=corn', 'kukurydz']) && hit(normalized, ['skrobi', 'starch', 'maki', 'maka', 'tortill', 'flake'])) return 'dry';
    if (hit(normalized, ['=tuna', 'tunczyk']) && hit(normalized, ['steak', 'fresh', 'sashimi', 'filet', 'fillet'])) return 'meat';
    if (hit(normalized, ['=corn', 'kukurydz']) && hit(normalized, ['kolba', 'swiez', 'fresh', 'cob'])) return 'produce';
    return 'jar';
  }

  if (hit(normalized, ['=kawa', '=kawy', '=kawie', '=kawe', '=coffee', 'espresso', '=herbata', '=herbaty', '=herbacie', '=tea', '=teas', 'czekolad', 'chocolat', 'kakao', '=cocoa', 'baton', 'cukierk', 'candy', 'ciastk', 'cookie', 'biscuit', 'herbatnik', 'wafel', '=wafer', 'orzech', 'orzesz', 'almond', 'migdal', 'walnut', 'peanut', 'cashew', 'nerkow', 'pistacj', 'laskow', 'hazelnut', 'pekan', '=pecan', 'bakali', 'rodzyn', 'raisin', 'daktyl', '=date', '=dates', 'wanili', 'vanilla', 'sezam', 'sesame', 'slonecznik', 'chia', 'siemie', 'pestk'])) {
    return 'sweets';
  }

  if (hit(normalized, ['olej', 'oliw', '=oil', '=oils', 'oct', 'vinegar', 'majonez', 'mayo', 'mayonnaise', 'ketchup', 'musztard', 'mustard', 'sos', 'sauce', 'srirach', 'tabasco', 'gochujang', 'harissa', 'pesto', '=miso', 'tamari', 'hoisin', '=salt', '=salts', '=sol', '=soli', '=sola', '=sole', 'pieprz', 'cayenne', 'przypraw', 'spice', 'seasoning', 'kmin', 'kumin', 'cumin', 'kurkum', 'turmeric', 'cynamon', 'cinnamon', 'nutmeg', 'galk', 'gozdz', 'laurow', 'worcester', 'kardamon', 'cardamom', 'anyz', 'zatar', 'sumac', 'kwasek', 'citric', 'smalc', 'lard', 'ghee', 'msg', 'glutamin', 'curry', 'masala', 'garam', 'mirin', 'proszk', 'powder', 'spray', 'salsa', 'shirodashi', 'dashi'])) {
    return 'sauce';
  }

  if (hit(normalized, ['=woda', '=wody', '=wode', '=wodzie', '=water', '=waters', 'sok', '=juice', 'napoj', 'lemoniad', 'lemonade', '=cola', '=coli', 'pepsi', 'sprite', '=fanta', 'piwo', 'piw', '=beer', '=wino', '=wina', '=winie', '=winem', '=wine', '=wines', 'wodk', 'vodka', '=rum', 'whisky', 'whiskey', '=gin', 'likier', 'liqueur', 'prosecco', 'szampan', 'champagne', 'cydr', '=cider', 'brandy', 'koniak', 'cognac', 'vermouth', 'wermut'])) {
    return 'drinks';
  }

  if (hit(normalized, ['szalot', 'shallot', '=por', '=pora', '=pory', '=leek', '=leeks', 'szczypior', 'dymk', 'pietruszk', 'seler', 'celery', 'marchew', 'carrot', 'burak', 'ziemniak', 'potato', 'batat', 'pomidor', 'tomato', 'ogork', 'ogore', 'cucumber', 'cukini', 'zucchini', 'kabacz', 'baklaz', 'dyni', 'pumpkin', 'brokul', 'broccoli', 'kalafior', 'cauliflower', 'kapust', 'cabbage', 'bruksel', 'jarmuz', 'kale', 'szpinak', 'spinach', 'salat', 'lettuce', 'rukol', 'arugula', 'rzodkiew', 'radish', 'kalarep', 'pieczark', 'mushroom', 'boczniak', 'grzyb', 'jablk', 'apple', 'gruszk', 'banan', 'pomarancz', 'orange', 'cytryn', 'lemon', 'limonk', 'lime', 'truskaw', 'strawberr', 'malin', 'raspberr', 'borowk', 'blueberr', 'awokado', 'avocado', 'mango', 'ananas', 'pineapple', 'kiwi', 'brzoskw', 'peach', 'morel', 'apricot', 'sliw', 'plum', 'fasolk', 'szparag', 'asparagus', 'porzecz', 'agrest', 'rabarbar', 'rhubarb', 'salata', 'scallion', 'fennel', 'fenkul'])) {
    return 'produce';
  }

  return 'other';
}
