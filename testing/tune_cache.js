// Caches OCR output (PaddleOCR lines + the 3 prepared Tesseract passes) for the TRAIN receipts only.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs'),{execFileSync}=require('child_process');
const OUT='/home/claude/tune/train_ocr.jsonl',DIST='/home/claude/bench/node_modules/onnxruntime-web/dist/';
const ids=JSON.parse(fs.readFileSync('/home/claude/tune/train_ids.json'));
const done=new Set(fs.existsSync(OUT)?fs.readFileSync(OUT,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).id):[]);
const q=ids.filter(i=>!done.has(i));
function tess(u,tmp){fs.writeFileSync(tmp,Buffer.from(u.split(',')[1],'base64'));
  const tsv=execFileSync('tesseract',[tmp,'stdout','--psm','6','-l','eng','tsv'],{maxBuffer:64e6,stdio:['ignore','pipe','ignore']}).toString();
  const rows=tsv.trim().split('\n').slice(1).map(l=>l.split('\t')).filter(c=>c[0]==='5'&&c[11]&&c[11].trim());
  const m=new Map();rows.forEach(c=>{const k=c[2]+'-'+c[3]+'-'+c[4];if(!m.has(k))m.set(k,{w:[],c:[]});m.get(k).w.push(c[11]);m.get(k).c.push(+c[10])});
  return [...m.values()].map(L=>({text:L.w.join(' '),conf:L.c.reduce((a,b)=>a+b,0)/L.c.length}))}
(async()=>{const b=await chromium.launch();
 await Promise.all([0,1].map(async wi=>{const p=await (await b.newContext()).newPage();
  await p.route(/^(?!http:\/\/127\.0\.0\.1).*/,r=>r.abort());
  await p.route(/cdn\.jsdelivr\.net\/npm\/onnxruntime-web@[^/]+\/dist\/(.*)$/,async r=>{const f=r.request().url().split('/dist/')[1].split('?')[0];await r.fulfill({status:200,contentType:f.endsWith('.wasm')?'application/wasm':'text/javascript',body:fs.readFileSync(DIST+f)})});
  await p.goto('http://127.0.0.1:8766/index.html');await p.waitForFunction(()=>window.ppLoad,null,{timeout:60000});await p.evaluate(()=>ppLoad());
  while(q.length){const id=q.shift();const t0=Date.now();
   const r=await p.evaluate(async id=>{const im=new Image();im.src='img/'+id+'.jpeg';await im.decode();const lines=await ppRead(im);
     return{lines,urls:PASSES.map(P=>window.__proto.prepReceipt(im,P.opts).toDataURL('image/png'))}},id);
   const t1=Date.now();const passes=r.urls.map((u,k)=>tess(u,`/tmp/c${wi}_${k}.png`));
   fs.appendFileSync(OUT,JSON.stringify({id,paddle:r.lines,passes,paddle_ms:t1-t0,tess_ms:Date.now()-t1})+'\n')}}));
 await b.close();console.log('DONE')})();
