export const CATEGORIES = [
  'PRODUCE',
  'DAIRY',
  'MEAT & SEAFOOD',
  'BAKERY',
  'PANTRY',
  'SNACKS',
  'BEVERAGES',
  'FROZEN',
  'HOUSEHOLD',
  'OTHER',
] as const;

export type Category = (typeof CATEGORIES)[number];

const KEYWORDS: Record<Exclude<Category, 'OTHER'>, string[]> = {
  PRODUCE: [
    'apple', 'banana', 'avocado', 'tomato', 'lettuce', 'spinach', 'kale', 'onion', 'garlic',
    'potato', 'carrot', 'pepper', 'cucumber', 'lemon', 'lime', 'orange', 'berry', 'berries',
    'grape', 'mango', 'broccoli', 'celery', 'mushroom', 'herb', 'cilantro', 'basil', 'fruit',
    'vegetable', 'salad', 'zucchini', 'squash', 'pear', 'peach', 'melon',
  ],
  DAIRY: [
    'milk', 'yogurt', 'yoghurt', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'butter',
    'cream', 'egg', 'kefir', 'feta', 'brie', 'ricotta',
  ],
  'MEAT & SEAFOOD': [
    'chicken', 'beef', 'pork', 'turkey', 'bacon', 'ham', 'sausage', 'salmon', 'tuna steak',
    'shrimp', 'fish', 'steak', 'lamb', 'ground',
  ],
  BAKERY: ['bread', 'bagel', 'bun', 'roll', 'croissant', 'muffin', 'tortilla', 'baguette', 'cake', 'pita'],
  PANTRY: [
    'pasta', 'penne', 'spaghetti', 'rice', 'oil', 'olive', 'flour', 'sugar', 'salt', 'sauce',
    'beans', 'soup', 'cereal', 'oats', 'honey', 'peanut butter', 'jam', 'vinegar', 'spice',
    'canned', 'tuna', 'noodle', 'quinoa', 'lentil', 'stock', 'broth',
  ],
  SNACKS: [
    'chips', 'crisps', 'cracker', 'cookie', 'chocolate', 'candy', 'popcorn', 'pretzel', 'nuts',
    'bar', 'snack', 'gummy',
  ],
  BEVERAGES: ['water', 'juice', 'soda', 'coffee', 'tea', 'cola', 'sparkling', 'drink', 'beer', 'wine', 'kombucha'],
  FROZEN: ['frozen', 'ice cream', 'pizza', 'waffle', 'popsicle'],
  HOUSEHOLD: ['paper', 'towel', 'tissue', 'soap', 'detergent', 'shampoo', 'toothpaste', 'trash', 'foil', 'sponge'],
};

/**
 * Guess a category from a product name. Multi-word keywords and later, more specific
 * matches win over generic ones (e.g. "potato chips" -> SNACKS, not PRODUCE).
 */
export function categorize(name: string): Category {
  const n = ` ${name.toLowerCase()} `;
  let best: { cat: Category; score: number } = { cat: 'OTHER', score: 0 };
  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    for (const w of words) {
      if (!new RegExp(`\\b${w}`, 'i').test(n)) continue;
      // Longer keyword = more specific; a keyword at the end of the name is the head noun.
      const atEnd = new RegExp(`\\b${w}\\w*\\s*$`, 'i').test(n.trim()) ? 10 : 0;
      const score = w.length + atEnd;
      if (score > best.score) best = { cat, score };
    }
  }
  return best.cat;
}
