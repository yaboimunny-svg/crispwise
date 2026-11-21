/* Crispwise scan pipeline, copied verbatim from the Crispwise artifact (version 1794803642-1d85)
   so the batch test runs the app's own logic. Only change: a canvas shim for Node, and TODAY can be fixed. */
const {createCanvas}=require('@napi-rs/canvas');
const document={createElement:()=>createCanvas(1,1)};

const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const startOfDay=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
let TODAY=startOfDay(new Date());
const setToday=d=>{TODAY=startOfDay(d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const diffDays=(a,b)=>Math.round((startOfDay(a)-startOfDay(b))/864e5);
const pad2=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());

const FOOD={
  chicken:{name:'Chicken',e:'🍗',shelf:2,risk:true,kw:['CHICKEN','CHKN','CHK','BRST','BREAST','WINGS','WING']},
  thighs:{name:'Chicken thighs',e:'🍗',shelf:2,risk:true,kw:['THIGH','THIGHS','THGH','THGHS']},
  turkey:{name:'Ground turkey',e:'🦃',shelf:2,risk:true,kw:['TURKEY','TRKY']},
  beef:{name:'Ground beef',e:'🥩',shelf:2,risk:true,kw:['BEEF','BF','STEAK','BEF']},
  pork:{name:'Pork',e:'🥓',shelf:3,risk:true,kw:['PORK','PRK','BACON']},
  sausage:{name:'Sausage',e:'🌭',shelf:5,risk:true,kw:['SAUSAGE','SSG']},
  deli:{name:'Deli meat',e:'🥪',shelf:5,risk:true,kw:['LUNCH','DELI','HAM','LNCH']},
  salmon:{name:'Salmon',e:'🐟',shelf:2,risk:true,kw:['SALMON','SLMN','SALM']},
  tuna:{name:'Tuna steaks',e:'🐟',shelf:2,risk:true,kw:['TUNA','TUN']},
  shrimp:{name:'Shrimp',e:'🦐',shelf:2,risk:true,kw:['SHRIMP','SHRMP','SHRP']},
  milk:{name:'Milk',e:'🥛',shelf:7,kw:['MILK','MLK']},
  yogurt:{name:'Yogurt',e:'🥣',shelf:14,kw:['YOGURT','YGRT','YOG','YGT']},
  cheese:{name:'Cheese',e:'🧀',shelf:21,kw:['CHEESE','CHS','CHDR','CHEDDAR']},
  butter:{name:'Butter',e:'🧈',shelf:30,kw:['BUTTER','BTR']},
  eggs:{name:'Eggs',e:'🥚',shelf:28,kw:['EGG','EGGS']},
  bread:{name:'Bread',e:'🍞',shelf:6,kw:['BREAD','BRD','LOAF']},
  banana:{name:'Bananas',e:'🍌',shelf:5,kw:['BANANA','BANANAS','BNNA','BNN']},
  apple:{name:'Apples',e:'🍎',shelf:21,kw:['APPLE','APPLES','APL','APLS']},
  pear:{name:'Pears',e:'🍐',shelf:7,kw:['PEAR','PEARS']},
  orange:{name:'Oranges',e:'🍊',shelf:14,kw:['ORANGE','ORANGES','ORNG','NAVEL']},
  tangerine:{name:'Tangerines',e:'🍊',shelf:10,kw:['TANGERINE','TANGERINES','MANDARIN','CLEMENTINE']},
  grapes:{name:'Grapes',e:'🍇',shelf:7,kw:['GRAPE','GRAPES']},
  lemon:{name:'Lemons',e:'🍋',shelf:21,kw:['LEMON','LEMONS']},
  berries:{name:'Berries',e:'🍓',shelf:4,kw:['BERRY','BERRIES','STRWB','STRAWBERRY','BLUEBERRY','BLBRY']},
  avocado:{name:'Avocados',e:'🥑',shelf:4,kw:['AVOCADO','AVOCADOS','AVO']},
  tomato:{name:'Tomatoes',e:'🍅',shelf:5,kw:['TOMATO','TOMATOES','TMTO','TOM']},
  carrot:{name:'Carrots',e:'🥕',shelf:21,kw:['CARROT','CARROTS','CRRT']},
  onion:{name:'Onions',e:'🧅',shelf:30,kw:['ONION','ONIONS']},
  potato:{name:'Potatoes',e:'🥔',shelf:30,kw:['POTATO','POTATOES']},
  cucumber:{name:'Cucumber',e:'🥒',shelf:7,kw:['CUCUMBER','CUKE']},
  broccoli:{name:'Broccoli',e:'🥦',shelf:5,kw:['BROCCOLI','BROC']},
  pepper:{name:'Peppers',e:'🫑',shelf:7,kw:['PEPPER','PEPPERS','PEPR']},
  mushroom:{name:'Mushrooms',e:'🍄',shelf:5,kw:['MUSHROOM','MUSHROOMS','MSHRM']},
  spinach:{name:'Baby spinach',e:'🥬',shelf:5,kw:['SPINACH','SPNCH','SPNCHS']},
  lettuce:{name:'Lettuce',e:'🥬',shelf:6,kw:['LETTUCE','LTTC','ROMAINE']},
  cabbage:{name:'Cabbage',e:'🥬',shelf:14,kw:['CABBAGE']},
  lamb:{name:'Lamb',e:'🍖',shelf:2,risk:true,kw:['LAMB']},
  pizza:{name:'Pizza',e:'🍕',shelf:4,risk:true,kw:['PIZZA']},
  juice:{name:'Juice',e:'🧃',shelf:10,kw:['JUICE','JCE']},
  drink:{name:'Drinks',e:'🥤',shelf:180,kw:['POP','SODA','COLA']},
  snack:{name:'Snacks',e:'🍪',shelf:90,kw:['CHIPS','SNACK','COOKIES','CRACKERS']},
  sugar:{name:'Sugar',e:'🍯',shelf:365,kw:['SUGAR']},
  cream:{name:'Cream and sour cream',e:'',shelf:14,kw:['CREAM','SOUR']},
  fruit:{name:'Fruit',e:'',shelf:7,kw:['FRUIT','MANGO','PEACH','PLUM','KIWI','CHERRIES','MELON','LIME','LIMES']},
  veg:{name:'Vegetables',e:'',shelf:7,kw:['CELERY','ZUCCHINI','KALE','CAULIFLOWER','CORN','GARLIC','GINGER','ASPARAGUS','SQUASH','BEANS','PEAS','LEEK','RADISH','BEETS','VEG','VEGETABLE']},
  seafood:{name:'Fish and seafood',e:'',shelf:2,risk:true,kw:['COD','TILAPIA','HADDOCK','TROUT','CRAB','LOBSTER','SCALLOPS','MUSSELS','FISH']},
  pantry:{name:'Pantry',e:'',shelf:180,kw:['RICE','PASTA','FLOUR','CEREAL','OATS','SAUCE','SOUP','OIL']},
  frozen:{name:'Frozen food',e:'',shelf:90,kw:['FROZEN','FRZ']},
  dip:{name:'Dips and prepared food',e:'',shelf:5,kw:['HUMMUS','SALSA','DIP','GUACAMOLE']},
  other:{name:'Other item',e:'🛒',shelf:7,kw:[]}
};
const FOOD_KEYS=Object.keys(FOOD);
const THRESH=.75;

function prepReceipt(img,opts){
  opts=opts||{};
  const nw=img.naturalWidth||img.width,nh=img.naturalHeight||img.height;
  const k0=Math.min(1,3000/Math.max(nw,nh));
  const w0=Math.round(nw*k0),h0=Math.round(nh*k0);
  const c0=document.createElement('canvas');c0.width=w0;c0.height=h0;
  const x0=c0.getContext('2d',{willReadFrequently:true});x0.drawImage(img,0,0,w0,h0);
  const d=x0.getImageData(0,0,w0,h0).data;
  const paper=i=>{const mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]);return mx>=140&&mx-mn<=70};
  const colN=new Float32Array(w0);
  for(let y=0;y<h0;y++)for(let x=0;x<w0;x++)if(paper((y*w0+x)*4))colN[x]++;
  function longest(arr,len,thr,norm,gapFrac){
    let best=[0,len-1],bl=-1,s=-1,gap=0,last=0;const g=Math.max(3,Math.round(len*gapFrac));
    for(let i=0;i<=len;i++){const on=i<len&&arr[i]/norm>=thr;
      if(on){if(s<0)s=i;gap=0;last=i}
      else if(s>=0){gap++;if(gap>g||i===len){if(last-s>bl){bl=last-s;best=[s,last]}s=-1;gap=0}}}
    return best}
  let [cx0,cx1]=longest(colN,w0,0.30,h0,0.02);
  const rowIn=new Float32Array(h0);
  for(let y=0;y<h0;y++){let n=0;for(let x=cx0;x<=cx1;x++)if(paper((y*w0+x)*4))n++;rowIn[y]=n}
  let [ry0,ry1]=longest(rowIn,h0,0.35,cx1-cx0+1,0.02);
  let cw=cx1-cx0+1,ch=ry1-ry0+1;
  if(cw*ch<0.12*w0*h0||cw<w0*0.12){cx0=0;ry0=0;cw=w0;ch=h0}
  const m=Math.round(Math.min(cw,ch)*0.02);
  cx0=Math.max(0,cx0-m);ry0=Math.max(0,ry0-m);cw=Math.min(w0-cx0,cw+2*m);ch=Math.min(h0-ry0,ch+2*m);
  if(opts.boxOnly)return{x:cx0/k0,y:ry0/k0,w:cw/k0,h:ch/k0};
  const sc=Math.min(8,Math.max(0.4,(opts.width||1300)/cw));
  const W=Math.round(cw*sc),H=Math.round(ch*sc);
  const c1=document.createElement('canvas');c1.width=W;c1.height=H;
  const x1=c1.getContext('2d',{willReadFrequently:true});x1.imageSmoothingQuality='high';
  x1.drawImage(c0,cx0,ry0,cw,ch,0,0,W,H);
  const id=x1.getImageData(0,0,W,H),p=id.data,gray=new Uint8Array(W*H);
  for(let i=0,j=0;i<p.length;i+=4,j++)gray[j]=(p[i]*0.299+p[i+1]*0.587+p[i+2]*0.114)|0;
  const I=new Float64Array((W+1)*(H+1));
  for(let y=1;y<=H;y++){let row=0;for(let x=1;x<=W;x++){row+=gray[(y-1)*W+x-1];I[y*(W+1)+x]=I[(y-1)*(W+1)+x]+row}}
  const r=Math.max(8,Math.round(W/(opts.div||60))),C=opts.C==null?8:opts.C,mode=opts.mode||'bin';
  for(let y=0;y<H;y++){const ya=Math.max(0,y-r),yb=Math.min(H-1,y+r);
    for(let x=0;x<W;x++){const xa=Math.max(0,x-r),xb=Math.min(W-1,x+r);
      const n=(xb-xa+1)*(yb-ya+1);
      const s=I[(yb+1)*(W+1)+xb+1]-I[ya*(W+1)+xb+1]-I[(yb+1)*(W+1)+xa]+I[ya*(W+1)+xa];
      const m=s/n,g=gray[y*W+x];
      let v=mode==='flat'?Math.max(0,Math.min(255,255-(m-g)*(opts.gain||3))):(g<m-C?0:255);
      if(mode==='flat'&&opts.hi){const lo=opts.lo||0,hi=opts.hi;v=v<=lo?0:v>=hi?255:Math.round((v-lo)/(hi-lo)*255)}
      const q=(y*W+x)*4;p[q]=p[q+1]=p[q+2]=v;p[q+3]=255}}
  x1.putImageData(id,0,0);
  return c1}

function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,j)=>j);for(let i=1;i<=m;i++){const q=[i];for(let j=1;j<=n;j++)q[j]=Math.min(p[j]+1,q[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=q}return p[n]}
function matchFood(text){
  const toks=text.toUpperCase().replace(/[^A-Z ]/g,' ').split(/\s+/).filter(t=>t.length>=2);
  let best=null;
  FOOD_KEYS.forEach(k=>{
    let top=0,hits=0;
    FOOD[k].kw.forEach(w=>toks.forEach(t=>{
      let s=0;
      if(t===w)s=w.length<=3?0.85:1;
      else if(w.length>=5&&t.length>=4){const sim=1-lev(t,w)/Math.max(t.length,w.length);if(sim>=0.75)s=sim*0.95}
      if(s>0){hits++;top=Math.max(top,s)}
    }));
    if(top>0){const score=Math.min(1,top+0.08*(hits-1));if(!best||score>best.score)best={key:k,score}}
  });
  return best}
const SKIP=/\b(SUB\s?TOTAL|TOTAL|TAX|HST|GST|PST|QST|VISA|MASTER\s?CARD|MCARD|DEBIT|CREDIT|CASH|CHANGE|THANK|WELCOME|APPROVED|CARD|TEL|PHONE|STORE|DATE|BALANCE|POINTS|CASHIER|REF|REFERENCE|SOLD|TEND|PAYMENT|VALIDATION|ACCOUNT|INTERAC|AMOUNT|INVOICE|AUTH|MEMBER|REWARDS|DEPOSIT|ENVIRO|ECO\s?FEE)\b/i;
const NOISE=['SUBTOTAL','CHANGE','DEBIT','CREDIT','BALANCE','APPROVED','THANK','INTERAC','AMOUNT','REWARDS'];
const PRICE=/(\$?\s?\d{1,3}\s?[.,'’`]\s?\d{2})\s*-?\s*[A-Z0]{0,2}\W{0,4}$/;
const PRICE_GAP=/(?:\$|\b)(\d{1,2})\s(\d{2})\s?[A-Z0]{0,2}\W{0,4}$/;
const NONFOOD=/\b(PAPER\s?TOWELS?|TOWELS?|TISSUES?|KLEENEX|BOUNTY|CHARMIN|ROYALE|CASHMERE|TOILET|BATH\s?TISSUE|NAPKINS?|DETERGENT|TIDE|GAIN|DOWNY|BOUNCE|FABRIC|BLEACH|CLOROX|LYSOL|CLEANER|CLEANING|WINDEX|WIPES?|SPONGES?|DISH\s?SOAP|DAWN|CASCADE|FINISH\s?PODS?|PODS|SOAP|BODY\s?WASH|SHAMPOO|CONDITIONER|TOOTHPASTE|COLGATE|CREST|TOOTHBRUSH|FLOSS|MOUTHWASH|DEODORANT|RAZORS?|LOTION|SUNSCREEN|DIAPERS?|PAMPERS|HUGGIES|BATTER(Y|IES)|DURACELL|ENERGIZER|FOIL|PLASTIC\s?WRAP|CLING|ZIPLOC|GARBAGE|TRASH|BIN\s?BAGS?|GLAD|CANDLES?|BULBS?|CHARGER|CABLE|HDMI|USB|GIFT\s?CARD|MAGAZINE|GREETING|SOCKS|SHIRT|PANTS|HANGERS?|ADVIL|TYLENOL|ADVIL|BAND.?AIDS?|DOG\s?FOOD|CAT\s?FOOD|LITTER|PEDIGREE|PURINA|MEOW|FLOWERS?|BOUQUET|PLANTS?|BAG\s?FEE|SHOPPING\s?BAGS?|REUSABLE\s?BAGS?|LIGHTER|MATCHES|PROPANE|CHARCOAL|MOTOR\s?OIL|WASHER\s?FLUID|LOTTO|LOTTERY)\b/i;
const SKIP_GLUED=/^\W*(SUB)?TOTAL[A-Z]|NU?M?BER\s*OF\s*ITEMS|ITEMS\s*SO\w{0,2}D|CHANGE\s*DUE|AMOUNT\s*DUE|(VISA|MASTERCARD|DEBIT)\s*TEND/i;
const END=/SUB\s?-?\s?TOTAL|\*{2,}\s*TOTAL|^\W*TOTAL\W*\$?\s*\d|BALANCE\s+DUE|\bTOTAL\s+\$\s?\d/i;
const DISC=/\bTPD\b|INSTANT\s+SAV|\bCOUPON|%\s*OFF|\bYOU\s+SAVED|\bSAVED\b|\bROLLBACK|\bREDUCED|MARK\s?DOWN|CLEARANCE|\bCLR\b|\bDISC(OUNT)?\b|^\W*-\s?\$?\d{1,3}[.,]\d{2}\W*$|\d[.,]\d{2}\s?-\s*[A-Z]?\W*$/i;
const DISC_WORD=/\bTPD\b|INSTANT\s+SAV|\bCOUPON|%\s*OFF|\bYOU\s+SAVED|\bSAVED\b|\bSAVINGS?\b|\bROLLBACK|\bREDUCED|MARK\s?DOWN|CLEARANCE|\bCLR\b|\bDISC(OUNT)?\b/i;
const MARKDOWN=/CLEARANCE|\bCLR\b|REDUCED|MARK\s?DOWN|\bMGR\s?SPEC/i;
const QTY=/^\W*\d+\s*@\s*\$?\d|\d\s*(kg|lb|ks)\b.*@|@\s*\$?\d+[.,]\d\d\s*\/\s*(kg|lb|ks)|\/\s*(k[gqas9]|lb|1b)\b|^\W*\d[.,]\d{2,3}\s*[xk]?\s*[gq9]?\s*[@x]?\s*\$?\d+[.,]\d\d\s*\/\s*k/i;
const RULES=[
 [/SOUR\s*CR|WHIP|HALF\s*&?\s*HALF|COFFEE\s*CR|(?<!ICE\s)\bCREAM\b(?!\s*CH)|\bCRM\b(?!\s*CH)|\b(10|18|35)\s?%\s*(CR|M\.?F)/i,'cream'],
 [/PEANUT\s*BUT|\bPB\b|NUTELLA|\bJAM\b|HONEY|SYRUP|DRESSING|KETCHUP|MUSTARD|\bMAYO|TOMATO\s*(SAUCE|PASTE)|PASTA\s*SAUCE|CORN\s*FLAKES|CEREAL|CHEERIOS|OATMEAL|\bOATS\b|\bRICE\b|PASTA|SPAGHETTI|PENNE|MACARONI|NOODLE|RAMEN|FLOUR|\bOIL\b|VINEGAR|CANNED|\bSOUP\b|\bSPICE|SEASONING|COFFEE|KRAFT\s*DINNER|\bKD\b/i,'pantry'],
 [/ICE\s*CR|FROZEN|\bFRZ\b|POPSICLE|FRIES\b/i,'frozen'],
 [/CREAM\s*CH|PHILADELPHIA|BABYBEL|CHEESE\s*STR|STRINGS?\s*CHEESE|COTTAGE|RICOTTA|HALLOUMI|PANEER|BLACK\s*DIAMOND|CRACKER\s*BARREL|SINGLES|SHRED|GRATED/i,'cheese'],
 [/PEANUT\s*BUT/i,'pantry'],
 [/BUTTER(?!MILK)|MARGARINE|BECEL|GAY\s*LEA|\bBTR\b/i,'butter'],
 [/CHOC(OLATE)?\s*MILK|BUTTERMILK|ALMOND\s*(MILK|BEV)|OAT\s*(MILK|BEV)|SOY\s*(MILK|BEV)|\bSILK\b|LACTOSE\s*FREE|SEALTEST|DAIRYLAND|BEATRICE/i,'milk'],
 [/JUICE|\bJCE\b|\bOJ\b|\bJU(ICE?|IC|I)?\b|TROPICANA|SIMPLY\s*OR|OASIS|MINUTE\s*MAID|LEMONADE/i,'juice'],
 [/PI[ZC]{1,2}[AE]|\b[1lI][0-9gq]["'”]\s*C?HEESE|TOSSED|HAND\s*TOSS|PAN\s*PIZ|THIN\s*CRUST|DELISSIO|PANZEROTTI/i,'pizza'],
 [/SMOKIE|CHD\s*SM|\bSMK\b|SAUSAGE|WIENER|HOT\s?DOG|BRATWURST|CHORIZO/i,'sausage'],
 [/SALAMI|PEPPERONI|PROSCIUTTO|BOLOGNA|PASTRAMI|\bHAM\b|DELI|SLICED\s*TURKEY|LUNCH\s*MEAT|SANDWICH\s*MEAT/i,'deli'],
 [/\bBRO[WU]N\s*[1lI][0-9A-Za-z]|\bEG{1,2}S?\b|LARGE\s*EG|\bDOZ(EN)?\b|BURNBRAE|GRAY\s*RIDGE|EGG\s*WHITE/i,'eggs'],
 [/YOG|YGRT|\bYGT\b|LIBERT[EÉ]|ACTIVIA|OIKOS|\bIOGO\b|GREEK\s*Y|\bGRK\b|\bYOP\b|YOPLAIT|DANONE|SKYR|KEFIR|\bASTRO\b|SILHOUETTE|NOUVEAU/i,'yogurt'],
 [/FAIRLIFE|PURFILTRE|\bHOMO\b|\b[12]\s?%\s*M|\bSKIM\b|LACTANTIA|NATREL|NEILSON|\bMLK\b|\bMILK\b/i,'milk'],
 [/MARBLE|CHEDDAR|\bCHDR\b|MOZZ|PARM|BRIE\b|GOUDA|FETA\b|BOCCONCINI|HAVARTI|SWISS|PROVOLONE|\bCHS\b|CHEESE/i,'cheese'],
 [/VICKIE|CHIPS|DORITO|\bLAYS\b|WELCH|FRUIT\s*SN|COOKIE|CRACKER|GOLDFISH|PRINGLE|OREO|POPCORN|CHOCOLATE|CANDY|GRANOLA\s*BAR|\bBARS?\b|PRETZEL|ALMONDS|CASHEW|\bNUTS\b|KIT\s*KAT|M&M/i,'snack'],
 [/\bPOP\b|NESTEA|COKE|PEPSI|SPRITE|GINGER\s*ALE|\bSODA\b|ICED\s*TEA|GATORADE|RED\s*BULL|CANADA\s*DRY|SPARKLING|\bWATER\b|KOMBUCHA|ENERGY/i,'drink'],
 [/SUGAR/i,'sugar'],
 [/BRIOCHE|\bDEMP|\bWWH\b|BAGEL|\bBUNS?\b|\bLOAF\b|BREAD|TORTILLA|\bPITA\b|CROISSANT|\bWRAPS?\b|MUFFIN|\bNAAN\b|\bROTI\b|ENGLISH\s*M|\bROLLS?\b|BAGUETTE|WONDER|VILLAGGIO|COUNTRY\s*HARVEST/i,'bread'],
 [/\bLAMB\b|GROUND\s*LA/i,'lamb'],
 [/GRAPE\s*TOM|CHERRY\s*TOM|\bTOMS?\b|TOMATO/i,'tomato'],
 [/PEP\s*GRN|GRN\s*PEP|\bPEPPERS?\b|\bRED\s*PEP|\bPEP\s*RED|BELL\s*PEP/i,'pepper'],
 [/GROUND\s*B|GRD\s*BF|\bBEEF\b|STEAK|\bBF\b|STRIPLOIN|SIRLOIN|RIBEYE|BRISKET/i,'beef'],
 [/THIGH/i,'thighs'],
 [/CHICKEN|\bCHKN\b|\bBRST\b|DRUMSTICK|\bWINGS?\b|ROTISSERIE/i,'chicken'],
 [/\bPORK\b|PORK\s*CH|\bRIBS\b|TENDERLOIN|\bLOIN\b|BACON/i,'pork'],
 [/TURKEY|\bTRKY\b/i,'turkey'],
 [/SALMON|\bSLMN\b/i,'salmon'],
 [/SHRIMP|PRAWN/i,'shrimp'],
 [/\bCOD\b|TILAPIA|HADDOCK|TROUT|POLLOCK|\bSOLE\b|HALIBUT|\bCRAB\b|LOBSTER|SCALLOP|MUSSEL|\bCLAMS?\b|CALAMARI|SQUID|FISH/i,'seafood'],
 [/SPRING\s*MIX|SALAD|ARUGULA|MESCLUN|ROMAINE|LETTUCE|ICEBERG/i,'lettuce'],
 [/SWEET\s*POT|\bYAMS?\b/i,'potato'],
 [/MANGO|PINEAPPLE|WATERMELON|MELON|CANTALOUPE|PEACH|NECTARINE|\bPLUMS?\b|CHERR|\bKIWI|PAPAYA|POMEGRANATE|\bLIMES?\b|RASPBERR|BLACKBERR/i,'fruit'],
 [/CELERY|ZUCCHINI|\bKALE\b|CAULI|\bCORN\b|GARLIC|GINGER|CILANTRO|PARSLEY|GREEN\s*ONION|SCALLION|ASPARAGUS|SQUASH|EGGPLANT|\bBEANS\b|\bPEAS\b|BOK\s*CHOY|\bLEEKS?\b|RADISH|\bBEETS?\b|\bHERBS?\b|BRUSSEL|TOFU/i,'veg'],
 [/HUMMUS|SALSA|GUAC|\bDIP\b|TZATZIKI|SUSHI|LASAGNA|PREPARED|READY\s*MEAL|\bMEAL\b/i,'dip']
];
function classify(label){
  const t=label.toUpperCase();
  for(const [re,k] of RULES)if(re.test(t))return{key:k,score:0.92};
  return matchFood(t)}
const money=s=>{const m=String(s).replace(/\s/g,'').match(/(\d{1,3})[.,'’`](\d{2})/);return m?+(m[1]+'.'+m[2]):null};
function receiptDate(text){
  let m=text.match(/\b(20\d\d)[-\/.](\d{1,2})[-\/.](\d{2}|\d(?!\d))/);
  if(m)return valid(+m[1],+m[2],+m[3]);
  m=text.match(/\b([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(20\d\d)\b/);
  if(m){const mo=MON.findIndex(x=>x.toLowerCase()===m[1].toLowerCase());if(mo>=0)return valid(+m[3],mo+1,+m[2])}
  m=text.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](20\d\d|\d\d\b)/);
  if(m){const y=m[3].length===2?2000+ +m[3]:+m[3];return valid(y,+m[1],+m[2])}
  return null}
function valid(y,mo,d){const x=new Date(y,mo-1,d);return x.getFullYear()===y&&x.getMonth()===mo-1&&x.getDate()===d?x:null}
function gtinOk(d){const n=d.length;let s=0;for(let i=n-2;i>=0;i--)s+=(+d[i])*(((n-2-i)%2===0)?3:1);return (10-s%10)%10===+d[n-1]}
const UPCTOK=/[0-9OoIl|SBZ]{11,14}/g;
const PLU={4011:['banana','Bananas'],4065:['pepper','Green peppers'],4088:['pepper','Red peppers'],4688:['pepper','Red peppers'],4689:['pepper','Yellow peppers'],
 4664:['tomato','Tomatoes on the vine'],4087:['tomato','Roma tomatoes'],4796:['tomato','Cherry tomatoes'],4799:['tomato','Tomatoes'],4062:['cucumber','Cucumber'],4593:['cucumber','English cucumber'],
 4060:['broccoli','Broccoli'],4072:['potato','Russet potatoes'],4093:['onion','Yellow onions'],4082:['onion','Red onions'],4166:['onion','Sweet onions'],
 4131:['apple','Fuji apples'],4133:['apple','Gala apples'],4017:['apple','Granny Smith apples'],4016:['apple','Red Delicious apples'],3283:['apple','Honeycrisp apples'],4128:['apple','Pink Lady apples'],
 4409:['pear','Bartlett pears'],4416:['pear','Bosc pears'],4012:['orange','Navel oranges'],4450:['tangerine','Clementines'],4958:['lemon','Lemons'],4048:['lemon','Limes'],
 4046:['avocado','Avocados'],4225:['avocado','Avocados'],4069:['cabbage','Green cabbage'],4554:['cabbage','Red cabbage'],4061:['lettuce','Iceberg lettuce'],4640:['lettuce','Romaine'],
 4562:['carrot','Carrots'],4022:['grapes','Green grapes'],4023:['grapes','Red grapes'],4090:['spinach','Spinach']};
const upcCheck=b=>{let s=0;for(let i=0;i<11;i++)s+=(+b[i])*(i%2===0?3:1);return String((10-s%10)%10)};
function findCode(t){
  for(const tok of (t.match(UPCTOK)||[])){
    if((tok.match(/\d/g)||[]).length<8)continue;
    const d=tok.replace(/[Oo]/g,'0').replace(/[Il|]/g,'1').replace(/S/g,'5').replace(/B/g,'8').replace(/Z/g,'2');
    if(!/^\d+$/.test(d))continue;
    const pm=d.match(/^0{4,}(9?\d{4})\d?$/);
    if(pm&&d.length>=11){const n=+pm[1];const organic=n>=90000;const base=organic?n-90000:n;if(PLU[base])return{plu:base,organic}}
    if((d.length===12||d.length===13)&&gtinOk(d))return{upc:d,verified:true};
    if(d.length===12)return{upc:d.slice(0,11)+upcCheck(d.slice(0,11)),verified:false}}
  return null}
function parseReceipt(lines){
  let date=null,dateConf=100,dateAlt=false,ended=false,pending=null;const items=[],nonFood=[];
  const add=(text,conf,priceTxt,cls)=>{
    const code=findCode(text),upc=code&&code.upc||null;
    if(code&&code.plu&&!cls){const [k,nmP]=PLU[code.plu];cls={key:k,score:0.97,plu:code.plu,name:(code.organic?'Organic ':'')+nmP}}
    const label=text.replace(PRICE,'').replace(UPCTOK,' ').replace(/\b\d{3,}\b/g,' ').replace(/[^A-Za-z0-9 %.\/'"-]/g,' ').replace(/\s+/g,' ').trim();
    const ocr=Math.max(0,Math.min(1,conf/100));
    const m=cls||classify(label);
    if(!m){
      const words=label.split(' ').filter(w=>/^[A-Za-z']{3,}$/.test(w));
      if(!(words.length&&ocr>=0.45)&&!upc)return}
    if(NONFOOD.test(label)&&(!m||m.score<0.9)){nonFood.push(label);return}
    const key=m?m.key:'other',match=m?m.score:0.3;
    const c=0.55*match+0.45*ocr;
    items.push({nice:m&&m.name?m.name:null,raw:text+(m&&m.plu?'  [PLU '+m.plu+(code.organic?', organic':'')+']':''),label:m&&m.name?m.name:(label||'Item '+(upc||'')),key,guessKey:key,conf:c,ocr,match,flagged:c<THRESH,upc,upcVerified:!!(code&&code.verified),organic:!!(code&&code.organic),upcOnly:!m,price:money(priceTxt),discount:0,markdown:false})};
  lines.forEach(({text,conf})=>{
    const t=text.trim().replace(/([A-Za-z]{2,})(\d{5,})/g,'$1 $2');if(!t)return;
    {const d=receiptDate(t);if(d){if(!date){date=d;dateConf=conf}else if(diffDays(d,date)!==0)dateAlt=true}}
    if(ended)return;
    if(END.test(t)&&items.length){ended=true;return}
    const last=items[items.length-1];
    if(last&&(DISC_WORD.test(t)||(DISC.test(t)&&!classify(t.replace(DISC,' '))))){
      const pct=t.match(/(\d{1,2})\s?%/);const amt=money(t.replace(/.*?(\d{1,3}\s?[.,]\s?\d{2})\D*$/,'$1'));
      if(pct)last.discountPct=Math.max(last.discountPct||0,+pct[1]/100);
      if(amt&&(!last.price||amt<last.price))last.discount+=amt;
      if(MARKDOWN.test(t))last.markdown=true;
      return}
    if(MARKDOWN.test(t)&&last){last.markdown=true}
    if(QTY.test(t)){
      const pm=t.match(PRICE);
      if(pending&&pm){add(pending.text+' '+pm[1],Math.min(pending.conf,conf),pm[1]);pending=null}
      return}
    if(/\bYOU\b/i.test(t)||SKIP.test(t)||SKIP_GLUED.test(t)){pending=null;return}
    const words=t.toUpperCase().replace(/[^A-Z ]/g,' ').split(/\s+/).filter(w=>w.length>=5);
    if(words.some(w=>NOISE.some(n=>lev(w,n)<=(n.length>=7?2:1)))){pending=null;return}
    let pm=t.match(PRICE);if(!pm){const g=t.match(PRICE_GAP);if(g&&/[A-Za-z]{3}/.test(t))pm=[g[0],g[1]+'.'+g[2]]}
    if(!pm){
      const cls=classify(t);
      if(pending&&pending.code){add(pending.text,pending.conf,null,pending.cls)}
      pending=cls&&(t.match(/[A-Za-z]/g)||[]).length>=4?{text:t,conf,cls,code:/^\W{0,3}\d{3,8}\s+[A-Za-z]/.test(t)}:null;return}
    const letters=(t.replace(PRICE,'').replace(UPCTOK,'').match(/[A-Za-z]/g)||[]).length;
    if(letters<3){if(pending){add(pending.text+' '+pm[1],Math.min(pending.conf,conf),pm[1],pending.cls);pending=null}return}
    if(pending&&pending.code)add(pending.text,pending.conf,null,pending.cls);
    pending=null;
    add(t,conf,pm[1]);
  });
  if(pending&&pending.code&&!ended)add(pending.text,pending.conf,null,pending.cls);
  items.forEach(it=>{
    const pct=it.discountPct||(it.price&&it.discount?it.discount/(it.price):0);
    it.discountPct=pct;
    if(it.markdown||pct>=0.3){it.clearance=true;it.flagged=true}});
  return{date,items,dateConf,dateAlt,nonFood}}
function sharesWord(a,b){const w=x=>new Set(x.toUpperCase().match(/[A-Z]{4,}/g)||[]);const A=w(a);for(const t of w(b))if(A.has(t))return true;return false}
function mergeParsed(list){
  list=list.filter(Boolean);if(list.length===1)return list[0];
  const dates={};list.forEach(r=>{if(r.date){const k=iso(r.date);dates[k]=(dates[k]||0)+1}});
  const dk=Object.keys(dates).sort((a,b)=>dates[b]-dates[a])[0];
  const groups={};
  list.forEach((r,pi)=>r.items.forEach(it=>{const k=it.price==null?'?'+it.key:it.price.toFixed(2);(groups[k]=groups[k]||{passes:{},items:[]});(groups[k].passes[pi]=groups[k].passes[pi]||[]).push(it);groups[k].items.push(it)}));
  const out=[];
  Object.keys(groups).forEach(gk=>{const g=groups[gk];
    const passes=Object.values(g.passes),support=passes.length;
    const base=passes.sort((a,b)=>(b.length-a.length)||(b.reduce((x,i)=>x+i.conf,0)-a.reduce((x,i)=>x+i.conf,0)))[0].map(it=>Object.assign({},it,{support}));
    const votes={};g.items.forEach(it=>{if(it.key!=='other')votes[it.key]=(votes[it.key]||0)+1});
    const used=new Set(base.map(i=>i.key));
    base.forEach(it=>{if(it.key==='other'){const k=Object.keys(votes).filter(k=>!used.has(k)).sort((a,b)=>votes[b]-votes[a])[0];
      if(k){const src=g.items.filter(i=>i.key===k).sort((a,b)=>b.conf-a.conf)[0];Object.assign(it,src,{support});used.add(k)}}});
    base.forEach(it=>{if(support===1&&list.length>2&&!(it.key!=='other'&&it.conf>=0.75))return;out.push(it)})});
  const final=out.filter(it=>!(it.price==null&&out.some(o=>o!==it&&o.price!=null&&o.key===it.key&&sharesWord(o.raw,it.raw))));
  const first=list.find(r=>r.date&&iso(r.date)===dk);
  return{date:first?first.date:null,items:final,dateConf:first?first.dateConf:100,dateAlt:Object.keys(dates).length>1&&dates[dk]<list.length/2}}
const PASSES=[{label:'sharpened',opts:{C:8,width:1300}},{label:'shadows removed',opts:{mode:'flat',gain:3,width:1800}},{label:'high contrast',opts:{mode:'flat',gain:3,width:1300,lo:100,hi:215}}];
function findTotal(t){const L=String(t||'').split('\n');const get=re=>{for(const l of L){if(re.test(l)&&!/TAX|SAV|NUMBER|ITEMS|PURCHASE|BOXES/i.test(l)){const m=l.match(/(\d{1,4})[.,](\d{2})(?!\d)/);if(m)return +(m[1]+'.'+m[2])}}return null};
  return get(/\bTOTAL\b/i)&&!/SUB/i.test('')?(get(/(^|[^B])\bTOTAL\b/i)||get(/SUB\s?TOTAL/i)):get(/SUB\s?TOTAL/i)}
/* the app's date decision after a scan (startScan) */
function dateDecision(parsed){
  const date=parsed.date;let issue=null;
  if(date){const n=diffDays(TODAY,date);
    if(n<0)issue='future';else if(n>730)issue='old';
    else if(n>=1&&(parsed.dateConf<70||parsed.dateAlt))issue='unclear'}
  const late=!issue&&date&&diffDays(TODAY,date)>=1;
  return{issue,latePrompt:!!late}}
module.exports={FOOD,THRESH,prepReceipt,parseReceipt,mergeParsed,PASSES,findTotal,classify,receiptDate,dateDecision,setToday,diffDays,iso,lev,get TODAY(){return TODAY}};
