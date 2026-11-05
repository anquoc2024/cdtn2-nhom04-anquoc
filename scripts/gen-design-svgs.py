"""Sinh hình minh họa SVG cho 12 mẫu nail trong dữ liệu mẫu (public/designs). Chạy: python3 scripts/gen-design-svgs.py"""
import math, os
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'designs')
NAIL = 'M0,-62 C24,-62 30,-30 30,10 L30,48 C30,58 22,64 0,64 C-22,64 -30,58 -30,48 L-30,10 C-30,-30 -24,-62 0,-62 Z'
FINGERS = [(-196, 52, -16, 1.22), (-98, 10, -7, 1.34), (0, -6, 0, 1.4), (98, 10, 7, 1.34), (196, 52, 16, 1.22)]

def nail_group(i, fill, extra=''):
    x, y, r, s = FINGERS[i]
    return (f'<g transform="translate({300 + x},{228 + y}) rotate({r}) scale({s})">'
            f'<path d="{NAIL}" fill="{fill}"/>{extra}'
            f'<path d="{NAIL}" fill="none" stroke="#3F2433" stroke-opacity=".10" stroke-width="1.5"/>'
            f'<ellipse cx="-12" cy="-20" rx="5" ry="22" fill="#fff" opacity=".35"/></g>')

def clip(i):
    return f'<clipPath id="c{i}"><path d="{NAIL}"/></clipPath>'

def card(name, bg, blob, body, defs=''):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" role="img" aria-label="{name}">'
           f'<defs>{defs}{"".join(clip(i) for i in range(5))}</defs>'
           f'<rect width="600" height="450" fill="{bg}"/>'
           f'<circle cx="470" cy="90" r="120" fill="{blob}" opacity=".55"/>'
           f'<circle cx="110" cy="380" r="90" fill="{blob}" opacity=".35"/>{body}</svg>')
    open(os.path.join(OUT, name + '.svg'), 'w', encoding='utf8').write(svg)

def all_nails(fill_fn, extra_fn=lambda i: ''):
    return ''.join(nail_group(i, fill_fn(i), extra_fn(i)) for i in range(5))

def dots(i, pts, r, fill, stroke='none'):
    return f'<g clip-path="url(#c{i})">' + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}"/>' for x, y in pts) + '</g>'

# 01 French
card('01-french', '#F6EEE8', '#EBD9CF', all_nails(lambda i: '#EFD3C6',
     lambda i: f'<g clip-path="url(#c{i})"><path d="M-40,-36 Q0,-20 40,-36 L40,-80 L-40,-80 Z" fill="#FFFDFB"/></g>'))
# 02 Nude
card('02-nude', '#F5EBE4', '#E6CFC2', all_nails(lambda i: ['#E3B9A6', '#DDB09C', '#E7C1AF', '#DDB09C', '#E3B9A6'][i]))
# 03 / 04 Ombre
for nm, bg, blob, a, b in (('03-ombre-pink', '#FBEFF2', '#F2CFDA', '#FCEFF2', '#E07C9C'),
                           ('04-ombre-peach', '#FCF1EA', '#F6D6C2', '#FEF2E8', '#EE9568')):
    card(nm, bg, blob, all_nails(lambda i: 'url(#g)'),
         f'<linearGradient id="g" x1="0" y1="1" x2="0" y2="0"><stop offset=".15" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>')
# 05 / 06 Cat eye
for nm, bg, blob, base, band in (('05-cateye-silver', '#EEF0F3', '#D6DAE2', '#3E4250', '#E9EDF5'),
                                 ('06-cateye-wine', '#F7ECEE', '#E6C4CC', '#4E1123', '#E06A88')):
    card(nm, bg, blob, all_nails(lambda i: 'url(#g)'),
         f'<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="{base}"/>'
         f'<stop offset=".5" stop-color="{band}"/><stop offset=".75" stop-color="{base}"/></linearGradient>')
# 07 Gems at base
card('07-gem-base', '#FBF0F2', '#F1D2DA', all_nails(lambda i: '#F6D9E0',
     lambda i: dots(i, [(-12, 48), (0, 52), (12, 48), (0, 40)], 5, '#FFFFFF', '#B8955A')))
# 08 Pearl and bow
card('08-pearl', '#F7F2EC', '#E9DED2', all_nails(lambda i: '#FBF6F0',
     lambda i: dots(i, [(0, 40), (-10, 30), (10, 30)], 6, '#FFFFFF', '#D9CBBB') +
     ('<path d="M-14,-10 L0,-2 L-14,6 Z M14,-10 L0,-2 L14,6 Z" fill="#E7A9B9"/><circle cx="0" cy="-2" r="3" fill="#C9708C"/>' if i % 2 == 0 else '')))
# 09 Flowers
def flower(cx, cy, c):
    return ''.join(f'<circle cx="{cx + 6*math.cos(a)}" cy="{cy + 6*math.sin(a)}" r="4.5" fill="{c}"/>' for a in [k*2*math.pi/5 for k in range(5)]) + f'<circle cx="{cx}" cy="{cy}" r="3" fill="#E8B04B"/>'
card('09-flowers', '#FBF4EC', '#EFDDC9', all_nails(lambda i: '#FFF7EE',
     lambda i: f'<g clip-path="url(#c{i})">' + flower(-8, -24 + 12*i % 30, '#EC9DB2') + flower(10, 18, '#F3C4D1') + flower(-6, 46, '#EC9DB2') + '</g>'))
# 10 Marble
card('10-marble', '#F1EFED', '#DDD8D3', all_nails(lambda i: '#FBFAF8',
     lambda i: f'<g clip-path="url(#c{i})" fill="none"><path d="M-30,{-40+6*i} C-10,-20 10,0 30,{-10+5*i}" stroke="#9A9AA2" stroke-width="2"/>'
               f'<path d="M-30,20 C-5,10 5,40 30,30" stroke="#B9B9C0" stroke-width="1.2"/><path d="M-30,52 C0,40 10,60 30,50" stroke="#B8955A" stroke-width="2"/></g>'))
# 11 Bridal
def spark(x, y, s):
    return f'<path d="M{x},{y-s} L{x+s*.3},{y-s*.3} L{x+s},{y} L{x+s*.3},{y+s*.3} L{x},{y+s} L{x-s*.3},{y+s*.3} L{x-s},{y} L{x-s*.3},{y-s*.3} Z" fill="#E2C9A0"/>'
card('11-bridal', '#F8F4F0', '#EAE0D6', all_nails(lambda i: '#FFFCF8',
     lambda i: f'<g clip-path="url(#c{i})">{spark(-8, -30, 7)}{spark(10, 0, 5)}' + dots(i, [(0, 44), (-10, 50), (10, 50)], 4.5, '#FFFFFF', '#A88F67')[len(f'<g clip-path="url(#c{i})">'):]))
# 12 Blush gold
card('12-blush-gold', '#FAEFEE', '#EFD0CE', all_nails(lambda i: '#F2CFCB',
     lambda i: f'<g clip-path="url(#c{i})"><path d="M-40,-34 Q0,-18 40,-34" fill="none" stroke="#C6A060" stroke-width="3"/>'
               f'<circle cx="-14" cy="-44" r="1.6" fill="#C6A060"/><circle cx="6" cy="-48" r="1.4" fill="#C6A060"/><circle cx="16" cy="-40" r="1.2" fill="#C6A060"/></g>'))
print('ok', len(os.listdir(OUT)))
