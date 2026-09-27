'use client';

import { useState } from 'react';

type Analysis={name:string;size:number;sha256:string;family:string;identifiers:string[]};

export default function Home(){
 const [file,setFile]=useState<File|null>(null); const [result,setResult]=useState<Analysis|null>(null); const [loading,setLoading]=useState(false);
 async function analyze(){ if(!file)return; setLoading(true); const fd=new FormData(); fd.append('file',file); const r=await fetch('/api/analyze',{method:'POST',body:fd}); setResult(await r.json()); setLoading(false); }
 return <main className="wrap"><section className="hero"><p className="eyebrow">VESTSJÆLLAND CHIPTUNING</p><h1>Vest Tune File Tool</h1><p className="lead">Upload en original ECU-fil og få fil-ID, fingerprint og ECU-familie analyseret.</p></section><section className="card"><h2>1. Upload ECU-fil</h2><input type="file" accept=".bin,.ori,.mod" onChange={e=>{setFile(e.target.files?.[0]||null);setResult(null)}}/><button disabled={!file||loading} onClick={analyze}>{loading?'Analyserer...':'Analyser fil'}</button>{result&&<div className="result"><div><b>Fil</b><span>{result.name}</span></div><div><b>Størrelse</b><span>{result.size.toLocaleString('da-DK')} bytes</span></div><div><b>ECU-familie</b><span>{result.family}</span></div><div><b>SHA-256</b><code>{result.sha256}</code></div><div><b>Fundne ID&apos;er</b><span>{result.identifiers.length?result.identifiers.join(' · '):'Ingen sikre ID’er fundet'}</span></div></div>}</section><section className="card"><h2>Stage 1 workflow</h2><p>Binær ændring aktiveres kun, når den konkrete ECU/softwareversion har en verificeret definition. Ukendte filer ændres ikke automatisk.</p><button disabled>Generér Stage 1</button></section></main>
}
