// Held-out test of the shipped Crispwise reader (index.html @ a438bd25) on real WildReceipt grocery receipts.
// Per receipt, two runs on the same image, both through the app's own code in a real browser:
//   paddle: ppRead -> parseReceipt; if items don't add up to the subtotal (findSubtotal, same tolerance as
//           recognizePasses), also run the 3 Tesseract passes and keep whichever sum is closer (the app's fallback).
//   tesseract: the 3 prepared passes (prepReceipt + PASSES) -> tesseract 5 CLI --psm 6 -> parseReceipt each -> mergeParsed.
// The app itself uses Tesseract.js in the browser; here the same passes go to the tesseract 5 CLI (as testing/run.js did).
// No retries: an error or timeout is written as a failed row and scored as 0 items found.
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const fs=require('fs'),{execFileSync}=require('child_process');
const OUT='/home/claude/held/raw.jsonl',DIST='/home/claude/bench/node_modules/onnxruntime-web/dist/';
const ids=Object.keys(JSON.parse(fs.readFileSync('/home/claude/held/filters.json')).kept).sort();
const done=new Set(fs.existsSync(OUT)?fs.readFileSync(OUT,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).id):[]);
const queue=ids.filter(i=>!done.has(i));
function tess(dataUrl,tmp){
  fs.writeFileSync(tmp,Buffer.from(dataUrl.split(',')[1],'base64'));
  const tsv=execFileSync('tesseract',[tmp,'stdout','--psm','6','-l','eng','tsv'],{maxBuffer:64e6,stdio:['ignore','pipe','ignore']}).toString();
  const rows=tsv.trim().split('\n').slice(1).map(l=>l.split('\t')).filter(c=>c[0]==='5'&&c[11]&&c[11].trim());
  const m=new Map();rows.forEach(c=>{const k=c[2]+'-'+c[3]+'-'+c[4];if(!m.has(k))m.set(k,{w:[],c:[]});m.get(k).w.push(c[11]);m.get(k).c.push(+c[10])});
  return [...m.values()].map(L=>({text:L.w.join(' '),conf:L.c.reduce((a,b)=>a+b,0)/L.c.length}))}
const withTO=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout '+ms+'ms')),ms))]);
(async()=>{
  const b=await chromium.launch();
  const worker=async wi=>{
    const p=await (await b.newContext()).newPage();
    await p.route(/^(?!http:\/\/127\.0\.0\.1).*/,r=>r.abort());
    await p.route(/cdn\.jsdelivr\.net\/npm\/onnxruntime-web@[^/]+\/dist\/(.*)$/,async r=>{const f=r.request().url().split('/dist/')[1].split('?')[0];
      await r.fulfill({status:200,contentType:f.endsWith('.wasm')?'application/wasm':'text/javascript',body:fs.readFileSync(DIST+f)})});
    await p.goto('http://127.0.0.1:8766/index.html');await p.waitForFunction(()=>window.ppLoad&&window.__proto,null,{timeout:60000});
    await p.evaluate(async()=>{await ppLoad();await window.__proto.loadFoodModel();
      window.__ser=(x,text)=>({items:x.items.map(i=>({label:i.label,raw:i.raw,key:i.key,price:i.price,discount:i.discount||0,flagged:!!i.flagged})),
        nonFood:x.nonFood||[],date:x.date?x.date.toISOString().slice(0,10):null,total:window.__proto.findTotal(text)});
      window.__img=async id=>{const im=new Image();im.src='img/'+id+'.jpeg';await im.decode();return im}});
    const ua=await p.evaluate(()=>navigator.userAgent);
    while(queue.length){const id=queue.shift();const rec={id,ua};
      // ---- PaddleOCR path (the GitHub app) ----
      let t0=Date.now();
      try{
        const r=await withTO(p.evaluate(async id=>{const img=await window.__img(id);
          const lines=await ppRead(img);const text=lines.map(l=>l.text).join('\n');const parsed=parseReceipt(lines);
          const sub=findSubtotal(text),sum=parsed.items.reduce((a,i)=>a+(i.price||0)-(i.discount||0),0);
          const need=!!sub&&Math.abs(sum-sub)>Math.max(.06,sub*.01);
          window.__pp={parsed,text,sub,sum};
          return{lines,text,need,sub,sum,W:img.naturalWidth,H:img.naturalHeight,ser:window.__ser(parsed,text)}},id),300000);
        let used_fallback=false,final=r.ser,fbText=null;
        if(r.need){
          const urls=await p.evaluate(async id=>{const img=await window.__img(id);return PASSES.map(P=>window.__proto.prepReceipt(img,P.opts).toDataURL('image/png'))},id);
          const passLines=urls.map((u,k)=>tess(u,`/tmp/h${wi}_${k}.png`));
          const alt=await p.evaluate(passLines=>{const m=window.__proto.mergeParsed(passLines.map(l=>parseReceipt(l)));
            const t=passLines.map(l=>l.map(x=>x.text).join('\n')).join('\n');const s=m.items.reduce((a,i)=>a+(i.price||0)-(i.discount||0),0);
            return{ser:window.__ser(m,t),sum:s,text:t}},passLines);
          if(Math.abs(alt.sum-r.sub)<Math.abs(r.sum-r.sub)){final=alt.ser;used_fallback=true}fbText=alt.text}
        Object.assign(rec,{W:r.W,H:r.H,paddle:{ok:true,lines:r.lines,text:r.text,sub:r.sub,sum:r.sum,fallback_run:r.need,used_fallback,fallback_text:fbText,result:final,secs:(Date.now()-t0)/1000}});
      }catch(e){rec.paddle={ok:false,error:String(e).slice(0,300),secs:(Date.now()-t0)/1000}}
      // ---- Tesseract-only path ----
      t0=Date.now();
      try{
        const urls=await withTO(p.evaluate(async id=>{const img=await window.__img(id);return PASSES.map(P=>window.__proto.prepReceipt(img,P.opts).toDataURL('image/png'))},id),300000);
        const passLines=urls.map((u,k)=>tess(u,`/tmp/t${wi}_${k}.png`));
        const r=await p.evaluate(passLines=>{const m=window.__proto.mergeParsed(passLines.map(l=>parseReceipt(l)));
          const t=passLines.map(l=>l.map(x=>x.text).join('\n')).join('\n');return{ser:window.__ser(m,t),text:t}},passLines);
        rec.tesseract={ok:true,text:r.text,result:r.ser,secs:(Date.now()-t0)/1000};
      }catch(e){rec.tesseract={ok:false,error:String(e).slice(0,300),secs:(Date.now()-t0)/1000}}
      fs.appendFileSync(OUT,JSON.stringify(rec)+'\n')}};
  await Promise.all([worker(0),worker(1)]);await b.close();console.log('DONE')})();
