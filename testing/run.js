// Batch runner: each photo goes through Crispwise's own 3-pass Tesseract pipeline, then is scored against ground truth.
// usage: node run.js DIR SHARD NSHARDS OUT.jsonl
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const {loadImage}=require('@napi-rs/canvas');
const A=require('./app.js');
const [dir,shard,nsh,out]=[process.argv[2],+process.argv[3],+process.argv[4],process.argv[5]];
A.setToday(new Date(2026,10,21));
const gt=JSON.parse(fs.readFileSync(path.join(dir,'ground_truth.json')));
const done=new Set(fs.existsSync(out)?fs.readFileSync(out,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).id):[]);
const norm=s=>s.replace(/[ \t]+/g,' ').split('\n').map(l=>l.trim()).filter(l=>l&&!/^[-=_*.\s]+$/.test(l)).join('\n');
function ocr(canvas,tmp){
  fs.writeFileSync(tmp,canvas.toBuffer('image/png'));
  const tsv=execFileSync('tesseract',[tmp,'stdout','--psm','6','-l','eng','tsv'],{maxBuffer:64e6,stdio:['ignore','pipe','ignore']}).toString();
  const rows=tsv.trim().split('\n').slice(1).map(l=>l.split('\t')).filter(c=>c[0]==='5'&&c[11]&&c[11].trim());
  const lines=new Map();
  rows.forEach(c=>{const k=c[2]+'-'+c[3]+'-'+c[4];if(!lines.has(k))lines.set(k,{w:[],c:[]});const L=lines.get(k);L.w.push(c[11]);L.c.push(+c[10])});
  return [...lines.values()].map(L=>({text:L.w.join(' '),conf:L.c.reduce((a,b)=>a+b,0)/L.c.length}))}
(async()=>{
  for(let i=0;i<gt.length;i++){
    if(i%nsh!==shard)continue;const g=gt[i];if(done.has(g.id))continue;
    const t0=Date.now();const img=await loadImage(path.join(dir,g.image));
    const results=[],passText=[],tmp=`/tmp/p${shard}.png`;
    for(const P of A.PASSES){const lines=ocr(A.prepReceipt(img,P.opts),tmp);results.push(A.parseReceipt(lines));passText.push(lines.map(l=>l.text).join('\n'))}
    const parsed=A.mergeParsed(results);
    const truth=norm(g.lines.join('\n'));
    const charAcc=passText.map(t=>Math.max(0,1-A.lev(norm(t),truth)/truth.length));
    // items: match by price
    const used=new Set();let correct=0,wrong=0,missed=0,wrongFlagged=0,correctFlagged=0;const det=[];
    g.items.forEach(it=>{const k=parsed.items.findIndex((p,j)=>!used.has(j)&&p.price!=null&&Math.abs(p.price-it.price)<.005);
      if(k<0){missed++;det.push({t:it.text,r:'missed'});return}used.add(k);const p=parsed.items[k];
      const ok=it.keys.includes(p.key);ok?correct++:wrong++;if(p.flagged)ok?correctFlagged++:wrongFlagged++;
      if(!ok)det.push({t:it.text,r:'wrong',got:p.key,raw:p.raw})});
    const extras=parsed.items.filter((p,j)=>!used.has(j));
    const nonfoodLeaked=extras.filter(p=>g.nonfood.some(n=>p.price!=null&&false)).length;
    const dd=A.dateDecision(parsed);const pd=new Date(g.purchase+'T00:00:00');
    const dateOK=!!parsed.date&&A.iso(parsed.date)===g.purchase;
    const late=g.age_days>=1;
    const lateHandled=late?(dateOK&&(dd.latePrompt||dd.issue==='unclear')):!dd.latePrompt;
    const tot=A.findTotal(passText[1])||A.findTotal(passText[0]);
    const rec={id:g.id,store:g.store,date_format:g.date_format,condition:g.condition,severity:g.severity,age_days:g.age_days,
      n_items:g.items.length,correct,wrong,missed,extras:extras.length,extra_raw:extras.slice(0,4).map(e=>e.raw),flagged:parsed.items.filter(p=>p.flagged).length,
      wrong_flagged:wrongFlagged,correct_flagged:correctFlagged,char_acc:charAcc,char_acc_mean:charAcc.reduce((a,b)=>a+b)/3,
      date_read:parsed.date?A.iso(parsed.date):null,date_ok:dateOK,late,late_prompt:dd.latePrompt,date_issue:dd.issue,late_handled:lateHandled,
      total_read:tot,total_ok:tot!=null&&Math.abs(tot-g.total)<.005,errors:det,secs:(Date.now()-t0)/1000,engine:'tesseract 5.3.4 (3-pass, app code)'};
    fs.appendFileSync(out,JSON.stringify(rec)+'\n');
  }})();
