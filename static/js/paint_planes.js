// Atelier AI — paint plane abstraction engine.
// This module deliberately moves away from photo pixels and toward paintable planes.
// It finds local value/chroma families, merges small photographic noise, and outputs
// clear regions an oil painter can reproduce on canvas.

const clamp = (v, min=0, max=255) => Math.max(min, Math.min(max, v));
const idx = (x,y,w)=>(y*w+x)*4;
const lum = (r,g,b)=>0.2126*r + 0.7152*g + 0.0722*b;
const sat = (r,g,b)=>{ const mx=Math.max(r,g,b), mn=Math.min(r,g,b); return mx===0?0:(mx-mn)/mx; };
const cloneImage = (img)=>new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);

function profileRules(profile){
  const key=((profile?.title||'')+' '+(profile?.era||'')).toLowerCase();
  const r={
    valueBands: 7,
    block: 7,
    merge: .42,
    boundary: .42,
    skinProtect: .45,
    hairMass: .50,
    shadowFamily: .45,
    planeContrast: .18,
    label: 'Paint planes'
  };
  if(key.includes('caravaggio')) Object.assign(r,{valueBands:4, block:13, merge:.72, boundary:.70, skinProtect:.34, hairMass:.86, shadowFamily:.90, planeContrast:.34, label:'Caravaggio planes'});
  else if(key.includes('rembrandt')) Object.assign(r,{valueBands:5, block:11, merge:.66, boundary:.56, skinProtect:.42, hairMass:.78, shadowFamily:.82, planeContrast:.26, label:'Rembrandt planes'});
  else if(key.includes('sargent')) Object.assign(r,{valueBands:6, block:15, merge:.58, boundary:.44, skinProtect:.38, hairMass:.66, shadowFamily:.50, planeContrast:.22, label:'Sargent broad strokes'});
  else if(key.includes('sorolla')) Object.assign(r,{valueBands:7, block:13, merge:.46, boundary:.34, skinProtect:.42, hairMass:.54, shadowFamily:.30, planeContrast:.18, label:'Sorolla light planes'});
  else if(key.includes('bouguereau')) Object.assign(r,{valueBands:10, block:5, merge:.25, boundary:.18, skinProtect:.72, hairMass:.36, shadowFamily:.24, planeContrast:.08, label:'Bouguereau subtle planes'});
  else if(key.includes('velazquez')) Object.assign(r,{valueBands:6, block:13, merge:.56, boundary:.42, skinProtect:.38, hairMass:.70, shadowFamily:.58, planeContrast:.20, label:'Velazquez economy'});
  else if(key.includes('alla')) Object.assign(r,{valueBands:6, block:15, merge:.56, boundary:.38, skinProtect:.34, hairMass:.62, shadowFamily:.42, planeContrast:.20, label:'Alla prima planes'});
  else if(key.includes('renaissance')) Object.assign(r,{valueBands:8, block:7, merge:.34, boundary:.24, skinProtect:.62, hairMass:.42, shadowFamily:.34, planeContrast:.12, label:'Renaissance form planes'});
  return r;
}

function isLikelySkin(r,g,b){
  // broad heuristic only: identifies warm low-to-mid chroma flesh families without naming identity.
  return r>70 && g>45 && b>35 && r>g*1.04 && g>b*.82 && sat(r,g,b)>.10 && sat(r,g,b)<.58;
}

function sampleAvg(src,w,h,cx,cy,rad){
  let r=0,g=0,b=0,n=0;
  for(let y=cy-rad;y<=cy+rad;y++) for(let x=cx-rad;x<=cx+rad;x++){
    if(x<0||y<0||x>=w||y>=h) continue;
    const p=idx(x,y,w); r+=src[p]; g+=src[p+1]; b+=src[p+2]; n++;
  }
  return [r/n,g/n,b/n];
}

function edgeAmount(src,w,h,x,y){
  const pL=idx(Math.max(0,x-1),y,w), pR=idx(Math.min(w-1,x+1),y,w);
  const pU=idx(x,Math.max(0,y-1),w), pD=idx(x,Math.min(h-1,y+1),w);
  const lx=lum(src[pR],src[pR+1],src[pR+2])-lum(src[pL],src[pL+1],src[pL+2]);
  const ly=lum(src[pD],src[pD+1],src[pD+2])-lum(src[pU],src[pU+1],src[pU+2]);
  return Math.min(1, Math.sqrt(lx*lx+ly*ly)/90);
}

export function paintPlaneAbstraction(img, profile, strength=.72){
  const rules=profileRules(profile);
  const out=cloneImage(img);
  const w=img.width,h=img.height,d=out.data,src=new Uint8ClampedArray(img.data);
  const block=Math.max(3, Math.round(rules.block));
  const bands=rules.valueBands;

  // Pass 1: local plane colour averaging. This removes tiny photo detail but keeps key boundaries.
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const p=idx(x,y,w);
      const R=src[p],G=src[p+1],B=src[p+2];
      const L=lum(R,G,B), edge=edgeAmount(src,w,h,x,y);
      const skin=isLikelySkin(R,G,B);
      const shadow=Math.max(0,(58-L)/58);
      const cx=Math.round(x/block)*block, cy=Math.round(y/block)*block;
      const rad=Math.max(1, Math.round(block*(0.35 + rules.merge*.55)*(1-edge*.55)));
      let [ar,ag,ab]=sampleAvg(src,w,h,cx,cy,rad);

      // Compress values into paintable families, stronger in shadow/hair/background.
      let targetL=lum(ar,ag,ab);
      const band=Math.round((targetL/255)*(bands-1))/(bands-1);
      const bandL=band*255;
      const valueMix=(rules.merge*.45 + rules.shadowFamily*shadow*.35) * strength;
      const ratio=targetL>1 ? bandL/targetL : 1;
      ar = ar*(1-valueMix) + ar*ratio*valueMix;
      ag = ag*(1-valueMix) + ag*ratio*valueMix;
      ab = ab*(1-valueMix) + ab*ratio*valueMix;

      // Preserve enough flesh modelling for portrait planes, but still remove photo noise.
      let m = rules.merge * strength * (1 - edge*0.45);
      if(skin) m *= (1 - rules.skinProtect*.55);
      if(shadow>.42 && !skin) m = Math.min(.92, m + rules.hairMass*shadow*.35);
      d[p]=clamp(R*(1-m)+ar*m);
      d[p+1]=clamp(G*(1-m)+ag*m);
      d[p+2]=clamp(B*(1-m)+ab*m);
    }
  }

  // Pass 2: plane boundary design. Boundaries are not outlines; they are where paint mixtures change.
  const mid=new Uint8ClampedArray(d);
  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){
      const p=idx(x,y,w);
      const e=edgeAmount(mid,w,h,x,y);
      if(e<.18) continue;
      const L=lum(mid[p],mid[p+1],mid[p+2]);
      const shadow=Math.max(0,(68-L)/68);
      const boundary=rules.boundary*strength*Math.min(1,e*1.6);
      const dark=18*boundary*(.45+shadow);
      d[p]=clamp(mid[p]-dark);
      d[p+1]=clamp(mid[p+1]-dark*.92);
      d[p+2]=clamp(mid[p+2]-dark*.82);
    }
  }

  // Pass 3: form-plane modulation: broad light/dark faces, useful for canvas translation.
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const p=idx(x,y,w);
      const plane=(Math.sin(x/(block*1.7))+Math.cos(y/(block*1.45)))*0.5;
      const L=lum(d[p],d[p+1],d[p+2]);
      const visible=(L>38&&L<232)?1:0;
      const shift=plane*rules.planeContrast*strength*18*visible;
      d[p]=clamp(d[p]+shift);
      d[p+1]=clamp(d[p+1]+shift*.96);
      d[p+2]=clamp(d[p+2]+shift*.90);
    }
  }
  return out;
}

export function paintPlaneMap(img, profile){
  const rules=profileRules(profile);
  const w=img.width,h=img.height,src=img.data;
  const out=new ImageData(w,h), d=out.data;
  const colours=[
    [22,18,15], [55,43,34], [84,66,50], [118,95,72], [153,126,93],
    [183,157,120], [211,190,152], [232,222,194], [245,239,219], [255,252,238]
  ];
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const p=idx(x,y,w), L=lum(src[p],src[p+1],src[p+2]);
      const band=Math.max(0,Math.min(rules.valueBands-1,Math.round((L/255)*(rules.valueBands-1))));
      const c=colours[Math.round(band*(colours.length-1)/(rules.valueBands-1))];
      const e=edgeAmount(src,w,h,x,y);
      const line=e>.22 ? 1 : 0;
      d[p]=clamp(c[0]-line*42); d[p+1]=clamp(c[1]-line*36); d[p+2]=clamp(c[2]-line*30); d[p+3]=255;
    }
  }
  return paintPlaneAbstraction(out, profile, .35);
}

export function paintPlaneNotes(profile){
  const r=profileRules(profile);
  return {
    title: r.label,
    body: `${r.valueBands} paintable value families. Block size ${r.block}. Stronger boundaries mark where the painter should change mixture, edge, or brush direction.`,
    steps: ['Squint and mass the largest planes first','Paint each plane as one clean mixture','Lose tiny photographic texture inside shadows','Only sharpen edges at the focal structure','Finish with small accents after the big planes read']
  };
}
