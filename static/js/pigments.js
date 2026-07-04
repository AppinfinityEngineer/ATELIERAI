// Atelier AI — Pigment library & mixing engine.
// Colour is never shown as RGB/HEX to the artist: everything resolves to
// physical pigments and paintable recipes. Mixing uses a weighted
// subtractive model (geometric mean in linear RGB, scaled by tinting
// strength) which tracks real oil mixing behaviour closely enough for
// planning purposes.

export const PIGMENTS = [
  // name, ci code, sRGB, tint strength, opacity 0..1 (1 = opaque), temp (-1 cool..+1 warm), family
  { id:'tiw',  name:'Titanium White',        ci:'PW6',   rgb:[246,244,238], tint:1.9, opacity:1.0, temp: 0.05, family:'white' },
  { id:'lww',  name:'Lead White (Cremnitz)', ci:'PW1',   rgb:[244,239,226], tint:1.1, opacity:0.85, temp: 0.15, family:'white' },
  { id:'cyl',  name:'Cadmium Yellow Light',  ci:'PY35',  rgb:[250,212,16],  tint:1.3, opacity:0.95, temp: 0.55, family:'yellow' },
  { id:'cym',  name:'Cadmium Yellow Medium', ci:'PY37',  rgb:[247,181,10],  tint:1.3, opacity:0.95, temp: 0.7,  family:'yellow' },
  { id:'yoc',  name:'Yellow Ochre',          ci:'PY43',  rgb:[196,146,58],  tint:0.9, opacity:0.8,  temp: 0.6,  family:'earth' },
  { id:'rsi',  name:'Raw Sienna',            ci:'PBr7',  rgb:[168,116,50],  tint:0.8, opacity:0.55, temp: 0.6,  family:'earth' },
  { id:'nap',  name:'Naples Yellow',         ci:'PBr24', rgb:[233,197,131], tint:0.8, opacity:0.95, temp: 0.5,  family:'yellow' },
  { id:'crl',  name:'Cadmium Red Light',     ci:'PR108', rgb:[224,60,29],   tint:1.4, opacity:0.95, temp: 0.9,  family:'red' },
  { id:'ver',  name:'Vermilion (Genuine hue)',ci:'PR106',rgb:[219,63,42],   tint:1.3, opacity:0.95, temp: 0.9,  family:'red' },
  { id:'ali',  name:'Alizarin Crimson',      ci:'PR83',  rgb:[130,20,38],   tint:1.5, opacity:0.2,  temp: 0.35, family:'red' },
  { id:'pmc',  name:'Permanent Rose (Quin.)',ci:'PV19',  rgb:[196,32,84],   tint:1.6, opacity:0.25, temp: 0.3,  family:'red' },
  { id:'ven',  name:'Venetian Red',          ci:'PR101', rgb:[158,64,42],   tint:1.1, opacity:0.95, temp: 0.75, family:'earth' },
  { id:'bsi',  name:'Burnt Sienna',          ci:'PBr7',  rgb:[121,58,32],   tint:1.0, opacity:0.6,  temp: 0.7,  family:'earth' },
  { id:'bum',  name:'Burnt Umber',           ci:'PBr7',  rgb:[74,48,33],    tint:1.1, opacity:0.7,  temp: 0.5,  family:'earth' },
  { id:'rum',  name:'Raw Umber',             ci:'PBr7',  rgb:[92,74,50],    tint:1.0, opacity:0.7,  temp: 0.15, family:'earth' },
  { id:'ulb',  name:'Ultramarine Blue',      ci:'PB29',  rgb:[28,42,120],   tint:1.3, opacity:0.45, temp:-0.55, family:'blue' },
  { id:'cob',  name:'Cobalt Blue',           ci:'PB28',  rgb:[38,74,157],   tint:0.9, opacity:0.7,  temp:-0.7,  family:'blue' },
  { id:'cer',  name:'Cerulean Blue',         ci:'PB35',  rgb:[42,110,168],  tint:0.8, opacity:0.9,  temp:-0.8,  family:'blue' },
  { id:'prb',  name:'Prussian Blue',         ci:'PB27',  rgb:[16,32,58],    tint:2.2, opacity:0.4,  temp:-0.6,  family:'blue' },
  { id:'vir',  name:'Viridian',              ci:'PG18',  rgb:[24,102,84],   tint:0.9, opacity:0.4,  temp:-0.75, family:'green' },
  { id:'sap',  name:'Sap Green',             ci:'PG7mx', rgb:[62,92,40],    tint:1.0, opacity:0.4,  temp:-0.1,  family:'green' },
  { id:'cgr',  name:'Chromium Oxide Green',  ci:'PG17',  rgb:[92,116,70],   tint:0.9, opacity:0.95, temp:-0.3,  family:'green' },
  { id:'dio',  name:'Dioxazine Violet',      ci:'PV23',  rgb:[52,26,74],    tint:1.9, opacity:0.3,  temp:-0.2,  family:'violet' },
  { id:'ivb',  name:'Ivory Black',           ci:'PBk9',  rgb:[36,34,32],    tint:1.2, opacity:0.8,  temp:-0.25, family:'black' },
  { id:'lmb',  name:'Lamp Black',            ci:'PBk6',  rgb:[28,28,30],    tint:1.6, opacity:0.85, temp:-0.35, family:'black' },
];

export const BRANDS = ['Gamblin','Michael Harding','Old Holland','Schmincke','Winsor & Newton','Williamsburg','Rembrandt','M. Graham'];

export const LIMITED_PALETTES = {
  full:      { name:'Full studio palette', ids: PIGMENTS.map(p=>p.id) },
  zorn:      { name:'Zorn Palette',        ids:['tiw','yoc','ver','ivb'] },
  apelles:   { name:'Apelles Palette',     ids:['lww','yoc','ven','ivb'] },
  academic:  { name:'Classical Academic',  ids:['tiw','yoc','cyl','crl','ali','bsi','rum','ulb','ivb'] },
  portrait:  { name:'Portrait Palette',    ids:['tiw','nap','yoc','crl','ali','ven','bum','rum','ulb','ivb'] },
  landscape: { name:'Landscape Palette',   ids:['tiw','cyl','cym','yoc','crl','bsi','ulb','cer','vir','sap','rum'] },
};

// ---------- colour math ----------
const s2l = c => { c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
const l2s = c => { c = c<=0.0031308 ? c*12.92 : 1.055*Math.pow(c,1/2.4)-0.055; return Math.max(0,Math.min(255,Math.round(c*255))); };

export function rgbToLab([r,g,b]){
  const R=s2l(r),G=s2l(g),B=s2l(b);
  let X=(R*0.4124+G*0.3576+B*0.1805)/0.95047,
      Y=(R*0.2126+G*0.7152+B*0.0722),
      Z=(R*0.0193+G*0.1192+B*0.9505)/1.08883;
  const f=t=> t>0.008856 ? Math.cbrt(t) : (7.787*t)+16/116;
  X=f(X); Y=f(Y); Z=f(Z);
  return [116*Y-16, 500*(X-Y), 200*(Y-Z)];
}
export function deltaE(a,b){ const [L1,A1,B1]=a,[L2,A2,B2]=b; return Math.hypot(L1-L2,A1-A2,B1-B2); }

// Subtractive-ish mix: weighted geometric mean in linear space.
export function mixPigments(parts){ // parts: [{pigment, w}]
  let tw=0; for(const p of parts) tw += p.w * p.pigment.tint;
  const out=[0,0,0].map((_,ch)=>{
    let acc=0;
    for(const p of parts){
      const lin=Math.max(1e-4, s2l(p.pigment.rgb[ch]));
      acc += (p.w*p.pigment.tint/tw) * Math.log(lin);
    }
    return l2s(Math.exp(acc));
  });
  return out;
}

export function mixProps(parts){
  let tw=0,op=0,tp=0;
  for(const p of parts) tw+=p.w;
  for(const p of parts){ op += (p.w/tw)*p.pigment.opacity; tp += (p.w/tw)*p.pigment.temp; }
  return { opacity: op, temp: tp };
}

// ---------- recipe search ----------
// Finds paintable recipes (1–3 pigments + optional white) nearest a target.
export function findRecipes(targetRgb, availableIds, maxResults=3){
  const avail = PIGMENTS.filter(p=>availableIds.includes(p.id));
  const whites = avail.filter(p=>p.family==='white');
  const chroma = avail.filter(p=>p.family!=='white');
  const white = whites[0] || null;
  const target = rgbToLab(targetRgb);
  const results = [];
  const whiteSteps = white ? [0,0.1,0.25,0.45,0.65,0.82,0.92] : [0];

  const evalMix = (parts)=>{
    const rgb = mixPigments(parts);
    const dE = deltaE(rgbToLab(rgb), target);
    results.push({ parts:[...parts], rgb, dE });
  };

  // singles + white
  for(const a of chroma){
    for(const w of whiteSteps){
      const parts=[{pigment:a,w:1-w}]; if(w>0) parts.push({pigment:white,w});
      evalMix(parts);
    }
  }
  // pairs + white
  const ratios=[0.15,0.3,0.5,0.7,0.85];
  for(let i=0;i<chroma.length;i++) for(let j=i+1;j<chroma.length;j++){
    for(const r of ratios) for(const w of whiteSteps){
      const c=1-w;
      const parts=[{pigment:chroma[i],w:c*r},{pigment:chroma[j],w:c*(1-r)}];
      if(w>0) parts.push({pigment:white,w});
      evalMix(parts);
    }
  }
  // triads (coarse) + white — only if palette is small enough to stay fast
  if(chroma.length<=12){
    const tr=[0.33,0.5];
    for(let i=0;i<chroma.length;i++) for(let j=i+1;j<chroma.length;j++) for(let k=j+1;k<chroma.length;k++){
      for(const r of tr) for(const w of [0,0.35,0.7]){
        const c=1-w, a=c*r, rem=c-a;
        const parts=[{pigment:chroma[i],w:a},{pigment:chroma[j],w:rem*0.55},{pigment:chroma[k],w:rem*0.45}];
        if(w>0) parts.push({pigment:white,w});
        evalMix(parts);
      }
    }
  }

  results.sort((x,y)=>x.dE-y.dE);
  // dedupe by pigment set signature
  const seen=new Set(), out=[];
  for(const r of results){
    const sig=r.parts.map(p=>p.pigment.id).sort().join('+');
    if(seen.has(sig)) continue;
    seen.add(sig); out.push(finishRecipe(r, target));
    if(out.length>=maxResults) break;
  }
  return out;
}

function finishRecipe(r, targetLab){
  const total=r.parts.reduce((s,p)=>s+p.w,0);
  const parts=r.parts.map(p=>({ name:p.pigment.name, ci:p.pigment.ci, id:p.pigment.id, pct:Math.round(100*p.w/total) }))
    .sort((a,b)=>b.pct-a.pct);
  // normalise rounding to 100
  const drift=100-parts.reduce((s,p)=>s+p.pct,0); parts[0].pct+=drift;
  const props=mixProps(r.parts);
  const L=rgbToLab(r.rgb)[0];
  return {
    parts, rgb:r.rgb, dE:r.dE,
    value: Math.round((L/100)*10),               // 0 dark .. 10 light (Munsell-ish)
    temp: props.temp,
    tempLabel: props.temp>0.25?'Warm':props.temp<-0.25?'Cool':'Neutral',
    opacity: props.opacity,
    opacityLabel: props.opacity>0.75?'Opaque':props.opacity>0.45?'Semi-opaque':'Transparent',
    confidence: Math.max(5, Math.min(99, Math.round(100 - r.dE*3))),
  };
}
