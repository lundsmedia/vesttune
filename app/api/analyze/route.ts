import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export const runtime = 'nodejs';

function printableStrings(buf: Buffer) {
  const out: string[] = [];
  let s = '';
  for (const b of buf) {
    if (b >= 32 && b <= 126) s += String.fromCharCode(b);
    else {
      if (s.length >= 6) out.push(s);
      s = '';
    }
  }
  if (s.length >= 6) out.push(s);
  return out.slice(0, 1200);
}

function ids(strings: string[]) {
  const rx = /(03G\d{6}[A-Z]{1,3}|0281\d{6,}|1037\d{6,}|EDC1[67][A-Z0-9_-]*|MED17[A-Z0-9_.-]*|SIMOS[A-Z0-9_.-]*|SID\d{3,})/gi;
  const found = new Set<string>();
  for (const s of strings) for (const m of s.matchAll(rx)) found.add(m[0].toUpperCase());
  return [...found].slice(0, 30);
}

function identify(found: string[], strings: string[]) {
  const set = new Set(found.map(x => x.toUpperCase()));
  const text = strings.join(' ').toUpperCase();

  if (set.has('03G906021RN') && set.has('1037391834')) {
    return {
      family: 'Bosch EDC16U34',
      vehicleProfile: 'VW 1.9 TDI BLS',
      confidence: 'Verificeret signatur',
      matchedDefinition: 'VW-BLS-03G906021RN-1037391834'
    };
  }

  if (text.includes('EDC16') || found.some(x => /^03G906/.test(x))) {
    return { family: 'Bosch EDC16', vehicleProfile: null, confidence: 'Sandsynlig', matchedDefinition: null };
  }
  if (text.includes('EDC17')) return { family: 'Bosch EDC17', vehicleProfile: null, confidence: 'Sandsynlig', matchedDefinition: null };
  if (text.includes('MED17')) return { family: 'Bosch MED17', vehicleProfile: null, confidence: 'Sandsynlig', matchedDefinition: null };
  if (text.includes('SIMOS')) return { family: 'Continental/Siemens SIMOS', vehicleProfile: null, confidence: 'Sandsynlig', matchedDefinition: null };
  if (text.includes('SID')) return { family: 'Siemens/Continental SID', vehicleProfile: null, confidence: 'Sandsynlig', matchedDefinition: null };

  return { family: 'Ukendt / ikke verificeret', vehicleProfile: null, confidence: 'Lav', matchedDefinition: null };
}

export async function POST(req: Request) {
  const form = await req.formData();
  const f = form.get('file');

  if (!(f instanceof File)) return NextResponse.json({ error: 'Ingen fil' }, { status: 400 });
  if (f.size > 16 * 1024 * 1024) return NextResponse.json({ error: 'Filen er for stor' }, { status: 400 });

  const buf = Buffer.from(await f.arrayBuffer());
  const strings = printableStrings(buf);
  const identifiers = ids(strings);
  const identity = identify(identifiers, strings);

  return NextResponse.json({
    name: f.name,
    size: f.size,
    sha256: createHash('sha256').update(buf).digest('hex'),
    identifiers,
    ...identity
  });
}
