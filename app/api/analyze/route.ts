import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export const runtime='nodejs';

function printableStrings(buf:Buffer){const out:string[]=[];let s='';for(const b of buf){if(b>=32&&b<=126)s+=String.fromCharCode(b);else{if(s.length>=6)out.push(s);s='';}}if(s.length>=6)out.push(s);return out.slice(0,500);}
function detectFamily(strings:string[]){const t=strings.join(' ').toUpperCase();if(t.includes('EDC16'))return'Bosch EDC16';if(t.includes('EDC17'))return'Bosch EDC17';if(t.includes('MED17'))return'Bosch MED17';if(t.includes('SIMOS'))return'Continental/Siemens SIMOS';if(t.includes('SID'))return'Siemens/Continental SID';return'Ukendt / ikke verificeret';}
function ids(strings:string[]){const rx=/(03G\d{6}[A-Z]{1,3}|0281\d{6,}|1037\d{6,}|EDC1[67][A-Z0-9_-]*|MED17[A-Z0-9_.-]*|SIMOS[A-Z0-9_.-]*|SID\d{3,})/gi;const found=new Set<string>();for(const s of strings){for(const m of s.matchAll(rx))found.add(m[0]);}return [...found].slice(0,20);}
export async function POST(req:Request){const form=await req.formData();const f=form.get('file');if(!(f instanceof File))return NextResponse.json({error:'Ingen fil'}, {status:400});if(f.size>16*1024*1024)return NextResponse.json({error:'Filen er for stor'}, {status:400});const buf=Buffer.from(await f.arrayBuffer());const strs=printableStrings(buf);return NextResponse.json({name:f.name,size:f.size,sha256:createHash('sha256').update(buf).digest('hex'),family:detectFamily(strs),identifiers:ids(strs)});}
