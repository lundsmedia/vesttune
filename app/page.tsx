'use client';

import { useState } from 'react';

type Analysis = {
  name: string;
  size: number;
  sha256: string;
  family: string;
  identifiers: string[];
  vehicleProfile: string | null;
  confidence: string;
  matchedDefinition: string | null;
};

type CompareResult = {
  originalName: string;
  modifiedName: string;
  sameSize: boolean;
  size: number;
  changedBytes: number;
  changedPercent: number;
  firstDifference: number | null;
  lastDifference: number | null;
  changedRanges: { start: number; end: number; bytes: number }[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const [original, setOriginal] = useState<File | null>(null);
  const [modified, setModified] = useState<File | null>(null);
  const [comparison, setComparison] = useState<CompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  async function analyze() {
    if (!file) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch('/api/analyze', { method: 'POST', body: fd });
    setResult(await r.json());
    setLoading(false);
  }

  async function compareFiles() {
    if (!original || !modified) return;
    setCompareLoading(true);
    const fd = new FormData();
    fd.append('original', original);
    fd.append('modified', modified);
    const r = await fetch('/api/compare', { method: 'POST', body: fd });
    setComparison(await r.json());
    setCompareLoading(false);
  }

  const hex = (n: number | null) => n === null ? '—' : '0x' + n.toString(16).toUpperCase().padStart(6, '0');

  return (
    <main className="wrap">
      <section className="hero">
        <p className="eyebrow">VESTSJÆLLAND CHIPTUNING</p>
        <h1>Vest Tune File Tool</h1>
        <p className="lead">Identificér ECU-filer og sammenlign original mod Stage 1 byte-for-byte.</p>
      </section>

      <section className="card">
        <h2>1. Analysér ECU-fil</h2>
        <input type="file" accept=".bin,.ori,.mod" onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }} />
        <button disabled={!file || loading} onClick={analyze}>{loading ? 'Analyserer...' : 'Analyser fil'}</button>

        {result && <div className="result">
          <div><b>Fil</b><span>{result.name}</span></div>
          <div><b>Størrelse</b><span>{result.size.toLocaleString('da-DK')} bytes</span></div>
          <div><b>ECU-familie</b><span>{result.family}</span></div>
          {result.vehicleProfile && <div><b>Køretøjsprofil</b><span>{result.vehicleProfile}</span></div>}
          <div><b>Match</b><span className={result.matchedDefinition ? 'ok' : ''}>{result.confidence}</span></div>
          {result.matchedDefinition && <div><b>Definition</b><code>{result.matchedDefinition}</code></div>}
          <div><b>SHA-256</b><code>{result.sha256}</code></div>
          <div><b>Fundne ID&apos;er</b><span>{result.identifiers.length ? result.identifiers.join(' · ') : 'Ingen sikre ID’er fundet'}</span></div>
        </div>}
      </section>

      <section className="card">
        <div className="sectionHead">
          <div>
            <p className="step">2. ORIGINAL vs STAGE 1</p>
            <h2>Sammenlign tuningfiler</h2>
          </div>
          <span className="badge">Read-only analyse</span>
        </div>

        <div className="twoCol">
          <label>
            <span>Original fil</span>
            <input type="file" accept=".bin,.ori,.mod" onChange={e => { setOriginal(e.target.files?.[0] || null); setComparison(null); }} />
          </label>
          <label>
            <span>Stage 1 / modificeret fil</span>
            <input type="file" accept=".bin,.ori,.mod" onChange={e => { setModified(e.target.files?.[0] || null); setComparison(null); }} />
          </label>
        </div>

        <button disabled={!original || !modified || compareLoading} onClick={compareFiles}>
          {compareLoading ? 'Sammenligner...' : 'Sammenlign filer'}
        </button>

        {comparison && <div className="compareBox">
          <div className="metricGrid">
            <div className="metric"><small>Ændrede bytes</small><strong>{comparison.changedBytes.toLocaleString('da-DK')}</strong></div>
            <div className="metric"><small>Ændret del</small><strong>{comparison.changedPercent.toFixed(4)}%</strong></div>
            <div className="metric"><small>Første ændring</small><strong>{hex(comparison.firstDifference)}</strong></div>
            <div className="metric"><small>Sidste ændring</small><strong>{hex(comparison.lastDifference)}</strong></div>
          </div>

          {!comparison.sameSize && <p className="warning">Filerne har forskellig størrelse. Sammenligningen bruger det fælles område.</p>}

          <h3>Største ændrede områder</h3>
          <div className="ranges">
            {comparison.changedRanges.length ? comparison.changedRanges.map((r, i) =>
              <div className="range" key={i}>
                <code>{hex(r.start)} → {hex(r.end)}</code>
                <span>{r.bytes.toLocaleString('da-DK')} bytes</span>
              </div>
            ) : <p>Filerne er identiske i det sammenlignede område.</p>}
          </div>
        </div>}
      </section>

      <section className="card">
        <h2>3. Stage 1 workflow</h2>
        <p>Næste trin bliver verificerede map-definitioner. Værktøjet ændrer ikke ukendte kalibreringsområder automatisk.</p>
        <button disabled>Generér Stage 1</button>
      </section>
    </main>
  );
}
