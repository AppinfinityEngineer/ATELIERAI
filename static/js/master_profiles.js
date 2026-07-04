// Atelier AI - master painting profiles.
import { rgbToLab } from './pigments.js';
import { labToRgb } from './imaging.js';

export const MASTER_PROFILES = {
  academic: { title:'Academic Realism', era:'19th century atelier', summary:'Balanced modelling, clean halftones, controlled chroma, accurate drawing and polished finish.', values:'7-9 value families; do not over-crush shadows.', edges:'Hardest accents around the focal feature; soft cheek, hair and background transitions.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Sienna, Ultramarine Blue, Cadmium Red Light.', steps:['Burnt umber drawing','Thin local-colour block-in','Model large light/shadow families','Refine halftones','Reserve sharp accents for the final pass'], ground:[37,31,24], groundBlend:.08, contrast:1.04, chroma:.92, shadowWarm:.04, lightWarm:.02, valueClamp:[5,96], texture:.06 },
  renaissance: { title:'High Renaissance', era:'Leonardo / Raphael logic', summary:'Sfumato transitions, restrained chroma, warm skin, quiet shadows and idealised form.', values:'6-8 value families with gentle midtone transitions.', edges:'Very soft facial planes; hard edges only at silhouettes, eyelids and key drawing accents.', palette:'Lead/Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Vermilion/Cadmium Red, Ultramarine.', steps:['Warm imprimatura','Accurate contour drawing','Thin umber/value block','Softly glaze colour','Feather transitions with dry brush'], ground:[72,55,36], groundBlend:.16, contrast:.96, chroma:.78, shadowWarm:.12, lightWarm:.03, valueClamp:[10,94], texture:.03, sfumato:.28 },
  baroque: { title:'Baroque', era:'dramatic 17th century studio', summary:'Large shadow masses, theatrical light, warm flesh, deep browns and strong focal contrast.', values:'5-7 value families; big shadow mass first.', edges:'Sharp accents at the lit focal point; shadows merge into broad lost edges.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Burnt Sienna, Cadmium Red Light, Ultramarine.', steps:['Tone canvas dark warm','Mass shadows as one shape','Place highest light early','Build warm halftones','Glaze dark passages and sharpen final accents'], ground:[45,29,18], groundBlend:.22, contrast:1.22, chroma:.82, shadowWarm:.18, lightWarm:.08, valueClamp:[2,98], texture:.07 },
  dutch: { title:'Dutch Golden Age', era:'Rembrandt school / Vermeer restraint', summary:'Earth pigments, quiet colour, luminous lights and disciplined dark masses.', values:'6-8 grouped values with controlled highlights.', edges:'Lost background edges, crisp jewellery/fabric/eye accents.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Burnt Sienna, Ultramarine, Ivory Black.', steps:['Warm brown ground','Transparent dark block-in','Opaque lights','Glazed middle notes','Final small highlight accents'], ground:[52,39,26], groundBlend:.20, contrast:1.16, chroma:.70, shadowWarm:.16, lightWarm:.04, valueClamp:[3,96], texture:.06 },
  atelier: { title:'Classical Atelier', era:'modern atelier method', summary:'Drawing-first realism with separated light/shadow families and clean practical mixtures.', values:'7-10 values; group shadow families before detail.', edges:'Hierarchy-led: focal hard edges, form soft edges, background lost edges.', palette:'Titanium White, Yellow Ochre, Burnt Sienna, Raw Umber, Ultramarine Blue, Cadmium Red Light.', steps:['Envelope drawing','Shadow-shape map','Dead-colour block-in','Turn form with halftones','Finish focal accents only'], ground:[42,34,27], groundBlend:.10, contrast:1.06, chroma:.88, shadowWarm:.06, lightWarm:.02, valueClamp:[5,97], texture:.04 },
  allaprima: { title:'Alla Prima', era:'direct painting', summary:'Wet-into-wet, broad colour notes, visible brushwork and fewer mixtures.', values:'5-7 larger value notes; avoid over-modelling.', edges:'Painterly variety; fresh hard notes over broader soft masses.', palette:'Titanium White, Cadmium Yellow Light, Yellow Ochre, Cadmium Red Light, Alizarin Crimson, Ultramarine, Viridian.', steps:['Big colour notes','Paint darks thin','Paint lights thicker','Merge wet edges','Add final calligraphic strokes'], ground:[48,41,32], groundBlend:.12, contrast:1.02, chroma:1.04, shadowWarm:.04, lightWarm:.04, valueClamp:[6,98], texture:.14 },
  sargent: { title:'Sargent', era:'bravura portrait logic', summary:'Economical value masses, confident dark accents, creamy lights and decisive brush placement.', values:'5-7 major value statements; avoid small equal-detail patches.', edges:'Sharp calligraphic accents surrounded by broad soft simplification.', palette:'Titanium White, Yellow Ochre, Cadmium Red Light, Alizarin Crimson, Raw Umber, Ultramarine, Ivory Black.', steps:['Draw with loaded brush','Block large shadow shapes','Place temperature notes','Drag thick lights over form','Stop before overworking'], ground:[40,35,30], groundBlend:.10, contrast:1.12, chroma:.94, shadowWarm:.05, lightWarm:.03, valueClamp:[4,99], texture:.16 },
  sorolla: { title:'Sorolla', era:'sunlit Spanish impression', summary:'High-key light, warm sun, cool shadows, lively chroma and outdoor freshness.', values:'6-8 values but lifted shadows; protect bright light.', edges:'Soft atmospheric backgrounds; crisp sunlit accents.', palette:'Titanium White, Cadmium Yellow Light, Yellow Ochre, Cadmium Red Light, Ultramarine, Cobalt Blue, Viridian.', steps:['High-key block-in','Keep shadows colourful','Paint light thick and warm','Cool reflected notes','Finish with sparkling accents'], ground:[74,63,45], groundBlend:.08, contrast:.96, chroma:1.15, shadowWarm:-.06, lightWarm:.16, valueClamp:[16,100], texture:.12 },
  rembrandt: { title:'Rembrandt', era:'Dutch chiaroscuro', summary:'Deep warm darks, luminous flesh, restrained colour and glowing impasto lights.', values:'4-6 dominant value masses; lights emerge from darkness.', edges:'Most edges disappear into shadow; facial focal accents are sharp and thick.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Burnt Sienna, Transparent Oxide Red, Ultramarine, Ivory Black.', steps:['Dark warm imprimatura','Transparent shadow masses','Opaque warm flesh lights','Scumble halftones','Final impasto highlights'], ground:[34,22,14], groundBlend:.30, contrast:1.34, chroma:.72, shadowWarm:.24, lightWarm:.10, valueClamp:[1,97], texture:.09 },
  caravaggio: { title:'Caravaggio', era:'tenebrism', summary:'Extreme light-versus-dark structure, simplified colour and a dramatic stage-lit focal point.', values:'3-5 huge value families; shadows must stay unified.', edges:'Knife-sharp light-side accents; almost all background edges lost.', palette:'Titanium White, Yellow Ochre, Raw Umber, Burnt Umber, Burnt Sienna, Cadmium Red Light, Ivory Black.', steps:['Decide the single light source','Mass all darks together','Carve the lit form','Keep background quiet','Add few brilliant accents'], ground:[25,17,12], groundBlend:.34, contrast:1.55, chroma:.68, shadowWarm:.20, lightWarm:.12, valueClamp:[0,99], texture:.07 },
  bouguereau: { title:'Bouguereau', era:'French academic finish', summary:'Silky modelling, accurate anatomy, pearly lights, delicate transitions and polished surfaces.', values:'8-10 subtle value families; no harsh posterisation.', edges:'Soft internal modelling; clean contours and carefully placed accents.', palette:'Titanium White, Naples Yellow, Yellow Ochre, Cadmium Red Light, Alizarin Crimson, Raw Umber, Ultramarine.', steps:['Precise drawing','Smooth dead-colour layer','Thin glazes','Opaque flesh lights','Final polished transitions'], ground:[66,55,43], groundBlend:.10, contrast:.92, chroma:.74, shadowWarm:.08, lightWarm:.05, valueClamp:[12,98], texture:.02, sfumato:.34 },
  velazquez: { title:'Velazquez', era:'Spanish economy', summary:'Muted earth colour, large simple planes, optical brush notes and restrained detail.', values:'5-7 honest values with broad plane simplification.', edges:'Loose outer edges, precise small accents at the focus.', palette:'Titanium White, Yellow Ochre, Raw Sienna, Burnt Umber, Raw Umber, Ultramarine, Ivory Black.', steps:['Thin earth block-in','Large planes first','Muted colour notes','Broken brush accents','Leave secondary areas unresolved'], ground:[50,42,32], groundBlend:.18, contrast:1.12, chroma:.62, shadowWarm:.08, lightWarm:.02, valueClamp:[5,96], texture:.13 },
  grisaille: { title:'Grisaille', era:'monochrome underpainting', summary:'Pure value training with no colour distraction; ideal for drawing and form accuracy.', values:'7-10 value families; focus on form turning.', edges:'Use full edge hierarchy without chroma.', palette:'Titanium White, Raw Umber or Ivory Black.', steps:['Tone the canvas','Draw accurately','Mass shadow','Model form in grey values','Use as finished study or underpainting'], ground:[45,43,40], groundBlend:.10, contrast:1.08, chroma:0, shadowWarm:0, lightWarm:0, valueClamp:[4,96], texture:.04 },
  verdaccio: { title:'Verdaccio', era:'green earth flesh underpainting', summary:'Cool greenish underpainting that supports later warm flesh glazes.', values:'7-9 value families in cool green-grey.', edges:'Soft internal form; keep drawing clear.', palette:'Titanium White, Yellow Ochre, Raw Umber, Viridian or Green Earth, Burnt Sienna.', steps:['Warm/cool ground','Green-grey form modelling','Dry fully','Glaze warm flesh over top','Reclaim highlights opaquely'], ground:[50,54,43], groundBlend:.22, contrast:1.04, chroma:.38, shadowWarm:-.12, lightWarm:-.04, valueClamp:[7,95], texture:.03 },
  zorn: { title:'Zorn Limited Palette', era:'four-colour discipline', summary:'White, yellow ochre, red and black force disciplined temperature and value control.', values:'5-7 value families; colour variety comes from temperature, not tube count.', edges:'Bold economical edges and simple masses.', palette:'Titanium White, Yellow Ochre, Cadmium Red Light, Ivory Black.', steps:['Mix full value string first','Paint shadows thin','Control orange/grey temperature','Reserve clean white mixes','Use black as cool blue substitute'], ground:[54,43,32], groundBlend:.18, contrast:1.10, chroma:.72, shadowWarm:.02, lightWarm:.04, valueClamp:[4,97], texture:.08 }
};


function clamp(v,min=0,max=255){ return Math.max(min, Math.min(max, v)); }
function noise(x,y){ const n=Math.sin(x*12.9898 + y*78.233) * 43758.5453; return n - Math.floor(n); }
function lum(r,g,b){ return 0.2126*r + 0.7152*g + 0.0722*b; }
function idx(x,y,w){ return (y*w+x)*4; }
function sample(buf,w,h,x,y,c){ x=clamp(x|0,0,w-1); y=clamp(y|0,0,h-1); return buf[idx(x,y,w)+c]; }
function profileOilRules(profile){
  const title=(profile?.title||'').toLowerCase();
  const era=(profile?.era||'').toLowerCase();
  const key=title+' '+era;
  const rules={
    stroke: 7,
    smear: .30,
    edgeKeep: .55,
    edgeLoss: .36,
    canvas: .018,
    impasto: .30,
    glaze: .20,
    scumble: .10,
    directionBias: 0,
    shadowMerge: .28,
    fleshPlane: .18,
    finalAccent: .20,
    wet: .42,
    ridge: .30,
    varnish: .22,
    bristle: .36,
    body: .32,
  };
  if(key.includes('caravaggio')) Object.assign(rules,{stroke:12,smear:.42,edgeKeep:.88,edgeLoss:.78,canvas:.008,impasto:.36,glaze:.50,shadowMerge:.84,finalAccent:.42,directionBias:.18,wet:.56,ridge:.38,varnish:.34,bristle:.40,body:.42});
  else if(key.includes('rembrandt')) Object.assign(rules,{stroke:9,smear:.36,edgeKeep:.66,edgeLoss:.72,canvas:.010,impasto:.58,glaze:.64,shadowMerge:.76,scumble:.14,finalAccent:.44,directionBias:.12,wet:.52,ridge:.56,varnish:.42,bristle:.34,body:.50});
  else if(key.includes('sargent')) Object.assign(rules,{stroke:17,smear:.58,edgeKeep:.76,edgeLoss:.44,canvas:.020,impasto:.52,glaze:.08,scumble:.22,finalAccent:.34,directionBias:.38,wet:.50,ridge:.50,varnish:.24,bristle:.58,body:.56});
  else if(key.includes('sorolla')) Object.assign(rules,{stroke:15,smear:.52,edgeKeep:.56,edgeLoss:.30,canvas:.010,impasto:.48,glaze:.04,scumble:.30,finalAccent:.36,directionBias:.48,wet:.54,ridge:.46,varnish:.22,bristle:.60,body:.52});
  else if(key.includes('bouguereau')) Object.assign(rules,{stroke:4,smear:.16,edgeKeep:.46,edgeLoss:.20,canvas:.010,impasto:.10,glaze:.34,scumble:.03,finalAccent:.08,directionBias:.02,wet:.24,ridge:.08,varnish:.18,bristle:.10,body:.14});
  else if(key.includes('velazquez')) Object.assign(rules,{stroke:15,smear:.54,edgeKeep:.62,edgeLoss:.42,canvas:.010,impasto:.34,glaze:.16,scumble:.22,finalAccent:.28,directionBias:.32,wet:.44,ridge:.34,varnish:.20,bristle:.54,body:.44});
  else if(key.includes('alla')) Object.assign(rules,{stroke:16,smear:.58,edgeKeep:.58,edgeLoss:.34,canvas:.0205,impasto:.56,glaze:.03,scumble:.22,finalAccent:.32,directionBias:.30,wet:.62,ridge:.58,varnish:.24,bristle:.64,body:.62});
  else if(key.includes('renaissance')) Object.assign(rules,{stroke:5,smear:.20,edgeKeep:.38,edgeLoss:.34,canvas:.010,impasto:.08,glaze:.42,scumble:.04,finalAccent:.08,directionBias:.04,wet:.18,ridge:.06,varnish:.16,bristle:.08,body:.12});
  else if(key.includes('grisaille')||key.includes('verdaccio')) Object.assign(rules,{stroke:6,smear:.24,edgeKeep:.50,edgeLoss:.30,canvas:.008,impasto:.12,glaze:.24,scumble:.06,finalAccent:.12,wet:.22,ridge:.10,varnish:.14,bristle:.16,body:.18});
  return rules;
}

function painterlyStrokePass(img, rules){
  const w=img.width,h=img.height,d=img.data;
  const src=new Uint8ClampedArray(d);
  const out=new Uint8ClampedArray(d);
  const maxR=Math.max(1, Math.round(rules.stroke));
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const p=idx(x,y,w);
      const L=lum(src[p],src[p+1],src[p+2]);
      const Lx=lum(sample(src,w,h,x+1,y,0),sample(src,w,h,x+1,y,1),sample(src,w,h,x+1,y,2))-lum(sample(src,w,h,x-1,y,0),sample(src,w,h,x-1,y,1),sample(src,w,h,x-1,y,2));
      const Ly=lum(sample(src,w,h,x,y+1,0),sample(src,w,h,x,y+1,1),sample(src,w,h,x,y+1,2))-lum(sample(src,w,h,x,y-1,0),sample(src,w,h,x,y-1,1),sample(src,w,h,x,y-1,2));
      const edge=Math.min(1, Math.sqrt(Lx*Lx+Ly*Ly)/70);
      const shadow=Math.max(0,(58-L)/58);
      const light=Math.max(0,(L-55)/45);
      const radius=Math.max(1, Math.round(maxR*(1-edge*rules.edgeKeep)*(0.55+rules.edgeLoss*shadow)));
      let angle=Math.atan2(Ly,Lx)+Math.PI/2 + rules.directionBias;
      if(light>.55) angle += 0.25*Math.sin(y*.04);
      const ca=Math.cos(angle), sa=Math.sin(angle);
      let r=0,g=0,b=0,total=0;
      for(let t=-radius;t<=radius;t++){
        const wt=1-Math.abs(t)/(radius+1);
        const xx=x+ca*t, yy=y+sa*t;
        r += sample(src,w,h,xx,yy,0)*wt;
        g += sample(src,w,h,xx,yy,1)*wt;
        b += sample(src,w,h,xx,yy,2)*wt;
        total += wt;
      }
      const mix=rules.smear*(1-edge*0.75);
      out[p]=clamp(src[p]*(1-mix)+(r/total)*mix);
      out[p+1]=clamp(src[p+1]*(1-mix)+(g/total)*mix);
      out[p+2]=clamp(src[p+2]*(1-mix)+(b/total)*mix);
      out[p+3]=255;
    }
  }
  d.set(out);
}

function oilSurfacePass(img, rules){
  const w=img.width,h=img.height,d=img.data;
  const src=new Uint8ClampedArray(d);

  // Wet oil should read as smooth body + pulled strokes + selective glossy ridges.
  // Avoid noisy all-over speckle: photographic texture is the enemy of believable paint.
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const p=idx(x,y,w);
      let r=src[p],g=src[p+1],b=src[p+2];
      const L=lum(r,g,b);
      const shadow=Math.max(0,(56-L)/56);
      const light=Math.max(0,(L-58)/42);
      const mid=1-Math.min(1,Math.abs(L-126)/126);

      const nx=noise((x/9)|0,(y/7)|0)-.5;
      const strokeWave=Math.sin((x*0.055)+(y*0.018)+rules.directionBias*5);
      const bristle=Math.sin((x*0.62)+(y*0.08))*0.45 + nx;

      // Subtle canvas only, mostly visible in thinner dark passages.
      const canvasMark=(Math.sin(x*1.15)+Math.sin(y*1.05))*rules.canvas*0.9*(0.35+shadow*.55);

      // Paint body: broad loaded-stroke variation. This makes it feel like material, not posterize.
      const body=(strokeWave*.55 + bristle*.25) * rules.body * (4 + 11*light + 4*mid);

      // Transparent warm glaze in shadows; important for Rembrandt/Caravaggio.
      const glazeAmt=rules.glaze*shadow;
      r += glazeAmt*13; g += glazeAmt*4; b -= glazeAmt*8;

      // Wet sheen sits on the light-facing planes and ridges, not everywhere.
      const sheenGate=(light>.28 && noise((x/5)|0,(y/5)|0)>.62) ? 1 : 0;
      const sheen=sheenGate * rules.wet * rules.varnish * (8 + 18*light) * Math.max(0, strokeWave*.7 + bristle*.3);

      // Impasto catches on the brightest paint planes. Keep it creamy, not grainy.
      const ridgeGate=(light>.38 && noise((x/4)|0,(y/6)|0)>.70) ? 1 : 0;
      const ridge=ridgeGate * rules.ridge * rules.impasto * (10 + 24*light);

      r += canvasMark + body + sheen + ridge;
      g += canvasMark + body*.95 + sheen*.94 + ridge*.90;
      b += canvasMark + body*.86 + sheen*.78 + ridge*.70;

      // Wet darks are smoother and deeper; avoid grey posterized chalk.
      if(shadow>.15){
        const depth=rules.wet*shadow*7;
        r-=depth*.34; g-=depth*.58; b-=depth*.75;
      }

      d[p]=clamp(Math.round(r)); d[p+1]=clamp(Math.round(g)); d[p+2]=clamp(Math.round(b));
    }
  }
}

function wetEdgeBlendPass(img, rules){
  const w=img.width,h=img.height,d=img.data;
  const src=new Uint8ClampedArray(d);
  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){
      const p=idx(x,y,w);
      const L=lum(src[p],src[p+1],src[p+2]);
      const gx=lum(sample(src,w,h,x+1,y,0),sample(src,w,h,x+1,y,1),sample(src,w,h,x+1,y,2))-lum(sample(src,w,h,x-1,y,0),sample(src,w,h,x-1,y,1),sample(src,w,h,x-1,y,2));
      const gy=lum(sample(src,w,h,x,y+1,0),sample(src,w,h,x,y+1,1),sample(src,w,h,x,y+1,2))-lum(sample(src,w,h,x,y-1,0),sample(src,w,h,x,y-1,1),sample(src,w,h,x,y-1,2));
      const edge=Math.min(1,Math.sqrt(gx*gx+gy*gy)/78);
      const shadow=Math.max(0,(66-L)/66);
      const lose=rules.edgeLoss*rules.wet*shadow*(1-edge*.45);
      if(lose<=.015) continue;
      const rad=1+Math.round(rules.stroke/8);
      let r=0,g=0,b=0,n=0;
      for(let yy=-rad;yy<=rad;yy++) for(let xx=-rad;xx<=rad;xx++){
        const q=idx(clamp(x+xx,0,w-1),clamp(y+yy,0,h-1),w);
        r+=src[q]; g+=src[q+1]; b+=src[q+2]; n++;
      }
      d[p]=clamp(src[p]*(1-lose)+(r/n)*lose);
      d[p+1]=clamp(src[p+1]*(1-lose)+(g/n)*lose);
      d[p+2]=clamp(src[p+2]*(1-lose)+(b/n)*lose);
    }
  }
}

function shadowMassPass(img, rules){
  const w=img.width,h=img.height,d=img.data;
  const src=new Uint8ClampedArray(d);
  for(let y=1;y<h-1;y++){
    for(let x=1;x<w-1;x++){
      const p=idx(x,y,w);
      const L=lum(src[p],src[p+1],src[p+2]);
      const shadow=Math.max(0,(55-L)/55);
      if(shadow<=0) continue;
      let r=0,g=0,b=0,n=0;
      const rad=1+Math.round(rules.shadowMerge*3);
      for(let yy=-rad;yy<=rad;yy++) for(let xx=-rad;xx<=rad;xx++){
        const q=idx(clamp(x+xx,0,w-1),clamp(y+yy,0,h-1),w);
        r+=src[q]; g+=src[q+1]; b+=src[q+2]; n++;
      }
      const m=rules.shadowMerge*shadow*.34;
      d[p]=clamp(src[p]*(1-m)+(r/n)*m);
      d[p+1]=clamp(src[p+1]*(1-m)+(g/n)*m);
      d[p+2]=clamp(src[p+2]*(1-m)+(b/n)*m);
    }
  }
}

export function applyMasterFinish(img, profile){
  if(!profile) return img;
  const d = img.data, w = img.width;
  const [lo,hi] = profile.valueClamp || [0,100];
  const ground = profile.ground || [42,34,27];
  const groundBlend = profile.groundBlend || 0;
  const chroma = profile.chroma ?? 1;
  const contrast = profile.contrast ?? 1;
  const texture = profile.texture || 0;
  const sfumato = profile.sfumato || 0;
  const rules = profileOilRules(profile);

  // Pigment-and-ground pass: move photographic colour into paintable earth/light families.
  for(let i=0,p=0;i<d.length;i+=4,p++){
    const x = p % w, y = (p / w) | 0;
    let lab = rgbToLab([d[i],d[i+1],d[i+2]]);
    let L = lab[0];
    L = 50 + (L - 50) * contrast;
    L = lo + (hi - lo) * clamp(L,0,100) / 100;
    const shadow = Math.max(0, (45 - L) / 45);
    const light = Math.max(0, (L - 55) / 45);
    lab[1] *= chroma;
    lab[2] *= chroma;
    lab[1] += (profile.shadowWarm || 0) * 18 * shadow + (profile.lightWarm || 0) * 8 * light;
    lab[2] += (profile.shadowWarm || 0) * 30 * shadow + (profile.lightWarm || 0) * 22 * light;
    lab[0] = L;
    let [r,g,b] = labToRgb(lab);
    const gb = groundBlend * (0.35 + 0.75 * (1 - light));
    r = r*(1-gb) + ground[0]*gb;
    g = g*(1-gb) + ground[1]*gb;
    b = b*(1-gb) + ground[2]*gb;
    if(texture){
      const n = (noise(x,y)-0.5) * texture * 12;
      r += n; g += n; b += n;
    }
    if(sfumato){
      const mid = 128;
      r = r*(1-sfumato*0.14) + mid*(sfumato*0.14);
      g = g*(1-sfumato*0.14) + mid*(sfumato*0.14);
      b = b*(1-sfumato*0.14) + mid*(sfumato*0.14);
    }
    d[i]=clamp(Math.round(r)); d[i+1]=clamp(Math.round(g)); d[i+2]=clamp(Math.round(b));
  }

  // Master-painter rule engine: lost shadows, directional strokes, canvas tooth, impasto/scumble.
  shadowMassPass(img, rules);
  painterlyStrokePass(img, rules);
  oilSurfacePass(img, rules);
  wetEdgeBlendPass(img, rules);
  return img;
}

export function masterNotes(key){
  return MASTER_PROFILES[key] || MASTER_PROFILES.academic;
}
