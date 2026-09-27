import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Range = { start: number; end: number; bytes: number };

function mergeRanges(indices: number[], gap = 16): Range[] {
  if (!indices.length) return [];
  const ranges: Range[] = [];
  let start = indices[0];
  let prev = indices[0];

  for (let i = 1; i < indices.length; i++) {
    const n = indices[i];
    if (n - prev > gap) {
      ranges.push({ start, end: prev, bytes: prev - start + 1 });
      start = n;
    }
    prev = n;
  }
  ranges.push({ start, end: prev, bytes: prev - start + 1 });
  return ranges.sort((a, b) => b.bytes - a.bytes).slice(0, 20);
}

export async function POST(req: Request) {
  const form = await req.formData();
  const original = form.get('original');
  const modified = form.get('modified');

  if (!(original instanceof File) || !(modified instanceof File)) {
    return NextResponse.json({ error: 'Begge filer skal vælges' }, { status: 400 });
  }

  const max = 16 * 1024 * 1024;
  if (original.size > max || modified.size > max) {
    return NextResponse.json({ error: 'En af filerne er for stor' }, { status: 400 });
  }

  const a = Buffer.from(await original.arrayBuffer());
  const b = Buffer.from(await modified.arrayBuffer());
  const len = Math.min(a.length, b.length);

  const changed: number[] = [];
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) changed.push(i);
  }

  const changedBytes = changed.length + Math.abs(a.length - b.length);
  const base = Math.max(a.length, b.length) || 1;

  return NextResponse.json({
    originalName: original.name,
    modifiedName: modified.name,
    sameSize: a.length === b.length,
    size: len,
    changedBytes,
    changedPercent: (changedBytes / base) * 100,
    firstDifference: changed.length ? changed[0] : (a.length !== b.length ? len : null),
    lastDifference: changed.length ? changed[changed.length - 1] : (a.length !== b.length ? base - 1 : null),
    changedRanges: mergeRanges(changed)
  });
}
