// PaddleOCR path, exactly as recognizePasses() does it in the repo's index.html:
// PaddleOCR read -> parse; if items don't add up to the receipt total, also run the 3 Tesseract passes and keep the closer one.
// usage: node run2.js DIR SHARD NSHARDS OUT.jsonl
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const {loadImage}=require('@napi-rs/canvas');
const A=require('./app2.js'),B=require('./app.js');
const [dir,shard,nsh,out]=[process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];
A.setToday(new Date(2026,10,21));B.setToday(new Date(2026,10,21));
const gt=JSON.parse(fs.readFileSync(path.join(dir,'ground_truth.json')));
const done=new Set(fs.existsSync(out)?fs.readFileSync(out,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).id):[]);
const norm=s=>s.replace(/[ \t]+/g,' ').split('\n').map(l=>l.trim()).filter(l=>l&&!/^[-=_*.\s]+$/.test(l)).join('\n');
function tess(canvas,tmp){
  fs.writeFileSync(tmp,canvas.toBuffer('image/png'));
  const tsv=execFileSync('tesseract',[tmp,'stdout','--psm','6','-l','eng','tsv'],{maxBuffer:64e6,stdio:['ignore','pipe','ignore']}).toString();
  const rows=tsv.trim().split('\n').slice(1).map(l=>l.split('\t')).filter(c=>c[0]==='5'&&c[11]&&c[11].trim());
  const m=new Map();rows.forEach(c=>{const k=c[2]+'-'+c[3]+'-'+c[4];if(!m.has(k))m.set(k,{w:[],c:[]});m.get(k).w.push(c[11]);m.get(k).c.push(+c[10])});
  return [...m.values()].map(L=>({text:L.w.join(' '),conf:L.c.reduce((a,b)=>a+b,0)/L.c.length}))}
const sumOf=p=>p.items.reduce((a,i)=>a+(i.price||0)-(i.discount||0),0);
(async()=>{
  await A.ppLoadNode('/home/claude/crispwise/ocr');
  for(let i=0;i<gt.length;i++){
    if(i%nsh!==shard)continue;const g=gt[i];if(done.has(g.id))continue;
    const t0=Date.now();const img=await loadImage(path.join(dir,g.image));
    const lines=await A.ppRead(img);let parsed=A.parseReceipt(lines);let text=lines.map(l=>l.text).join('\n');let used_fallback=false;
    const sub=A.findTotal(text),sum=sumOf(parsed);
    if(sub&&Math.abs(sum-sub)>Math.max(.06,sub*.01)){
      const res=[];for(const P of A.PASSES)res.push(A.parseReceipt(tess(A.prepReceipt(img,P.opts),`/tmp/q${shard}.png`)));
      const alt=A.mergeParsed(res);if(Math.abs(sumOf(alt)-sub)<Math.abs(sum-sub)){parsed=alt;used_fallback=true}}
    const truth=norm(g.lines.join('\n'));const charAcc=Math.max(0,1-A.lev(norm(text),truth)/truth.length);
    const usedIx=new Set();let correct=0,wrong=0,missed=0,wf=0,cf=0;const det=[];
    g.items.forEach(it=>{const k=parsed.items.findIndex((p,j)=>!usedIx.has(j)&&p.price!=null&&Math.abs(p.price-it.price)<.005);
      if(k<0){missed++;det.push({t:it.text,r:'missed'});return}usedIx.add(k);const p=parsed.items[k];
      const ok=it.keys.includes(p.key);ok?correct++:wrong++;if(p.flagged)ok?cf++:wf++;if(!ok)det.push({t:it.text,r:'wrong',got:p.key,raw:p.raw})});
    const extras=parsed.items.filter((p,j)=>!usedIx.has(j));
    const date=parsed.date;let issue=null;if(date){const n=A.diffDays(A.TODAY,date);if(n<0)issue='future';else if(n>730)issue='old';else if(n>=1&&(parsed.dateConf<70||parsed.dateAlt))issue='unclear'}
    const latePrompt=!issue&&!!date&&A.diffDays(A.TODAY,date)>=1;
    const dateOK=!!date&&A.iso(date)===g.purchase,late=g.age_days>=1;
    const lateHandled=late?(dateOK&&(latePrompt||issue==='unclear')):!latePrompt;
    fs.appendFileSync(out,JSON.stringify({id:g.id,store:g.store,date_format:g.date_format,condition:g.condition,severity:g.severity,age_days:g.age_days,
      n_items:g.items.length,correct,wrong,missed,extras:extras.length,extra_raw:extras.slice(0,4).map(e=>e.raw),flagged:parsed.items.filter(p=>p.flagged).length,
      wrong_flagged:wf,correct_flagged:cf,char_acc_mean:charAcc,date_read:date?A.iso(date):null,date_ok:dateOK,late,late_prompt:latePrompt,date_issue:issue,
      late_handled:lateHandled,total_read:sub,total_ok:sub!=null&&Math.abs(sub-g.total)<.005,errors:det,secs:(Date.now()-t0)/1000,used_fallback,
      engine:'PaddleOCR PP-OCRv4 (app ONNX models) + app fallback'})+'\n')}})();
