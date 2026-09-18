#!/usr/bin/env python3
"""Convert a .dc.html design-component template into a JSX render function.
Usage: dc2jsx.py <in.dc.html> <Name> <outdir>
Writes <outdir>/<kebab>.view.tsx, <outdir>/<kebab>.css, <outdir>/<kebab>.logic.raw.js"""
import sys, re, json, os
from html.parser import HTMLParser

VOID = {'input','br','hr','img','meta','link','area','base','col','embed','source','track','wbr'}
EVENT_MAP = {k.lower(): k for k in [
 'onClick','onChange','onInput','onSubmit','onKeyDown','onKeyUp','onKeyPress','onMouseDown','onMouseUp','onMouseEnter','onMouseLeave','onFocus','onBlur','onDoubleClick','onContextMenu','onMouseMove','onMouseOver','onMouseOut','onPointerDown','onPointerUp','onPointerMove','onPointerEnter','onPointerLeave','onPointerCancel','onPointerOver','onPointerOut','onGotPointerCapture','onLostPointerCapture','onTouchStart','onTouchEnd','onTouchMove','onTouchCancel','onDragStart','onDragEnd','onDragEnter','onDragLeave','onDragOver','onDrop','onAnimationStart','onAnimationEnd','onAnimationIteration','onTransitionEnd']}
ATTR_MAP = {'tabindex':'tabIndex','readonly':'readOnly','maxlength':'maxLength','autocomplete':'autoComplete','autofocus':'autoFocus','colspan':'colSpan','rowspan':'rowSpan','spellcheck':'spellCheck','contenteditable':'contentEditable','srcset':'srcSet','defaultvalue':'defaultValue','defaultchecked':'defaultChecked','class':'className','for':'htmlFor'}
IDENT = re.compile(r'[A-Za-z_$][A-Za-z0-9_$]*')
NUMBER = re.compile(r'^-?\d+(\.\d+)?$')
CAMEL_RE = re.compile(r'(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)')
WHOLE_RE = re.compile(r'^\s*\{\{([\s\S]+?)\}\}\s*$')
SPLIT_RE = re.compile(r'\{\{([\s\S]+?)\}\}')

def encode_camel(s):
    return CAMEL_RE.sub(lambda m: m.group(1)+'sc-camel-'+re.sub(r'[A-Z]', lambda c: '-'+c.group(0).lower(), m.group(2))+m.group(3), s)
def kebab_to_camel(s):
    return re.sub(r'-([a-z])', lambda m: m.group(1).upper(), s)
def decode_attr(name):
    return kebab_to_camel(name[len('sc-camel-'):]) if name.startswith('sc-camel-') else name

class Node:
    def __init__(self, tag, attrs=None, text=None):
        self.tag=tag; self.attrs=attrs or []; self.text=text; self.children=[]

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root=Node('#root'); self.stack=[self.root]
    def handle_starttag(self, tag, attrs):
        n=Node(tag, [(decode_attr(k), v) for k,v in attrs]); self.stack[-1].children.append(n)
        if tag not in VOID: self.stack.append(n)
    def handle_startendtag(self, tag, attrs):
        n=Node(tag, [(decode_attr(k), v) for k,v in attrs]); self.stack[-1].children.append(n)
    def handle_endtag(self, tag):
        for i in range(len(self.stack)-1, 0, -1):
            if self.stack[i].tag==tag:
                del self.stack[i:]; return
    def handle_data(self, data):
        self.stack[-1].children.append(Node('#text', text=data))

# ---- expressions (mirror of runtime resolve()) ----
def parens_wrap_whole(e):
    depth=0
    for i in range(len(e)-1):
        if e[i]=='(': depth+=1
        elif e[i]==')':
            depth-=1
            if depth==0: return False
    return True
def find_eq(e):
    depth=0
    for i,c in enumerate(e):
        if c in '[(': depth+=1
        elif c in '])': depth-=1
        elif depth==0 and c in '=!' and i+1<len(e) and e[i+1]=='=':
            if i>0 and e[i-1] in '=!': continue
            if not e[:i].strip(): continue
            op = c+'==' if (i+2<len(e) and e[i+2]=='=') else c+'='
            return i, op
    return None
def tr(expr, scope):
    e = str(expr).strip()
    if not e: return 'undefined'
    if e[0]=='(' and e[-1]==')' and parens_wrap_whole(e): return '('+tr(e[1:-1], scope)+')'
    eq = find_eq(e)
    if eq:
        i, op = eq
        return '('+tr(e[:i], scope)+' '+op+' '+tr(e[i+len(op):], scope)+')'
    if e[0]=='!': return '!('+tr(e[1:], scope)+')'
    if e in ('true','false','null','undefined'): return e
    if NUMBER.match(e): return e
    if len(e)>=2 and e[0] in '"\'' and e[-1]==e[0]: return json.dumps(e[1:-1])
    return tr_path(e, scope)
def tr_path(e, scope):
    m = IDENT.match(e)
    if not m: return 'undefined'
    head = m.group(0); i = len(head)
    out = head if (head in scope or head=='$index') else 'v.'+head
    while i < len(e):
        if e[i]=='.':
            m = IDENT.match(e[i+1:]) or re.match(r'\d+', e[i+1:])
            if not m: return 'undefined'
            k = m.group(0)
            out += ('?.['+k+']') if k.isdigit() else ('?.'+k)
            i += 1+len(k)
        elif e[i]=='[':
            depth=1; j=i+1
            while j<len(e) and depth>0:
                if e[j]=='[': depth+=1
                elif e[j]==']':
                    depth-=1
                    if depth==0: break
                j+=1
            if depth!=0: return 'undefined'
            out += '?.['+tr(e[i+1:j], scope)+']'
            i = j+1
        else:
            return 'undefined'
    return out

# ---- css helpers ----
def css_to_obj(css):
    o = {}
    for decl in css.split(';'):
        i = decl.find(':')
        if i < 0: continue
        prop = decl[:i].strip()
        o[prop if prop.startswith('--') else kebab_to_camel(prop)] = decl[i+1:].strip()
    return o
def split_decls(css):
    out=[]; start=0; depth=0; quote=''
    i=0
    while i < len(css):
        c=css[i]
        if quote:
            if c=='\\': i+=1
            elif c==quote: quote=''
        elif c in '\'"': quote=c
        elif c=='(': depth+=1
        elif c==')': depth=max(0,depth-1)
        elif c==';' and depth==0:
            out.append(css[start:i]); start=i+1
        i+=1
    out.append(css[start:])
    return [d.strip() for d in out if d.strip()]
def importantify(css):
    return ';'.join(d if d.endswith('!important') else d+' !important' for d in split_decls(css))

def tpl_escape(s):
    return s.replace('\\','\\\\').replace('`','\\`').replace('${','\\${')
def mixed_template(val, scope):
    parts = SPLIT_RE.split(val)
    out = '`'
    for i,p in enumerate(parts):
        out += tpl_escape(p) if i%2==0 else '${dcStr('+tr(p, scope)+')}'
    return out+'`'

class Conv:
    def __init__(self):
        self.pseudo = {}; self.rules = []; self.imports = set(); self.unknown_attrs = set(); self.tags = set()
    def pseudo_class(self, pseudo, css):
        k = pseudo+'|'+css
        if k in self.pseudo: return self.pseudo[k]
        cls = 'scp'+str(len(self.pseudo))
        self.pseudo[k] = cls
        is_el = pseudo in ('before','after')
        sel = '.'+cls+('::' if is_el else ':')+pseudo
        self.rules.append(sel+'{'+(css if is_el else importantify(css))+'}')
        return cls
    def attr_value(self, key, val, scope):
        if val is None: return key
        m = WHOLE_RE.match(val)
        if m:
            ex = tr(m.group(1), scope)
            if key in ('value','checked'): ex = 'dcVal('+ex+', '+json.dumps(key)+')'
            return key+'={'+ex+'}'
        if '{{' in val: return key+'={'+mixed_template(val, scope)+'}'
        return key+'={'+json.dumps(val, ensure_ascii=False)+'}'
    def children(self, nodes, scope, ind, parent=None):
        out=[]
        for n in nodes:
            s = self.node(n, scope, ind, parent)
            if s is not None: out.append(s)
        return out
    def node(self, n, scope, ind, parent=None):
        pad = '  '*ind
        if n.tag=='#text':
            txt = n.text or ''
            if '{{' not in txt:
                if not txt.strip() and (' ' not in txt or parent in ('select','optgroup','table','thead','tbody','tfoot','tr')): return None
                return pad+'{'+json.dumps(txt, ensure_ascii=False)+'}'
            parts = SPLIT_RE.split(txt); out=[]
            for i,p in enumerate(parts):
                if i%2==0:
                    if p: out.append('{'+json.dumps(p, ensure_ascii=False)+'}')
                else:
                    out.append('{dcText('+tr(p, scope)+')}')
            return pad+''.join(out)
        if n.tag=='sc-if':
            val = dict(n.attrs).get('value','')
            m = WHOLE_RE.match(val or '')
            cond = tr(m.group(1), scope) if m else ('true' if val else 'false')
            kids = self.children(n.children, scope, ind+1)
            return pad+'{('+cond+') ? (<>\n'+'\n'.join(kids)+'\n'+pad+'</>) : null}'
        if n.tag=='sc-for':
            a = dict(n.attrs); lst = a.get('list',''); asn = a.get('as','item')
            m = WHOLE_RE.match(lst or '')
            lexpr = tr(m.group(1), scope) if m else '[]'
            kids = self.children(n.children, scope|{asn}, ind+1)
            return pad+'{dcList('+lexpr+').map(('+asn+', $index) => (<React.Fragment key={$index}>\n'+'\n'.join(kids)+'\n'+pad+'</React.Fragment>))}'
        if n.tag in ('dc-import','x-import'):
            a = dict(n.attrs); name = a.get('name') or a.get('component') or 'Unknown'
            self.imports.add(name)
            props=[]
            for k,v in n.attrs:
                if k in ('name','component') or k.startswith('hint-') or k=='style': continue
                key = k if (k.startswith('aria-') or k.startswith('data-')) else kebab_to_camel(k)
                props.append(self.attr_value(key, v, scope))
            return pad+'<div className="sc-host"><'+name+' '+' '.join(props)+' /></div>'
        if n.tag in ('template','script','style','sc-helmet','helmet'): return None
        # element
        self.tags.add(n.tag)
        props=[]; classes=[]; class_dyn=None; pseudo=[]
        for k,v in n.attrs:
            if k.startswith('hint-'): continue
            if k.startswith('style-'):
                pseudo.append(self.pseudo_class(k[6:], v or '')); continue
            if k=='style':
                if v is None: continue
                if '{{' in v: props.append('style={cssToObj('+mixed_template(v, scope)+')}')
                else: props.append('style={'+json.dumps(css_to_obj(v), ensure_ascii=False)+'}')
                continue
            if k=='class':
                if v and '{{' in v: class_dyn = v
                elif v: classes.append(v)
                continue
            key = k
            lk = k.lower()
            if lk in EVENT_MAP: key = EVENT_MAP[lk]
            elif lk.startswith('on') and len(lk)>2: key = 'on'+k[2].upper()+k[3:]
            elif lk in ATTR_MAP: key = ATTR_MAP[lk]
            elif '-' in k and not (k.startswith('aria-') or k.startswith('data-')): self.unknown_attrs.add(k)
            props.append(self.attr_value(key, v, scope))
        if class_dyn or classes or pseudo:
            static = ' '.join(classes+pseudo)
            if class_dyn:
                props.append('className={'+mixed_template((class_dyn+' '+' '.join(pseudo)).strip(), scope)+'}')
            else:
                props.append('className={'+json.dumps(static)+'}')
        head = '<'+n.tag+(' '+' '.join(props) if props else '')
        if n.tag in VOID: return pad+head+' />'
        kids = self.children(n.children, scope, ind+1, n.tag)
        if not kids: return pad+head+'></'+n.tag+'>'
        return pad+head+'>\n'+'\n'.join(kids)+'\n'+pad+'</'+n.tag+'>'

def main():
    src_path, name, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
    src = open(src_path, encoding='utf-8').read()
    kebab = re.sub(r'(?<!^)(?=[A-Z])', '-', name).lower()
    # logic
    m = re.search(r'<script[^>]*data-dc-script[^>]*>([\s\S]*?)</script>', src)
    logic = m.group(1) if m else ''
    # template
    a = src.index('<x-dc'); a = src.index('>', a)+1; b = src.rindex('</x-dc>')
    tpl = src[a:b]
    style = ''
    hm = re.search(r'<helmet>([\s\S]*?)</helmet>', tpl)
    if hm:
        for sm in re.finditer(r'<style>([\s\S]*?)</style>', hm.group(1)): style += sm.group(1)+'\n'
        tpl = tpl[:hm.start()] + tpl[hm.end():]
    p = P(); p.feed(encode_camel(tpl)); p.close()
    c = Conv()
    body = c.children(p.root.children, set(), 3)
    imports = ''.join('import { %s } from "./%s";\n' % (i, re.sub(r'(?<!^)(?=[A-Z])', '-', i).lower()) for i in sorted(c.imports))
    tsx = ('/* eslint-disable */\n// @ts-nocheck\n// Generated from %s by dc2jsx.py - do not edit by hand.\nimport React from "react";\nimport { cssToObj, dcList, dcText, dcVal, dcStr } from "./dc-runtime";\n%s\nexport function render%s(v: any) {\n  return (\n    <>\n%s\n    </>\n  );\n}\n' % (os.path.basename(src_path), imports, name, '\n'.join(body)))
    os.makedirs(outdir, exist_ok=True)
    open(os.path.join(outdir, kebab+'.view.tsx'), 'w', encoding='utf-8').write(tsx)
    open(os.path.join(outdir, kebab+'.css'), 'w', encoding='utf-8').write(style + '\n'.join(c.rules) + '\n')
    open(os.path.join(outdir, kebab+'.logic.raw.js'), 'w', encoding='utf-8').write(logic)
    print('tags:', sorted(c.tags)); print('imports:', sorted(c.imports)); print('pseudo rules:', len(c.rules)); print('unknown dashed attrs:', sorted(c.unknown_attrs)); print('logic chars:', len(logic))
main()
