import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LanguageProvider } from '../src/i18n';
import { ShoppingListView } from '../src/components/ShoppingListView';
import { classifyStoreAisle } from '../src/data/storeAisles';
import type { ShoppingItem } from '../src/types';

const longTitle =
  '2 opakowania makaronu pełnoziarnistego z suszonymi pomidorami i pieczoną papryką';
const item: ShoppingItem = {
  id: 'shopping-list-regression',
  title: longTitle,
  subtitle: '',
  price: 0,
  isBought: false,
  group: 'recipe-regression',
  groupTitle: 'Długi przepis testowy',
  groupIcon: 'dinner_dining',
};

const markup = renderToStaticMarkup(
  React.createElement(
    LanguageProvider,
    null,
    React.createElement(ShoppingListView, {
      items: [item],
      onToggleBought: () => undefined,
      onClearBought: () => undefined,
      onDeleteGroup: () => undefined,
      onShowToast: () => undefined,
      onOpenFilter: () => undefined,
    }),
  ),
);

const itemMarkup = markup.slice(markup.indexOf(longTitle) - 300, markup.indexOf(longTitle) + longTitle.length);

assert.match(markup, new RegExp(longTitle));
assert.doesNotMatch(itemMarkup, /\btruncate\b/);
assert.match(itemMarkup, /\bwhitespace-normal\b/);
assert.match(itemMarkup, /\bbreak-words\b/);

const aisleCases: Array<[string, string]> = [
  ['2 łyżki majonezu', 'sauce'],
  ['1 łyżeczka białego octu', 'sauce'],
  ['oliwa z oliwek', 'sauce'],
  ['200 g mąki', 'dry'],
  ['⅓ łyżki cukru', 'dry'],
  ['1 cebula', 'produce'],
  ['2 jajka', 'dairy'],
  ['50 g masła', 'dairy'],
  ['100 g zamrożonego masła', 'dairy'],
  ['mrożone frytki', 'frozen'],
  ['lody waniliowe', 'frozen'],
  ['500 ml mleka owsianego', 'drinks'],
  ['1 chleb', 'bakery'],
  ['pierś z kurczaka', 'meat'],
  ['2 łyżki miodu', 'jar'],
  ['kawa mielona', 'sweets'],
  ['2 tablespoons butter', 'dairy'],
  ['1 large onion', 'produce'],
  ['1 tsp kosher salt', 'sauce'],
  ['3,5 łyżeczki proszku do pieczenia', 'sweets'],
  ['drożdże świeże', 'dairy'],
  ['drożdże suszone', 'sweets'],
];

for (const [title, aisle] of aisleCases) {
  assert.equal(classifyStoreAisle(title), aisle, title);
}

function shoppingItem(id: string, title: string, group: string, groupTitle: string): ShoppingItem {
  return {
    id,
    title,
    subtitle: '',
    price: 0,
    isBought: false,
    group,
    groupTitle,
    groupIcon: 'dinner_dining',
  };
}

const groupedItems = [
  shoppingItem('flour-a', '200 g mąki', 'recipe-pancakes', 'Naleśniki'),
  shoppingItem('onion', '1 cebula', 'recipe-pancakes', 'Naleśniki'),
  shoppingItem('flour-b', '100 g mąki', 'recipe-bread', 'Chleb'),
  shoppingItem('fries', 'mrożone frytki', 'recipe-bread', 'Chleb'),
];

function renderList(filterMode: 'byRecipe' | 'byCategoryInRecipe' | 'byCategoryMerged') {
  return renderToStaticMarkup(
    React.createElement(
      LanguageProvider,
      null,
      React.createElement(ShoppingListView, {
        items: groupedItems,
        filterMode,
        onToggleBought: () => undefined,
        onClearBought: () => undefined,
        onDeleteGroup: () => undefined,
        onShowToast: () => undefined,
        onOpenFilter: () => undefined,
      }),
    ),
  );
}

const byRecipe = renderList('byRecipe');
assert.match(byRecipe, /Naleśniki/);
assert.match(byRecipe, /Chleb/);
assert.doesNotMatch(byRecipe, /Warzywa i owoce/);

const byCategoryInRecipe = renderList('byCategoryInRecipe');
assert.match(byCategoryInRecipe, /Naleśniki/);
assert.match(byCategoryInRecipe, /Warzywa i owoce/);
assert.match(byCategoryInRecipe, /Produkty sypkie/);
assert.match(byCategoryInRecipe, /Mrożonki/);
const frozenAt = byCategoryInRecipe.lastIndexOf('Mrożonki');
const produceAt = byCategoryInRecipe.indexOf('Warzywa i owoce');
assert.ok(produceAt !== -1 && frozenAt > produceAt);

const merged = renderList('byCategoryMerged');
assert.match(merged, /Warzywa i owoce/);
assert.match(merged, /300 g mąki/);
assert.match(merged, /Mrożonki/);
assert.doesNotMatch(merged, /Naleśniki/);
assert.ok(merged.indexOf('Mrożonki') > merged.indexOf('Warzywa i owoce'));
assert.ok(merged.indexOf('Mrożonki') > merged.indexOf('Produkty sypkie'));

console.log('shopping list regression: passed');
