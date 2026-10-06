import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let html=await fs.readFile(path.join(root,'public/index.html'),'utf8');
const css=await fs.readFile(path.join(root,'public/styles.css'),'utf8');
const engine=(await fs.readFile(path.join(root,'public/engine.mjs'),'utf8')).replaceAll('export ','');
let samples=(await fs.readFile(path.join(root,'public/samples.mjs'),'utf8')).replace('export ','');
for(const asset of await fs.readdir(path.join(root,'public/assets'))){
 if(!asset.endsWith('.jpg'))continue;
 const data=(await fs.readFile(path.join(root,'public/assets',asset))).toString('base64');
 samples=samples.replaceAll('./assets/'+asset,'data:image/jpeg;base64,'+data);
}
const app=(await fs.readFile(path.join(root,'public/app.js'),'utf8')).replace("import * as E from './engine.mjs';",'').replace("import { SAMPLES } from './samples.mjs';",'');
const exports=['EVENT_TYPES','clone','normalize','escapeHTML','uid','parseQuery','evidenceFields','localSearch','groupResults','suggestions','summarizeAttempts','safePhoto','validateClues','sanitizeSearch'];
const js=`(async()=>{globalThis.__MEMORYTRAIL_STANDALONE__=true;const E=(()=>{${engine}\nreturn {${exports.join(',')}};})();\n${samples}\n${app}\n})();`;
const favicon=(await fs.readFile(path.join(root,'public/favicon.svg'))).toString('base64');
html=html.replace('<link rel="stylesheet" href="./styles.css">',`<style>${css}</style>`).replace('<script type="module" src="./app.js"></script>','').replace('href="./favicon.svg"',`href="data:image/svg+xml;base64,${favicon}"`).replace('</body>',`<script>${js.replaceAll('</script','<\\/script')}</script></body>`);
const outfile=path.join(root,'MemoryTrail_Part5_Preview.html');await fs.writeFile(outfile,html);console.log(outfile);
