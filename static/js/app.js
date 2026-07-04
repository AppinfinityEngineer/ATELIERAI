// Atelier AI — workspace application.
import { PIGMENTS, LIMITED_PALETTES, findRecipes, rgbToLab } from './pigments.js';
import * as IM from './imaging.js';

// ---------------- state ----------------
const S = {
  source: null,          // ImageData (working size)
  fullSource: null,      // original <img> for hi-res export
  module: 'original',
  mode: 'academic',
  paletteKey: 'academic',
  owned: new Set(LIMITED_PALETTES.academic.ids),
  valueSteps: 6, softness: 0,
  colourK: 12, saturation: 1, tempBias: 0, painterliness: 0.35,
  drawingMode: 'construction',
  overlay: 'none',       // grid | thirds | golden | none
  gridN: 4,
  zoom: 1, panX: 0, panY: 0,
  cache: {},             // module -> ImageData
  clusters: [],          // colour clusters w/ recipes
  lastMix: null,
  canvasSizeIn: [16, 20], // inches, for paint estimate
};

const MODES = {
  academic:   { label:'Academic Realism',  k:14, sat:0.95, temp:0,     vs:0, paint:0.3,  gamma:1,    palette:'academic' },
  renaissance:{ label:'High Renaissance',  k:12, sat:0.85, temp:0.1,   vs:8, paint:0.25, gamma:1.05, palette:'academic' },
  baroque:    { label:'Baroque',           k:10, sat:0.9,  temp:0.25,  vs:6, paint:0.3,  gamma:1.35, palette:'portrait' },
  dutch:      { label:'Dutch Golden Age',  k:11, sat:0.8,  temp:0.2,   vs:7, paint:0.3,  gamma:1.25, palette:'portrait' },
  atelier:    { label:'Classical Atelier', k:12, sat:0.9,  temp:0.05,  vs:9, paint:0.2,  gamma:1,    palette:'academic' },
  allaprima:  { label:'Alla Prima',        k:12, sat:1.05, temp:0.1,   vs:0, paint:0.7,  gamma:1,    palette:'full' },
  sargent:    { label:'Sargent',           k:11, sat:1.0,  temp:0.05,  vs:0, paint:0.8,  gamma:1.15, palette:'portrait' },
  sorolla:    { label:'Sorolla',           k:14, sat:1.2,  temp:0.3,   vs:0, paint:0.7,  gamma:0.95, palette:'landscape' },
  rembrandt:  { label:'Rembrandt',         k:9,  sat:0.75, temp:0.35,  vs:6, paint:0.4,  gamma:1.45, palette:'portrait' },
  caravaggio: { label:'Caravaggio',        k:8,  sat:0.8,  temp:0.2,   vs:5, paint:0.3,  gamma:1.7,  palette:'portrait' },
  bouguereau: { label:'Bouguereau',        k:14, sat:0.85, temp:0.1,   vs:10,paint:0.1,  gamma:1,    palette:'portrait' },
  velazquez:  { label:'Velázquez',         k:9,  sat:0.7,  temp:0.05,  vs:7, paint:0.5,  gamma:1.3,  palette:'apelles' },
  grisaille:  { label:'Grisaille',         k:9,  sat:0,    temp:0,     vs:9, paint:0.2,  gamma:1.1,  palette:'academic', tint:[0,0] },
  verdaccio:  { label:'Verdaccio',         k:9,  sat:0,    temp:0,     vs:9, paint:0.2,  gamma:1.1,  palette:'academic', tint:[-9,9] },
  zorn:       { label:'Limited · Zorn',    k:9,  sat:0.9,  temp:0.15,  vs:0, paint:0.4,  gamma:1.15, palette:'zorn' },
};

const MODULES = [
  { id:'original',  label:'Original',        group:'Reference' },
  { id:'preview',   label:'Painting Preview',group:'Reference' },
  { id:'value',     label:'Value Study',     group:'Values' },
  { id:'notan',     label:'Notan',           group:'Values' },
  { id:'light',     label:'Light Map',       group:'Values' },
  { id:'temp',      label:'Temperature Map', group:'Colour' },
  { id:'sat',       label:'Saturation Map',  group:'Colour' },
  { id:'palette',   label:'Virtual Palette', group:'Colour' },
  { id:'edges',     label:'Edge Hierarchy',  group:'Structure' },
  { id:'drawing',   label:'Drawing Guide',   group:'Structure' },
  { id:'brush',     label:'Brush Direction', group:'Structure' },
];

// ---------------- dom ----------------
const $ = s => document.querySelector(s);
const el = (t,c,html)=>{ const e=document.createElement(t); if(c)e.className=c; if(html!=null)e.innerHTML=html; return e; };
const viewport = $('#viewport');
const stage = $('#stage');
const ctx = stage.getContext('2d');
const overlayCanvas = $('#overlay');
const octx = overlayCanvas.getContext('2d');

// ---------------- boot ----------------
buildRail(); buildModeSelect(); buildInspector(); bindViewport(); bindTopbar();
showEmptyState(true);

function showEmptyState(on){ $('#empty').style.display = on?'grid':'none'; $('#stagewrap').style.visibility = on?'hidden':'visible'; }

// ---------------- image load ----------------
$('#file').addEventListener('change', e=>{ const f=e.target.files[0]; if(f) loadFile(f); });
$('#empty').addEventListener('click', ()=>$('#file').click());
['dragover','drop'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault()));
document.addEventListener('drop', e=>{ const f=e.dataTransfer?.files?.[0]; if(f&&f.type.startsWith('image/')) loadFile(f); });

function loadFile(f){
  const img=new Image();
  img.onload=()=>{
    S.fullSource=img;
    S.source=IM.fitImage(img,1400);
    S.cache={}; S.clusters=[]; S.lastMix=null; S.zoom=1; S.panX=S.panY=0;
    showEmptyState(false);
    setStatus(`${img.width}×${img.height}px loaded — analysing`);
    render(); analyseAsync();
  };
  img.src=URL.createObjectURL(f);
}

// ---------------- mode / preprocessing ----------------
function preprocessed(){
  const m=MODES[S.mode];
  const key='pre:'+S.mode;
  if(S.cache[key]) return S.cache[key];
  const id=IM.clone(S.source), d=id.data;
  const g=m.gamma||1;
  if(g!==1){ const lut=new Uint8ClampedArray(256); for(let i=0;i<256;i++) lut[i]=255*Math.pow(i/255,g);
    for(let i=0;i<d.length;i+=4){ d[i]=lut[d[i]]; d[i+1]=lut[d[i+1]]; d[i+2]=lut[d[i+2]]; } }
  S.cache[key]=id; return id;
}

function colourOpts(){
  const m=MODES[S.mode];
  return { k:S.colourK??m.k, saturation:S.saturation*m.sat, tempBias:S.tempBias+m.temp,
           valueSteps:m.vs, painterliness:S.painterliness*(0.4+m.paint) , tint:m.tint };
}

// ---------------- analysis ----------------
function analyseAsync(){
  setTimeout(()=>{
    const res=IM.colourStudy(preprocessed(), colourOpts());
    if(MODES[S.mode].tint){ applyTint(res.image, MODES[S.mode].tint); res.clusters.forEach(c=>{ c.rgb=tintRgb(c.rgb,MODES[S.mode].tint); }); }
    S.cache['preview:'+cacheSig()]=res.image;
    S.clusters=res.clusters.map(c=>({...c, recipes:findRecipes(c.rgb,[...S.owned],2)}));
    if(S.module==='preview'||S.module==='palette') render();
    renderPalettePanel();
    setStatus(`${S.clusters.length} colour families · ${MODES[S.mode].label}`);
  },16);
}
function applyTint(img,[a,b]){ const d=img.data;
  for(let i=0;i<d.length;i+=4){ const L=(0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]);
    const rgb=IM.labToRgb([L/255*100, a, b]); d[i]=rgb[0]; d[i+1]=rgb[1]; d[i+2]=rgb[2]; } }
function tintRgb(rgb,[a,b]){ const L=rgbToLab(rgb)[0]; return IM.labToRgb([L,a,b]); }

function cacheSig(){ return [S.mode,S.colourK,S.saturation,S.tempBias,S.painterliness].join('|'); }

function moduleImage(){
  const m=S.module, src=preprocessed();
  const sig = {
    original: 'original',
    preview:  'preview:'+cacheSig(),
    value:    `value:${S.mode}|${S.valueSteps}|${S.softness}`,
    notan:    `notan:${S.mode}`,
    light:    `light:${S.mode}`,
    temp:     'temp', sat:'sat',
    edges:    `edges:${S.mode}`,
    drawing:  `drawing:${S.mode}|${S.drawingMode}`,
    brush:    'brush-src',
    palette:  'preview:'+cacheSig(),
  }[m];
  if(S.cache[sig]) return S.cache[sig];
  let out;
  switch(m){
    case 'original': out=S.source; break;
    case 'value':    out=IM.valueStudy(src,S.valueSteps,S.softness); break;
    case 'notan':    out=IM.notan(src); break;
    case 'light':    out=IM.lightMap(src); break;
    case 'temp':     out=IM.temperatureMap(S.source); break;
    case 'sat':      out=IM.saturationMap(S.source); break;
    case 'edges':    out=IM.edgeHierarchy(src); break;
    case 'drawing':  out=IM.drawingGuide(src,S.drawingMode); break;
    case 'brush':    out=IM.valueStudy(src,0); break;
    case 'preview': case 'palette': {
      const r=IM.colourStudy(src,colourOpts());
      if(MODES[S.mode].tint) applyTint(r.image,MODES[S.mode].tint);
      out=r.image; break; }
    default: out=S.source;
  }
  S.cache[sig]=out; return out;
}

// ---------------- render ----------------
function render(){
  if(!S.source) return;
  const img=moduleImage();
  const vw=viewport.clientWidth, vh=viewport.clientHeight;
  const base=Math.min(vw/img.width, vh/img.height)*0.92;
  const scale=base*S.zoom;
  const w=img.width*scale, h=img.height*scale;
  stage.width=img.width; stage.height=img.height;
  overlayCanvas.width=img.width; overlayCanvas.height=img.height;
  ctx.putImageData(img,0,0);
  drawOverlays();
  const wrap=$('#stagewrap');
  wrap.style.width=w+'px'; wrap.style.height=h+'px';
  wrap.style.transform=`translate(${S.panX}px,${S.panY}px)`;
  if(S.module==='palette') renderVirtualPalette(); else $('#palettelay').style.display='none';
}

function drawOverlays(){
  const w=overlayCanvas.width,h=overlayCanvas.height;
  octx.clearRect(0,0,w,h);
  // brush direction strokes
  if(S.module==='brush' && S.source){
    const strokes=IM.brushDirection(preprocessed());
    octx.lineCap='round';
    for(const s of strokes){
      const dx=Math.cos(s.a)*s.len/2, dy=Math.sin(s.a)*s.len/2;
      octx.strokeStyle= s.v>140 ? 'rgba(201,162,39,.85)' : 'rgba(122,147,168,.85)';
      octx.lineWidth=Math.max(1.5, s.len/9);
      octx.beginPath(); octx.moveTo(s.x-dx,s.y-dy); octx.lineTo(s.x+dx,s.y+dy); octx.stroke();
    }
  }
  if(S.overlay==='none') return;
  octx.strokeStyle='rgba(201,162,39,.75)'; octx.lineWidth=Math.max(1,w/700);
  const line=(x1,y1,x2,y2)=>{ octx.beginPath(); octx.moveTo(x1,y1); octx.lineTo(x2,y2); octx.stroke(); };
  if(S.overlay==='grid'){ const n=S.gridN;
    for(let i=1;i<n;i++){ line(w*i/n,0,w*i/n,h); line(0,h*i/n,w,h*i/n); } }
  if(S.overlay==='thirds'){ for(const t of [1/3,2/3]){ line(w*t,0,w*t,h); line(0,h*t,w,h*t); } }
  if(S.overlay==='golden'){ const p=0.618;
    for(const t of [1-p,p]){ line(w*t,0,w*t,h); line(0,h*t,w,h*t); }
    // golden spiral hint
    octx.strokeStyle='rgba(201,162,39,.45)';
    let x=0,y=0,cw=w,chh=h;
    for(let i=0;i<7;i++){ const r=Math.min(cw,chh);
      octx.beginPath(); octx.arc(i%4<2? x+r : x+cw-r, i%4===0||i%4===3 ? y+r : y+chh-r, r, 0, Math.PI/2);
      octx.stroke();
      if(i%2===0){ x+= (i%4<2? r:0); cw-=r; } else { y+= (i%4===1? r:0); chh-=r; }
    }
  }
}

// ---------------- viewport interaction ----------------
function bindViewport(){
  let drag=null;
  viewport.addEventListener('pointerdown',e=>{ drag={x:e.clientX-S.panX,y:e.clientY-S.panY,moved:false}; viewport.setPointerCapture(e.pointerId); });
  viewport.addEventListener('pointermove',e=>{ if(!drag) return;
    const nx=e.clientX-drag.x, ny=e.clientY-drag.y;
    if(Math.hypot(nx-S.panX,ny-S.panY)>3) drag.moved=true;
    S.panX=nx; S.panY=ny; $('#stagewrap').style.transform=`translate(${S.panX}px,${S.panY}px)`; });
  viewport.addEventListener('pointerup',e=>{ const was=drag; drag=null; if(was&&!was.moved) pickMix(e); });
  viewport.addEventListener('wheel',e=>{ e.preventDefault();
    S.zoom=Math.min(12,Math.max(0.2,S.zoom*Math.exp(-e.deltaY*0.0012))); render(); },{passive:false});
  window.addEventListener('resize',render);
  $('#zoomin').onclick=()=>{S.zoom=Math.min(12,S.zoom*1.3);render();};
  $('#zoomout').onclick=()=>{S.zoom=Math.max(0.2,S.zoom/1.3);render();};
  $('#zoomfit').onclick=()=>{S.zoom=1;S.panX=S.panY=0;render();};
}

// ---------------- mixing engine (click anywhere) ----------------
function pickMix(e){
  if(!S.source) return;
  const rect=stage.getBoundingClientRect();
  const x=Math.floor((e.clientX-rect.left)/rect.width*stage.width);
  const y=Math.floor((e.clientY-rect.top)/rect.height*stage.height);
  if(x<0||y<0||x>=stage.width||y>=stage.height) return;
  // sample 3x3 from painting preview (or source)
  const img=S.module==='original'? S.source : moduleImage();
  let r=0,g=0,b=0,n=0;
  for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
    const xx=Math.min(img.width-1,Math.max(0,x+dx)), yy=Math.min(img.height-1,Math.max(0,y+dy));
    const i=(yy*img.width+xx)*4; r+=img.data[i]; g+=img.data[i+1]; b+=img.data[i+2]; n++;
  }
  const target=[r/n|0,g/n|0,b/n|0];
  const recipes=findRecipes(target,[...S.owned],3);
  S.lastMix={target,recipes,x,y};
  renderMixPanel();
  document.body.classList.add('mix-open');
}
$('#mixclose').onclick=()=>document.body.classList.remove('mix-open');

function renderMixPanel(){
  const box=$('#mixbody'); box.innerHTML='';
  if(!S.lastMix){ box.append(el('p','hint','Click anywhere on the image to get a paint recipe.')); return; }
  const {target,recipes}=S.lastMix;
  const head=el('div','mix-target');
  head.append(swatch(target,44));
  const first=recipes[0];
  head.append(el('div','mix-target-meta',
    `<strong>Value ${first?first.value:'–'} / 10</strong><span>${first?first.tempLabel:''} · ${first?first.opacityLabel:''}</span>`));
  box.append(head);
  recipes.forEach((rec,i)=>{
    const card=el('div','recipe');
    const title=el('div','recipe-head');
    title.append(swatch(rec.rgb,26), el('span','recipe-title', i===0?'Nearest mixture':'Alternative '+i),
      el('span','conf', rec.confidence+'%'));
    card.append(title);
    const rows=el('div','recipe-rows');
    rec.parts.forEach(p=>{
      const pg=PIGMENTS.find(q=>q.id===p.id);
      const row=el('div','recipe-row');
      row.append(swatch(pg.rgb,16), el('span','pname',`${p.name} <em>${p.ci}</em>`), el('span','pct',p.pct+'%'));
      const bar=el('div','bar'); bar.style.setProperty('--w',p.pct+'%');
      row.append(bar); rows.append(row);
    });
    card.append(rows);
    card.append(el('div','recipe-meta',`ΔE ${rec.dE.toFixed(1)} · ${rec.opacityLabel} · lay in ${rec.value>=6?'lights':'darks'} pass`));
    box.append(card);
  });
}
function swatch(rgb,size){ const s=el('span','swatch'); s.style.width=s.style.height=size+'px';
  s.style.background=`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`; return s; }

// ---------------- virtual palette ----------------
function renderVirtualPalette(){
  const lay=$('#palettelay'); lay.style.display='block';
  const c=$('#palettecanvas');
  const w=c.clientWidth*devicePixelRatio, h=c.clientHeight*devicePixelRatio;
  c.width=w; c.height=h;
  const x=c.getContext('2d');
  // glass
  const grd=x.createLinearGradient(0,0,w,h);
  grd.addColorStop(0,'#2b2620'); grd.addColorStop(0.5,'#3a332a'); grd.addColorStop(1,'#241f19');
  x.fillStyle=grd; x.fillRect(0,0,w,h);
  x.strokeStyle='rgba(237,228,211,.12)'; x.lineWidth=2; x.strokeRect(6,6,w-12,h-12);
  const cl=S.clusters.slice(0,14).sort((a,b)=>b.lab[0]-a.lab[0]); // light → dark mixing order
  const cols=Math.ceil(Math.sqrt(cl.length*1.6));
  cl.forEach((cluster,i)=>{
    const col=i%cols, row=(i/cols)|0;
    const px=(col+0.5)/cols*w, py=(row+0.6)/Math.ceil(cl.length/cols)*h*0.92;
    const rad=Math.max(14, Math.sqrt(cluster.share)* w*0.16);
    // paint pile with body
    const g=x.createRadialGradient(px-rad*0.3,py-rad*0.35,rad*0.1,px,py,rad);
    const [r,gg,b]=cluster.rgb;
    g.addColorStop(0,`rgb(${Math.min(255,r+38)},${Math.min(255,gg+38)},${Math.min(255,b+38)})`);
    g.addColorStop(0.75,`rgb(${r},${gg},${b})`);
    g.addColorStop(1,`rgb(${(r*0.55)|0},${(gg*0.55)|0},${(b*0.55)|0})`);
    x.fillStyle=g; x.beginPath();
    // irregular pile edge
    x.moveTo(px+rad,py);
    for(let a=0;a<=Math.PI*2+0.01;a+=Math.PI/14){
      const rr=rad*(0.92+0.1*Math.sin(a*3+i));
      x.lineTo(px+Math.cos(a)*rr, py+Math.sin(a)*rr);
    }
    x.closePath(); x.fill();
    // knife streak
    x.strokeStyle='rgba(255,255,255,.14)'; x.lineWidth=rad*0.16;
    x.beginPath(); x.moveTo(px-rad*0.5,py+rad*0.2); x.quadraticCurveTo(px,py-rad*0.1,px+rad*0.6,py+rad*0.05); x.stroke();
    cluster._pos=[px/devicePixelRatio,py/devicePixelRatio,rad/devicePixelRatio];
  });
  // hit handling
  c.onclick=ev=>{
    const rect=c.getBoundingClientRect();
    const mx=ev.clientX-rect.left,my=ev.clientY-rect.top;
    for(const cluster of cl){ const [px,py,rad]=cluster._pos||[];
      if(Math.hypot(mx-px,my-py)<rad){ S.lastMix={target:cluster.rgb,recipes:cluster.recipes.length?cluster.recipes:findRecipes(cluster.rgb,[...S.owned],3)};
        renderMixPanel(); document.body.classList.add('mix-open'); return; } }
  };
}

function renderPalettePanel(){
  const box=$('#families'); if(!box) return; box.innerHTML='';
  const area=S.canvasSizeIn[0]*S.canvasSizeIn[1];         // sq in
  const mlTotal=area*0.10;                                 // ~0.1 ml per sq in, one layer
  S.clusters.slice(0,14).forEach(c=>{
    const ml=(c.share*mlTotal);
    const row=el('div','family');
    row.append(swatch(c.rgb,22));
    const rec=c.recipes?.[0];
    row.append(el('div','family-meta',
      `<strong>${rec? rec.parts.map(p=>p.name.split(' ')[0]+' '+p.pct+'%').join(' · ') : '—'}</strong>
       <span>${(c.share*100).toFixed(1)}% of canvas · ≈ ${ml.toFixed(1)} ml</span>`));
    row.onclick=()=>{ S.lastMix={target:c.rgb,recipes:c.recipes}; renderMixPanel(); document.body.classList.add('mix-open'); };
    box.append(row);
  });
}

// ---------------- rail / topbar / inspector ----------------
function buildRail(){
  const rail=$('#rail'); let group='';
  MODULES.forEach(m=>{
    if(m.group!==group){ group=m.group; rail.append(el('div','rail-group',group)); }
    const b=el('button','rail-item',m.label); b.dataset.id=m.id;
    if(m.id===S.module) b.classList.add('active');
    b.onclick=()=>{ S.module=m.id;
      rail.querySelectorAll('.rail-item').forEach(x=>x.classList.toggle('active',x.dataset.id===m.id));
      buildInspector(); render(); };
    rail.append(b);
  });
}

function buildModeSelect(){
  const sel=$('#mode');
  Object.entries(MODES).forEach(([k,m])=>{ const o=el('option','',m.label); o.value=k; sel.append(o); });
  sel.value=S.mode;
  sel.onchange=()=>{ S.mode=sel.value; S.cache={};
    setPalette(MODES[S.mode].palette);
    render(); analyseAsync(); buildInspector(); };
}

function setPalette(key){
  S.paletteKey=key; S.owned=new Set(LIMITED_PALETTES[key].ids);
}

function bindTopbar(){
  $('#exportpng').onclick=exportPNG;
  $('#exportpdf').onclick=exportPDF;
}

function buildInspector(){
  const box=$('#controls'); box.innerHTML='';
  const add=(...n)=>n.forEach(x=>box.append(x));
  const slider=(label,min,max,step,val,fn,fmt)=>{
    const w=el('div','ctl');
    w.append(el('label','',label));
    const row=el('div','ctl-row');
    const inp=el('input'); inp.type='range'; inp.min=min; inp.max=max; inp.step=step; inp.value=val;
    const out=el('span','ctl-val',fmt?fmt(val):val);
    inp.oninput=()=>{ const v=parseFloat(inp.value); out.textContent=fmt?fmt(v):v; fn(v); };
    row.append(inp,out); w.append(row); return w;
  };
  const seg=(label,options,val,fn)=>{
    const w=el('div','ctl'); w.append(el('label','',label));
    const row=el('div','seg');
    options.forEach(([v,txt])=>{ const b=el('button','',txt); if(v===val)b.classList.add('on');
      b.onclick=()=>{ row.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); fn(v); };
      row.append(b); });
    w.append(row); return w;
  };
  const invalidate=(prefix)=>{ for(const k of Object.keys(S.cache)) if(k.startsWith(prefix)) delete S.cache[k]; };

  if(S.module==='value'){
    add(slider('Value groups',2,12,1,S.valueSteps,v=>{S.valueSteps=v;invalidate('value:');render();}),
        slider('Transition softness',0,1,0.05,S.softness,v=>{S.softness=v;invalidate('value:');render();},v=>v.toFixed(2)),
        histogramCtl());
  }
  if(S.module==='preview'||S.module==='palette'){
    add(slider('Colour complexity',4,20,1,S.colourK,v=>{S.colourK=v;invalidate('preview:');render();analyseAsync();}),
        slider('Saturation',0,1.6,0.05,S.saturation,v=>{S.saturation=v;invalidate('preview:');render();analyseAsync();},v=>v.toFixed(2)),
        slider('Temperature',-0.6,0.6,0.05,S.tempBias,v=>{S.tempBias=v;invalidate('preview:');render();analyseAsync();},v=>v>0?'+'+v.toFixed(2):v.toFixed(2)),
        slider('Painterliness',0,1,0.05,S.painterliness,v=>{S.painterliness=v;invalidate('preview:');render();analyseAsync();},v=>v.toFixed(2)));
  }
  if(S.module==='drawing'){
    add(seg('Guide type',[['construction','Construction'],['contour','Contour'],['gesture','Gesture'],['shadowshapes','Shadow shapes']],
      S.drawingMode,v=>{S.drawingMode=v;invalidate('drawing:');render();}));
  }
  if(['drawing','original','preview','value'].includes(S.module)){
    add(seg('Overlay',[['none','None'],['grid','Grid'],['thirds','Thirds'],['golden','Golden']],S.overlay,v=>{S.overlay=v;render();}));
    if(S.overlay==='grid') add(slider('Grid divisions',2,10,1,S.gridN,v=>{S.gridN=v;render();}));
  }
  if(S.module==='palette'){
    add(el('div','ctl-note','Piles are sized by coverage and ordered light → dark — the efficient mixing order. Click a pile for its recipe.'));
    const fam=el('div'); fam.id='families'; add(el('label','ctl-label','Colour families & paint estimate'),fam);
    add(seg('Canvas size',[['12x16','12×16″'],['16x20','16×20″'],['24x30','24×30″'],['30x40','30×40″']],
      S.canvasSizeIn.join('x'),v=>{S.canvasSizeIn=v.split('x').map(Number);renderPalettePanel();}));
  }
  // master palette (always available)
  add(el('label','ctl-label','Master palette'));
  const psel=el('select','select');
  Object.entries(LIMITED_PALETTES).forEach(([k,p])=>{ const o=el('option','',p.name); o.value=k; psel.append(o); });
  psel.value=S.paletteKey;
  psel.onchange=()=>{ setPalette(psel.value); buildInspector(); analyseAsync(); };
  add(psel);
  const grid=el('div','pigment-grid');
  PIGMENTS.forEach(p=>{
    const b=el('button','pigment'+(S.owned.has(p.id)?' owned':''));
    b.title=`${p.name} · ${p.ci}`;
    b.append(swatch(p.rgb,18), el('span','',p.name.replace(' (Cremnitz)','').replace(' (Genuine hue)','').replace(' (Quin.)','')));
    b.onclick=()=>{ S.owned.has(p.id)? S.owned.delete(p.id) : S.owned.add(p.id);
      b.classList.toggle('owned'); analyseAsync(); if(S.lastMix){ S.lastMix.recipes=findRecipes(S.lastMix.target,[...S.owned],3); renderMixPanel(); } };
    grid.append(b);
  });
  add(grid);
  if(S.clusters.length && S.module==='palette') renderPalettePanel();
}

function histogramCtl(){
  const w=el('div','ctl'); w.append(el('label','','Value histogram'));
  const c=el('canvas','hist'); c.width=260; c.height=64; w.append(c);
  if(S.source){ const bins=IM.histogram(S.source); const x=c.getContext('2d');
    x.fillStyle='#c9a227';
    bins.forEach((v,i)=>x.fillRect(i*(260/64),64-v*60,260/64-1,v*60)); }
  return w;
}

function setStatus(t){ $('#status').textContent=t; }

// ---------------- export ----------------
function sheet(title, img, note){
  const W=1600, H=2100, c=IM.makeCanvas(W,H), x=c.getContext('2d');
  x.fillStyle='#f3eee2'; x.fillRect(0,0,W,H);
  x.fillStyle='#1d1712'; x.font='600 26px Inter, sans-serif';
  x.fillText('ATELIER AI', 90, 110);
  x.font='42px Cormorant Garamond, serif'; x.fillText(title, 90, 168);
  x.strokeStyle='#c9a227'; x.lineWidth=3; x.beginPath(); x.moveTo(90,196); x.lineTo(W-90,196); x.stroke();
  const maxW=W-180, maxH=H-460;
  const s=Math.min(maxW/img.width, maxH/img.height);
  const iw=img.width*s, ih=img.height*s;
  const tmp=IM.makeCanvas(img.width,img.height); tmp.getContext('2d').putImageData(img,0,0);
  x.drawImage(tmp,(W-iw)/2,240,iw,ih);
  x.font='24px Inter, sans-serif'; x.fillStyle='#5c4a32';
  wrapText(x, note, 90, 280+ih, W-180, 34);
  return c;
}
function wrapText(x,text,px,py,maxw,lh){ const words=text.split(' '); let line='';
  for(const wd of words){ const t=line+wd+' ';
    if(x.measureText(t).width>maxw){ x.fillText(line,px,py); line=wd+' '; py+=lh; } else line=t; }
  x.fillText(line,px,py); }

function pigmentSheet(){
  const W=1600,H=2100,c=IM.makeCanvas(W,H),x=c.getContext('2d');
  x.fillStyle='#f3eee2'; x.fillRect(0,0,W,H);
  x.fillStyle='#1d1712'; x.font='600 26px Inter'; x.fillText('ATELIER AI',90,110);
  x.font='42px Cormorant Garamond, serif'; x.fillText('Mixing recipes — '+MODES[S.mode].label,90,168);
  x.strokeStyle='#c9a227'; x.lineWidth=3; x.beginPath(); x.moveTo(90,196); x.lineTo(W-90,196); x.stroke();
  let y=280;
  S.clusters.slice(0,12).forEach((cl,i)=>{
    const r=cl.recipes?.[0]; if(!r) return;
    x.fillStyle=`rgb(${cl.rgb[0]},${cl.rgb[1]},${cl.rgb[2]})`;
    x.fillRect(90,y-40,110,110);
    x.strokeStyle='#1d171233'; x.strokeRect(90,y-40,110,110);
    x.fillStyle='#1d1712'; x.font='600 28px Inter';
    x.fillText(`Family ${i+1} — value ${r.value}/10, ${r.tempLabel.toLowerCase()}, ${(cl.share*100).toFixed(1)}% of canvas`,230,y);
    x.font='26px Inter'; x.fillStyle='#3a2f22';
    x.fillText(r.parts.map(p=>`${p.name} ${p.pct}%`).join('  +  '),230,y+42);
    x.fillStyle='#5c4a32'; x.font='22px Inter';
    x.fillText(`${r.opacityLabel} · confidence ${r.confidence}%`,230,y+78);
    y+=150; if(y>H-120) return;
  });
  return c;
}

function buildSheets(){
  const src=preprocessed();
  return [
    sheet('Reference', S.source, 'Working reference at analysis resolution.'),
    sheet('Value study — '+S.valueSteps+' groups', IM.valueStudy(src,S.valueSteps,S.softness),
      'Squint and mass the shadow family first. Hold every value inside its group; save the top group for true highlights only.'),
    sheet('Notan', IM.notan(src), 'Two-value composition check. If the design fails here, no colour will rescue it.'),
    sheet('Drawing guide', IM.drawingGuide(src,'construction'),
      'Transfer with a grid or projector. Commit shadow shapes before any modelling.'),
    sheet('Painting preview — '+MODES[S.mode].label, moduleImageFor('preview'),
      'Colour families compressed for the selected mode. Match mixtures to the recipe sheet.'),
    sheet('Edge hierarchy', IM.edgeHierarchy(src),
      'White = hard, gold = soft, blue = lost. Spend hard edges only at the focal point.'),
    pigmentSheet(),
  ];
}
function moduleImageFor(id){ const keep=S.module; S.module=id; const img=moduleImage(); S.module=keep; return img; }

function exportPNG(){
  if(!S.source) return;
  const img=moduleImage();
  const c=IM.makeCanvas(img.width,img.height); c.getContext('2d').putImageData(img,0,0);
  c.getContext('2d').drawImage(overlayCanvas,0,0);
  c.toBlob(b=>download(b,`atelier-${S.module}.png`));
}
async function exportPDF(){
  if(!S.source) return;
  setStatus('Building PDF pack…');
  if(!window.jspdf) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const sheets=buildSheets();
  sheets.forEach((c,i)=>{ if(i>0) doc.addPage();
    doc.addImage(c.toDataURL('image/jpeg',0.9),'JPEG',0,0,210,275); });
  doc.save('atelier-painting-plan.pdf');
  setStatus('PDF pack exported');
}
function loadScript(src){ return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.append(s); }); }
function download(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }
