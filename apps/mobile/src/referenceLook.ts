import { RecipeSummary } from './api/types';
import { IconName } from './components/Icon';

export const REFERENCE_CATEGORIES: { label: string; icon: IconName }[] = [
  { label: 'Szybkie obiady (<25 min)', icon: 'bolt' },
  { label: 'Kuchnia polska', icon: 'restaurant' },
  { label: 'Makarony & Risotto', icon: 'ramen-dining' },
  { label: 'Street Food & Burgery', icon: 'lunch-dining' },
  { label: 'Wege & Roślinne', icon: 'eco' },
  { label: 'Słodkości', icon: 'cake' },
];

export const REFERENCE_CHEFS = [
  { id: 'foxx', name: 'Foxx Gotuje', shortName: 'Foxx Gotuje', recipesCount: 48, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq2SXcsB5uafFF63ImuatUrgPAD_UV_KAAt9ixgvkLFgbfG8O48pwp62j6XM0lhG3WaKyA1QeGJPHsafUvaPxKiyAxPyahMb9S07kC-Xail1TbY3XVGpIwzMnVkyhO0tq1jNew97b868xNlXnlGjzxWTA4rjn3B9wsLqVML6ntthz4ZoVjWL7BoKauoasodo7BJbHmrvsuW86TEvaBNvjnvftF1yC0sFQpdPXTqzPD99Bys6Fg2U-_' },
  { id: 'jakubiak', name: 'Tomasz Jakubiak', shortName: 'T. Jakubiak', recipesCount: 32, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAb4p5jC6f9Ub12hZ_chLV_G5Cn_5oez_iF8lO1AcfyCbRy5FmmP0fr1BtHB4e3-l33ZWjCOK-kAajiZmrt2Ml4LDBalZpwA3z3efkQZuUz-XYdvfTF7urxbb9mrn3gc_xNc5_11I6DStTMTdOpIDf4TT6a9oLzBlByxZMNq_s_btqqiiuuRMKC3t_hOksDN3RHGNwqoohc-Yol6OzHU3cCkb5yLU2PN-VXb5GL62uEWVLzcqP9F8Ua' },
  { id: 'fogel', name: 'Paulina Fogel', shortName: 'P. Fogel', recipesCount: 19, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHUX-Yw9sK2kmNsxi8xuSqu9GR9IY-g5cGrMytCs3eyS8YANbQ-PRGaRvOuxlmgOj7Q9ro40RqYvL45a6Ta1XoOYonkzn_AC7_CHI4IalwPVKoF5urF3LPqpX7FU4YQ5eGeYQM0EaYJvH3-qehAIcYedrMWqIyWoK6GKUkJHjnYrfMLU1bYjteKbCTTQNps40kMDZCJnbNASg59VrgSq7dbAd2kw8gmt-xjpOuK6WVTU9HCShe-VDo' },
  { id: 'maklowicz', name: 'Robert Makłowicz', shortName: 'R. Makłowicz', recipesCount: 64, avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCNqmFW1sDL2IzHOAvT2fmch0fA47EN0duliUbaj8Mdw-G7QV4zX1BWakYKIEjhu94LVmUv4j7OniRzlfbaQpDMUB6LbrDJJg4AwxGBk6yCsUuQw0ExdCJBVjMuzg-YHKoAi3rf5yXDQuFF2caZgcSxFV37hHR664WE5LXZZug_--WQC3vPCnvmSyxBy7yI7mc0j3qEcEAlqasvWEtPH_Zdpk_lV2aXXp8eEV8ea3uOav6_nLdWJZlI' },
];

const IMAGES: { match: RegExp; imageUrl: string; category: string; author: string; source: string; price: string; headline: string }[] = [
  { match: /pappardelle|borowik/i, headline: 'Kremowe Pappardelle z Borowikami i Świeżym Tymiankiem', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCt1SZgwssb9qGBa-X4PyMJc913qigXzytIOdDv9jOB08h4Nl_I6KCkA-KRC-_6qG73U8nSjhNIcQQJ9XwvlWfkUQy6wNmB0fZQ_J9W7UUMBpg3N_Cw6URJ_M65pgkBvvatcnDf9gCiQ-R9-M99IJTm0Z488MuUz4axcE_sOlMq1S9mLBXvI-DOfuDYCcxw0bWCreDyuLjydCEZK9lg_kPObdUysc_Mns6vfO809pwhahYhscnu6vmi', category: 'Makarony & Risotto', author: 'Tomasz Jakubiak', source: 'tomaszjakubiak.pl', price: 'ok. 28 zł' },
  { match: /carbonara/i, headline: 'Tradycyjna Rzymska Carbonara ze Spaghetti', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlT4FSWpkPFixhSxaCT1m3tcHLGTagFclegcnBEWdDnDCwq6w8e3ctAYpm5cOKGG2Vb4Cplv53BjXcE02U0yi2iA8UCTmf0AMeQNVVt_0df6BFt3wAM-hMeUmVghRrwNdycNkNRcWg0TRH1Bn1BiMdp0b3Fi0LGixs8kGS4yhTCV6ArS_B9x5XNWEWLv_8A-W38GkFTcQ7UKcN3jxP9CN7CM9WE2NficL_0OfOn-dUExVRpOVH7HRa', category: 'Makarony & Risotto', author: 'Tomasz Jakubiak', source: 'tomaszjakubiak.pl', price: 'ok. 18 zł' },
  { match: /szakszuk/i, headline: 'Szakszuka ze Szpinakiem i Fetą', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCd7Xk5ESGNT4GlBOFOQlGczGGA5rDMQ6H0M6tEVc4MQ7yv_h2feIoMbJYImE2C8VyDaaSpEO5SV7frpsKU7aF6jAQ_5dswjkHBPJNbCdaYok1xDMnTHXI9S8WjMz3yDwZooqyJAoR__dIQ75EFj_s3qqXDXqEnJirJKN_eLDHc7CRXs8uRBA6TJam9-4TRY-sF5gDX2zfgKaMhJ0_BLD-SFFiswlhIB5rF7i_YrAgQXJAJ_FN27H2Q', category: 'Szybkie obiady (<25 min)', author: 'Paulina Fogel', source: 'instagram.com/paulinafogel', price: 'ok. 14 zł' },
  { match: /penne|pesto|arrabbiata/i, headline: "Penne all'Arrabbiata z Oliwkami", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAr253bRRF5Aiye4lgPlGAckuzj05ggdj87ZjnUUs_HgoB86zHN5JcJ6RRf5YhDciEZH2TquwU7TxfFNcFN8rEVH6NdueUQ7pbEA4YFtl1FwVO-MCpRywcycPotfFLZXEW1pz3cPGgpt2Jtlc4YD3HlJz4x-A8FEUaZimeeICgX5c1bbq3PhptNrlzYRb2vaXFijyoZHP-9cfAxqlWlEPT8ICJeEukznOXSvJH5npqyGuGVDZEusDDe', category: 'Makarony & Risotto', author: 'Foxx Gotuje', source: 'youtube.com/@FoxxGotuje', price: 'ok. 16 zł' },
  { match: /curry|ciecierzyc|pad.?thai/i, headline: 'Autentyczny Pad Thai z Krewetkami i Tamaryndowcem', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFwbj5viHztYZYwa8tqym2Lfuc40Paki4HUq9sRPW7p7jqLc9kKiuAr-nJxKyla9H80k74eT3lTmQOvDJm2GECWsMgpuLKV9uqF5dGBQG3wJ49S98u9tGucwsLPktImPqGtAys0xXFIgqOKZkWoPYZhPqMZrQG472gAJFxdXe-LHImlIo_c8922wmrgQx29wMiP_Tcw2SuXUX5ZE5N12pjYVYfZtixhLsQmag0kY0vUgmt8RAfptC8', category: 'Wege & Roślinne', author: 'Foxx Gotuje', source: 'youtube.com/@FoxxGotuje', price: 'ok. 24 zł' },
  { match: /owsian|jablk|łosoś|losos|miso/i, headline: 'Pieczony Łosoś Miso z Sezamową Fasolką', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDte5jc6mbF_SeI4ofZHs6kfmcg6NmqAye5MiYXvieqY9-IA7WHPi0dH7miTdlmroj2Aj3Fty0bxwBlalhgZCtt8TyljZvWNS-ldnDkvRraB0MSDBjj2FPChzkrpz2Ww1SmQ7wBmIlSp_CoMPyy2QgSJcOEblyoT_qHaaBQF1pPjankYc_m7H0o1pehvSeoWYgigsGuHOitN1o6VxNcU4FXbbRh3uCStW0EU9h5wY67dsH3hvMXgrpU', category: 'Szybkie obiady (<25 min)', author: 'Paulina Fogel', source: 'instagram.com/paulinafogel', price: 'ok. 9 zł' },
  { match: /burger/i, headline: 'Klasyczny Smash Burger z Karmelizowaną Cebulą', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDohqjD4FgV4xrDc2-zjnDzfodbRt5QjrIq_fQLaH8WlwsYW6DDw6YVRqN-EaN7bCV82XwAq-_U6UL1MYmlM-qUI9G063HF5-dVdEYFCl-_orm7El5_oBABUh5POedRwQROlGbhKdd5hbGfZsetQhvb8WEGR0i_LVJQgA8AnZmRZPsmMsdVQO1Fvm0EMWzlS1-dZ6b5vBQvSSiwMTsHSB7Uy-ELIIjDfVUy58VRekjjKsdjD5AxvLNz', category: 'Street Food & Burgery', author: 'Foxx Gotuje', source: 'youtube.com/@FoxxGotuje', price: 'ok. 22 zł' },
  { match: /zupa|pomidor/i, headline: 'Zupa Krem z Pieczonych Pomidorów', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwFpNMLT4KsTio-XlHaHkFxicgBv-U7iMuZF-TtPRetXt0hYIoQOo54FMrW8nM5JarRckMTtSEHLlSAvjHWLhiR5jV5-OLrLbB5cj6oEj_sC2Mf53IFe_l6G_1ZOBI84bfslMXKtYf6x4he75DTPloOgTtRqGH9gFBkSjaVSPr4roAxBddDX95Ga3ELclVDVCom-ILZhCxPrz3oWdX50Ti4h4Q3tHcRVE0VnYQjQjJ8JDr9UY1LjGR', category: 'Kuchnia polska', author: 'Robert Makłowicz', source: 'maklowicz.pl', price: 'ok. 12 zł' },
];

const FALLBACK_IMAGE = IMAGES[0].imageUrl;

export function lookFor(recipe: Pick<RecipeSummary, 'id' | 'title' | 'category'>) {
  const haystack = `${recipe.id} ${recipe.title} ${recipe.category}`;
  return IMAGES.find((entry) => entry.match.test(haystack));
}

export function recipeImageUrl(recipe: Pick<RecipeSummary, 'id' | 'title' | 'category'>): string {
  return lookFor(recipe)?.imageUrl ?? FALLBACK_IMAGE;
}

export function recipeLookCategory(recipe: RecipeSummary): string {
  return lookFor(recipe)?.category ?? (recipe.category.includes('&') ? recipe.category : REFERENCE_CATEGORIES.find((item) => item.label.toLocaleLowerCase().includes(recipe.category.toLocaleLowerCase()))?.label ?? recipe.category);
}

export function recipeLookAuthor(recipe: RecipeSummary): string {
  return lookFor(recipe)?.author ?? recipe.creator?.name ?? 'Kuchnia Appetyt';
}

export function recipeLookSource(recipe: RecipeSummary): string {
  const look = lookFor(recipe)?.source;
  if (look) return look;
  const host = recipe.creator?.website_url ?? recipe.creator?.primary_source ?? 'appetyt.pl';
  const cleaned = host.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!cleaned || /^(website|youtube|blog|unknown|source)$/i.test(cleaned)) {
    return 'appetyt.pl';
  }
  return cleaned;
}

export function recipeLookPrice(recipe: RecipeSummary): string {
  return lookFor(recipe)?.price ?? 'cena orientacyjna';
}

export function ingredientIconName(name: string): IconName {
  const value = name.toLocaleLowerCase();
  if (value.includes('makaron') || value.includes('penne') || value.includes('spaghetti') || value.includes('pappardelle') || value.includes('ryż')) return 'ramen-dining';
  if (value.includes('szpinak') || value.includes('bazyl') || value.includes('wege') || value.includes('tymian')) return 'eco';
  if (value.includes('pomidor')) return 'local-florist';
  if (value.includes('ser') || value.includes('parmezan') || value.includes('chleb') || value.includes('jaj')) return 'restaurant';
  if (value.includes('mleko') || value.includes('śmiet') || value.includes('masło')) return 'opacity';
  if (value.includes('czosnek') || value.includes('cebula') || value.includes('oliw')) return 'spa';
  return 'kitchen';
}

const SHELF_ORDER = [/pappardelle|borowik|carbonara/i, /szakszuk/i, /penne|pesto|arrabbiata/i, /curry|ciecierzyc|pad.?thai/i, /owsian|łosoś|losos|miso/i, /burger/i, /zupa|pomidor/i];

export function presentShelfRecipe(recipe: RecipeSummary): RecipeSummary {
  const look = lookFor(recipe);
  if (!look) return recipe;
  return { ...recipe, title: look.headline, category: look.category };
}

export function pickDiscoverShelf(recipes: RecipeSummary[], fridge: string[]) {
  const ranked = SHELF_ORDER.map((pattern) => recipes.find((recipe) => pattern.test(`${recipe.id} ${recipe.title}`))).filter((recipe): recipe is RecipeSummary => Boolean(recipe));
  const unique = [...new Map(ranked.map((recipe) => [recipe.id, recipe])).values()];
  const featured = unique[0] ?? recipes[0];
  const forYou = unique.filter((recipe) => recipe.id !== featured?.id).slice(0, 3);
  const matched = recipes.find((recipe) => recipe.ingredient_names.some((name) => fridge.some((item) => name.toLocaleLowerCase().includes(item.toLocaleLowerCase()))))
    ?? unique.find((recipe) => /zupa|pomidor/i.test(`${recipe.id} ${recipe.title}`))
    ?? unique[1]
    ?? featured;
  return {
    featured: featured ? presentShelfRecipe(featured) : undefined,
    forYou: (forYou.length ? forYou : recipes.filter((recipe) => recipe.id !== featured?.id).slice(0, 3)).map(presentShelfRecipe),
    matched: matched ? presentShelfRecipe(matched) : undefined,
  };
}

export type SearchSeed = {
  query?: string;
  cuisine?: string;
  maxTime?: '30' | '45' | 'any';
};

const CHEF_SOURCES: Record<string, string> = {
  foxx: 'youtube.com/@FoxxGotuje',
  jakubiak: 'tomaszjakubiak.pl',
  fogel: 'instagram.com/paulinafogel',
  maklowicz: 'maklowicz.pl',
};

export function chefSourceDomain(chefId: string): string {
  return CHEF_SOURCES[chefId] ?? 'appetyt.pl';
}

export function recipesForChef(recipes: RecipeSummary[], chefName: string): RecipeSummary[] {
  const needle = chefName.toLocaleLowerCase();
  const last = needle.split(' ').pop() ?? needle;
  return recipes
    .map(presentShelfRecipe)
    .filter((recipe) => {
      const author = recipeLookAuthor(recipe).toLocaleLowerCase();
      return author.includes(needle) || needle.includes(author) || author.includes(last);
    });
}

export function recipeMatchesCategory(recipe: RecipeSummary, label: string): boolean {
  const shown = presentShelfRecipe(recipe);
  const hay = `${shown.title} ${shown.category} ${shown.cuisine ?? ''} ${shown.id}`.toLocaleLowerCase();
  switch (label) {
    case 'Szybkie obiady (<25 min)':
      return shown.duration_minutes <= 25;
    case 'Kuchnia polska':
      return /polsk|zupa|pierog|schab|bigos/.test(hay);
    case 'Makarony & Risotto':
      return /makaron|risotto|penne|spaghetti|pappardelle|carbonara/.test(hay);
    case 'Street Food & Burgery':
      return /burger|street|kebab|wrap/.test(hay);
    case 'Wege & Roślinne':
      return /wege|roślin|vegan|szpinak|ciecierzyc|curry/.test(hay);
    case 'Słodkości':
      return /deser|ciasto|ciast|słod|cake|owsian/.test(hay);
    default:
      return shown.category === label;
  }
}

export function seedForCategory(label: string): SearchSeed {
  switch (label) {
    case 'Szybkie obiady (<25 min)':
      return { maxTime: '30', cuisine: 'Wszystkie' };
    case 'Kuchnia polska':
      return { cuisine: 'Polska' };
    case 'Makarony & Risotto':
      return { query: 'makaron', cuisine: 'Włoska' };
    case 'Street Food & Burgery':
      return { query: 'burger' };
    case 'Wege & Roślinne':
      return { query: 'szpinak' };
    case 'Słodkości':
      return { query: 'deser' };
    default:
      return { query: label };
  }
}
