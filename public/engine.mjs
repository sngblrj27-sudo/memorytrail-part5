/** Shared deterministic utilities. Sample search is NOT a learned AI model. */
export const EVENT_TYPES = ['birthday','wedding','school','beach','picnic','home','travel','celebration','other','unknown'];
export const clone = value => JSON.parse(JSON.stringify(value));
export const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().replace(/[’']s\b/g, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim();
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const aliases = [
 ['birthday','event',/\b(birthday|bday|b day)\b/], ['wedding','event',/\b(wedding|marriage|bride)\b/],
 ['school','event',/\b(school|graduation|classroom)\b/], ['beach','event',/\b(beach|seaside|sea side|shore)\b/],
 ['picnic','event',/\bpicnic\b/], ['home','place',/\b(home|house)\b/],
 ['child','person',/\b(child|children|kid|kids|daughter|son|toddler|baby|little one)\b/],
 ['cake','object',/\bcake\b/], ['candles','object',/\b(candle|candles)\b/],
 ['balloons','object',/\b(balloon|balloons)\b/],['flowers','object',/\b(flower|flowers|bouquet)\b/],
 ['toy blocks','object',/\b(block|blocks|tower)\b/], ['umbrella','object',/\b(umbrella|parasol)\b/],
 ['backpacks','object',/\b(backpack|backpacks|school bag)\b/],['ocean','scene',/\b(ocean|waves|sea)\b/],
 ['park','place',/\bpark\b/], ['indoor','setting',/\b(indoor|indoors|inside)\b/],
 ['outdoor','setting',/\b(outdoor|outdoors|outside)\b/], ['smiling','activity',/\b(smiling|laughing|laughed|smile)\b/]
];
export function parseQuery(query, photos = []) {
 const q = normalize(query); if (!q) return [];
 const found=[];
 function add(text,kind,index=0,patternText=text){
  const before=q.slice(Math.max(0,index-24),index);
  const after=q.slice(index+patternText.length,index+patternText.length+12);
  const exclude=/\b(not|without|except|exclude)\s+(?:a\s+|the\s+)?$/.test(before);
  const maybe=/\b(maybe|perhaps|possibly|around|about|think|guess)\b/.test(before) || /\b(maybe|perhaps)\b/.test(after);
  if(!found.some(c=>c.text===text))found.push({text,kind,certainty:maybe?'maybe':'certain',exclude,enabled:true});
 }
 const compound=/\b(red|blue|pink|white|yellow|green|black|orange|purple)\s+(dress|shirt|suit|umbrella|backpack|hat|flowers|blocks)\b/g;
 let m; while((m=compound.exec(q))) add(m[0],'visual',m.index,m[0]);
 for(const [text,kind,re] of aliases){const x=re.exec(q);if(x)add(text,kind,x.index,x[0]);}
 for(const name of [...new Set(photos.flatMap(p=>p.people||[]))]){
  const n=normalize(name), i=q.indexOf(n);if(i>=0 && (!i || q[i-1]===' ') && (i+n.length===q.length || q[i+n.length]===' '))add(name,'person',i,n);
 }
 for(const x of q.matchAll(/\b(?:19|20)\d{2}\b/g))add(x[0],'time',x.index,x[0]);
 if(!found.length){
  const stop=new Set('the a an of in with my that those this photo photos picture pictures image images find show me from was is were and i remember looking for please it some had one at we us our'.split(' '));
  q.split(' ').filter(w=>w.length>2&&!stop.has(w)).slice(0,6).forEach(w=>add(w,'other',q.indexOf(w),w));
 }
 return found.slice(0,14);
}
export function evidenceFields(photo){return [photo.caption,photo.eventType,photo.setting,photo.eventLabel,photo.date,...(photo.cues||[]),...(photo.people||[])].filter(Boolean);}
function wordMatch(hay,needle){
 const n=normalize(needle), h=normalize(hay);if(!n)return false;
 if(n==='child')return /\b(child|children|kid|kids|toddler)\b/.test(h);
 if(n==='candles')return /\bcandles?\b/.test(h);
 if(n==='flowers')return /\b(flowers?|bouquet)\b/.test(h);
 if(n==='backpacks')return /\bbackpacks?\b/.test(h);
 return (` ${h} `).includes(` ${n} `);
}
export function localSearch(photos, clues, rejected=[]){
 const active=clues.filter(c=>c.enabled!==false),pos=active.filter(c=>!c.exclude),neg=active.filter(c=>c.exclude&&c.certainty!=='maybe'),skip=new Set(rejected);
 if(!pos.length)return [];
 return photos.filter(p=>!skip.has(p.id)).map(p=>{
  const fields=evidenceFields(p);if(neg.some(c=>fields.some(f=>wordMatch(f,c.text))))return null;
  const matched=[],missing=[],evidence=[];let score=0;
  for(const c of pos){const f=fields.find(f=>wordMatch(f,c.text));if(f){matched.push(c.text);evidence.push(f);score+=c.certainty==='maybe'?1:3;}else missing.push(c.text);}
  if(!matched.length)return null;
  const strong=pos.filter(c=>c.certainty!=='maybe').every(c=>matched.includes(c.text));
  return {id:p.id,strength:strong?'strong':'possible',matched,missing,evidence:[...new Set(evidence)],score};
 }).filter(Boolean).sort((a,b)=>(b.strength==='strong')-(a.strength==='strong')||b.score-a.score);
}
export function groupResults(photos,results){
 const byId=new Map(photos.map(p=>[p.id,p])),groups=new Map();
 results.forEach(r=>{const p=byId.get(r.id);if(!p)return;const key=p.eventId||[p.eventType||'unknown',p.date||'undated',p.setting||'unknown'].join(':');
  if(!groups.has(key))groups.set(key,{id:key,label:p.eventLabel||`${p.eventType==='unknown'?'Unsorted':p.eventType||'Unsorted'} moments`,source:p.source,photos:[]});
  groups.get(key).photos.push({...p,match:r});
 });return [...groups.values()];
}
export function suggestions(photos,results,clues){
 const candidates=results.slice(0,12).map(r=>photos.find(p=>p.id===r.id)).filter(Boolean);
 const active=clues.filter(c=>c.enabled!==false).map(c=>normalize(c.text));
 const has = s => active.includes(s);
 if(!candidates.length)return {question:'Could one clue be a guess—or is the photo missing from this collection?',options:[]};
 const settings=[...new Set(candidates.map(p=>p.setting).filter(x=>x!=='unknown'))];
 if(!has('indoor')&&!has('outdoor')&&settings.length>1)return {question:'Was this moment indoors or outdoors?',options:['indoors','outdoors']};
 const cues=['candles','balloons','toy blocks','flowers','umbrella','backpacks'];
 const useful=cues.filter(c=>!has(c)&&candidates.some(p=>evidenceFields(p).some(f=>wordMatch(f,c))));
 return {question:'What else do you remember seeing?',options:useful.slice(0,3)};
}
export function summarizeAttempts(attempts){
 const finished=attempts.filter(a=>a.status==='confirmed'||a.status==='abandoned');
 const confirmed=finished.filter(a=>a.status==='confirmed');
 const timed=confirmed.map(a=>(a.endedAt-a.startedAt)/1000).sort((a,b)=>a-b);
 const tasks=finished.filter(a=>a.targetId);const correct=tasks.filter(a=>a.status==='confirmed'&&a.selectedId===a.targetId);
 const mid=Math.floor(timed.length/2);const median=timed.length?(timed.length%2?timed[mid]:(timed[mid-1]+timed[mid])/2):null;
 return {total:attempts.length,completed:finished.length,confirmed:confirmed.length,abandoned:finished.length-confirmed.length,
  open:attempts.filter(a=>a.status==='active').length,interrupted:attempts.filter(a=>a.status==='interrupted').length,
  confirmationRate:finished.length?confirmed.length/finished.length:null,medianSeconds:median,
  refined:finished.filter(a=>a.rounds.length>1).length,refinementRate:finished.length?finished.filter(a=>a.rounds.length>1).length/finished.length:null,
  verifiedTasks:tasks.length,verifiedCorrect:correct.length,verifiedRate:tasks.length?correct.length/tasks.length:null};
}
export function safePhoto(photo){
 return {id:String(photo.id||'').slice(0,100),title:String(photo.title||'Untitled photo').slice(0,120),caption:String(photo.caption||'').slice(0,1000),
  eventId:String(photo.eventId||'').slice(0,100),eventLabel:String(photo.eventLabel||'').slice(0,120),eventType:EVENT_TYPES.includes(photo.eventType)?photo.eventType:'unknown',
  date:/^\d{4}-\d{2}-\d{2}$/.test(photo.date||'')?photo.date:'',setting:['indoor','outdoor','unknown'].includes(photo.setting)?photo.setting:'unknown',
  cues:(Array.isArray(photo.cues)?photo.cues:[]).filter(x=>typeof x==='string').slice(0,30).map(x=>x.slice(0,100)),
  people:(Array.isArray(photo.people)?photo.people:[]).filter(x=>typeof x==='string').slice(0,12).map(x=>x.slice(0,80))};
}
export function validateClues(clues){
 if(!Array.isArray(clues))throw new Error('The AI returned no clue list. Please retry.');
 return clues.slice(0,14).filter(c=>c&&typeof c.text==='string'&&c.text.trim()).map(c=>({text:c.text.trim().slice(0,120),kind:['event','person','visual','object','activity','place','setting','time','scene','other'].includes(c.kind)?c.kind:'other',certainty:c.certainty==='maybe'?'maybe':'certain',exclude:c.exclude===true,enabled:c.enabled!==false}));
}
export function sanitizeSearch(output,photos){
 if(!output||!Array.isArray(output.matches))throw new Error('The AI returned an invalid result structure. Please retry.');
 const clues=validateClues(output.clues),byId=new Map(photos.map(p=>[p.id,p]));const seen=new Set();
 if(!clues.some(c=>c.enabled!==false&&!c.exclude))return {clues,matches:[],question:'Which clue would you like to try?',suggestions:[]};
 const matches=output.matches.slice(0,100).flatMap(m=>{
  const p=byId.get(m?.id);if(!p||seen.has(m.id))return [];seen.add(m.id);
  const fields=evidenceFields(p);
  if(clues.some(c=>c.enabled!==false&&c.exclude&&c.certainty!=='maybe'&&fields.some(f=>wordMatch(f,c.text))))return [];
  const evidence=(Array.isArray(m.evidence)?m.evidence:[]).filter(e=>typeof e==='string'&&e.trim()&&fields.some(f=>f.includes(e.trim()))).slice(0,5).map(e=>e.slice(0,200));
  // A match without source-grounded evidence is not shown as an AI result.
  if(!evidence.length)return [];
  const all=clues.filter(c=>c.enabled!==false&&!c.exclude).map(c=>c.text);
  const matched=(Array.isArray(m.matched)?m.matched:[]).filter(x=>all.includes(x)).filter(x=>{const clue=clues.find(c=>c.text===x);return clue.kind!=='person'||/^(my )?(child|children|kid|kids|person|people|couple|adult|man|woman|baby|toddler)$/.test(normalize(x))||(p.people||[]).some(name=>normalize(name)===normalize(x));});
  if(!matched.length)return [];
  return [{id:m.id,strength:m.strength==='strong'&&clues.filter(c=>c.enabled!==false&&!c.exclude&&c.certainty!=='maybe').every(c=>matched.includes(c.text))?'strong':'possible',matched,missing:all.filter(x=>!matched.includes(x)),evidence}];
 });
 return {clues,matches,question:typeof output.question==='string'?output.question.slice(0,240):'What else do you remember?',suggestions:(Array.isArray(output.suggestions)?output.suggestions:[]).filter(s=>typeof s==='string'&&s.length<100).slice(0,3)};
}
