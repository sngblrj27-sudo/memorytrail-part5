import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, timingSafeEqual, randomUUID } from 'node:crypto';
import { createAI, ApiError } from './lib/ai.mjs';
const ROOT=path.dirname(fileURLToPath(import.meta.url));
export async function loadEnv(filename=path.join(ROOT,'.env')){
 try{for(const line of (await fs.readFile(filename,'utf8')).split(/\r?\n/)){
  const m=/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);if(!m||process.env[m[1]]!==undefined)continue;
  let value=m[2].trim();if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);else value=value.replace(/\s+#.*$/,'').trim();process.env[m[1]]=value;
 }}catch(e){if(e.code!=='ENOENT')throw e;}
}
function equal(a,b){const hash=v=>createHash('sha256').update(v).digest();return timingSafeEqual(hash(a),hash(b));}
function json(res,status,data){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));}
async function readJSON(req,max=6*1024*1024){
 if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))throw new ApiError('Content-Type must be application/json.',415);
 if(Number(req.headers['content-length'])>max)throw new ApiError('Request too large. Use fewer or smaller photos.',413);
 let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>max)throw new ApiError('Request too large.',413);chunks.push(chunk);}
 try{const obj=JSON.parse(Buffer.concat(chunks).toString());if(!obj||typeof obj!=='object'||Array.isArray(obj))throw 0;return obj;}catch{throw new ApiError('Invalid JSON request.');}
}
export function createApp({key='',model='gemini-3.8-flash',accessToken='',requestsPerHour=120,maxConcurrent=2,timeoutMs=45000,fetchImpl=globalThis.fetch}={}){
 const ai=createAI({key,model,timeoutMs,fetchImpl});let requestTimes=[],inFlight=0;
 const staticFiles=new Map([['/','index.html'],['/index.html','index.html'],['/app.js','app.js'],['/engine.mjs','engine.mjs'],['/samples.mjs','samples.mjs'],['/styles.css','styles.css'],['/favicon.svg','favicon.svg']]);
 const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
 return http.createServer(async(req,res)=>{
  const requestId=randomUUID();res.setHeader('x-request-id',requestId);res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','no-referrer');res.setHeader('x-frame-options','DENY');
  res.setHeader('content-security-policy',"default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  res.setHeader('permissions-policy','camera=(), geolocation=(), microphone=(self)');
  try{
   let pathname;try{pathname=new URL(req.url,'http://localhost').pathname;}catch{throw new ApiError('Invalid URL.');}
   if(pathname==='/api/status'&&req.method==='GET')return json(res,200,{configured:Boolean(key),model:key?model:null,requiresToken:Boolean(accessToken),limits:{photos:100,imageMB:4,requestsPerHour,maxConcurrent},version:'1.0.0'});
   if(pathname==='/healthz'&&req.method==='GET')return json(res,200,{ok:true});
   if(pathname.startsWith('/api/')){
    if(req.method!=='POST')throw new ApiError('Method not allowed.',405);
    if(!['/api/analyze','/api/search'].includes(pathname))throw new ApiError('Endpoint not found.',404);
    // Same-origin browser calls only. Authentication is still enforced independently.
    const origin=req.headers.origin;if(origin){let host;try{host=new URL(origin).host;}catch{throw new ApiError('Invalid origin.',403);}if(host!==req.headers.host)throw new ApiError('Cross-origin requests are not accepted.',403);}
    if(accessToken&&!equal(String(req.headers.authorization||''),`Bearer ${accessToken}`))throw new ApiError('Enter the reviewer password in AI settings.',401);
    if(!key)throw new ApiError('Live AI is not configured. Add GEMINI_API_KEY to .env and restart. Local sample search still works.',503);
    const now=Date.now();requestTimes=requestTimes.filter(t=>now-t<3600000);
    if(requestTimes.length>=requestsPerHour){res.setHeader('retry-after','60');throw new ApiError('This prototype reached its hourly AI-call limit. Please wait.',429);}
    if(inFlight>=maxConcurrent){res.setHeader('retry-after','3');throw new ApiError('The AI server is busy. Please retry in a few seconds.',429);}
    const body=await readJSON(req,pathname==='/api/search'?512*1024:6*1024*1024);
    inFlight++;requestTimes.push(now);
    try{const result=pathname==='/api/analyze'?await ai.analyze(body.image):await ai.search(body);return json(res,200,{...result,requestId});}finally{inFlight--;}
   }
   if(req.method!=='GET'&&req.method!=='HEAD')throw new ApiError('Method not allowed.',405);
   let name=staticFiles.get(pathname);
   if(!name&&/^\/assets\/[a-z0-9-]+\.(jpg|png|webp)$/.test(pathname))name=pathname.slice(1);
   if(!name)throw new ApiError('Not found.',404);
   let bytes;try{bytes=await fs.readFile(path.join(ROOT,'public',name));}catch(e){if(e.code==='ENOENT')throw new ApiError('Not found.',404);throw e;}
   res.writeHead(200,{'content-type':mime[path.extname(name)]||'application/octet-stream','content-length':bytes.length,'cache-control':'no-cache'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(e){if(!res.headersSent)json(res,e instanceof ApiError?e.status:500,{error:e instanceof ApiError?e.message:'Unexpected server error. Please retry.',requestId});else res.end();}
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 await loadEnv();
 const key=process.env.GEMINI_API_KEY||'',host=process.env.HOST||'127.0.0.1',accessToken=process.env.APP_ACCESS_TOKEN||'';
 if(key&&!['127.0.0.1','localhost','::1'].includes(host)&&accessToken.length<16){console.error('Public AI hosting requires APP_ACCESS_TOKEN of at least 16 characters. Set a reviewer password before binding HOST=0.0.0.0.');process.exit(1);}
 const num=(key,fallback,min,max)=>{const v=Number(process.env[key]||fallback);if(!Number.isInteger(v)||v<min||v>max)throw new Error(`${key} must be an integer between ${min} and ${max}.`);return v;};
 const port=num('PORT',3000,1,65535),model=process.env.GEMINI_MODEL||'gemini-3.8-flash';
 const server=createApp({key,model,accessToken,requestsPerHour:num('AI_REQUESTS_PER_HOUR',120,1,10000),maxConcurrent:num('AI_MAX_CONCURRENT',2,1,8),timeoutMs:num('AI_TIMEOUT_MS',45000,1000,120000)});
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is already in use. Change PORT in .env.`:e.message);process.exitCode=1;});
 server.listen(port,host,()=>console.log(`\nMemoryTrail — Part 5 MVP\nOpen http://localhost:${port}\n${key?`Gemini configured: ${model} (provider connection not yet checked)`:'Sample/local mode. Add GEMINI_API_KEY to .env for live AI.'}\nPhotos are stored in the browser, not on this server.\n`));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
