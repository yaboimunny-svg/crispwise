"""Simulated Canadian grocery receipts + phone-photo damage, with exact ground truth.
Store names are fictional; layouts follow common Canadian POS styles (Loblaw-, Metro-, Walmart-,
Costco-style and an independent). Usage: python3 gen.py OUTDIR N SEED"""
import json, math, os, random, sys
from datetime import date, timedelta
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

TODAY = date(2026, 11, 21)
FONTS = ['/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf',
         '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf',
         '/usr/share/fonts/truetype/freefont/FreeMono.ttf',
         '/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf']

# (receipt text, acceptable app categories, price range, taxable). Abbreviations follow how Canadian POS systems print.
F = [
 ('CHKN BRST BNLS SKNLS', {'chicken'}, (9, 22), 0), ('BNLS SKNLS CHKN BREAST', {'chicken'}, (9, 22), 0),
 ('CHICKEN THIGHS BNLS', {'thighs'}, (7, 15), 0), ('CHKN DRUMSTICKS', {'chicken'}, (5, 11), 0),
 ('ROTISSERIE CHICKEN', {'chicken'}, (8, 12), 0), ('CHKN WINGS', {'chicken'}, (8, 16), 0),
 ('LEAN GRD BEEF', {'beef'}, (6, 14), 0), ('GRD BF X-LEAN', {'beef'}, (7, 14), 0),
 ('STRIPLOIN STEAK', {'beef'}, (12, 28), 0), ('PORK LOIN CHOPS', {'pork'}, (6, 14), 0),
 ('BACON REG SLICED', {'pork'}, (5, 9), 0), ('ITAL SAUSAGE MILD', {'sausage'}, (5, 9), 0),
 ('SMOKIES CHEDDAR', {'sausage'}, (5, 8), 0), ('BLACK FOREST HAM', {'deli'}, (4, 8), 0),
 ('SLCD TURKEY BREAST', {'deli', 'turkey'}, (4, 8), 0), ('GRD TURKEY', {'turkey'}, (6, 10), 0),
 ('ATL SALMON FLT', {'salmon'}, (10, 20), 0), ('SLMN FLT SKN ON', {'salmon'}, (10, 20), 0),
 ('COOKED SHRIMP 31/40', {'shrimp'}, (9, 16), 0), ('TILAPIA FLT FRZ', {'seafood', 'frozen'}, (8, 14), 0),
 ('GROUND LAMB', {'lamb'}, (8, 13), 0),
 ('2% MILK 4L', {'milk'}, (5.5, 7.2), 0), ('NATREL 2% MLK 2L', {'milk'}, (4.5, 6.5), 0),
 ('HOMO MILK 4L', {'milk'}, (6, 7.5), 0), ('SKIM MILK 1L', {'milk'}, (2.5, 3.5), 0),
 ('LACTOSE FREE 2% 2L', {'milk'}, (5, 7), 0), ('OAT BEVERAGE 1.75L', {'milk'}, (4, 6), 0),
 ('GREEK YOGOURT 0%', {'yogurt'}, (4, 7), 0), ('YGRT VANILLA 650G', {'yogurt'}, (3.5, 6), 0),
 ('LIBERTE MED YOG', {'yogurt'}, (4, 7), 0), ('MARBLE CHEDDAR 400G', {'cheese'}, (6, 10), 0),
 ('MOZZ SHRED 320G', {'cheese'}, (5, 8), 0), ('CREAM CHEESE 250G', {'cheese'}, (3.5, 5.5), 0),
 ('FETA CHEESE', {'cheese'}, (5, 8), 0), ('SALTED BUTTER 454G', {'butter'}, (5.5, 8.5), 0),
 ('SOUR CREAM 14%', {'cream'}, (2.5, 4), 0), ('35% WHIPPING CRM', {'cream'}, (4, 6), 0),
 ('10% CREAM 1L', {'cream'}, (3.5, 5), 0),
 ('LARGE EGGS 12', {'eggs'}, (3.8, 6), 0), ('BURNBRAE LG EGGS 18', {'eggs'}, (6, 9), 0),
 ('FREE RUN EGGS DZ', {'eggs'}, (5, 7.5), 0),
 ('DEMPSTERS WW BREAD', {'bread'}, (3, 5), 0), ('WHITE BREAD 675G', {'bread'}, (2.5, 4.5), 0),
 ('BAGELS PLAIN 6PK', {'bread'}, (3, 5), 0), ('HAMBURGER BUNS 8', {'bread'}, (2.5, 4), 0),
 ('FLOUR TORTILLAS 10', {'bread'}, (3, 5), 0), ('ENGLISH MUFFINS', {'bread'}, (2.5, 4), 0),
 ('BANANAS', {'banana'}, (1.2, 2.5), 0), ('ORG BANANAS', {'banana'}, (1.8, 3.2), 0),
 ('GALA APPLES 3LB', {'apple'}, (4, 6), 0), ('HONEYCRISP APPLES', {'apple'}, (3, 7), 0),
 ('BARTLETT PEARS', {'pear'}, (2, 4), 0), ('NAVEL ORANGES', {'orange'}, (3, 6), 0),
 ('CLEMENTINES 2LB', {'tangerine'}, (4, 7), 0), ('RED SDLS GRAPES', {'grapes'}, (4, 8), 0),
 ('LEMONS', {'lemon'}, (0.8, 1.5), 0), ('LIMES', {'lemon', 'fruit'}, (0.5, 1.2), 0),
 ('STRAWBERRIES 1LB', {'berries'}, (3.5, 6), 0), ('BLUEBERRIES PINT', {'berries'}, (4, 6), 0),
 ('RASPBERRIES 6OZ', {'fruit', 'berries'}, (4, 6), 0), ('AVOCADOS 4PK', {'avocado'}, (4, 6), 0),
 ('HASS AVOCADO', {'avocado'}, (1.2, 2.5), 0), ('ROMA TOMATOES', {'tomato'}, (2, 4), 0),
 ('GRAPE TOMATOES', {'tomato'}, (3, 5), 0), ('TOMATOES ON VINE', {'tomato'}, (3, 5), 0),
 ('CARROTS 2LB', {'carrot'}, (1.8, 3.5), 0), ('BABY CARROTS', {'carrot'}, (2, 4), 0),
 ('YELLOW ONIONS 3LB', {'onion'}, (2.5, 4.5), 0), ('RED ONION', {'onion'}, (1, 2), 0),
 ('RUSSET POTATOES 10LB', {'potato'}, (4, 8), 0), ('SWEET POTATOES', {'potato'}, (2, 4), 0),
 ('ENG CUCUMBER', {'cucumber'}, (1.2, 2.5), 0), ('BROCCOLI CROWNS', {'broccoli'}, (2, 4), 0),
 ('RED PEPPERS', {'pepper'}, (2.5, 5), 0), ('GRN PEPPER', {'pepper'}, (1, 2.5), 0),
 ('WHITE MUSHROOMS 227G', {'mushroom'}, (2, 3.5), 0), ('BABY SPINACH 142G', {'spinach'}, (3, 5), 0),
 ('ROMAINE HEARTS 3PK', {'lettuce'}, (3.5, 5.5), 0), ('ICEBERG LETTUCE', {'lettuce'}, (2, 3.5), 0),
 ('SPRING MIX 312G', {'lettuce'}, (5, 7), 0), ('GREEN CABBAGE', {'cabbage'}, (2, 4), 0),
 ('CELERY STALKS', {'veg'}, (2, 4), 0), ('ZUCCHINI', {'veg'}, (1.5, 3), 0),
 ('GARLIC 3PK', {'veg'}, (1.5, 3), 0), ('GREEN ONIONS', {'veg'}, (0.8, 1.8), 0),
 ('CAULIFLOWER', {'veg'}, (3, 5), 0), ('FIRM TOFU', {'veg'}, (2.5, 4), 0),
 ('MANGO', {'fruit'}, (1, 2.5), 0), ('PINEAPPLE', {'fruit'}, (3, 5), 0),
 ('ORANGE JUICE 2.63L', {'juice'}, (4, 7), 0), ('APPLE JUICE 1.36L', {'juice'}, (2, 4), 0),
 ('HUMMUS ORIGINAL', {'dip'}, (3.5, 5.5), 0), ('MILD SALSA', {'dip'}, (3, 5), 0),
 ('FRZ PIZZA PEPPERONI', {'pizza', 'frozen'}, (5, 9), 0), ('DELISSIO PIZZA', {'pizza'}, (5, 9), 0),
 ('ICE CREAM VAN 1.5L', {'frozen'}, (4, 7), 1), ('FRZ MIXED VEG 750G', {'frozen', 'veg'}, (2.5, 4.5), 0),
 ('SPAGHETTI 900G', {'pantry'}, (2, 3.5), 0), ('BASMATI RICE 2KG', {'pantry'}, (6, 10), 0),
 ('PASTA SAUCE', {'pantry'}, (2.5, 4.5), 0), ('KD ORIGINAL', {'pantry'}, (1.2, 2), 0),
 ('CEREAL HONEY OATS', {'pantry'}, (4, 7), 0), ('PEANUT BUTTER 1KG', {'pantry'}, (5, 8), 0),
 ('CANOLA OIL 3L', {'pantry'}, (7, 11), 0), ('CHKN NOODLE SOUP', {'pantry', 'chicken'}, (1.5, 3), 0),
 ('GRANULATED SUGAR 2KG', {'sugar'}, (3, 5), 0),
 ('POTATO CHIPS 235G', {'snack'}, (3, 5), 1), ('TORTILLA CHIPS', {'snack', 'bread'}, (3, 5), 1),
 ('COOKIES CHOC CHIP', {'snack'}, (3, 5), 1), ('CRACKERS 200G', {'snack'}, (3, 5), 0),
 ('GRANOLA BARS 6PK', {'snack'}, (3, 5), 1), ('COLA 12X355ML', {'drink'}, (6, 9), 1),
 ('SPARKLING WATER 12PK', {'drink'}, (5, 8), 1), ('ICED TEA 2L', {'drink'}, (2, 3.5), 1),
]
NONFOOD = [('PAPER TOWELS 6RL', 1), ('BATH TISSUE 12DR', 1), ('DISH SOAP 709ML', 1), ('LAUNDRY DETERGENT', 1),
           ('GARBAGE BAGS 40CT', 1), ('ALUMINUM FOIL', 1), ('TOOTHPASTE', 1), ('SHAMPOO 750ML', 1)]
PLU_ITEMS = {'BANANAS': 4011, 'RED PEPPERS': 4088, 'GRN PEPPER': 4065, 'ROMA TOMATOES': 4087, 'ENG CUCUMBER': 4593,
             'BROCCOLI CROWNS': 4060, 'RED ONION': 4082, 'BARTLETT PEARS': 4409, 'LEMONS': 4958, 'LIMES': 4048,
             'HASS AVOCADO': 4046, 'ICEBERG LETTUCE': 4061, 'GREEN CABBAGE': 4069, 'HONEYCRISP APPLES': 3283}
WEIGHED = {'BANANAS': 1.52, 'ORG BANANAS': 2.18, 'RED PEPPERS': 6.59, 'GRN PEPPER': 4.39, 'ROMA TOMATOES': 4.39,
           'HONEYCRISP APPLES': 6.59, 'BARTLETT PEARS': 4.39, 'ZUCCHINI': 4.39, 'MANGO': 0, 'SWEET POTATOES': 3.29}

STORES = [  # fictional names, Canadian cities
 dict(id='truenorth', name='TRUE NORTH SUPERMARKET', addr=['#1042  875 DUNDAS ST W', 'TORONTO ON  M6J 1V5', '(416) 555-0142'],
      date='ymd_slash', tax='HMRJ', w=40, codes=True, brand='TN '),
 dict(id='mapleway', name='MAPLEWAY FOODS', addr=['MAPLEWAY #318', '2150 BURNHAMTHORPE RD W', 'MISSISSAUGA ON L5L 5Z5'],
      date='dmy_slash', tax='', w=38, codes=False, brand='MW '),
 dict(id='northgate', name='NORTHGATE MART', addr=['SUPERCENTRE #3127', '(905) 555-0119', '1 BLOOR ST E BRAMPTON ON'],
      date='mdy_short', tax='JN', w=42, codes=True, brand='NV '),
 dict(id='harbour', name='HARBOUR FRESH MARKET', addr=['412 QUEEN ST E', 'HAMILTON ON  L8L 1K7', 'HST# 81234 5678 RT0001'],
      date='mon_d_y', tax='', w=36, codes=False, brand=''),
 dict(id='prairie', name='PRAIRIE WHOLESALE CLUB', addr=['WAREHOUSE #0547', '3550 OGDEN RD SE', 'CALGARY AB  T2G 4N6'],
      date='iso', tax='E', w=40, codes='item', brand='PW '),
]
CONDITIONS = ['clean', 'crumpled', 'shadow', 'tilted', 'blurry', 'faded', 'lowlight']
SEVERITY = ['mild', 'moderate', 'severe']


def fmt_date(d, kind, r):
    hh, mm, ss = r.randint(8, 21), r.randint(0, 59), r.randint(0, 59)
    if kind == 'ymd_slash': return f'{d:%Y/%m/%d} {hh:02d}:{mm:02d}:{ss:02d}'
    if kind == 'dmy_slash': return f'{d:%d/%m/%Y}  {hh:02d}:{mm:02d}'
    if kind == 'mdy_short': return f'{d:%m/%d/%y}  {hh:02d}:{mm:02d}:{ss:02d}'
    if kind == 'mon_d_y':
        h12 = hh % 12 or 12
        return f'{d:%b} {d.day}, {d.year}  {h12}:{mm:02d} {"PM" if hh >= 12 else "AM"}'
    return f'{d:%Y-%m-%d} {hh:02d}:{mm:02d}'


def upc(r):
    b = [r.randint(0, 9) for _ in range(11)]; b[0] = 0
    s = sum(b[i] * (3 if i % 2 == 0 else 1) for i in range(11))
    return ''.join(map(str, b)) + str((10 - s % 10) % 10)


def build_receipt(r, rid):
    st = r.choice(STORES); W = st['w']
    age = r.choices([0, r.randint(1, 3), r.randint(4, 10)], [45, 30, 25])[0]
    d = TODAY - timedelta(days=age)
    n_food = r.randint(5, 16); n_non = r.choices([0, 1, 2], [55, 30, 15])[0]
    picks = r.sample(F, n_food); nonf = r.sample(NONFOOD, n_non)
    used = set(); lines = []; items = []
    def price_in(lo, hi):
        while True:
            p = round(r.uniform(lo, hi), 2)
            if f'{p:.2f}' not in used: used.add(f'{p:.2f}'); return p
    def row(label, price, flag=''):
        if flag in ('HMRJ', 'MRJ'):  # Loblaw-style: tax code before the price
            right = f'{flag:>4}   {price:.2f}'
        else:
            right = f'{price:.2f}' + (f' {flag}' if flag else '')
        return label[:W - len(right) - 1].ljust(W - len(right)) + right
    L = ['', st['name'].center(W)] + [a.center(W) for a in st['addr']] + ['']
    L.append(fmt_date(d, st['date'], r).ljust(W - 9) + f'TRN {r.randint(1000,9999)}')
    L.append(f'CASHIER: {r.randint(10,99)}   LANE {r.randint(1,14)}'); L.append('-' * W)
    sub = 0.0; taxable = 0.0
    order = [(f, True) for f in picks] + [(nf, False) for nf in nonf]; r.shuffle(order)
    for it, is_food in order:
        if is_food:
            name, keys, pr, tx = it
        else:
            name, tx = it; keys = set(); pr = (3, 14)
        label = name
        if st['brand'] and is_food and r.random() < .3 and not name.startswith(('BANANA', 'ORG', 'LEMON', 'LIME')):
            label = st['brand'] + name
        flag = ''
        if st['tax'] == 'HMRJ': flag = 'HMRJ' if tx else 'MRJ'
        elif st['tax'] == 'JN': flag = 'J' if tx else 'N'
        elif st['tax'] == 'E': flag = 'E' if not tx else 'A'
        weighed = is_food and name in WEIGHED and WEIGHED[name] and r.random() < .7
        plu = PLU_ITEMS.get(name) if is_food else None
        if weighed:
            kg = round(r.uniform(.3, 1.6), 3); per = WEIGHED[name]
            price = round(kg * per, 2)
            while f'{price:.2f}' in used: kg = round(kg + .005, 3); price = round(kg * per, 2)
            used.add(f'{price:.2f}')
            first = (f'{plu:04d} ' if plu and st['codes'] else '') + label
            lines.append(first[:W]); lines.append(row(f'  {kg:.3f} kg @ ${per:.2f}/kg', price, flag))
        else:
            price = price_in(*pr)
            if st['codes'] == 'item': label = f'{r.randint(10000,1999999)} {label}'
            elif st['codes'] and r.random() < .5:
                label = (f'{plu:04d} ' if plu else '') + label if plu else label
                if not plu: lines.append(f'  {upc(r)}')
            lines.append(row(label, price, flag))
        if is_food and r.random() < .12:
            dsc = round(min(price * .3, r.choice([1.0, 1.5, 2.0, .75])), 2)
            lines.append(row('  INSTANT SAVINGS', dsc, '-')) if st['id'] != 'mapleway' else lines.append(row('  TPD/ DISCOUNT', dsc, '-'))
            price_net = price - dsc
        else:
            price_net = price
        sub += price_net
        if tx: taxable += price_net
        if is_food: items.append(dict(text=name, price=price, keys=sorted(keys), weighed=bool(weighed)))
    if r.random() < .35:
        lines.append(row('BOTTLE DEPOSIT', .10 * r.randint(1, 12)))
    L += lines; L.append('-' * W)
    hst = round(taxable * .13, 2) if st['id'] != 'prairie' else round(taxable * .05, 2)
    total = round(sub + hst + sum(0 for _ in []), 2)
    dep = sum(float(l.split()[-1]) for l in lines if l.startswith('BOTTLE DEPOSIT'))
    total = round(total + dep, 2)
    L.append(row('SUBTOTAL', round(sub + dep, 2)))
    L.append(row('HST 13%' if st['id'] != 'prairie' else 'GST 5%', hst))
    L.append(row('TOTAL', total)); L.append('')
    L.append(row(r.choice(['VISA', 'MASTERCARD', 'INTERAC DEBIT']) + ' TEND', total))
    L.append(f'NUMBER OF ITEMS SOLD = {len(order)}'); L.append('')
    L.append('THANK YOU FOR SHOPPING'.center(W)); L.append('MERCI / THANK YOU'.center(W)); L.append('')
    return dict(id=rid, store=st['id'], date_format=st['date'], purchase=d.isoformat(), age_days=age,
                lines=L, items=items, nonfood=[n for n, _ in nonf], total=total)


def render(rec, r):
    font = ImageFont.truetype(r.choice(FONTS), r.randint(26, 30))
    W = len(rec['lines'][1]) if rec['lines'][1] else 40
    cw = font.getbbox('M')[2]; lh = int(font.size * r.uniform(1.25, 1.45))
    pw = int(cw * (max(len(l) for l in rec['lines']) + 4)); ph = lh * len(rec['lines']) + 60
    img = Image.new('L', (pw, ph), 250); dr = ImageDraw.Draw(img)
    ink = r.randint(10, 45)
    for i, l in enumerate(rec['lines']):
        dr.text((cw * 2, 30 + i * lh), l, font=font, fill=ink)
    a = np.array(img).astype(np.float32)
    # thermal print texture: uneven darkness along the print head
    a += np.random.normal(0, 3, a.shape)
    return np.clip(a, 0, 255).astype(np.uint8)


def background(h, w, r):
    kind = r.choice(['wood', 'counter', 'dark', 'fabric'])
    base = {'wood': (95, 125, 160), 'counter': (170, 172, 168), 'dark': (40, 42, 48), 'fabric': (120, 90, 70)}[kind]
    bg = np.zeros((h, w, 3), np.float32) + np.array(base, np.float32)
    n = cv2.resize(np.random.rand(max(2, h // 40), max(2, w // 40)).astype(np.float32), (w, h))
    bg += (n[..., None] - .5) * 40
    if kind == 'wood':
        y = np.arange(h)[:, None]; bg += (np.sin(y / r.uniform(6, 14) + n[..., None][:, :, 0] * 6) * 12)[..., None]
    return np.clip(bg, 0, 255)


def damage(paper, cond, sev, r):
    s = SEVERITY.index(sev) + 1  # 1..3
    p = paper.astype(np.float32)
    h, w = p.shape
    if cond == 'faded':
        ink_lift = [70, 110, 140][s - 1]
        p = 250 - (250 - p) * (1 - ink_lift / 250)
        g = cv2.resize(np.random.rand(8, 3).astype(np.float32), (w, h)) * [20, 35, 45][s - 1]
        p = p + g * ((250 - p) > 5)  # patchy fade on the print only
    # paper onto a bigger photo canvas
    pad_x, pad_y = int(w * r.uniform(.12, .3)), int(h * r.uniform(.05, .12))
    H, Wd = h + 2 * pad_y, w + 2 * pad_x
    bg = background(H, Wd, r)
    paper_rgb = np.stack([p * 1.0, p * .99, p * .96], -1)
    mask = np.zeros((H, Wd), np.float32); mask[pad_y:pad_y + h, pad_x:pad_x + w] = 1
    canvas = bg.copy(); canvas[pad_y:pad_y + h, pad_x:pad_x + w] = paper_rgb
    if cond == 'crumpled':
        amp = [5, 10, 16][s - 1]; k = [6, 9, 12][s - 1]
        dx = cv2.resize((np.random.rand(k, max(2, k // 3)) - .5).astype(np.float32), (Wd, H), interpolation=cv2.INTER_CUBIC) * amp * 4
        dy = cv2.resize((np.random.rand(k, max(2, k // 3)) - .5).astype(np.float32), (Wd, H), interpolation=cv2.INTER_CUBIC) * amp * 4
        X, Y = np.meshgrid(np.arange(Wd, dtype=np.float32), np.arange(H, dtype=np.float32))
        canvas = cv2.remap(canvas, X + dx, Y + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        mask = cv2.remap(mask, X + dx, Y + dy, cv2.INTER_LINEAR)
        shade = np.ones((H, Wd), np.float32)
        for _ in range([4, 8, 14][s - 1]):  # creases: a bright and a dark side
            x0, y0 = r.uniform(0, Wd), r.uniform(0, H); ang = r.uniform(0, math.pi)
            nx, ny = math.cos(ang), math.sin(ang)
            dist = (X - x0) * ny - (Y - y0) * nx
            wdt = r.uniform(4, 14)
            shade -= np.exp(-(dist / wdt) ** 2) * r.uniform(.08, .22) * np.sign(dist + 1e-3)
        lumpy = cv2.resize(np.random.rand(k, k // 2 + 2).astype(np.float32), (Wd, H), interpolation=cv2.INTER_CUBIC)
        shade *= 1 - (lumpy - .5) * [0.15, .25, .35][s - 1]
        canvas = canvas * np.where(mask[..., None] > .5, shade[..., None], 1)
    # lighting
    X, Y = np.meshgrid(np.linspace(-1, 1, Wd), np.linspace(-1, 1, H))
    gx, gy = r.uniform(-1, 1), r.uniform(-1, 1)
    light = 1 + (gx * X + gy * Y) * .08
    if cond == 'shadow':
        pts = np.array([[r.uniform(-.2, .6) * Wd, -10], [r.uniform(.3, 1.2) * Wd, -10],
                        [r.uniform(.2, 1.1) * Wd, r.uniform(.3, .9) * H], [r.uniform(-.3, .4) * Wd, r.uniform(.4, 1.0) * H]], np.int32)
        sm = np.zeros((H, Wd), np.float32); cv2.fillPoly(sm, [pts], 1.0)
        sm = cv2.GaussianBlur(sm, (0, 0), [25, 12, 6][s - 1])
        light = light * (1 - sm * [.35, .5, .62][s - 1])
        light = light * (1 + (gx * X) * .15 * s)
    if cond == 'lowlight':
        light = light * [.55, .42, .32][s - 1]
    canvas = canvas * light[..., None]
    if cond == 'lowlight':
        canvas = canvas * np.array([.85, .95, 1.1])  # warm tint (BGR)
    # camera pose
    ang = {'tilted': r.uniform(7, 10) * s, 'clean': r.uniform(-2, 2)}.get(cond, r.uniform(-4, 4)) * r.choice([-1, 1])
    persp = {'tilted': .03 * s, 'clean': .01}.get(cond, .02)
    src = np.float32([[0, 0], [Wd, 0], [Wd, H], [0, H]])
    jit = lambda v: v + r.uniform(-persp, persp) * max(Wd, H)
    dst = np.float32([[jit(0), jit(0)], [jit(Wd), jit(0)], [jit(Wd), jit(H)], [jit(0), jit(H)]])
    M = cv2.getPerspectiveTransform(src, dst)
    R = cv2.getRotationMatrix2D((Wd / 2, H / 2), ang, 1.0); R = np.vstack([R, [0, 0, 1]])
    T = R @ M
    big = background(H, Wd, r) * (light[..., None] if cond in ('lowlight',) else 1)
    canvas = cv2.warpPerspective(canvas.astype(np.float32), T, (Wd, H), borderMode=cv2.BORDER_REFLECT)
    m2 = cv2.warpPerspective(mask, T, (Wd, H))
    canvas = canvas * m2[..., None] + big * (1 - m2[..., None]) * (canvas.mean() / max(1, canvas.mean()))
    if cond == 'blurry':
        if r.random() < .5:
            canvas = cv2.GaussianBlur(canvas, (0, 0), [1.6, 2.4, 3.2][s - 1])
        else:
            k = [9, 15, 21][s - 1]; ker = np.zeros((k, k), np.float32); ker[k // 2, :] = 1
            ker = cv2.warpAffine(ker, cv2.getRotationMatrix2D((k / 2, k / 2), r.uniform(0, 180), 1), (k, k)); ker /= ker.sum()
            canvas = cv2.filter2D(canvas, -1, ker)
    else:
        canvas = cv2.GaussianBlur(canvas, (0, 0), .6)
    noise = {'lowlight': [6, 10, 14][s - 1]}.get(cond, 2.5)
    canvas = canvas + np.random.normal(0, noise, canvas.shape)
    out = np.clip(canvas, 0, 255).astype(np.uint8)
    # phone photo size: long side ~2400 px
    k = 2400 / max(out.shape[:2]); out = cv2.resize(out, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
    return out


def main():
    outdir, n, seed = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    os.makedirs(outdir, exist_ok=True)
    r = random.Random(seed); np.random.seed(seed)
    gts = []
    for i in range(n):
        cond = CONDITIONS[i % len(CONDITIONS)]; sev = SEVERITY[(i // len(CONDITIONS)) % 3]
        if cond == 'clean': sev = 'none'
        rid = f'R{i + 1:03d}'
        rec = build_receipt(r, rid)
        paper = render(rec, r)
        img = damage(paper, cond, sev if sev != 'none' else 'mild', r)
        q = 55 if cond == 'lowlight' else 85
        cv2.imwrite(os.path.join(outdir, rid + '.jpg'), img, [cv2.IMWRITE_JPEG_QUALITY, q])
        rec.update(condition=cond, severity=sev, image=rid + '.jpg')
        gts.append(rec)
    with open(os.path.join(outdir, 'ground_truth.json'), 'w') as f: json.dump(gts, f, indent=1)
    print('wrote', len(gts))


if __name__ == '__main__':
    main()
