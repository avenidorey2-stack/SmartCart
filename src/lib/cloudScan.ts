import type { Frame, TextLine, TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Rect } from './ocr';

// Free key from https://ocr.space/ocrapi (25,000 scans/month).
const apiKey = process.env.EXPO_PUBLIC_OCR_SPACE_KEY;

/** True when an OCR.space key was provided in .env.local, so cloud scanning can be used. */
export const cloudScanAvailable = !!apiKey;

const MAX_SIDE = 1280; // keeps uploads well under the free tier's 1 MB limit

type OcrWord = { WordText: string; Left: number; Top: number; Width: number; Height: number };
type OcrResponse = {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ParsedResults?: { TextOverlay?: { Lines?: { Words?: OcrWord[] }[] } }[];
};

/**
 * Read text with the OCR.space API (for Expo Go, where ML Kit isn't linked). Only the part of the
 * photo inside `focus` is uploaded. The result has ML Kit's shape with frames in full-photo
 * pixels, so `parseScan` works on it unchanged.
 */
export async function cloudRecognize(
  uri: string,
  photo: { width: number; height: number },
  focus: Rect,
): Promise<TextRecognitionResult> {
  if (!apiKey) throw new Error('No API key');

  const left = Math.max(0, Math.round(focus.left));
  const top = Math.max(0, Math.round(focus.top));
  const crop = {
    originX: left,
    originY: top,
    width: Math.min(photo.width - left, Math.round(focus.width)),
    height: Math.min(photo.height - top, Math.round(focus.height)),
  };
  const shrink = Math.min(1, MAX_SIDE / Math.max(crop.width, crop.height));

  const ctx = ImageManipulator.manipulate(uri).crop(crop);
  if (shrink < 1) ctx.resize({ width: Math.round(crop.width * shrink) });
  const image = await ctx.renderAsync();
  const { base64 } = await image.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
  if (!base64) throw new Error('Could not encode photo');

  const form = new FormData();
  form.append('base64Image', `data:image/jpeg;base64,${base64}`);
  form.append('OCREngine', '2');
  form.append('isOverlayRequired', 'true');
  form.append('scale', 'true');

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { apikey: apiKey },
    body: form,
  });
  if (!res.ok) throw new Error(`OCR.space HTTP ${res.status}`);
  const data = (await res.json()) as OcrResponse;
  if (data.IsErroredOnProcessing) throw new Error(String(data.ErrorMessage ?? 'OCR failed'));

  // Uploaded-image px -> full-photo px.
  const toPhoto = (w: OcrWord): Frame => ({
    left: crop.originX + w.Left / shrink,
    top: crop.originY + w.Top / shrink,
    width: w.Width / shrink,
    height: w.Height / shrink,
  });

  const lines: TextLine[] = (data.ParsedResults ?? [])
    .flatMap((r) => r.TextOverlay?.Lines ?? [])
    .map((l) => l.Words ?? [])
    .filter((words) => words.length > 0)
    .map((words) => {
      const frames = words.map(toPhoto);
      const x0 = Math.min(...frames.map((f) => f.left));
      const y0 = Math.min(...frames.map((f) => f.top));
      const x1 = Math.max(...frames.map((f) => f.left + f.width));
      const y1 = Math.max(...frames.map((f) => f.top + f.height));
      return {
        text: words.map((w) => w.WordText).join(' '),
        frame: { left: x0, top: y0, width: x1 - x0, height: y1 - y0 },
        elements: words.map((w, i) => ({ text: w.WordText, frame: frames[i] })),
        recognizedLanguages: [],
      };
    });

  return {
    text: lines.map((l) => l.text).join('\n'),
    blocks: lines.map((l) => ({ text: l.text, frame: l.frame, lines: [l], recognizedLanguages: [] })),
  };
}
