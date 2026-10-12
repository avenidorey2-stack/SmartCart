import type { Frame, TextRecognitionResult } from '@react-native-ml-kit/text-recognition';

import { cents, sentenceCase } from './format';

export type Rect = { left: number; top: number; width: number; height: number };

export type ScanResult = {
  name: string | null;
  price: number | null;
  nameFrame: Frame | null;
  priceFrame: Frame | null;
};

type Word = { text: string; frame: Frame };
type Line = { text: string; frame: Frame; words: Word[] };
type Candidate = { price: number; frame: Frame; score: number };

// "$2.99", "2.99", "$ 12,49", "2.99EA" — but not unit prices like "$0.35 / OZ".
const PRICE_RE = /(\$\s?)?(\d{1,4})[.,](\d{2})(?!\d)(\s*(?:\/|per\b))?/gi;
// "$4 25" / "$425": big dollars with small raised cents and no decimal point. Needs the "$".
const SPLIT_PRICE_RE = /\$\s?(\d{1,3})\s?(\d{2})(?![\d.,%])(\s*(?:\/|per\b))?/gi;
// Shelf-tag noise that should never become the product name.
const NOISE_RE =
  /^(ea|each|regular|reg|sale|save|price|unit price|per|oz|lb|kg|g|ml|l|qty|was|now|special|special offer|offer|deal|hot deal|promo|promotion|clearance|new|value pack|\d+\s?(g|kg|oz|lb|ml|l|ct|pk)|[\W\d_]+)$/i;

const center = (f: Frame) => ({ x: f.left + f.width / 2, y: f.top + f.height / 2 });
const inside = (f: Frame, r: Rect) => {
  const c = center(f);
  return c.x >= r.left && c.x <= r.left + r.width && c.y >= r.top && c.y <= r.top + r.height;
};
const union = (a: Frame, b: Frame): Frame => {
  const left = Math.min(a.left, b.left);
  const top = Math.min(a.top, b.top);
  return {
    left,
    top,
    width: Math.max(a.left + a.width, b.left + b.width) - left,
    height: Math.max(a.top + a.height, b.top + b.height) - top,
  };
};
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

function flattenLines(result: TextRecognitionResult): Line[] {
  return result.blocks.flatMap((b) =>
    b.lines
      .filter((l) => l.frame && l.text.trim())
      .map((l) => {
        const frame = l.frame!;
        const words = l.elements.filter((e) => e.frame && e.text.trim()).map((e) => ({ text: e.text.trim(), frame: e.frame! }));
        return { text: l.text.trim(), frame, words: words.length ? words : [{ text: l.text.trim(), frame }] };
      }),
  );
}

/**
 * Prices printed without a "$" or decimal point, recognised by size alone: a big "1" with a small
 * raised "78" beside it, or one big "178". Only text much taller than the rest of the tag counts,
 * so barcodes, dates and SKUs are never mistaken for a price.
 */
function bareDigitPrices(lines: Line[]): Candidate[] {
  const words = lines.flatMap((l) => l.words);
  const tall = median(words.map((w) => w.frame.height)) * 1.8;
  const out: Candidate[] = [];
  for (const big of words) {
    if (big.frame.height < tall) continue;
    const dollars = big.text.match(/^\$?(\d{1,3})$/);
    if (dollars) {
      const right = big.frame.left + big.frame.width;
      const sup = words.find(
        (w) =>
          /^\d{2}$/.test(w.text) &&
          w.frame.height < big.frame.height * 0.85 &&
          w.frame.left >= big.frame.left + big.frame.width * 0.5 &&
          w.frame.left - right < big.frame.height * 0.6 &&
          w.frame.top < big.frame.top + big.frame.height * 0.4,
      );
      if (sup) {
        out.push({
          price: cents(Number(`${dollars[1]}.${sup.text}`)),
          frame: union(big.frame, sup.frame),
          score: big.frame.height * 1.3,
        });
      }
    }
    const joined = big.text.match(/^\$?(\d{1,2})(\d{2})$/);
    if (joined) {
      out.push({ price: cents(Number(`${joined[1]}.${joined[2]}`)), frame: big.frame, score: big.frame.height * 0.8 });
    }
  }
  return out;
}

/** Pick the most prominent shelf price. Font size (line height) is the best signal on a tag. */
function findPrice(lines: Line[]): { price: number; frame: Frame } | null {
  const candidates: Candidate[] = bareDigitPrices(lines);
  for (const line of lines) {
    let matched = false;
    for (const m of line.text.matchAll(PRICE_RE)) {
      if (m[4]) continue; // unit price ("/ oz")
      matched = true;
      // explicit "$" is a strong hint
      candidates.push({ price: cents(Number(`${m[2]}.${m[3]}`)), frame: line.frame, score: line.frame.height * (m[1] ? 1.5 : 1) });
    }
    if (matched) continue; // a normal "4.25" on this line wins over a split reading of it
    for (const m of line.text.matchAll(SPLIT_PRICE_RE)) {
      if (m[3]) continue;
      candidates.push({ price: cents(Number(`${m[1]}.${m[2]}`)), frame: line.frame, score: line.frame.height * 1.2 });
    }
  }
  let best: Candidate | null = null;
  for (const c of candidates) {
    if (c.price <= 0 || c.price > 2000) continue;
    if (!best || c.score > best.score) best = c;
  }
  return best && { price: best.price, frame: best.frame };
}

/** Join a product description that wraps onto a second line ("GG CUT BEANS" / "GREEN"). */
function mergeWrapped(lines: Line[]): Line[] {
  const sorted = [...lines].sort((a, b) => a.frame.top - b.frame.top);
  const used = new Set<Line>();
  const out: Line[] = [];
  for (const line of sorted) {
    if (used.has(line)) continue;
    let cur = line;
    for (;;) {
      const h = cur.frame.height;
      const next = sorted.find(
        (n) =>
          !used.has(n) &&
          n !== line &&
          n.frame.top > cur.frame.top &&
          n.frame.top - (cur.frame.top + h) < h * 0.6 &&
          Math.abs(n.frame.left - cur.frame.left) < h * 1.5 &&
          n.frame.height > h * 0.7 &&
          n.frame.height < h * 1.4 &&
          /[a-z]{2}/i.test(n.text),
      );
      if (!next) break;
      used.add(next);
      cur = { text: `${cur.text} ${next.text}`, frame: union(cur.frame, next.frame), words: [...cur.words, ...next.words] };
    }
    out.push(cur);
  }
  return out;
}

/** Pick the product name: a mostly-alphabetic line printed on the tag near the price. */
function findName(lines: Line[], priceFrame: Frame | null): { name: string; frame: Frame } | null {
  let best: { name: string; frame: Frame; score: number } | null = null;
  for (const line of mergeWrapped(lines)) {
    const text = line.text.replace(PRICE_RE, '').replace(/[|*_~]/g, ' ').replace(/\s+/g, ' ').trim();
    const letters = (text.match(/\p{L}/gu) ?? []).length;
    if (letters < 3 || letters / text.length < 0.6 || NOISE_RE.test(text)) continue;
    const wordCount = text.split(' ').filter((w) => /\p{L}{2}/u.test(w)).length;
    // Product descriptions are usually several words; a lone big word is often a brand or store logo.
    let score = line.frame.height * Math.sqrt(letters) * Math.sqrt(Math.max(1, wordCount));
    if (priceFrame) {
      const p = priceFrame;
      // Names on a tag are printed smaller than the price. Text as big as the price is signage.
      if (line.frame.height > p.height * 0.8) score *= 0.3;
      // On the tag: beside the price, or just above it.
      const besideRows = line.frame.top < p.top + p.height && line.frame.top + line.frame.height > p.top - p.height;
      const above = p.top - (line.frame.top + line.frame.height);
      const sameColumn = Math.abs(center(line.frame).x - center(p).x) < p.width * 2;
      if (besideRows || (above >= 0 && above < p.height * 3 && sameColumn)) score *= 1.4;
    }
    if (!best || score > best.score) best = { name: text, frame: line.frame, score };
  }
  return best && { name: sentenceCase(best.name).slice(0, 40), frame: best.frame };
}

/**
 * Turn raw OCR output into a product name + price. When `focus` is given, only text whose
 * center falls inside the scan brackets is considered (falling back to the whole photo).
 */
export function parseScan(result: TextRecognitionResult, focus?: Rect): ScanResult {
  const all = flattenLines(result);
  const focused = focus ? all.filter((l) => inside(l.frame, focus)) : all;
  const lines = focused.length ? focused : all;

  const price = findPrice(lines) ?? (lines !== all ? findPrice(all) : null);
  const name = findName(lines, price?.frame ?? null);
  return {
    name: name?.name ?? null,
    price: price?.price ?? null,
    nameFrame: name?.frame ?? null,
    priceFrame: price?.frame ?? null,
  };
}
