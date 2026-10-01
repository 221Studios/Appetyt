import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LanguageProvider } from '../src/i18n';
import { ShoppingListView } from '../src/components/ShoppingListView';
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
    }),
  ),
);

const itemMarkup = markup.slice(markup.indexOf(longTitle) - 300, markup.indexOf(longTitle) + longTitle.length);

assert.match(markup, new RegExp(longTitle));
assert.doesNotMatch(itemMarkup, /\btruncate\b/);
assert.match(itemMarkup, /\bwhitespace-normal\b/);
assert.match(itemMarkup, /\bbreak-words\b/);

console.log('shopping list regression: passed');
