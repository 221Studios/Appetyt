const INGREDIENT_ALIASES: Record<string, string> = {
  makaron: 'makaron spaghetti',
  boczek: 'boczek wedzony',
};

export function normalizeIngredientName(value: string): string {
  const normalized = value.trim().toLocaleLowerCase().replace(/[ąćęłńóśźż]/g, (letter) => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' })[letter] ?? letter).normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return INGREDIENT_ALIASES[normalized] ?? normalized;
}

export function ingredientsMatch(left: string, right: string): boolean {
  const normalizedLeft = normalizeIngredientName(left);
  const normalizedRight = normalizeIngredientName(right);
  return Boolean(normalizedLeft && normalizedRight) && normalizedLeft === normalizedRight;
}

export function isIngredientAvailable(requiredName: string, fridge: string[]): boolean {
  return fridge.some((fridgeName) => ingredientsMatch(requiredName, fridgeName));
}

export function findMissingIngredients<T extends { name: string }>(ingredients: T[], fridge: string[]): T[] {
  return ingredients.filter((ingredient) => !isIngredientAvailable(ingredient.name, fridge));
}
