// Replays cached TRAIN OCR through a candidate index.html, mirroring recognizePasses (PaddleOCR -> parse -> subtotal check -> Tesseract fallback).
// usage: node eval.js OUT.jsonl
const {chromium}=require('/opt/npm-tools/node_modules/playwright');const fs=require('fs');
const OUT=process.argv[2];const C=fs.readFileSync('/home/claude/tune/train_ocr.jsonl','utf8').trim().split('\n').map(l=>JSON.parse(l));
(async()=>{const b=await chromium.launch();const p=await (await b.newContext()).newPage();
 await p.route(/^(?!http:\/\/127\.0\.0\.1).*/,r=>r.abort());
 await p.goto('http://127.0.0.1:8767/index.html');await p.waitForFunction(()=>window.__proto,null,{timeout:60000});
 await p.evaluate(async()=>{await window.__proto.loadFoodModel()});
 const out=[];
 for(const c of C){
  const r=await p.evaluate(c=>{const ser=(x,text)=>({items:x.items.map(i=>({label:i.label,raw:i.raw,key:i.key,price:i.price,discount:i.discount||0,flagged:!!i.flagged})),nonFood:x.nonFood||[],date:x.date?x.date.toISOString().slice(0,10):null,total:window.__proto.findTotal(text)});
    const text=c.paddle.map(l=>l.text).join('\n');const parsed=parseReceipt(c.paddle);
    const tt=c.passes.map(l=>l.map(x=>x.text).join('\n')).join('\n');
    const tess=window.__proto.mergeParsed(c.passes.map(l=>parseReceipt(l)));
    const sub=findSubtotal(text),sum=parsed.items.reduce((a,i)=>a+(i.price||0)-(i.discount||0),0);
    let final=ser(parsed,text),used=false;
    const pref=typeof preferTesseract==='function'&&preferTesseract(text);
    if(pref){final=ser(tess,tt);used=true}
    else if(sub&&Math.abs(sum-sub)>Math.max(.06,sub*.01)){const s=tess.items.reduce((a,i)=>a+(i.price||0)-(i.discount||0),0);if(Math.abs(s-sub)<Math.abs(sum-sub)){final=ser(tess,tt);used=true}}
    return{paddle:{ok:true,text,fallback_text:tt,used_fallback:used,result:final},tesseract:{ok:true,text:tt,result:ser(tess,tt)}}},c);
  r.id=c.id;r.paddle.secs=(c.paddle_ms+(r.paddle.used_fallback?c.tess_ms:0))/1000;r.tesseract.secs=c.tess_ms/1000;out.push(JSON.stringify(r))}
 fs.writeFileSync(OUT,out.join('\n')+'\n');await b.close()})();
